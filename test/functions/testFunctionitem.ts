/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Uri } from 'vscode';
import { FunctionContextType } from '../../src/cli/config';
import { FunctionNode } from '../../src/functions/function-tree-view/functionsTreeItem';

export class TestItem implements FunctionNode {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    private parent: FunctionNode,
    private name: string,
    public readonly contextValue: FunctionContextType,
    private children = [],
    public contextPath?: Uri,
    public runtime?: string,
    public functionStatus?: string,
  ) {}

  getName(): string {
    return this.name;
  }

  getChildren(): FunctionNode[] {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.children;
  }

  getParent(): FunctionNode {
    return this.parent;
  }

  get label(): string {
    return this.name;
  }

  // eslint-disable-next-line class-methods-use-this
  refresh(): Promise<void> {
    return Promise.resolve();
  }
}
