/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { commands, Disposable, extensions, TreeView, Uri, version, window } from 'vscode';
import * as path from 'path';
import { Platform } from '../util/platform';
import { KnativeTreeItem } from './knativeTreeItem';
import { ServiceDataProvider } from './serviceDataProvider';
import { WatchUtil, FileContentChangeNotifier } from '../util/watch';

const kubeConfigFolder: string = path.join(Platform.getUserHomePath(), '.kube');

const kubeconfigEnv: string = process.env.KUBECONFIG;
let kubeconfigList: string[] = [];
// check to make sure there is an ENV for KUBECONFIG
if (kubeconfigEnv) {
  kubeconfigList = kubeconfigEnv.split(path.delimiter);
}
const kubeconfigParam: string[][] = [[kubeConfigFolder, 'config']];
kubeconfigList.forEach((value): void => {
  const kubeconfigSplit: string[] = value.split(path.sep);
  const kubeconfigFileName: string = kubeconfigSplit.pop();
  const kubeconfigDir: string = kubeconfigSplit.join(path.sep);
  kubeconfigParam.push([kubeconfigDir, kubeconfigFileName]);
});

function issueUrl(): string {
  const { packageJSON } = extensions.getExtension('redhat.vscode-knative');
  const body = [`VS Code version: ${version}`, `OS: ${Platform.OS}`, `Extension version: ${packageJSON.version}`].join('\n');
  return `${packageJSON.bugs}/new?labels=kind/bug&title=&body=**Environment**\n${body}\n**Description**`;
}

async function reportIssue(): Promise<unknown> {
  return commands.executeCommand('vscode.open', Uri.parse(issueUrl()));
}

export class ServiceExplorer implements Disposable {
  private treeView: TreeView<KnativeTreeItem>;

  private fsw: FileContentChangeNotifier[] = [];

  public constructor() {
    const treeDataProvider = new ServiceDataProvider();
    kubeconfigParam.forEach((params) => {
      const l = this.fsw.push(WatchUtil.watchFileForContextChange(params[0], params[1]));
      this.fsw[l - 1].emitter.on('file-changed', () => treeDataProvider.refresh());
    });

    // Initialize the tree/explorer view by linking the refernece in the package.json to this class.
    this.treeView = window.createTreeView('knativeProjectExplorerServices', { treeDataProvider });

    commands.registerCommand('service.explorer.create', () => treeDataProvider.addService());
    commands.registerCommand('service.explorer.delete', (treeItem: KnativeTreeItem) => treeDataProvider.deleteFeature(treeItem));
    commands.registerCommand('service.explorer.refresh', () => treeDataProvider.refresh());
    commands.registerCommand('service.explorer.reportIssue', () => reportIssue());
  }

  dispose(): void {
    // this.fsw.watcher.close();
    this.fsw.forEach((value) => {
      value.watcher.close();
    });
    this.treeView.dispose();
  }

  public async reveal(item: KnativeTreeItem): Promise<void> {
    await this.treeView.reveal(item);
  }
}
