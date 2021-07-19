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
import { getStderrString } from '../util/stderrstring';

export async function functionTreeView(): Promise<FunctionNodeImpl[]> {
  const result: CliExitData = await knExecutor.execute(FuncAPI.funcList());
  let functionList: FunctionList[];
  if (result.error) {
    window.showErrorMessage(`Unable to fetch Function list Error: ${getStderrString(result.error)}`);
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    functionList = JSON.parse(result.stdout);
    // eslint-disable-next-line no-empty
  } catch (error) {
    window.showErrorMessage(`Fail to parse Json Error: ${getStderrString(error)}`);
    return null;
  }
  if (functionList && functionList.length === 0) {
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
