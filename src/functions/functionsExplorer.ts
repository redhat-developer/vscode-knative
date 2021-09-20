/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/


import { TreeDataProvider, TreeView, Event, EventEmitter, TreeItem, ProviderResult, Disposable, window, commands } from 'vscode';
import { FunctionNode } from './functionsTreeItem';

export class FunctionExplorer implements TreeDataProvider<FunctionNode>, Disposable {
  private treeView: TreeView<FunctionNode>;
  private onDidChangeTreeDataEmitter: EventEmitter<FunctionNode | undefined> = new EventEmitter<FunctionNode | undefined>();
  readonly onDidChangeTreeData: Event<FunctionNode | undefined> = this.onDidChangeTreeDataEmitter.event;

  public registeredCommands: Disposable[] = [];

  constructor() {
    this.treeView = window.createTreeView('knativeFunctionProjectExplorer', { treeDataProvider: this, canSelectMany: true });
    this.registeredCommands = [
      commands.registerCommand('function.explorer.refresh', () => this.refresh()),
      commands.registerCommand('function.explorer.create', () => this.refresh()),
    ];
  }

  getTreeItem(element: FunctionNode): TreeItem | Thenable<TreeItem> {
    return element;
  }

  getChildren(element?: FunctionNode): ProviderResult<FunctionNode[]> {
    if (element) {
      return element.getChildren();
    } else {
      // return
    }

  }

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
    this.treeView.dispose();
  }

  async reveal(item: FunctionNode): Promise<void> {
    this.refresh(item.getParent());
    // double call of reveal is workaround for possible upstream issue
    // https://github.com/redhat-developer/vscode-openshift-tools/issues/762
    await this.treeView.reveal(item);
    this.treeView.reveal(item);
  }

  getSelection(): FunctionNode[] | undefined {
    return this.treeView.selection;
  }

  isVisible(): boolean {
    return this.treeView.visible;
  }
}

export const functionExplorer = new FunctionExplorer();
