/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import {
  TreeDataProvider,
  TreeItem,
  Event,
  ProviderResult,
  EventEmitter,
  Disposable,
  TreeView,
  window,
  extensions,
  version,
  commands,
  Uri,
} from 'vscode';

import * as path from 'path';
import Platform from './util/platform';

import { Kn, KnImpl } from './kn/knController';
import { KnativeTreeObject } from './kn/knativeTreeObject';
import WatchUtil, { FileContentChangeNotifier } from './util/watch';

const kubeConfigFolder: string = path.join(Platform.getUserHomePath(), '.kube');

export default class KnativeExplorer implements TreeDataProvider<KnativeTreeObject>, Disposable {
  private static instance: KnativeExplorer;

  private static knctl: Kn = KnImpl.Instance;

  private treeView: TreeView<KnativeTreeObject>;

  private fsw: FileContentChangeNotifier;

  private onDidChangeTreeDataEmitter: EventEmitter<
    KnativeTreeObject | undefined
  > = new EventEmitter<KnativeTreeObject | undefined>();

  readonly onDidChangeTreeData: Event<KnativeTreeObject | undefined> = this
    .onDidChangeTreeDataEmitter.event;

  private constructor() {
    this.fsw = WatchUtil.watchFileForContextChange(kubeConfigFolder, 'config');
    this.fsw.emitter.on('file-changed', this.refresh.bind(this));
    this.treeView = window.createTreeView('knativeProjectExplorer', { treeDataProvider: this });
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    KnativeExplorer.knctl.subject.subscribe((event) =>
      event.reveal ? this.reveal(event.data) : this.refresh(event.data),
    );
  }

  static getInstance(): KnativeExplorer {
    if (!KnativeExplorer.instance) {
      KnativeExplorer.instance = new KnativeExplorer();
    }
    return KnativeExplorer.instance;
  }

  // eslint-disable-next-line class-methods-use-this
  getTreeItem(element: KnativeTreeObject): TreeItem | Thenable<TreeItem> {
    return element;
  }

  // eslint-disable-next-line class-methods-use-this
  getChildren(element?: KnativeTreeObject): ProviderResult<KnativeTreeObject[]> {
    return element ? element.getChildren() : KnativeExplorer.knctl.getServices();
  }

  // eslint-disable-next-line class-methods-use-this
  getParent?(element: KnativeTreeObject): KnativeTreeObject {
    return element.getParent();
  }

  refresh(target?: KnativeTreeObject): void {
    if (!target) {
      KnativeExplorer.knctl.clearCache();
      KnativeExplorer.knctl.getServices();
    }
    this.onDidChangeTreeDataEmitter.fire(target);
  }

  dispose(): void {
    this.fsw.watcher.close();
    this.treeView.dispose();
  }

  async reveal(item: KnativeTreeObject): Promise<void> {
    this.refresh(item.getParent());
    // double call of reveal is workaround for possible upstream issue
    // https://github.com/redhat-developer/vscode-openshift-tools/issues/762
    await this.treeView.reveal(item);
    this.treeView.reveal(item);
  }

  static async reportIssue(): Promise<unknown> {
    return commands.executeCommand('vscode.open', Uri.parse(KnativeExplorer.issueUrl()));
  }

  static issueUrl(): string {
    const { packageJSON } = extensions.getExtension('redhat.vscode-knative');
    const body = [
      `VS Code version: ${version}`,
      `OS: ${Platform.OS}`,
      `Extension version: ${packageJSON.version}`,
    ].join('\n');
    return `${packageJSON.bugs}/new?labels=kind/bug&title=&body=**Environment**\n${body}\n**Description**`;
  }
}
