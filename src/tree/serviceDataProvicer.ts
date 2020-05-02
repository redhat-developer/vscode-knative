/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Event, ProviderResult, EventEmitter, TreeDataProvider, TreeItem } from 'vscode';
import { KnController } from './knController';
import { TreeObject } from './knativeTreeObject';

export class ServiceDataProvider implements TreeDataProvider<TreeObject> {
  private static knctl: KnController = KnController.Instance;

  private onDidChangeTreeDataEmitter: EventEmitter<TreeObject | undefined | null> = new EventEmitter<TreeObject | undefined | null>();

  readonly onDidChangeTreeData: Event<TreeObject | undefined | null> = this.onDidChangeTreeDataEmitter.event;

  // Add the model for the service or the KnController, it might make the on change event fire when updated
  // use the model in the getChildren method
  // constructor(private readonly model: FtpModel) { }

  refresh(target?: TreeObject): void {
    // eslint-disable-next-line no-console
    console.log(`serviceDataProvider.refresh `);
    this.onDidChangeTreeDataEmitter.fire(target);
  }

  /**
   * Get the UI representation of the TreeObject.
   *
   * Required to fulfill the `TreeDataProvider` API.
   * @param element TreeObject
   */
  // eslint-disable-next-line class-methods-use-this
  getTreeItem(element: TreeObject): TreeItem | Thenable<TreeItem> {
    // eslint-disable-next-line no-console
    console.log(`serviceDataProvider.getTreeItem `);
    return element;
  }

  /**
   * When the user opens the Tree View, the getChildren method will be called without
   * an element. From there, your TreeDataProvider should return your top-level tree
   * items. getChildren is then called for each of your top-level tree items, so that
   * you can provide the children of those items.
   *
   * Get the children of the TreeObject passed in or get the root if none is passed in.
   *
   * Required to fulfill the `TreeDataProvider` API.
   *
   * @param element TreeObject
   */
  // eslint-disable-next-line class-methods-use-this
  getChildren(element?: TreeObject): ProviderResult<TreeObject[]> {
    // eslint-disable-next-line no-console
    console.log(`serviceDataProvider.getChildren start`);
    let children: ProviderResult<TreeObject[]>;
    // const ktm: KnativeTreeModel = new KnativeTreeModel();
    if (element) {
      // eslint-disable-next-line no-console
      console.log(`serviceDataProvider.getChildren element.name = ${element.getName()}`);
       if (element.contextValue === 'service') {
        // eslint-disable-next-line no-console
        console.log(`serviceDataProvider.getChildren element.contextValue = ${element.contextValue}`);
        children = ServiceDataProvider.knctl.data.getChildrenByParent(element);
      } else {
        children = element.getChildren();
        // eslint-disable-next-line no-console
        console.log(`serviceDataProvider.getChildren children.toString = ${children.toString}`);
      }
    } else {
      // eslint-disable-next-line no-console
      console.log(`serviceDataProvider.getChildren: No element passed, so run Get Services`);
      children = ServiceDataProvider.knctl.getServices() as ProviderResult<TreeObject[]>;
    }
    // eslint-disable-next-line no-console
    console.log(`serviceDataProvider.getChildren end`);
    return children;
  }

  // eslint-disable-next-line class-methods-use-this
  getParent?(element: TreeObject): TreeObject {
    // eslint-disable-next-line no-console
    console.log(`serviceDataProvider.getParent `);
    return element.getParent();
  }
}
