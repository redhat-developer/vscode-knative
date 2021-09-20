/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as path from 'path';
import * as vscode from 'vscode';
import { CliExitData } from '../cli/cmdCli';
import { knExecutor } from '../cli/execute';
import { FuncAPI } from '../cli/func-api';
import { getStderrString } from '../util/stderrstring';

export async function createFunction(): Promise<string> {
  const location = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectMany: false,
    canSelectFolders: true,
    openLabel: 'Select location to create function',
  });
  if (!location) {
    return null;
  }
  const name = await vscode.window.showInputBox({ ignoreFocusOut: true, prompt: 'Provide Function Name' });
  if (!name) {
    return null;
  }
  const runtimeLanguage = ['go', 'node', 'python', 'quarkus', 'rust', 'springboot', 'typescript'];
  const language = await vscode.window.showQuickPick(runtimeLanguage, {
    placeHolder: 'Select language/framework.',
    canPickMany: false,
    ignoreFocusOut: true,
  });
  if (!language) {
    return null;
  }
  const template = await vscode.window.showQuickPick(['http', 'events'], {
    placeHolder: 'Select Function templates.',
    canPickMany: false,
    ignoreFocusOut: true,
  });
  if (!template) {
    return null;
  }
  const result: CliExitData = await knExecutor.execute(FuncAPI.createFunc(name, language, template, location[0].fsPath));
  if (result.error) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    vscode.window.showErrorMessage(`Fail create Function: ${getStderrString(result.error)}`);
    return null;
  }
  let response: string;
  if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
    response = await vscode.window.showWarningMessage(
      `Function successfully created Name: ${name}`,
      'Add to this workspace',
      'Open in new workspace',
      'Cancel',
    );
  } else {
    response = await vscode.window.showWarningMessage(
      `Function successfully created Name: ${name}. Do you want to open in workspace`,
      'Yes',
      'No',
    );
  }
  const uri = vscode.Uri.file(path.join(location[0].fsPath, name));
  if (response === 'Yes' || response === 'Open in new workspace') {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    vscode.commands.executeCommand('vscode.openFolder', uri);
  } else if (response === 'Add to this workspace') {
    vscode.workspace.updateWorkspaceFolders(0, 0, { uri });
  }
}
