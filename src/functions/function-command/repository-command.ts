/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { knExecutor } from '../../cli/execute';
import { FuncAPI } from '../../cli/func-api';

async function showInputBox(promptMessage: string): Promise<string> {
  // eslint-disable-next-line no-return-await
  return await vscode.window.showInputBox({
    ignoreFocusOut: true,
    prompt: promptMessage,
  });
}

export async function addRepository(): Promise<void> {
  const name: string = await showInputBox('Provide Name');
  if (!name) {
    return null;
  }
  const repositoryURL: string = await showInputBox('Provide repository URL');
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
  const name: string = await showInputBox('Rename repository name.');
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
