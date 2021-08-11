/* eslint-disable @typescript-eslint/no-floating-promises */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { TreeItemCollapsibleState, window } from 'vscode';
import { FunctionList } from './function-type';
import { FunctionNodeImpl } from './functionsTreeItem';
import { CliExitData } from '../cli/cmdCli';
import { FunctionContextType } from '../cli/config';
import { knExecutor } from '../cli/execute';
import { FuncAPI } from '../cli/func-api';
import { compareNodes } from '../knative/knativeItem';
import { telemetryLog, telemetryLogError } from '../telemetry';
import { getStderrString } from '../util/stderrstring';

export async function functionTreeView(): Promise<FunctionNodeImpl[]> {
  let result: CliExitData;
  try {
    result = await knExecutor.execute(FuncAPI.funcList());
  } catch (err) {
    window.showErrorMessage(`Unable to fetch Function list Error: ${getStderrString(err)}`);
    telemetryLogError('Function_List_Error', err);
    return [new FunctionNodeImpl(null, 'No Functions Found', FunctionContextType.NONE, TreeItemCollapsibleState.None, null)];
  }
  let functionList: FunctionList[];
  if (result.error) {
    window.showErrorMessage(`Unable to fetch Function list Error: ${getStderrString(result.error)}`);
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    functionList = JSON.parse(result.stdout);
  } catch (error) {
    const functionCheck = RegExp('^No functions found');
    if (functionCheck.test(result.stdout)) {
      telemetryLog('No_Function_Found', result.stdout);
      return [new FunctionNodeImpl(null, 'No Functions Found', FunctionContextType.NONE, TreeItemCollapsibleState.None, null)];
    }
    telemetryLogError('parse_error', error);
    window.showErrorMessage(`Fail to parse Json Error: ${getStderrString(error)}`);
    return null;
  }
  if (functionList && functionList.length === 0) {
    telemetryLog('No_Function_deploy', 'No Function Found');
    return [new FunctionNodeImpl(null, 'No Function Found', FunctionContextType.NONE, TreeItemCollapsibleState.None, null)];
  }

  const children = functionList
    .map<FunctionNodeImpl>((value) => {
      const obj: FunctionNodeImpl = new FunctionNodeImpl(
        null,
        value.name,
        FunctionContextType.FUNCTION,
        TreeItemCollapsibleState.None,
      );
      return obj;
    })
    .sort(compareNodes);

  return children;
}
