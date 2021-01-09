/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Uri } from 'vscode';
import { Subscription } from './subscription';
import { Channel } from './channel';
import { KnativeChannels } from './knativeChannels';
import { Sink } from './sink';
import { KnativeServices } from './knativeServices';
import { KnativeBrokers } from './knativeBrokers';
import { Broker } from './broker';
import { Service } from './service';
import { convertStringToURI } from '../util/parse';

/**
 * A singleton to hold the Subscriptions.
 * Public methods to control the list of Subscriptions.
 */
export class KnativeSubscriptions {
  private static instance: KnativeSubscriptions;

  // eslint-disable-next-line no-useless-constructor
  private constructor() {
    // do something if needed, but this is private for the singleton
  }

  public static get Instance(): KnativeSubscriptions {
    if (!KnativeSubscriptions.instance) {
      KnativeSubscriptions.instance = new KnativeSubscriptions();
    }
    return KnativeSubscriptions.instance;
  }

  private knChannel = KnativeChannels.Instance;

  private knService = KnativeServices.Instance;

  private knBroker = KnativeBrokers.Instance;

  private subscriptions: Subscription[];

  // eslint-disable-next-line class-methods-use-this
  private updateTree(): void {
    // TODO:
    // tell the tree view to refresh it's look at the data in 'subscriptions'
    // convert subscriptions to tree objects and then sort them
  }

  public getSubscriptions(): Subscription[] {
    return this.subscriptions;
  }

  public findSubscription(subscriptionName: string): Subscription {
    return this.subscriptions[this.subscriptions.findIndex((s) => s.name === subscriptionName)];
  }

  public addSubscription(subscription: Subscription): Subscription {
    this.subscriptions.push(subscription);
    this.addChannel(subscription);
    this.addSink(subscription);
    this.addSinkDeadLetter(subscription);
    this.addSinkReply(subscription);
    // this.subscriptions.sort(compareNodes);
    this.updateTree();
    return subscription;
  }

  public addSubscriptions(subscriptions: Subscription[]): Subscription[] {
    this.subscriptions = subscriptions;
    // Add the children objects to the subscription
    subscriptions.forEach((sub) => {
      this.addChannel(sub);
      this.addSink(sub);
      this.addSinkDeadLetter(sub);
      this.addSinkReply(sub);
    });

    // this.subscriptions.sort(compareNodes);
    this.updateTree();
    return this.subscriptions;
  }

  /**
   * Find a Channel from the static list of Channels that matches the name
   *  in the Subscription channel field.
   *
   * Then add that found Channel to the childChannel in the sub sent in.
   * @param subscription
   * @returns channel for the subscription
   */
  public addChannel(subscription: Subscription): Channel {
    const channelName = subscription.channel;
    // if no channel was set on the subscription then don't try to add it.
    if (!channelName) {
      return null;
    }

    const channel: Channel = this.knChannel.getChannels().find((child): boolean => child.name === channelName);
    if (channel) {
      this.findSubscription(subscription.name).childChannel = channel;
      this.updateTree();
    }
    return channel;
  }

  /**
   * Find a Channel from the static list of Channels that matches the name
   *  in the Subscription channel field.
   *
   * Then add that found Channel to the childChannel in the sub sent in.
   * @param subscription
   * @returns channel for the subscription
   */
  public addSink(subscription: Subscription): Sink {
    const sinkName = subscription.sink;
    // if no channel was set on the subscription then don't try to add it.
    if (!sinkName) {
      return null;
    }

    const broker: Broker = this.knBroker.findBroker(sinkName);
    const channel: Channel = this.knChannel.findChannel(sinkName);
    const service: Service = this.knService.findService(sinkName);
    const uri: Uri = sinkName ? convertStringToURI(sinkName) : undefined;
    const sink: Sink = broker || channel || service || uri;
    if (sink) {
      this.findSubscription(subscription.name).childSink = sink;
      this.updateTree();
    }
    return sink;
  }

  /**
   * Find a Channel from the static list of Channels that matches the name
   *  in the Subscription channel field.
   *
   * Then add that found Channel to the childChannel in the sub sent in.
   * @param subscription
   * @returns channel for the subscription
   */
  public addSinkDeadLetter(subscription: Subscription): Sink {
    const sinkName = subscription.sinkDeadLetter;
    // if no channel was set on the subscription then don't try to add it.
    if (!sinkName) {
      return null;
    }

    const broker: Broker = this.knBroker.findBroker(sinkName);
    const channel: Channel = this.knChannel.findChannel(sinkName);
    const service: Service = this.knService.findService(sinkName);
    const uri: Uri = sinkName ? convertStringToURI(sinkName) : undefined;
    const sink: Sink = broker || channel || service || uri;
    if (sink) {
      this.findSubscription(subscription.name).childSinkDeadLetter = sink;
      this.updateTree();
    }
    return sink;
  }

  /**
   * Find a Channel from the static list of Channels that matches the name
   *  in the Subscription channel field.
   *
   * Then add that found Channel to the childChannel in the sub sent in.
   * @param subscription
   * @returns channel for the subscription
   */
  public addSinkReply(subscription: Subscription): Sink {
    const sinkName = subscription.sinkReply;
    // if no channel was set on the subscription then don't try to add it.
    if (!sinkName) {
      return null;
    }

    const broker: Broker = this.knBroker.findBroker(sinkName);
    const channel: Channel = this.knChannel.findChannel(sinkName);
    const service: Service = this.knService.findService(sinkName);
    const uri: Uri = sinkName ? convertStringToURI(sinkName) : undefined;
    const sink: Sink = broker || channel || service || uri;
    if (sink) {
      this.findSubscription(subscription.name).childSinkReply = sink;
      this.updateTree();
    }
    return sink;
  }

  public updateSubscription(subscription: Subscription): Subscription[] {
    const updated: Subscription[] = this.subscriptions.map((s) => {
      if (s.name === subscription.name) {
        return subscription;
      }
      return s;
    });
    // passing this through a variable to ensure we don't change values while working on them
    this.subscriptions = updated;
    return this.subscriptions;
  }

  public removeSubscription(name: string): Subscription[] {
    // find the index of the subscription passed in.
    const subscriptionIndex: number = this.subscriptions.findIndex((s) => s.name === name);
    // remove the subscription
    this.subscriptions.splice(subscriptionIndex, 1);

    this.updateTree();
    return this.subscriptions;
  }
}
