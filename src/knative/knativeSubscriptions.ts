/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Subscription } from './subscription';

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
    // this.subscriptions.sort(compareNodes);
    this.updateTree();
    return subscription;
  }

  public addSubscriptions(subscriptions: Subscription[]): Subscription[] {
    this.subscriptions = subscriptions;
    // this.subscriptions.sort(compareNodes);
    this.updateTree();
    return this.subscriptions;
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
