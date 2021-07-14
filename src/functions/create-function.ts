/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { CliExitData } from '../cli/cmdCli';
import { knExecutor } from '../cli/execute';
import { funcApi } from '../cli/func-api';

export async function createFunction(): Promise<string> {
  const name = await vscode.window.showInputBox({ignoreFocusOut: true, prompt: 'Provide Function Name' });
  if (!name) return null;
  const runtimeLanguage = ['go', 'node', 'python', 'quarkus', 'rust', 'springboot', 'typescript'];
  const language = await vscode.window.showQuickPick(runtimeLanguage, {placeHolder: 'Select language/framework.', canPickMany: false, ignoreFocusOut: true});
  if (!language) return null;
  const template = await vscode.window.showQuickPick(['http', 'events'], {placeHolder: 'Select Function templates.', canPickMany: false, ignoreFocusOut: true});
  if (!template) return null;
  const result: CliExitData = await knExecutor.execute(funcApi.createFunc(name, language, template));
  console.log(result);
}
