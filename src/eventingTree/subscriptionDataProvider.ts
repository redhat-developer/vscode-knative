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
import { Subscription } from '../knative/subscription';
import { KnativeSubscriptions } from '../knative/knativeSubscriptions';

export class SubscriptionDataProvider implements TreeDataProvider<EventingTreeItem> {
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
    if (element && element.contextValue === EventingContextType.SUBSCRIPTION) {
      children = this.getSubscriptions(element);
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

  private ksrc: KnativeSubscriptions = KnativeSubscriptions.Instance;

  /**
   * Fetch the Subscription data
   *
   * When creating a new Subscription on the cluster it takes time, however this fetch is called immediately.
   * It will continue to call itself until the data is complete on the cluster.
   */
  private async getSubscriptionsList(): Promise<Subscription[]> {
    let subscriptions: Subscription[] = [];
    // Get the raw data from the cli call.
    const result: CliExitData = await this.knExecutor.execute(KnAPI.listSubscriptions());
    subscriptions = this.ksrc.addSubscriptions(loadItems(result).map((value) => Subscription.JSONToSubscription(value)));
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
          'No Subscription Found',
          EventingContextType.NONE,
          TreeItemCollapsibleState.None,
          null,
          null,
        ),
      ];
    }

    // Convert the fetch Subscriptions into TreeItems
    const children = subscriptions
      .map<EventingTreeItem>((value) => {
        const obj: EventingTreeItem = new EventingTreeItem(
          parent,
          value,
          value.name,
          EventingContextType.SUBSCRIPTION,
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
