/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { functionExplorer } from './functionsExplorer';
import { FunctionNode } from './functionsTreeItem';
import { CliExitData } from '../cli/cmdCli';
import { knExecutor } from '../cli/execute';
import { FuncAPI } from '../cli/func-api';
import { getStderrString } from '../util/stderrstring';

export async function deleteFunction(context: FunctionNode): Promise<string> {
  if (!context) {
    return null;
  }
  const response = await vscode.window.showWarningMessage(
    `Do you want to delete Function Name: ${context.getName()}`,
    'Yes',
    'No',
  );
  if (response === 'No') {
    return null;
  }
  const result: CliExitData = await knExecutor.execute(FuncAPI.deleteFunc(context.getName()));
  if (result.error) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    vscode.window.showErrorMessage(`Fail create Function: ${getStderrString(result.error)}`);
    return null;
  }
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  functionExplorer.refresh();
  return vscode.window.showInformationMessage(`Function successfully deleted Name: ${context.getName()}`);
}
