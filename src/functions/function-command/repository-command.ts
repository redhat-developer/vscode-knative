/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
// eslint-disable-next-line import/no-cycle
import { gitRegex } from './create-function';
import { knExecutor } from '../../cli/execute';
import { FuncAPI } from '../../cli/func-api';

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
  const name: string = await showInputBox('Provide Name', 'name cannot be empty');
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
  await knExecutor.executeInTerminal(FuncAPI.addRepository(name, repositoryURL));
}

export async function listRepository(): Promise<void> {
  await knExecutor.executeInTerminal(FuncAPI.listRepository());
}

async function getRepository(): Promise<string> {
  const listAllRepository = await knExecutor.execute(FuncAPI.listRepository());
  const repositoryList = listAllRepository.stdout.trim().split('\n').slice(1);
  if (repositoryList && repositoryList.length === 0) {
    return null;
  }
  const selectedRepository =
    repositoryList.length === 1
      ? repositoryList[0]
      : await vscode.window.showQuickPick(repositoryList, {
          canPickMany: false,
          ignoreFocusOut: true,
          placeHolder: 'Select repository',
        });
  if (!selectedRepository) {
    return null;
  }
  return selectedRepository;
}

export async function renameRepository(): Promise<void> {
  const selectedRepository = await getRepository();
  if (!selectedRepository) {
    return null;
  }
  const name: string = await showInputBox('Rename repository name.', 'name cannot be empty');
  if (!name) {
    return null;
  }
  await knExecutor.executeInTerminal(FuncAPI.renameRepository(selectedRepository, name));
}

export async function removeRepository(): Promise<void> {
  const selectedRepository = await getRepository();
  if (!selectedRepository) {
    return null;
  }
  await knExecutor.executeInTerminal(FuncAPI.removeRepository(selectedRepository));
}
