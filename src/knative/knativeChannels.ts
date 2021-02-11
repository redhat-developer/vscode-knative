/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Channel } from './channel';

/**
 * A singleton to hold the Channels.
 * Public methods to control the list of Channels.
 */
export class KnativeChannels {
  private static instance: KnativeChannels;

  // eslint-disable-next-line no-useless-constructor
  private constructor() {
    // do something if needed, but this is private for the singleton
  }

  public static get Instance(): KnativeChannels {
    if (!KnativeChannels.instance) {
      KnativeChannels.instance = new KnativeChannels();
    }
    return KnativeChannels.instance;
  }

  private channels: Channel[] = [];

  // eslint-disable-next-line class-methods-use-this
  private updateTree(): void {
    // TODO:
    // tell the tree view to refresh it's look at the data in 'channels'
    // convert channels to tree objects and then sort them
  }

  public getChannels(): Channel[] {
    return this.channels;
  }

  public findChannel(channelName: string): Channel {
    return this.channels[this.channels.findIndex((s) => s.name === channelName)];
  }

  public addChannel(channel: Channel): Channel {
    this.channels.push(channel);
    // this.channels.sort(compareNodes);
    this.updateTree();
    return channel;
  }

  public addChannels(channels: Channel[]): Channel[] {
    this.channels = channels;
    // this.channels.sort(compareNodes);
    this.updateTree();
    return this.channels;
  }

  public updateChannel(channel: Channel): Channel[] {
    const updated: Channel[] = this.channels.map((s) => {
      if (s.name === channel.name) {
        return channel;
      }
      return s;
    });
    // passing this through a variable to ensure we don't change values while working on them
    this.channels = updated;
    return this.channels;
  }

  public removeChannel(name: string): Channel[] {
    // find the index of the channel passed in.
    const channelIndex: number = this.channels.findIndex((s) => s.name === name);
    // remove the channel
    this.channels.splice(channelIndex, 1);

    this.updateTree();
    return this.channels;
  }
}
