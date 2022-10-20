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
import { knExecutor } from '../../cli/execute';
import { FuncAPI } from '../../cli/func-api';
import { contextGlobalState } from '../../extension';
import { getGitBranchInteractively, getGitRepoInteractively, getGitStateByPath, GitModel } from '../../git/git';
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
  const defaultUsername = Platform.getEnv();
  const defaultImage = `quay.io/${Platform.getOS() === 'win32' ? defaultUsername.USERNAME : defaultUsername.USER}/${name}:latest`;
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

async function getFuncYamlContent(dir: string): Promise<FuncContent> {
  let funcData: FuncContent[];
  try {
    const funcYaml: string = await fs.readFile(path.join(dir, 'func.yaml'), 'utf-8');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    funcData = yaml.safeLoadAll(funcYaml);
  } catch (error) {
    // ignore
  }
  return funcData?.[0];
}

async function getImageAndBuildStrategy(funcData?: FuncContent, forceImageStrategyPicker?: boolean): Promise<ImageAndBuild> {
  const imageList: string[] = [];
  if (funcData?.image && imageRegex.test(funcData.image)) {
    imageList.push(funcData.image);
  }

  if (imageList.length === 1 && !forceImageStrategyPicker) {
    return { image: imageList[0] };
  }

  const strategies = [
    {
      label: 'Retrieve the image name from func.yaml or provide it',
    },
    { label: 'Autodiscover a registry and generate an image name using it.' },
  ];
  let strategy = strategies[0];
  if (forceImageStrategyPicker) {
    strategy = await vscode.window.showQuickPick(strategies, {
      canPickMany: false,
      ignoreFocusOut: true,
      placeHolder: 'Choose how the image name should be created',
    });

    if (!strategy) {
      return null;
    }
  }

  if (strategy === strategies[1]) {
    return { autoGenerateImage: true };
  }

  const imagePick =
    imageList.length === 1
      ? imageList[0]
      : await showInputBox(
          'Provide full image name in the form [registry]/[namespace]/[name]:[tag] (e.g quay.io/boson/image:latest)',
          'Provide full image name in the form [registry]/[namespace]/[name]:[tag] (e.g quay.io/boson/image:latest)',
          funcData?.name,
        );
  if (!imagePick) {
    return null;
  }

  return { image: imagePick };
}

async function functionImage(
  selectedFolderPick: vscode.Uri,
  forceImageStrategyPicker?: boolean,
  funcName?: string,
  namespace?: string,
): Promise<ImageAndBuild> {
  const funcData = await getFuncYamlContent(selectedFolderPick.fsPath);
  if (funcData && funcData.deploy?.namespace?.trim() && funcData.deploy?.namespace !== namespace && funcName) {
    const checkNamespace = await vscode.window.showInformationMessage(
      `Function namespace (declared in func.yaml) is different from the current active namespace. Deploy function ${funcName} to namespace ${namespace}?`,
      'Ok',
      'Cancel',
    );
    if (checkNamespace === 'Cancel') {
      return null;
    }
  }

  return getImageAndBuildStrategy(funcData, forceImageStrategyPicker);
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
  const funcData = await functionImage(context.contextPath);
  if (!funcData) {
    return null;
  }
  telemetryLog('function_build_command', 'Build command execute');
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  functionExplorer.refresh();
  const command = await FuncAPI.buildFunc(context.contextPath.fsPath, funcData.image, context?.getParent()?.getName());
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
    `The Build for function:${context.getName()} is already active.`,
    'Restart',
  );
  if (status === 'Restart') {
    CACHED_CHILDPROCESS.get(name)?.kill('SIGTERM');
    restartBuildCommand.set(context.getName(), true);
  }
}

async function checkFuncIsBuild(context: FunctionNode): Promise<CliExitData> {
  const funcData = await getFuncYamlContent(context?.contextPath.fsPath);
  if (!funcData?.[0]?.image) {
    const response: string = await vscode.window.showInformationMessage(
      'The image is not present in func.yaml. Please build the function before deploying?',
      'Build',
      'Cancel',
    );
    if (response === 'Build') {
      const result = await buildFunction(context);
      if (result.error) {
        return null;
      }
      return result;
    }
    return null;
  }
}

export async function deployFunction(context?: FunctionNode): Promise<CliExitData> {
  if (!context) {
    return null;
  }
  if ((await checkFuncIsBuild(context)) === null) {
    return null;
  }
  const funcData = await functionImage(context.contextPath, false, context.getName(), context?.getParent()?.getName());
  if (!funcData) {
    return null;
  }
  telemetryLog('function_deploy_command', 'Deploy command execute');
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  functionExplorer.refresh();
  const command = await FuncAPI.deployFunc(context.contextPath.fsPath, funcData, context?.getParent()?.getName());
  const name = `Deploy: ${context.getName()}`;
  if (STILL_EXECUTING_COMMAND.get(name)) {
    const status = await vscode.window.showWarningMessage(
      `The Build for function:${context.getName()} is already active`,
      'Restart',
    );
    if (status === 'Restart') {
      CACHED_CHILDPROCESS.get(name)?.stdin?.end();
      CACHED_CHILDPROCESS.get(name)?.kill('SIGTERM');
      restartDeployCommand.set(context.getName(), true);
    }
    return;
  }
  const result = await executeCommandInOutputChannels(command, name);
  if (restartDeployCommand.get(context.getName())) {
    restartDeployCommand.set(context.getName(), false);
    await deployFunction(context);
  }
  return result;
}

async function getGitModel(fsPath?: string): Promise<GitModel> {
  const gitState = getGitStateByPath(fsPath);

  const gitRemote = await getGitRepoInteractively(gitState);
  if (!gitRemote) {
    return null;
  }

  const gitBranch = await getGitBranchInteractively(gitState, gitRemote);
  if (!gitBranch) {
    return null;
  }
  return {
    remoteUrl: gitState.remotes.filter((r) => r.name === gitRemote).map((r) => r.fetchUrl)[0],
    branchName: gitBranch,
  };
}

export async function onClusterBuildFunction(context?: FunctionNode): Promise<void> {
  if (!context) {
    return null;
  }

  if (!contextGlobalState.globalState.get('hasTekton')) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    await vscode.window.showWarningMessage(
      'This action requires Tekton to be installed on the cluster. Please install it and then proceed to build the function on the cluster.',
    );
    return null;
  }

  const gitModel = await getGitModel(context.contextPath?.fsPath);
  if (!gitModel) {
    return null;
  }

  const imageAndBuildMode = await functionImage(context.contextPath, true);
  if (!imageAndBuildMode) {
    return null;
  }

  telemetryLog('function_on_cluster_build_command', 'OnClusterBuild command execute');

  const command = await FuncAPI.onClusterBuildFunc(
    context.contextPath.fsPath,
    imageAndBuildMode,
    context?.getParent()?.getName(),
    gitModel,
  );
  const name = `On Cluster Build: ${context.getName()}`;
  await knExecutor.executeInTerminal(command, process.cwd(), name);
}
