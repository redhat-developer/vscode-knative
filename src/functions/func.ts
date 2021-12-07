/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { TreeItemCollapsibleState, window } from 'vscode';
// eslint-disable-next-line import/no-cycle
import { FunctionNode, FunctionNodeImpl } from './function-tree-view/functionsTreeItem';
import { FunctionList } from './function-type';
import { CliExitData } from '../cli/cmdCli';
import { FunctionContextType } from '../cli/config';
import { knExecutor } from '../cli/execute';
import { FuncAPI } from '../cli/func-api';
import { compareNodes } from '../knative/knativeItem';
import { telemetryLog, telemetryLogError } from '../telemetry';
import { getStderrString } from '../util/stderrstring';

export interface Func {
  getFunctionNodes(): FunctionNode[];
  getDeployedFunction(func: FunctionNode): Promise<FunctionNode[]>;
}

export class FuncImpl implements Func {
  public static ROOT: FunctionNode = new FunctionNodeImpl(undefined, 'root', undefined, undefined);

  getFunctionNodes(): FunctionNode[] {
    return this._getFunctionsNodes();
  }

  public _getFunctionsNodes(): FunctionNode[] {
    const functionsTree: FunctionNode[] = [];
    const functionsNode = new FunctionNodeImpl(
      FuncImpl.ROOT,
      'Deployed Function',
      FunctionContextType.FUNCTIONSNODE,
      this,
      TreeItemCollapsibleState.Collapsed,
    );
    const localFunctionsNode = new FunctionNodeImpl(
      FuncImpl.ROOT,
      'Local Function',
      FunctionContextType.LOCAlFUNCTIONSNODE,
      this,
      TreeItemCollapsibleState.Collapsed,
    );
    functionsTree.push(functionsNode, localFunctionsNode);
    FuncImpl.ROOT.getChildren = () => functionsTree;
    return functionsTree;
  }

  async getDeployedFunction(func: FunctionNode): Promise<FunctionNode[]> {
    let result: CliExitData;
    try {
      result = await knExecutor.execute(FuncAPI.funcList());
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      window.showErrorMessage(`Unable to fetch Function list Error: ${getStderrString(err)}`);
      telemetryLogError('Function_List_Error', err);
      return [
        new FunctionNodeImpl(null, 'No Functions Found', FunctionContextType.NONE, this, TreeItemCollapsibleState.None, null),
      ];
    }
    let functionList: FunctionList[];
    if (result.error) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
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
        // return [new FunctionNodeImpl(null, 'No Functions Found', FunctionContextType.NONE, TreeItemCollapsibleState.None, null)];
      }
      telemetryLogError('parse_error', error);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      window.showErrorMessage(`Fail to parse Json Error: ${getStderrString(error)}`);
      return null;
    }
    if (functionList && functionList.length === 0) {
      telemetryLog('No_Function_deploy', 'No Function Found');
      return [
        new FunctionNodeImpl(func, 'No Function Found', FunctionContextType.NONE, this, TreeItemCollapsibleState.None, null),
      ];
    }

    const children = functionList
      .map<FunctionNodeImpl>((value) => {
        const obj: FunctionNodeImpl = new FunctionNodeImpl(
          func,
          value.name,
          FunctionContextType.FUNCTION,
          this,
          TreeItemCollapsibleState.None,
        );
        return obj;
      })
      .sort(compareNodes);

    return children;
  }
}

export const func = new FuncImpl();
