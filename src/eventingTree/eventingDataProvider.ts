/* eslint-disable import/no-cycle */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import {
  Event,
  EventEmitter,
  FileChangeEvent,
  ProviderResult,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
} from 'vscode';
import * as vscode from 'vscode';
import { BrokerDataProvider } from './brokerDataProvider';
import { ChannelDataProvider } from './channelDataProvider';
import { EventingTreeItem } from './eventingTreeItem';
import { SourceDataProvider } from './sourceDataProvider';
import { SubscriptionDataProvider } from './subscriptionDataProvider';
import { TriggerDataProvider } from './triggerDataProvider';
import { EventingContextType } from '../cli/config';
import { KnativeResourceVirtualFileSystemProvider } from '../cli/virtualfs';
import { KEvent } from '../knative/kEvent';
import { KnativeEvents } from '../knative/knativeEvents';
import { ServingTreeItem } from '../servingTree/servingTreeItem';

export class EventingDataProvider implements TreeDataProvider<EventingTreeItem | ServingTreeItem> {
  private events: KnativeEvents = KnativeEvents.Instance;

  public brokerDataProvider = new BrokerDataProvider();

  public channelDataProvider = new ChannelDataProvider();

  public sourceDataProvider = new SourceDataProvider();

  public subscriptionDataProvider = new SubscriptionDataProvider();

  public triggerDataProvider = new TriggerDataProvider();

  public knvfs = new KnativeResourceVirtualFileSystemProvider();

  private onDidChangeTreeDataEmitter: EventEmitter<EventingTreeItem | ServingTreeItem | undefined | null> = new EventEmitter<
    EventingTreeItem | ServingTreeItem | undefined | null
  >();

  // eslint-disable-next-line prettier/prettier
  readonly onDidChangeTreeData: Event<EventingTreeItem | ServingTreeItem | undefined | null> = this.onDidChangeTreeDataEmitter.event;

  refresh(target?: EventingTreeItem | ServingTreeItem): void {
    this.onDidChangeTreeDataEmitter.fire(target);
  }

  stopRefresh: NodeJS.Timeout;

  /**
   * Start a refresh of the tree that happens every 60 seconds
   */
  pollRefresh = (): void => {
    this.stopRefresh = setInterval(
      () => {
        // eslint-disable-next-line no-console
        // console.log(`ServingDataProvider.pollRefresh`);
        this.refresh();
      },
      vscode.workspace.getConfiguration('knative').get<number>('pollRefreshDelay') * 1000,
    );
  };

  /**
   * Stop the polling refresh
   */
  stopPollRefresh = (): void => {
    clearInterval(this.stopRefresh);
  };

  /**
   * Listen for a Service to be modified and Refresh the tree.
   */
  vfsListener = (event: FileChangeEvent[]): void => {
    // eslint-disable-next-line no-console
    console.log(`ServingDataProvider.vfsListener event ${event[0].type}, ${event[0].uri.path}`);
    this.refresh();
  };

  vfsListenerSubscription = this.knvfs.onDidChangeFile(this.vfsListener);

