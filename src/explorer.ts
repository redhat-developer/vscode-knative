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
import { Kn, KnController } from './kn/knController';
import { TreeObject } from './kn/knativeTreeObject';
import WatchUtil, { FileContentChangeNotifier } from './util/watch';

const kubeConfigFolder: string = path.join(Platform.getUserHomePath(), '.kube');

export default class KnativeExplorer implements TreeDataProvider<TreeObject>, Disposable {
  private static instance: KnativeExplorer;

  private static knctl: Kn = KnController.Instance;

  private treeView: TreeView<TreeObject>;

  private fsw: FileContentChangeNotifier;

  private onDidChangeTreeDataEmitter: EventEmitter<TreeObject | undefined> = new EventEmitter<
    TreeObject | undefined
  >();

  readonly onDidChangeTreeData: Event<TreeObject | undefined> = this.onDidChangeTreeDataEmitter
    .event;

  private constructor() {
    this.fsw = WatchUtil.watchFileForContextChange(kubeConfigFolder, 'config');
    this.fsw.emitter.on('file-changed', this.refresh.bind(this));
    // Initialize the tree/explorer view by linking the refernece in the package.json to this class.
    this.treeView = window.createTreeView('knativeProjectExplorer', { treeDataProvider: this });
    KnativeExplorer.knctl.subject.subscribe((event) => {
      if (event.reveal) {
        this.reveal(event.data);
      } else {
        this.refresh(event.data);
      }
    });
  }

  static getInstance(): KnativeExplorer {
    if (!KnativeExplorer.instance) {
      KnativeExplorer.instance = new KnativeExplorer();
    }
    return KnativeExplorer.instance;
  }

  // eslint-disable-next-line class-methods-use-this
  getTreeItem(element: TreeObject): TreeItem | Thenable<TreeItem> {
    return element;
  }

  /**
   * Called when the user opens the view, it populates the view.
   * @param element
   */
  // eslint-disable-next-line class-methods-use-this
  getChildren(element?: TreeObject): ProviderResult<TreeObject[]> {
    return element ? element.getChildren() : KnativeExplorer.knctl.getServices();
  }

  // eslint-disable-next-line class-methods-use-this
  getParent?(element: TreeObject): TreeObject {
    return element.getParent();
  }

  refresh(target?: TreeObject): void {
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

  async reveal(item: TreeObject): Promise<void> {
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
