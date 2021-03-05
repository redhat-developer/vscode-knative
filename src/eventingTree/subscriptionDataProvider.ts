/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { TreeItemCollapsibleState, Uri } from 'vscode';
import { EventingTreeItem } from './eventingTreeItem';
import { CliExitData } from '../cli/cmdCli';
import { EventingContextType, ServingContextType } from '../cli/config';
import { Execute, loadItems } from '../cli/execute';
import { KnAPI } from '../cli/kn-api';
import { Broker } from '../knative/broker';
import { Channel } from '../knative/channel';
import { KnativeEvents } from '../knative/knativeEvents';
import { compareNodes } from '../knative/knativeItem';
import { KnativeSubscriptions } from '../knative/knativeSubscriptions';
import { Service } from '../knative/service';
import { Sink } from '../knative/sink';
import { Subscription } from '../knative/subscription';
import { ServingTreeItem } from '../servingTree/servingTreeItem';

export class SubscriptionDataProvider {
  public knExecutor = new Execute();

  private kSubs: KnativeSubscriptions = KnativeSubscriptions.Instance;

  private events: KnativeEvents = KnativeEvents.Instance;

  /**
   * Fetch the Subscription data
   *
   * When creating a new Subscription on the cluster it takes time, however this fetch is called immediately.
   * It will continue to call itself until the data is complete on the cluster.
   */
  private async getSubscriptionsList(): Promise<Subscription[]> {
    let subscriptions: Subscription[] = [];
    // Get the raw data from the cli call.
    let result: CliExitData;
    try {
      result = await this.knExecutor.execute(KnAPI.listSubscriptions());
    } catch (err) {
      // eslint-disable-next-line no-console, @typescript-eslint/restrict-template-expressions
      console.log(`Subscription data provider fetch had error.\n ${err}`);
    }
    subscriptions = this.kSubs.addSubscriptions(loadItems(result).map((value) => Subscription.JSONToSubscription(value)));
    // If there are no Subscriptions found then stop looking and we can post 'No Subscriptions Found`
    if (subscriptions.length === 0) {
      return subscriptions;
    }

    let subscriptionNotReady: boolean;
    // Make sure there is Status info in the Subscription to confirm that it has finished being created.
    subscriptions.find((s): boolean => {
      if (s.details.status.conditions === undefined) {
        subscriptionNotReady = true;
        return subscriptionNotReady;
      }
      subscriptionNotReady = false;
      return subscriptionNotReady;
    });
    if (subscriptionNotReady) {
      return this.getSubscriptionsList();
    }
    return subscriptions;
  }

  /**
   * The Subscription is the highest level of the tree for Knative. This method sets it at the root if not already done.
   */
  public async getSubscriptions(parent: EventingTreeItem): Promise<EventingTreeItem[]> {
    const subscriptions = await this.getSubscriptionsList();

    // Pull out the name of the subscription from the raw data.
    // Create an empty state message when there is no Subscription.
    if (subscriptions.length === 0) {
      return [
        new EventingTreeItem(
          parent,
          null,
          { label: 'No Subscription Found' },
          EventingContextType.NONE,
          TreeItemCollapsibleState.None,
        ),
      ];
    }

    // Add the list of children to the parent for reference
    this.events.addChildren(subscriptions);

    // Convert the fetch Subscriptions into TreeItems
    const children = subscriptions
      .map<EventingTreeItem>((value) => {
        const obj: EventingTreeItem = new EventingTreeItem(
          parent,
          value,
          { label: value.name },
          EventingContextType.SUBSCRIPTION,
          TreeItemCollapsibleState.Expanded,
        );
        return obj;
      })
      .sort(compareNodes);

    return children;
  }

  /**
   * A Subscription should have at least 2 children and up to 4. This will build a list of those children.
   */
  // eslint-disable-next-line class-methods-use-this
  public getSubscriptionChildren(parent: EventingTreeItem): Array<EventingTreeItem | ServingTreeItem> {
    const sub: Subscription = parent.getKnativeItem() as Subscription;

    const children: Sink[] = [sub.childChannel, sub.childSink, sub.childSinkReply, sub.childSinkDeadLetter];
    const childrenLabel = ['Channel', 'Subscriber', 'Reply', 'DeadLetterSink'];
    const treeItems: Array<EventingTreeItem | ServingTreeItem> = [];
    // Create an empty state message when there are no Children.
    children.forEach((child, index) => {
      // Only look at the Channel and Sink children, then look to see if the item exists
      if (index < 2 && (child === null || child === undefined)) {
        treeItems.push(
          new EventingTreeItem(
            parent,
            null,
            { label: `${childrenLabel[index]} Not Found` },
            EventingContextType.NONE,
            TreeItemCollapsibleState.None,
          ),
        );
      }
      if (child instanceof Broker) {
        treeItems.push(
          new EventingTreeItem(
            parent,
            child,
            { label: `${childrenLabel[index]} - ${child.name}` },
            EventingContextType.BROKER,
            TreeItemCollapsibleState.None,
          ),
        );
      }
      if (child instanceof Channel) {
        treeItems.push(
          new EventingTreeItem(
            parent,
            child,
            { label: `${childrenLabel[index]} - ${child.name}` },
            EventingContextType.CHANNEL,
            TreeItemCollapsibleState.None,
          ),
        );
      }
      if (child instanceof Service) {
        treeItems.push(
          new ServingTreeItem(
            parent,
            child,
            { label: `${childrenLabel[index]} - ${child.name}` },
            ServingContextType.SERVICE,
            TreeItemCollapsibleState.None,
          ),
        );
      }
      if (child instanceof Uri) {
        treeItems.push(
          new EventingTreeItem(
            parent,
            null,
            { label: `${childrenLabel[index]} - ${child.toString()}` },
            EventingContextType.URI,
            TreeItemCollapsibleState.None,
          ),
        );
      }
    });

    return treeItems;
  }
}
