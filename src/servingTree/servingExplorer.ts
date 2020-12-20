/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Disposable, extensions, TreeView, Uri, version, window, workspace } from 'vscode';
import * as vscode from 'vscode';
import * as path from 'path';
import { Platform } from '../util/platform';
import { ServingTreeItem } from './servingTreeItem';
import { ServingDataProvider } from './servingDataProvider';
import { WatchUtil, FileContentChangeNotifier } from '../util/watch';
import { EventingTreeItem } from '../eventingTree/eventingTreeItem';

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

  // eslint-disable-next-line class-methods-use-this
  public issueUrl(): string {
    const { packageJSON } = extensions.getExtension('redhat.vscode-knative');
    const body = [`VS Code version: ${version}`, `OS: ${Platform.OS}`, `Extension version: ${packageJSON.version}`].join('\n');
    return `${packageJSON.bugs}/new?labels=kind/bug&title=&body=**Environment**\n${body}\n**Description**`;
  }

  public async reportIssue(): Promise<unknown> {
    return vscode.commands.executeCommand('vscode.open', Uri.parse(this.issueUrl()));
  }

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
      vscode.commands.registerCommand('service.output', () => this.treeDataProvider.showOutputChannel()),
      vscode.commands.registerCommand('service.explorer.create', () => this.treeDataProvider.addService()),
      vscode.commands.registerCommand('service.explorer.delete', (treeItem: ServingTreeItem) =>
        this.treeDataProvider.deleteFeature(treeItem),
      ),
      vscode.commands.registerCommand('service.explorer.tag', (treeItem: ServingTreeItem) =>
        this.treeDataProvider.addTag(treeItem),
      ),
      vscode.commands.registerCommand('service.explorer.apply', (treeItem: ServingTreeItem) =>
        this.treeDataProvider.updateServiceFromYaml(treeItem),
      ),
      vscode.commands.registerCommand('service.explorer.deleteLocal', (treeItem: ServingTreeItem) =>
        this.treeDataProvider.deleteLocalYaml(treeItem),
      ),
      vscode.commands.registerCommand('service.explorer.refresh', () => this.treeDataProvider.refresh()),
      vscode.commands.registerCommand('service.explorer.reportIssue', () => this.reportIssue()),
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
