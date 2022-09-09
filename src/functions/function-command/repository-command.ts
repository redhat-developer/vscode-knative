/* eslint-disable import/no-cycle */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { gitRegex } from './create-function';
import { executeCmdCli } from '../../cli/cmdCli';
import { knExecutor } from '../../cli/execute';
import { FuncAPI } from '../../cli/func-api';
import { telemetryLogError } from '../../telemetry';
import { executeCommandInOutputChannels } from '../../util/output_channels';
import { getStderrString } from '../../util/stderrstring';
import { activeNamespace } from '../active-namespace';

async function showInputBox(promptMessage: string, inputValidMessage?: string): Promise<string> {
  // eslint-disable-next-line no-return-await
  return await vscode.window.showInputBox({
    ignoreFocusOut: true,
    prompt: promptMessage,
    validateInput: (value: string) => {
      if (!value?.trim()) {
        return inputValidMessage;
      }
      return null;
    },
  });
}

export async function addRepository(): Promise<void> {
  const name: string = await showInputBox('Enter new repository name', 'Name cannot be empty');
  if (!name) {
    return null;
  }
  const repositoryURL: string = await vscode.window.showInputBox({
    ignoreFocusOut: true,
    prompt: 'Provide repository URL',
    validateInput: (value: string) => {
      if (!value.trim()) {
        return 'Empty Git repository URL';
      }
      if (!gitRegex.test(value)) {
        return 'Invalid URL provided';
      }
      return null;
    },
  });
  if (!repositoryURL) {
    return null;
  }
  await vscode.window.withProgress(
    {
      cancellable: false,
      location: vscode.ProgressLocation.Notification,
      title: `Adding repository....`,
    },
    async () => {
      const result = await executeCmdCli.executeExec(
        FuncAPI.addRepository(name, repositoryURL, (await activeNamespace()) ?? 'default'),
      );
      if (result.error) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        vscode.window.showErrorMessage(`Failed to add repository ${name} error: ${getStderrString(result.error)}`);
        telemetryLogError('Function_repository_add_error', getStderrString(result.error));
        return null;
      }
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      vscode.window.showInformationMessage('Repository successfully added.');
    },
  );
}

export async function listRepository(): Promise<void> {
  await executeCommandInOutputChannels(FuncAPI.listRepository(), 'Function: List Repository');
}

async function getRepository(): Promise<string> {
  const listAllRepository = await knExecutor.execute(FuncAPI.listRepository());
  const repositoryList = listAllRepository.stdout.trim().split('\n').slice(1);
  if (repositoryList && repositoryList.length === 0) {
    return null;
  }
  const selectedRepository = await vscode.window.showQuickPick(repositoryList, {
    canPickMany: false,
    ignoreFocusOut: true,
    placeHolder: 'Select repository',
  });
  if (!selectedRepository) {
    return null;
  }
  return selectedRepository.split(/\t/)[0];
}

export async function renameRepository(): Promise<void> {
  const selectedRepository = await getRepository();
  if (!selectedRepository) {
    return null;
  }
  const name: string = await showInputBox('Rename repository name.', 'Name cannot be empty');
  if (!name) {
    return null;
  }
  await vscode.window.withProgress(
    {
      cancellable: false,
      location: vscode.ProgressLocation.Notification,
      title: `Renaming repository....`,
    },
    async () => {
      const result = await executeCmdCli.executeExec(
        FuncAPI.renameRepository(selectedRepository, name, (await activeNamespace()) ?? 'default'),
      );
      if (result.error) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        vscode.window.showErrorMessage(`Failed to rename repository ${name} error: ${getStderrString(result.error)}`);
        telemetryLogError('Function_repository_rename_error', getStderrString(result.error));
        return null;
      }
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      vscode.window.showInformationMessage('Repository successfully renamed.');
    },
  );
}

export async function removeRepository(): Promise<void> {
  const selectedRepository = await getRepository();
  if (!selectedRepository) {
    return null;
  }
  await vscode.window.withProgress(
    {
      cancellable: false,
      location: vscode.ProgressLocation.Notification,
      title: `Removing repository....`,
    },
    async () => {
      const result = await executeCmdCli.executeExec(
        FuncAPI.removeRepository(selectedRepository, (await activeNamespace()) ?? 'default'),
      );
      if (result.error) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        vscode.window.showErrorMessage(
          `Failed to remove repository ${selectedRepository} error: ${getStderrString(result.error)}`,
        );
        telemetryLogError('Function_repository_rename_error', getStderrString(result.error));
        return null;
      }
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      vscode.window.showInformationMessage('Repository successfully removed.');
    },
  );
}

export async function repository(): Promise<void> {
  const selectedRepository = await vscode.window.showQuickPick(
    ['Add repository', 'List repositories', 'Remove repository', 'Rename repository'],
    {
      canPickMany: false,
      ignoreFocusOut: true,
      placeHolder: 'Select repository',
    },
  );
  if (!selectedRepository) {
    return null;
  }
  if (selectedRepository === 'Add repository') {
    await addRepository();
  }
  if (selectedRepository === 'List repositories') {
    await listRepository();
  }
  if (selectedRepository === 'Remove repository') {
    await removeRepository();
  }
  if (selectedRepository === 'Rename repository') {
    await renameRepository();
  }
}
