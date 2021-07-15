/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import * as path from 'path';
import { CliExitData } from '../cli/cmdCli';
import { knExecutor } from '../cli/execute';
import { funcApi } from '../cli/func-api';

export async function createFunction(): Promise<string> {
  const location = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectMany: false,
    canSelectFolders: true,
    openLabel: 'Select location to create function'
  });
  if (!location) return null;
  const name = await vscode.window.showInputBox({ignoreFocusOut: true, prompt: 'Provide Function Name' });
  if (!name) return null;
  const runtimeLanguage = ['go', 'node', 'python', 'quarkus', 'rust', 'springboot', 'typescript'];
  const language = await vscode.window.showQuickPick(runtimeLanguage, {placeHolder: 'Select language/framework.', canPickMany: false, ignoreFocusOut: true});
  if (!language) return null;
  const template = await vscode.window.showQuickPick(['http', 'events'], {placeHolder: 'Select Function templates.', canPickMany: false, ignoreFocusOut: true});
  if (!template) return null;
  const result: CliExitData = await knExecutor.execute(funcApi.createFunc(name, language, template, location[0].fsPath));
  if (result.error) {
    vscode.window.showErrorMessage(`Fail create Function: ${result.error}`);
    return null;
  } else {
    let response: string;
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
      response = await vscode.window.showWarningMessage(`Function successfully created Name: ${name}`, 'Add to this workspace', 'Open in new workspace', 'Cancel');
    } else {
      response = await vscode.window.showWarningMessage(`Function successfully created Name: ${name}. Do you want to open in workspace`, 'Yes', 'No');
    }
    const uri = vscode.Uri.file(path.join(location[0].fsPath, name));
    if (response === 'Yes' || response === 'Open in new workspace') {
      vscode.commands.executeCommand("vscode.openFolder", uri);
    } else if (response === 'Add to this workspace') {
      vscode.workspace.updateWorkspaceFolders(0, 0, { uri: uri });
    }
  }
}
