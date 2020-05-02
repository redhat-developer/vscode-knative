/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { commands, Disposable, extensions, TreeView, Uri, version, window } from 'vscode';
import * as path from 'path';
import { Platform } from '../util/platform';
import { TreeObject } from './knativeTreeObject';
import { ServiceDataProvider } from './serviceDataProvicer';
import { WatchUtil, FileContentChangeNotifier } from '../util/watch';

const kubeConfigFolder: string = path.join(Platform.getUserHomePath(), '.kube');

function issueUrl(): string {
  const { packageJSON } = extensions.getExtension('redhat.vscode-knative');
  const body = [`VS Code version: ${version}`, `OS: ${Platform.OS}`, `Extension version: ${packageJSON.version}`].join('\n');
  return `${packageJSON.bugs}/new?labels=kind/bug&title=&body=**Environment**\n${body}\n**Description**`;
}

export class ServiceExplorer implements Disposable {
  private treeView: TreeView<TreeObject>;

  private fsw: FileContentChangeNotifier;

  public constructor() {
    // eslint-disable-next-line no-console
    console.log(`serviceExplorer.constructor start`);
    const treeDataProvider = new ServiceDataProvider();
    this.fsw = WatchUtil.watchFileForContextChange(kubeConfigFolder, 'config');
    this.fsw.emitter.on('file-changed', treeDataProvider.refresh.bind(this));
    // eslint-disable-next-line no-console
    console.log(`serviceExplorer.constructor: before create tree`);
    // Initialize the tree/explorer view by linking the refernece in the package.json to this class.
    this.treeView = window.createTreeView('knativeProjectExplorerServices', { treeDataProvider });
    commands.registerCommand('knative.explorer.refresh', () => treeDataProvider.refresh());

    // eslint-disable-next-line no-console
    console.log(`serviceExplorer.constructor end`);
  }

  dispose(): void {
    // eslint-disable-next-line no-console
    console.log(`serviceExplorer.dispose`);
    this.fsw.watcher.close();
    this.treeView.dispose();
  }

  public async reveal(item: TreeObject): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(`serviceExplorer.reveal`);
    await this.treeView.reveal(item);
  }

  public static async reportIssue(): Promise<unknown> {
    return commands.executeCommand('vscode.open', Uri.parse(issueUrl()));
  }
}
