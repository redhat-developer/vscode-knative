/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Disposable, Event, EventEmitter, ProviderResult, TreeDataProvider, TreeItem, TreeView, window } from 'vscode';
import { activeCommandTreeView } from './active-command-tree-view';
import { CommandNode } from './command-node';

export class ActiveCommandExplorer implements TreeDataProvider<CommandNode>, Disposable {
  private treeView: TreeView<CommandNode>;

  private onDidChangeTreeDataEmitter: EventEmitter<CommandNode | undefined> = new EventEmitter<CommandNode | undefined>();

  readonly onDidChangeTreeData: Event<CommandNode | undefined> = this.onDidChangeTreeDataEmitter.event;

  constructor() {
    this.treeView = window.createTreeView('activeTaskFunction', { treeDataProvider: this, canSelectMany: false });
  }

  getTreeItem(element: CommandNode): TreeItem | Thenable<TreeItem> {
    return element;
  }

  getChildren(element?: CommandNode): ProviderResult<CommandNode[]> {
    if (element) {
      return element.getChildren();
    }
    return activeCommandTreeView();
  }

  getParent?(element: CommandNode): CommandNode {
    return element.getParent();
  }

  async refresh(target?: CommandNode): Promise<void> {
    if (target) {
      await target.refresh();
    }
    this.onDidChangeTreeDataEmitter.fire(target);
  }

  dispose(): void {
    this.treeView.dispose();
  }

  async reveal(item: CommandNode): Promise<void> {
    this.refresh(item.getParent());
    // double call of reveal is workaround for possible upstream issue
    // https://github.com/redhat-developer/vscode-openshift-tools/issues/762
    await this.treeView.reveal(item);
    this.treeView.reveal(item);
  }

  getSelection(): CommandNode[] | undefined {
    return this.treeView.selection;
  }

  isVisible(): boolean {
    return this.treeView.visible;
  }
}

export const activeCommandExplorer = new ActiveCommandExplorer();
