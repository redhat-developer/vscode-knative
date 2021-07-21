/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { TreeDataProvider, TreeView, Event, EventEmitter, TreeItem, ProviderResult, Disposable, window } from 'vscode';
import { functionTreeView } from './function-tree-view';
import { FunctionNode } from './functionsTreeItem';

export class FunctionExplorer implements TreeDataProvider<FunctionNode>, Disposable {
  private treeView: TreeView<FunctionNode>;

  private onDidChangeTreeDataEmitter: EventEmitter<FunctionNode | undefined> = new EventEmitter<FunctionNode | undefined>();

  readonly onDidChangeTreeData: Event<FunctionNode | undefined> = this.onDidChangeTreeDataEmitter.event;

  public registeredCommands: Disposable[] = [];

  constructor() {
    this.treeView = window.createTreeView('knativeFunctionProjectExplorer', { treeDataProvider: this, canSelectMany: true });
  }

  // eslint-disable-next-line class-methods-use-this
  getTreeItem(element: FunctionNode): TreeItem | Thenable<TreeItem> {
    return element;
  }

  // eslint-disable-next-line class-methods-use-this
  getChildren(element?: FunctionNode): ProviderResult<FunctionNode[]> {
    if (element) {
      return element.getChildren();
    }
    return functionTreeView();
  }

  // eslint-disable-next-line class-methods-use-this
  getParent?(element: FunctionNode): FunctionNode {
    return element.getParent();
  }

  async refresh(target?: FunctionNode): Promise<void> {
    if (target) {
      await target.refresh();
    }
    this.onDidChangeTreeDataEmitter.fire(target);
  }

  dispose(): void {
    this.registeredCommands.forEach((command) => {
      command.dispose();
    });
    this.treeView.dispose();
  }

  async reveal(item: FunctionNode): Promise<void> {
    await this.refresh(item.getParent());
    await this.treeView.reveal(item);
    await this.treeView.reveal(item);
  }

  getSelection(): FunctionNode[] | undefined {
    return this.treeView.selection;
  }

  isVisible(): boolean {
    return this.treeView.visible;
  }
}

export const functionExplorer = new FunctionExplorer();
