/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { ProviderResult, QuickPickItem, TreeItemCollapsibleState, Uri, Command as vsCommand } from 'vscode';
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
  url?: string;
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
      icon: 'ns.svg',
      tooltip: 'NameSpace: {label}',
      description: '',
      // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
      getChildren: () => this.func.getTreeFunction(this),
    },
    failNamespaceNode: {
      icon: 'ns.svg',
      tooltip: '{label}',
      description: '',
      // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
      getChildren: () => this.func.getTreeFunction(this),
    },
    notConnectedLocalFunctions: {
      icon: 'service.svg',
      tooltip: '{label}',
      description: '',
      getChildren: (): undefined[] => [],
    },
    notConnectedLocalFunctionsEnablement: {
      icon: 'service.svg',
      tooltip: '{label}',
      description: '',
      getChildren: (): undefined[] => [],
    },
    localFunctions: {
      icon: 'service.svg',
      tooltip: '{label}',
      description: '',
      getChildren: (): undefined[] => [],
    },
    localFunctionsEnablement: {
      icon: 'service.svg',
      tooltip: '{label}',
      description: '',
      getChildren: (): undefined[] => [],
    },
    functions: {
      icon: 'service.svg',
      tooltip: 'Function: {label}',
      description: '',
      getChildren: (): undefined[] => [],
    },
    deployFunctions: {
      icon: 'service.svg',
      tooltip: 'Function: {label}',
      description: '',
      getChildren: (): undefined[] => [],
    },
    localDeployFunctions: {
      icon: 'service.svg',
      tooltip: '{label}',
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
    public readonly url?: string,
    public readonly template?: string,
  ) {}

  get iconPath(): Uri {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return Uri.file(path.join(__dirname, `../../../../images/context`, this.CONTEXT_DATA[this.contextValue].icon));
  }

  get description(): string {
    if (this.functionStatus === FunctionStatus.CLUSTERLOCALBOTH) {
      return `(${this.template.toUpperCase()}) Local/Cluster`;
    }
    if (this.functionStatus === FunctionStatus.LOCALONLY) {
      return `(${this.template.toUpperCase()}) Local Only`;
    }
    if (this.functionStatus === FunctionStatus.CLUSTERONLY) {
      return 'Cluster Only';
    }
  }

  get tooltip(): string {
    if (
      this.contextValue === FunctionContextType.LOCAlFUNCTIONS ||
      this.contextValue === FunctionContextType.LOCAlFUNCTIONSENABLEMENT ||
      this.contextValue === FunctionContextType.LOCALDEPLOYFUNCTION ||
      this.contextValue === FunctionContextType.NOTCONNECTEDLOCALFUNCTIONS
    ) {
      return format(
        `Name: ${this.CONTEXT_DATA[this.contextValue].tooltip}\nRuntime: ${this.runtime}\nTemplate: ${this.template}\nContext: ${
          this.contextPath.fsPath
        }`,
        this,
      );
    }
    if (this.contextValue === FunctionContextType.FAILNAMESPACENODE) {
      return format(`Cluster is active?`, this);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return format(this.CONTEXT_DATA[this.contextValue].tooltip, this);
  }

  get command(): vsCommand | undefined {
    const arrName = [
      'localDeployFunctions',
      'localFunctions',
      'localFunctionsEnablement',
      'notConnectedLocalFunctions',
      'notConnectedLocalFunctionsEnablement',
    ];
    if (arrName.includes(this.contextValue)) {
      return { command: 'function.openInEditor', title: 'Open In Editor', arguments: [this] };
    }
  }

  get label(): string {
    return this.name;
  }

  getName(): string {
    return this.name;
  }

  getChildren(): ProviderResult<FunctionNode[]> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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