  /**
   * Get the UI representation of the TreeObject.
   *
   * Required to fulfill the `TreeDataProvider` API.
   * @param element TreeObject
   */
  // eslint-disable-next-line class-methods-use-this
  getTreeItem(element: EventingTreeItem | ServingTreeItem): TreeItem | Thenable<TreeItem> {
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
  getChildren(element?: EventingTreeItem | ServingTreeItem): ProviderResult<Array<EventingTreeItem | ServingTreeItem>> {
    let children: ProviderResult<Array<EventingTreeItem | ServingTreeItem>>;
    if (element) {
      children = this.getEventingInstances(element);
    } else {
      children = this.getEventingFolders();
    }
    return children;
  }

  // eslint-disable-next-line class-methods-use-this
  getParent?(element: EventingTreeItem | ServingTreeItem): EventingTreeItem | ServingTreeItem {
    return element.getParent();
  }

  /**
   * The Revision is a child of Service. Every update makes a new Revision.
   * Fetch the Revisions and associate them with their parent Services.
   *
   * @param parentService
   */
  public async getEventingInstances(
    parentTreeItem: EventingTreeItem | ServingTreeItem,
  ): Promise<Array<EventingTreeItem | ServingTreeItem>> {
    let children: Promise<Array<EventingTreeItem | ServingTreeItem>> | Array<EventingTreeItem | ServingTreeItem>;
    try {
      if (parentTreeItem.contextValue === EventingContextType.BROKER_FOLDER) {
        children = this.brokerDataProvider.getBrokers(parentTreeItem);
      }
      if (parentTreeItem.contextValue === EventingContextType.CHANNEL_FOLDER) {
        children = this.channelDataProvider.getChannels(parentTreeItem);
      }
      if (parentTreeItem.contextValue === EventingContextType.SOURCE_FOLDER) {
        children = this.sourceDataProvider.getSources(parentTreeItem);
      }
      if (parentTreeItem.contextValue === EventingContextType.SOURCE_APISERVER) {
        children = this.sourceDataProvider.getSourceChildren(parentTreeItem);
      }
      if (parentTreeItem.contextValue === EventingContextType.SOURCE_BINDING) {
        children = this.sourceDataProvider.getSourceChildren(parentTreeItem);
      }
      if (parentTreeItem.contextValue === EventingContextType.SOURCE_PING) {
        children = this.sourceDataProvider.getSourceChildren(parentTreeItem);
      }
      if (parentTreeItem.contextValue === EventingContextType.SUBSCRIPTION_FOLDER) {
        children = this.subscriptionDataProvider.getSubscriptions(parentTreeItem);
      }
      if (parentTreeItem.contextValue === EventingContextType.SUBSCRIPTION) {
        children = this.subscriptionDataProvider.getSubscriptionChildren(parentTreeItem);
      }
      if (parentTreeItem.contextValue === EventingContextType.TRIGGER_FOLDER) {
        children = this.triggerDataProvider.getTriggers(parentTreeItem);
      }
      if (parentTreeItem.contextValue === EventingContextType.TRIGGER) {
        children = this.triggerDataProvider.getTriggerChildren(parentTreeItem);
      }
    } catch (err) {
      // Catch the Rejected Promise of the Execute to list Eventing data.
      // note: not sure this will catch the rejected promise, tried to write a unit test and can't catch the error.
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      await vscode.window.showErrorMessage(`Caught an error getting the Eventing data.\n ${err}`, { modal: true }, 'OK');
      return null;
    }

    return children;
  }

  /**
   * The Service is the highest level of the tree for Knative. This method sets it at the root if not already done.
   */
  public getEventingFolders(): EventingTreeItem[] {
    const eventingConcepts = ['Brokers', 'Channels', 'Sources', 'Subscriptions', 'Triggers'];

    const events: KEvent[] = eventingConcepts.map((e): KEvent => new KEvent(e));

    this.events.addEvents(events);

    const eventingFolderNodes = [
      new EventingTreeItem(
        null,
        events[0],
        { label: eventingConcepts[0] },
        EventingContextType.BROKER_FOLDER,
        TreeItemCollapsibleState.Expanded,
        null,
        null,
      ),
      new EventingTreeItem(
        null,
        events[1],
        { label: eventingConcepts[1] },
        EventingContextType.CHANNEL_FOLDER,
        TreeItemCollapsibleState.Expanded,
        null,
        null,
      ),
      new EventingTreeItem(
        null,
        events[2],
        { label: eventingConcepts[2] },
        EventingContextType.SOURCE_FOLDER,
        TreeItemCollapsibleState.Expanded,
        null,
        null,
      ),
      new EventingTreeItem(
        null,
        events[3],
        { label: eventingConcepts[3] },
        EventingContextType.SUBSCRIPTION_FOLDER,
        TreeItemCollapsibleState.Expanded,
        null,
        null,
      ),
      new EventingTreeItem(
        null,
        events[4],
        { label: eventingConcepts[4] },
        EventingContextType.TRIGGER_FOLDER,
        TreeItemCollapsibleState.Expanded,
        null,
        null,
      ),
    ];

    return eventingFolderNodes;
  }
}

export const eventingDataProvider = new EventingDataProvider();
