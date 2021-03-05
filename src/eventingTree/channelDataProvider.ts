/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { TreeItemCollapsibleState } from 'vscode';
import { EventingTreeItem } from './eventingTreeItem';
import { CliExitData } from '../cli/cmdCli';
import { EventingContextType } from '../cli/config';
import { Execute, loadItems } from '../cli/execute';
import { KnAPI } from '../cli/kn-api';
import { Channel } from '../knative/channel';
import { KnativeChannels } from '../knative/knativeChannels';
import { KnativeEvents } from '../knative/knativeEvents';
import { compareNodes } from '../knative/knativeItem';

export class ChannelDataProvider {
  public knExecutor = new Execute();

  private kChannels: KnativeChannels = KnativeChannels.Instance;

  private events: KnativeEvents = KnativeEvents.Instance;

  /**
   * Fetch the Channel data
   *
   * When creating a new Channel on the cluster it takes time, however this fetch is called immediately.
   * It will continue to call itself until the data is complete on the cluster.
   */
  private async getChannelsList(): Promise<Channel[]> {
    let channels: Channel[] = [];
    // Get the raw data from the cli call.
    let result: CliExitData;
    try {
      result = await this.knExecutor.execute(KnAPI.listChannels());
    } catch (err) {
      // eslint-disable-next-line no-console, @typescript-eslint/restrict-template-expressions
      console.log(`Channel data provider fetch had error.\n ${err}`);
    }
    channels = this.kChannels.addChannels(loadItems(result).map((value) => Channel.JSONToChannel(value)));
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
          { label: 'No Channel Found' },
          EventingContextType.NONE,
          TreeItemCollapsibleState.None,
        ),
      ];
    }

    // Add the list of children to the parent for reference
    this.events.addChildren(channels);

    // Convert the fetch Channels into TreeItems
    const children = channels
      .map<EventingTreeItem>((value) => {
        const obj: EventingTreeItem = new EventingTreeItem(
          parent,
          value,
          { label: value.name },
          EventingContextType.CHANNEL,
          TreeItemCollapsibleState.None,
        );
        return obj;
      })
      .sort(compareNodes);

    return children;
  }
}
