/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Event, EventEmitter, ProviderResult, TreeDataProvider, TreeItem, TreeItemCollapsibleState } from 'vscode';
import { EventingTreeItem } from './eventingTreeItem';
import { Execute, loadItems } from '../cli/execute';
import { CliExitData } from '../cli/cmdCli';
import { KnAPI } from '../cli/kn-api';
import { EventingContextType } from '../cli/config';
import { compareNodes } from '../knative/knativeItem';
import { Source } from '../knative/source';
import { KnativeSources } from '../knative/knativeSources';

export class SourceDataProvider implements TreeDataProvider<EventingTreeItem> {
  public knExecutor = new Execute();

  private onDidChangeTreeDataEmitter: EventEmitter<EventingTreeItem | undefined | null> = new EventEmitter<
    EventingTreeItem | undefined | null
  >();

  readonly onDidChangeTreeData: Event<EventingTreeItem | undefined | null> = this.onDidChangeTreeDataEmitter.event;

  refresh(target?: EventingTreeItem): void {
    this.onDidChangeTreeDataEmitter.fire(target);
  }

  /**
   * Get the UI representation of the TreeObject.
   *
   * Required to fulfill the `TreeDataProvider` API.
   * @param element TreeObject
   */
  // eslint-disable-next-line class-methods-use-this
  getTreeItem(element: EventingTreeItem): TreeItem | Thenable<TreeItem> {
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
  getChildren(element?: EventingTreeItem): ProviderResult<EventingTreeItem[]> {
    let children: ProviderResult<EventingTreeItem[]>;
    if (element && element.contextValue === EventingContextType.SOURCE) {
      children = this.getSources(element);
    } else {
      children = [
        new EventingTreeItem(element, null, 'Empty', EventingContextType.NONE, TreeItemCollapsibleState.None, null, null),
      ];
    }
    return children;
  }

  // eslint-disable-next-line class-methods-use-this
  getParent?(element: EventingTreeItem): EventingTreeItem {
    return element.getParent();
  }

  private ksrc: KnativeSources = KnativeSources.Instance;

  /**
   * Fetch the Source data
   *
   * When creating a new Source on the cluster it takes time, however this fetch is called immediately.
   * It will continue to call itself until the data is complete on the cluster.
   */
  private async getSourcesList(): Promise<Source[]> {
    let sources: Source[] = [];
    // Get the raw data from the cli call.
    const result: CliExitData = await this.knExecutor.execute(KnAPI.listSources());
    sources = this.ksrc.addSources(loadItems(result).map((value) => Source.JSONToSource(value)));
    // If there are no Sources found then stop looking and we can post 'No Sources Found`
    if (sources.length === 0) {
      return sources;
    }

    let sourceNotReady: boolean;
    // Make sure there is Status info in the Source to confirm that it has finished being created.
    sources.find((s): boolean => {
      if (s.details.status.conditions === undefined) {
        sourceNotReady = true;
        return sourceNotReady;
      }
      sourceNotReady = false;
      return sourceNotReady;
    });
    if (sourceNotReady) {
      return this.getSourcesList();
    }
    return sources;
  }

  /**
   * The Source is the highest level of the tree for Knative. This method sets it at the root if not already done.
   */
  public async getSources(parent: EventingTreeItem): Promise<EventingTreeItem[]> {
    const sources = await this.getSourcesList();

    // Pull out the name of the source from the raw data.
    // Create an empty state message when there is no Source.
    if (sources.length === 0) {
      return [
        new EventingTreeItem(
          parent,
          null,
          'No Source Found',
          EventingContextType.NONE,
          TreeItemCollapsibleState.None,
          null,
          null,
        ),
      ];
    }

    // Convert the fetch Sources into TreeItems
    const children = sources
      .map<EventingTreeItem>((value) => {
        const obj: EventingTreeItem = new EventingTreeItem(
          parent,
          value,
          value.name,
          EventingContextType.SOURCE,
          TreeItemCollapsibleState.None,
          null,
          null,
        );
        return obj;
      })
      .sort(compareNodes);

    return children;
  }
}
