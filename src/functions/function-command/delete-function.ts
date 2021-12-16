/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as path from 'path';
import * as vscode from 'vscode';
import * as fsExtra from 'fs-extra';
import { CliExitData } from '../../cli/cmdCli';
import { FunctionStatus } from '../../cli/config';
import { knExecutor } from '../../cli/execute';
import { FuncAPI } from '../../cli/func-api';
import { getStderrString } from '../../util/stderrstring';
import { FunctionNode } from '../function-tree-view/functionsTreeItem';
import { functionExplorer } from '../functionsExplorer';

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
  await vscode.window.withProgress(
    {
      cancellable: false,
      location: vscode.ProgressLocation.Notification,
      title: `Deleting Function: ${context.getName()}`,
    },
    async () => {
      if (context.functionStatus === FunctionStatus.CLUSTERLOCALBOTH || context.functionStatus === FunctionStatus.CLUSTERONLY) {
        const result: CliExitData = await knExecutor.execute(FuncAPI.deleteFunc(context.getName()), process.cwd(), false);
        if (result.error) {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          vscode.window.showErrorMessage(`Fail deleted Function: ${getStderrString(result.error)}`);
          return null;
        }
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        vscode.window.showInformationMessage(`Function successfully deleted Name: ${context.getName()}`);
      }
      if (context.functionStatus === FunctionStatus.CLUSTERLOCALBOTH || context.functionStatus === FunctionStatus.LOCALONLY) {
        const funcYaml = path.join(context.contextPath.fsPath, 'func.yaml');
        await fsExtra.remove(funcYaml);
      }
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      functionExplorer.refresh();
      return null;
    },
  );
}
