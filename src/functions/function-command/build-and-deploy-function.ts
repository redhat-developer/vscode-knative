/* eslint-disable import/no-cycle */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as yaml from 'js-yaml';
import { knExecutor } from '../../cli/execute';
import { FuncAPI } from '../../cli/func-api';
import { telemetryLog } from '../../telemetry';
import { ExistingWorkspaceFolderPick } from '../../util/existing-workspace-folder-pick';
import { Platform } from '../../util/platform';
import { FunctionNode } from '../function-tree-view/functionsTreeItem';
import { FolderPick, FuncContent, ImageAndBuild } from '../function-type';
import { functionExplorer } from '../functionsExplorer';

const imageRegex = RegExp('[^/]+\\.[^/.]+\\/([^/.]+)(?:\\/[\\w\\s._-]*([\\w\\s._-]))*(?::[a-z0-9\\.-]+)?$');

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

async function functionImage(selectedFolderPick: vscode.Uri, skipBuilder?: boolean): Promise<ImageAndBuild> {
  const imageList: string[] = [];
  let funcData: FuncContent[];
  try {
    const funcYaml: string = await fs.readFile(path.join(selectedFolderPick.fsPath, 'func.yaml'), 'utf-8');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    funcData = yaml.safeLoadAll(funcYaml);
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
  if (!funcData?.[0]?.builder.trim() && !skipBuilder) {
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

async function selectedFolder(context?: FunctionNode): Promise<FolderPick> {
  let selectedFolderPick: FolderPick;
  if (!context) {
    selectedFolderPick = await selectFunctionFolder();
    if (!selectedFolderPick) {
      return null;
    }
  }
  return selectedFolderPick;
}

export async function buildFunction(context?: FunctionNode): Promise<void> {
  const selectedFolderPick: FolderPick = await selectedFolder(context);
  if (!selectedFolderPick && !context) {
    return null;
  }
  const funcData = await functionImage(context ? context.contextPath : selectedFolderPick.workspaceFolder.uri, true);
  if (!funcData) {
    return null;
  }
  telemetryLog('function_build_command', 'Build command execute');
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  functionExplorer.refresh();
  await knExecutor.executeInTerminal(
    FuncAPI.buildFunc(
      context ? context.contextPath.fsPath : selectedFolderPick.workspaceFolder.uri.fsPath,
      funcData.image,
      funcData.builder,
    ),
  );
}

export async function deployFunction(context?: FunctionNode): Promise<void> {
  const selectedFolderPick: FolderPick = await selectedFolder(context);
  if (!selectedFolderPick && !context) {
    return null;
  }
  const funcData = await functionImage(context ? context.contextPath : selectedFolderPick.workspaceFolder.uri, true);
  if (!funcData) {
    return null;
  }
  telemetryLog('function_deploy_command', 'Deploy command execute');
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  functionExplorer.refresh();
  await knExecutor.executeInTerminal(
    FuncAPI.deployFunc(context ? context.contextPath.fsPath : selectedFolderPick.workspaceFolder.uri.fsPath, funcData.image),
  );
}
