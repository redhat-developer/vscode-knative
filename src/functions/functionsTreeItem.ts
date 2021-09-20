/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { ProviderResult, QuickPickItem, TreeItemCollapsibleState } from 'vscode';

export interface FunctionNode extends QuickPickItem {
  getChildren(): ProviderResult<FunctionNode[]>;
  getParent(): FunctionNode | undefined;
  getName(): string;
  refresh(): Promise<void>;
  contextValue?: string;
  creationTime?: string;
  state?: string;
  visibleChildren?: number;
  collapsibleState?: TreeItemCollapsibleState;
  uid?: string;
}

export class FunctionNodeImpl implements FunctionNode {
  protected readonly CONTEXT_DATA = {
    functions: {
      icon: 'PL.svg',
      tooltip: 'Function: {label}',
      // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
      getChildren: () => [],
    },
  };

  // eslint-disable-next-line no-useless-constructor
  constructor(
    private parent: FunctionNode,
    public readonly name: string,
    public readonly contextValue: string,
    public readonly collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.Collapsed,
    public readonly uid?: string,
    public readonly creationTime?: string,
    public readonly state?: string,
  ) {}

  // get iconPath(): Uri {
  // }

  // get tooltip(): string {
  //   return format(this.CONTEXT_DATA[this.contextValue].tooltip, this);
  // }

  get label(): string {
    return this.name;
  }

  getName(): string {
    return this.name;
  }

  getChildren(): ProviderResult<FunctionNode[]> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
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
