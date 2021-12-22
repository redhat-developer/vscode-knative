/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { ProviderResult, QuickPickItem, TreeItemCollapsibleState, Uri } from 'vscode';
import format = require('string-format');
import { FunctionContextType, FunctionStatus } from '../../cli/config';
// eslint-disable-next-line import/no-cycle
import { Func } from '../func';

export interface FunctionNode extends QuickPickItem {
  getChildren(): ProviderResult<FunctionNode[]>;
  getParent(): FunctionNode | undefined;
  getName(): string;
  refresh(): Promise<void>;
  contextValue?: string;
  creationTime?: string;
  contextPath?: Uri;
  collapsibleState?: TreeItemCollapsibleState;
  uid?: string;
  functionStatus?: string;
}

export class FunctionNodeImpl implements FunctionNode {
  protected readonly CONTEXT_DATA = {
    none: {
      icon: '',
      tooltip: '{label}',
      description: '',
      getChildren: (): undefined[] => [],
    },
    namespaceNode: {
      icon: '',
      tooltip: 'NameSpace: {label}',
      description: '',
      // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
      getChildren: () => this.func.getTreeFunction(this),
    },
    failNamespaceNode: {
      icon: '',
      tooltip: '{label}',
      description: '',
      // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
      getChildren: () => this.func.getTreeFunction(this),
    },
    localFunctions: {
      icon: '',
      tooltip: '{label}',
      description: '',
      getChildren: (): undefined[] => [],
    },
    localFunctionsEnablement: {
      icon: '',
      tooltip: '{label}',
      description: '',
      getChildren: (): undefined[] => [],
    },
    functions: {
      icon: '',
      tooltip: 'Function: {label}',
      description: '',
      getChildren: (): undefined[] => [],
    },
  };

  // eslint-disable-next-line no-useless-constructor
  constructor(
    private parent: FunctionNode,
    public readonly name: string,
    public readonly contextValue: FunctionContextType,
    protected readonly func: Func,
    public readonly collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.Collapsed,
    public readonly contextPath?: Uri,
    public readonly runtime?: string,
    public readonly functionStatus?: string,
    public readonly uid?: string,
  ) {}

  // get iconPath(): Uri {
  // }

  get description(): string {
    if (this.functionStatus === FunctionStatus.CLUSTERLOCALBOTH) {
      return 'Local/Cluster';
    }
    if (this.functionStatus === FunctionStatus.LOCALONLY) {
      return 'Local Only';
    }
    if (this.functionStatus === FunctionStatus.CLUSTERONLY) {
      return 'Cluster Only';
    }
  }

  get tooltip(): string {
    if (
      this.contextValue === FunctionContextType.LOCAlFUNCTIONS ||
      this.contextValue === FunctionContextType.LOCAlFUNCTIONSENABLEMENT
    ) {
      return format(
        `Name: ${this.CONTEXT_DATA[this.contextValue].tooltip} RunTime: ${this.runtime} Context: ${this.contextPath.fsPath}`,
        this,
      );
    }
    if (this.contextValue === FunctionContextType.FAILNAMESPACENODE) {
      return format(`Cluster is active?`, this);
    }
    return format(this.CONTEXT_DATA[this.contextValue].tooltip, this);
  }

  get label(): string {
    return this.name;
  }

  getName(): string {
    return this.name;
  }

  getChildren(): ProviderResult<FunctionNode[]> {
    return this.CONTEXT_DATA[this.contextValue].getChildren();
  }

  getParent(): FunctionNode {
    return this.parent;
  }

  // eslint-disable-next-line class-methods-use-this
  refresh(): Promise<void> {
    return Promise.resolve();
  }
}
