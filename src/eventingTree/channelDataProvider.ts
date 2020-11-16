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
import { Channel } from '../knative/channel';
import { KnativeChannels } from '../knative/knativeChannels';

export class ChannelDataProvider implements TreeDataProvider<EventingTreeItem> {
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
    if (element && element.contextValue === EventingContextType.CHANNEL) {
      children = this.getChannels(element);
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

  private ksrc: KnativeChannels = KnativeChannels.Instance;

  /**
   * Fetch the Channel data
   *
   * When creating a new Channel on the cluster it takes time, however this fetch is called immediately.
   * It will continue to call itself until the data is complete on the cluster.
   */
  private async getChannelsList(): Promise<Channel[]> {
    let channels: Channel[] = [];
    // Get the raw data from the cli call.
    const result: CliExitData = await this.knExecutor.execute(KnAPI.listChannels());
    channels = this.ksrc.addChannels(loadItems(result).map((value) => Channel.JSONToChannel(value)));
    // If there are no Channels found then stop looking and we can post 'No Channels Found`
    if (channels.length === 0) {
      return channels;
    }

    let channelNotReady: boolean;
    // Make sure there is Status info in the Channel to confirm that it has finished being created.
    channels.find((s): boolean => {
      if (s.details.status.conditions === undefined) {
        channelNotReady = true;
        return channelNotReady;
      }
      channelNotReady = false;
      return channelNotReady;
    });
    if (channelNotReady) {
      return this.getChannelsList();
    }
    return channels;
  }

  /**
   * The Channel is the highest level of the tree for Knative. This method sets it at the root if not already done.
   */
  public async getChannels(parent: EventingTreeItem): Promise<EventingTreeItem[]> {
    const channels = await this.getChannelsList();

    // Pull out the name of the channel from the raw data.
    // Create an empty state message when there is no Channel.
    if (channels.length === 0) {
      return [
        new EventingTreeItem(
          parent,
          null,
          'No Channel Found',
          EventingContextType.NONE,
          TreeItemCollapsibleState.None,
          null,
          null,
        ),
      ];
    }

    // Convert the fetch Channels into TreeItems
    const children = channels
      .map<EventingTreeItem>((value) => {
        const obj: EventingTreeItem = new EventingTreeItem(
          parent,
          value,
          value.name,
          EventingContextType.CHANNEL,
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
