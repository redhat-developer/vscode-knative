/* eslint-disable import/no-cycle */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { TreeItemCollapsibleState, Uri, window, workspace } from 'vscode';
import * as fs from 'fs-extra';
import * as yaml from 'js-yaml';
import { FunctionNode, FunctionNodeImpl } from './function-tree-view/functionsTreeItem';
import { FuncContent, FunctionInfo, FunctionList, Namespace } from './function-type';
import { functionExplorer } from './functionsExplorer';
import { CliExitData } from '../cli/cmdCli';
import { FunctionContextType } from '../cli/config';
import { knExecutor } from '../cli/execute';
import { FuncAPI } from '../cli/func-api';
import { KubectlAPI } from '../cli/kubectl-api';
import { compareNodes } from '../knative/knativeItem';
import { telemetryLog, telemetryLogError } from '../telemetry';
import { getStderrString } from '../util/stderrstring';

export interface Func {
  getFunctionNodes(): FunctionNode[];
  getDeployedFunction(func: FunctionNode): Promise<FunctionNode[]>;
  getLocalFunction(func: FunctionNode): Promise<FunctionNode[]>;
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
      result = await knExecutor.execute(FuncAPI.funcList(), process.cwd(), false);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      window.showErrorMessage(`Unable to fetch Function list Error: ${getStderrString(err)}`);
      telemetryLogError('Function_List_Error', err);
      return [
        new FunctionNodeImpl(func, 'No Functions Found', FunctionContextType.NONE, this, TreeItemCollapsibleState.None, null),
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
        return [
          new FunctionNodeImpl(func, 'No Functions Found', FunctionContextType.NONE, this, TreeItemCollapsibleState.None, null),
        ];
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

  async getLocalFunction(func: FunctionNode): Promise<FunctionNode[]> {
    const folders: Uri[] = [];
    const functionList: FunctionNode[] = [];
    if (workspace.workspaceFolders && workspace.workspaceFolders.length > 0) {
      // eslint-disable-next-line no-restricted-syntax
      for (const wf of workspace.workspaceFolders) {
        if (fs.existsSync(path.join(wf.uri.fsPath, 'func.yaml'))) {
          folders.push(wf.uri);
        }
      }
    }
    if (folders.length === 0) {
      return [
        new FunctionNodeImpl(
          func,
          'No Functions Found in workspace',
          FunctionContextType.NONEWORKSPACE,
          this,
          TreeItemCollapsibleState.None,
        ),
      ];
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const folderUri of folders) {
      let funcStatus = false;
      // eslint-disable-next-line no-await-in-loop
      const funcYaml: string = await fs.readFile(path.join(folderUri.fsPath, 'func.yaml'), 'utf-8');
      // eslint-disable-next-line no-await-in-loop
      const result = await knExecutor.execute(KubectlAPI.currentNamesapce(), process.cwd(), false);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const currentNamespace: Namespace = JSON.parse(result.stdout);
      const getCurrentNamespace = currentNamespace.contexts[0].context.namespace;
      // eslint-disable-next-line no-await-in-loop
      const funcInfoResult = await knExecutor.execute(FuncAPI.functionInfo(folderUri.fsPath), process.cwd(), false);
      let functionNamespace: FunctionInfo;
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        functionNamespace = JSON.parse(funcInfoResult.stdout);
      } catch (e) {
        functionNamespace = undefined;
      }
      const getFunctionNamespace = functionNamespace?.namespace;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const funcData: FuncContent[] = yaml.safeLoadAll(funcYaml);
      if (getCurrentNamespace === getFunctionNamespace) {
        funcStatus = true;
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      fs.watch(folderUri.fsPath, (eventName, filename) => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        functionExplorer.refresh();
      });
      if (funcData && funcData?.[0]?.name && funcData?.[0]?.image.trim()) {
        functionList.push(
          new FunctionNodeImpl(
            func,
            funcData[0].name,
            FunctionContextType.LOCAlFUNCTIONS,
            this,
            TreeItemCollapsibleState.None,
            folderUri,
            funcData[0].runtime,
            funcStatus,
          ),
        );
      } else if (funcData && funcData?.[0]?.name && !funcData?.[0]?.image.trim()) {
        functionList.push(
          new FunctionNodeImpl(
            func,
            funcData[0].name,
            FunctionContextType.LOCAlFUNCTIONSENABLEMENT,
            this,
            TreeItemCollapsibleState.None,
            folderUri,
            funcData[0].runtime,
            funcStatus,
          ),
        );
      }
    }
    return functionList;
  }
}

export const func = new FuncImpl();
