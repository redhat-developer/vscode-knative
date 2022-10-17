/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { Disposable, TreeView, window, workspace } from 'vscode';
import * as vscode from 'vscode';
// eslint-disable-next-line import/no-cycle
import { ServingDataProvider } from './servingDataProvider';
import { ServingTreeItem } from './servingTreeItem';
import { EventingTreeItem } from '../eventingTree/eventingTreeItem';
import { Platform } from '../util/platform';
import { WatchUtil, FileContentChangeNotifier } from '../util/watch';

const kubeConfigFolder: string = path.join(Platform.getUserHomePath(), '.kube');
const kubeconfigParam: string[][] = [[kubeConfigFolder, 'config']];
const kubeconfigEnv: string = process.env.KUBECONFIG;
let kubeconfigList: string[] = [];
// check to make sure there is an ENV for KUBECONFIG
if (kubeconfigEnv) {
  kubeconfigList = kubeconfigEnv.split(path.delimiter);
}
kubeconfigList.forEach((value): void => {
  const kubeconfigSplit: string[] = value.split(path.sep);
  const kubeconfigFileName: string = kubeconfigSplit.pop();
  const kubeconfigDir: string = kubeconfigSplit.join(path.sep);
  kubeconfigParam.push([kubeconfigDir, kubeconfigFileName]);
});

export class ServingExplorer implements Disposable {
  public treeView: TreeView<ServingTreeItem | EventingTreeItem>;

  public fsw: FileContentChangeNotifier[] = [];

  public registeredCommands: Disposable[] = [];

  public treeDataProvider: ServingDataProvider;

  public constructor() {
    this.treeDataProvider = new ServingDataProvider();

    // Watch the local kubeconfig locations for changes and refresh when one changes.
    kubeconfigParam.forEach((params) => {
      const l = this.fsw.push(WatchUtil.watchFileForContextChange(params[0], params[1]));
      this.fsw[l - 1].emitter.on('file-changed', () => this.treeDataProvider.refresh());
    });

    if (workspace.getConfiguration('knative').get<boolean>('pollRefresh')) {
      this.treeDataProvider.pollRefresh();
    }

    // Initialize the tree/explorer view by linking the reference in the package.json to this class.
    this.treeView = window.createTreeView('knativeServingProjectExplorer', { treeDataProvider: this.treeDataProvider });

    this.registeredCommands = [
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      vscode.commands.registerCommand('service.output', () => this.treeDataProvider.showOutputChannel()),
      vscode.commands.registerCommand('service.explorer.create', () => this.treeDataProvider.addService()),
      vscode.commands.registerCommand('service.explorer.delete', (treeItem: ServingTreeItem) =>
        this.treeDataProvider.deleteFeature(treeItem),
      ),
      vscode.commands.registerCommand('service.explorer.tag', (treeItem: ServingTreeItem) =>
        this.treeDataProvider.addTag(treeItem),
      ),
      vscode.commands.registerCommand('service.explorer.refresh', () => this.treeDataProvider.refresh()),
    ];
  }

  dispose(): void {
    this.registeredCommands.forEach((command) => {
      command.dispose();
    });
    this.fsw.forEach((value) => {
      value.watcher.close();
    });
    this.treeView.dispose();
  }

  public async reveal(item: ServingTreeItem): Promise<void> {
    await this.treeView.reveal(item);
  }
}
