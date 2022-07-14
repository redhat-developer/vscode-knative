/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable import/no-cycle */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as yaml from 'js-yaml';
import { CliExitData } from '../../cli/cmdCli';
import { FuncAPI } from '../../cli/func-api';
import { telemetryLog } from '../../telemetry';
import { ExistingWorkspaceFolderPick } from '../../util/existing-workspace-folder-pick';
import { CACHED_CHILDPROCESS, executeCommandInOutputChannels, STILL_EXECUTING_COMMAND } from '../../util/output_channels';
import { Platform } from '../../util/platform';
import { FunctionNode } from '../function-tree-view/functionsTreeItem';
import { FolderPick, FuncContent, ImageAndBuild } from '../function-type';
import { functionExplorer } from '../functionsExplorer';

const imageRegex = RegExp('[^/]+\\.[^/.]+\\/([^/.]+)(?:\\/[\\w\\s._-]*([\\w\\s._-]))*(?::[a-z0-9\\.-]+)?$');
export const restartBuildCommand = new Map<string, boolean>();
export const restartDeployCommand = new Map<string, boolean>();

async function showInputBox(promptMessage: string, inputValidMessage: string, name?: string): Promise<string> {
  const defaultUsername = Platform.ENV;
  const defaultImage = `quay.io/${defaultUsername.USER}/${name}:latest`;
  // eslint-disable-next-line no-return-await
  return await vscode.window.showInputBox({
    ignoreFocusOut: true,
    prompt: promptMessage,
    value: defaultImage,
    validateInput: (value: string) => {
      if (!imageRegex.test(value)) {
        return inputValidMessage;
      }
      return null;
    },
  });
}

async function functionBuilder(image: string, name: string): Promise<ImageAndBuild> {
  const builder = await showInputBox(
    'Provide Buildpack builder, either an as a an image name or a mapping name.',
    'Provide full image name in the form [registry]/[namespace]/[name]:[tag] (e.g quay.io/boson/image:latest)',
    name,
  );
  if (!builder) {
    return null;
  }
  return { image, builder };
}

async function functionImage(
  selectedFolderPick: vscode.Uri,
  skipBuilder?: boolean,
  funcName?: string,
  namespace?: string,
): Promise<ImageAndBuild> {
  const imageList: string[] = [];
  let funcData: FuncContent[];
  let checkNamespace: string;
  try {
    const funcYaml: string = await fs.readFile(path.join(selectedFolderPick.fsPath, 'func.yaml'), 'utf-8');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    funcData = yaml.safeLoadAll(funcYaml);
    if (funcData?.[0].namespace?.trim() && funcData?.[0].namespace !== namespace && funcName) {
      checkNamespace = await vscode.window.showInformationMessage(
        `Function namespace (declared in func.yaml) is different from the current active namespace. Deploy function ${funcName} to namespace ${namespace}?`,
        'Ok',
        'Cancel',
      );
    }
    if (checkNamespace === 'Cancel') {
      return null;
    }
    if (funcData?.[0]?.image && imageRegex.test(funcData?.[0].image)) {
      imageList.push(funcData[0].image);
    }
  } catch (error) {
    // ignore
  }
  const imagePick =
    imageList.length === 1
      ? imageList[0]
      : await showInputBox(
          'Provide full image name in the form [registry]/[namespace]/[name]:[tag] (e.g quay.io/boson/image:latest)',
          'Provide full image name in the form [registry]/[namespace]/[name]:[tag] (e.g quay.io/boson/image:latest)',
          funcData?.[0].name,
        );
  if (!imagePick) {
    return null;
  }
  if (!funcData?.[0]?.builder?.trim() && !skipBuilder) {
    const builder = await functionBuilder(imagePick, funcData?.[0].name);
    return builder;
  }
  return { image: imagePick };
}

export async function selectFunctionFolder(): Promise<FolderPick> {
  const folderPicks: FolderPick[] = [];
  if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const wf of vscode.workspace.workspaceFolders) {
      if (fs.existsSync(path.join(wf.uri.fsPath, 'func.yaml'))) {
        folderPicks.push(new ExistingWorkspaceFolderPick(wf));
      }
    }
  }
  if (folderPicks.length === 0) {
    const message = 'No project exist which contain func.yaml in it.';
    telemetryLog('func_yaml_not_found', message);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    vscode.window.showInformationMessage(message);
    return null;
  }
  const selectedFolderPick =
    folderPicks.length === 1
      ? folderPicks[0]
      : await vscode.window.showQuickPick(folderPicks, {
          canPickMany: false,
          ignoreFocusOut: true,
          placeHolder: 'Select function',
        });
  return selectedFolderPick;
}

export async function buildFunction(context?: FunctionNode): Promise<CliExitData> {
  if (!context) {
    return null;
  }
  const funcData = await functionImage(context.contextPath, true);
  if (!funcData) {
    return null;
  }
  telemetryLog('function_build_command', 'Build command execute');
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  functionExplorer.refresh();
  const command = await FuncAPI.buildFunc(context.contextPath.fsPath, funcData.image);
  const name = `Build: ${context.getName()}`;
  if (!STILL_EXECUTING_COMMAND.get(name)) {
    const result = await executeCommandInOutputChannels(command, name);
    if (restartBuildCommand.get(context.getName())) {
      restartBuildCommand.set(context.getName(), false);
      await buildFunction(context);
    }
    return result;
  }
  const status = await vscode.window.showWarningMessage(
    `The Function ${command.cliArguments[0]}: ${context.getName()} is already active.`,
    'Restart',
  );
  if (status === 'Restart') {
    CACHED_CHILDPROCESS.get(name)?.kill('SIGTERM');
    restartBuildCommand.set(context.getName(), true);
  }
}

export async function deployFunction(context?: FunctionNode): Promise<CliExitData> {
  if (!context) {
    return null;
  }
  const funcYaml: string = await fs.readFile(path.join(context.contextPath.fsPath, 'func.yaml'), 'utf-8');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const getFuncYaml = yaml.safeLoadAll(funcYaml);
  if (!getFuncYaml?.[0]?.image) {
    const response: string = await vscode.window.showInformationMessage(
      'Image not found in func.yaml. Do you want to build before deploy?',
      'Yes',
      'No',
    );
    if (response === 'Yes') {
      const result = await buildFunction(context);
      // eslint-disable-next-line no-console
      console.log(result);
    }
  }
  const funcData = await functionImage(context.contextPath, true, context.getName(), context?.getParent()?.getName());
  if (!funcData) {
    return null;
  }
  telemetryLog('function_deploy_command', 'Deploy command execute');
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  functionExplorer.refresh();
  const command = await FuncAPI.deployFunc(context.contextPath.fsPath, funcData.image, context?.getParent()?.getName());
  const name = `Deploy: ${context.getName()}`;
  if (!STILL_EXECUTING_COMMAND.get(name)) {
    const result = await executeCommandInOutputChannels(command, name);
    if (restartDeployCommand.get(context.getName())) {
      restartDeployCommand.set(context.getName(), false);
      await deployFunction(context);
    }
    return result;
  }
  const status = await vscode.window.showWarningMessage(
    `The Function ${command.cliArguments[0]}: ${context.getName()} is already active.`,
    'Restart',
  );
  if (status === 'Restart') {
    CACHED_CHILDPROCESS.get(name)?.stdin?.end();
    CACHED_CHILDPROCESS.get(name)?.kill('SIGTERM');
    restartDeployCommand.set(context.getName(), true);
  }
}
