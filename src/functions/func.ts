/* eslint-disable import/no-cycle */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { TreeItemCollapsibleState, Uri, workspace } from 'vscode';
import * as fs from 'fs-extra';
import { activeNamespace } from './active-namespace';
import { FunctionNode, FunctionNodeImpl } from './function-tree-view/functionsTreeItem';
import { FuncContent, FunctionList } from './function-type';
import { functionExplorer } from './functionsExplorer';
import { getFuncYamlContent } from './funcUtils';
import { CliExitData } from '../cli/cmdCli';
import { FunctionContextType, FunctionStatus } from '../cli/config';
import { knExecutor } from '../cli/execute';
import { FuncAPI } from '../cli/func-api';

export interface Func {
  getFunctionNodes(): Promise<FunctionNode[]>;
  getTreeFunction(func: FunctionNode): Promise<FunctionNode[]>;
  getDeployedFunction(func: FunctionNode): Promise<Map<string, FunctionNode>>;
  getLocalFunctions(func: FunctionNode, functionTreeView: Map<string, FunctionNode>): Promise<FunctionNode[]>;
}

export class FuncImpl implements Func {
  public static ROOT: FunctionNode = new FunctionNodeImpl(undefined, 'root', undefined, undefined);

  async getFunctionNodes(): Promise<FunctionNode[]> {
    // eslint-disable-next-line no-return-await
    return await this._getFunctionsNodes();
  }

  public async _getFunctionsNodes(): Promise<FunctionNode[]> {
    const functionsTree: FunctionNode[] = [];
    const currentNamespace: string = await activeNamespace();
    let functionsNode: FunctionNode;
    if (!currentNamespace) {
      functionsNode = new FunctionNodeImpl(
        FuncImpl.ROOT,
        'default',
        FunctionContextType.FAILNAMESPACENODE,
        this,
        TreeItemCollapsibleState.Collapsed,
      );
    } else {
      functionsNode = new FunctionNodeImpl(
        FuncImpl.ROOT,
        currentNamespace,
        FunctionContextType.NAMESPACENODE,
        this,
        TreeItemCollapsibleState.Collapsed,
      );
    }
    functionsTree.push(functionsNode);
    FuncImpl.ROOT.getChildren = () => functionsTree;
    return functionsTree;
  }

  async getTreeFunction(func: FunctionNode): Promise<FunctionNode[]> {
    const deployedFunction: Map<string, FunctionNode> = await this.getDeployedFunction(func);
    const deployedLocalFunction: FunctionNode[] = await this.getLocalFunctions(func, deployedFunction);
    if (deployedLocalFunction.length === 0) {
      return [
        new FunctionNodeImpl(func, 'No Functions Found', FunctionContextType.NONE, this, TreeItemCollapsibleState.None, null),
      ];
    }
    return deployedLocalFunction;
  }

  // eslint-disable-next-line class-methods-use-this
  getAdaptedContextValue(func: FunctionNode, funcData: FuncContent, funcStatus: FunctionStatus): FunctionContextType {
    const contextValue =
      funcStatus === FunctionStatus.CLUSTERLOCALBOTH
        ? FunctionContextType.LOCALDEPLOYFUNCTION
        : FunctionContextType.LOCAlFUNCTIONS;
    // eslint-disable-next-line no-use-before-define
    if (func.contextValue === FunctionContextType.FAILNAMESPACENODE) {
      return funcData?.image.trim()
        ? FunctionContextType.NOTCONNECTEDLOCALFUNCTIONS
        : FunctionContextType.NOTCONNECTEDLOCALFUNCTIONSENABLEMENT;
    }
    return funcData?.image.trim() ? contextValue : FunctionContextType.LOCAlFUNCTIONSENABLEMENT;
  }

  createFunctionNodeImpl(
    func: FunctionNode,
    funcData: FuncContent,
    folderUri: Uri,
    funcStatus: FunctionStatus,
    url?: string,
    context?: FunctionContextType,
  ): FunctionNodeImpl {
    return new FunctionNodeImpl(
      func,
      funcData.name,
      context || this.getAdaptedContextValue(func, funcData, funcStatus),
      this,
      TreeItemCollapsibleState.None,
      folderUri,
      funcData.runtime,
      funcStatus,
      url,
      funcData.invocation?.format,
    );
  }

  async getDeployedFunction(func: FunctionNode): Promise<Map<string, FunctionNode>> {
    const functionTreeView = new Map<string, FunctionNode>();
    let result: CliExitData;
    let functionList: FunctionList[];
    try {
      result = await knExecutor.execute(FuncAPI.funcList(), process.cwd(), false);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      functionList = JSON.parse(result.stdout);
    } catch (err) {
      // ignores
    }
    if (functionList && functionList.length !== 0) {
      functionList.forEach((value) => {
        const obj: FunctionNodeImpl = this.createFunctionNodeImpl(
          func,
          value,
          null,
          FunctionStatus.CLUSTERONLY,
          value.url,
          FunctionContextType.DEPLOYFUNCTION,
        );
        functionTreeView.set(value.name, obj);
      });
    }
    return functionTreeView;
  }

  async getLocalFunctions(func: FunctionNode, functionTreeView: Map<string, FunctionNode>): Promise<FunctionNode[]> {
    const folders: Uri[] = [];
    const functionList: FunctionNode[] = [];
    if (workspace.workspaceFolders) {
      // eslint-disable-next-line no-restricted-syntax
      for (const wf of workspace.workspaceFolders) {
        if (fs.existsSync(path.join(wf.uri.fsPath, 'func.yaml'))) {
          folders.push(wf.uri);
        }
      }
    }
    const getCurrentNamespace: string = await activeNamespace();
    // eslint-disable-next-line no-restricted-syntax
    for (const folderUri of folders) {
      let funcStatus = FunctionStatus.LOCALONLY;
      try {
        // eslint-disable-next-line no-await-in-loop
        const funcData: FuncContent = await getFuncYamlContent(folderUri.fsPath);
        if (functionTreeView.has(funcData?.name) && (!funcData?.namespace || getCurrentNamespace === funcData?.namespace)) {
          funcStatus = FunctionStatus.CLUSTERLOCALBOTH;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fs.watch(folderUri.fsPath, (eventName, filename) => {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          functionExplorer.refresh();
        });
        if (funcData?.name) {
          const url =
            func.contextValue !== FunctionContextType.FAILNAMESPACENODE && funcData?.image.trim()
              ? functionTreeView.get(funcData?.name)?.url
              : undefined;
          functionTreeView.set(funcData?.name, this.createFunctionNodeImpl(func, funcData, folderUri, funcStatus, url));
        }
      } catch (err) {
        // ignore
      }
    }
    functionTreeView.forEach((value) => {
      functionList.push(value);
    });
    return functionList;
  }
}

export const func = new FuncImpl();
