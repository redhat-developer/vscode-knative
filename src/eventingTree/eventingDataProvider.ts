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
import { EventingTreeItem } from './eventingTreeItem';
import { BrokerDataProvider } from './brokerDataProvider';
import { ChannelDataProvider } from './channelDataProvider';
import { SourceDataProvider } from './sourceDataProvider';
import { SubscriptionDataProvider } from './subscriptionDataProvider';
import { TriggerDataProvider } from './triggerDataProvider';
import { EventingContextType } from '../cli/config';
import { KnativeResourceVirtualFileSystemProvider } from '../cli/virtualfs';
import { KnativeEvents } from '../knative/knativeEvents';
import { KEvent } from '../knative/kEvent';

export class EventingDataProvider implements TreeDataProvider<EventingTreeItem> {
  private events: KnativeEvents = KnativeEvents.Instance;

  public brokerDataProvider = new BrokerDataProvider();

  public channelDataProvider = new ChannelDataProvider();

  public sourceDataProvider = new SourceDataProvider();

  public subscriptionDataProvider = new SubscriptionDataProvider();

  public triggerDataProvider = new TriggerDataProvider();

  public knvfs = new KnativeResourceVirtualFileSystemProvider();

  private onDidChangeTreeDataEmitter: EventEmitter<EventingTreeItem | undefined | null> = new EventEmitter<
    EventingTreeItem | undefined | null
  >();

  readonly onDidChangeTreeData: Event<EventingTreeItem | undefined | null> = this.onDidChangeTreeDataEmitter.event;

  refresh(target?: EventingTreeItem): void {
    this.onDidChangeTreeDataEmitter.fire(target);
  }

  stopRefresh: NodeJS.Timeout;

  /**
   * Start a refresh of the tree that happens every 60 seconds
   */
  pollRefresh = (): void => {
    this.stopRefresh = setInterval(() => {
      // eslint-disable-next-line no-console
      // console.log(`ServingDataProvider.pollRefresh`);
      this.refresh();
    }, vscode.workspace.getConfiguration('knative').get<number>('pollRefreshDelay') * 1000);
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
    if (element) {
      children = this.getEventingInstances(element);
    } else {
      children = this.getEventingFolders();
    }
    return children;
  }

  // eslint-disable-next-line class-methods-use-this
  getParent?(element: EventingTreeItem): EventingTreeItem {
    return element.getParent();
  }

  /**
   * The Revision is a child of Service. Every update makes a new Revision.
   * Fetch the Revisions and associate them with their parent Services.
   *
   * @param parentService
   */
  public async getEventingInstances(parentEventFolder: EventingTreeItem): Promise<EventingTreeItem[]> {
    let children: Promise<EventingTreeItem[]>;
    try {
      if (parentEventFolder.contextValue === EventingContextType.BROKER) {
        children = this.brokerDataProvider.getBrokers(parentEventFolder);
      }
      if (parentEventFolder.contextValue === EventingContextType.CHANNEL) {
        children = this.channelDataProvider.getChannels(parentEventFolder);
      }
      if (parentEventFolder.contextValue === EventingContextType.SOURCE) {
        children = this.sourceDataProvider.getSources(parentEventFolder);
      }
      if (parentEventFolder.contextValue === EventingContextType.SUBSCRIPTION) {
        children = this.subscriptionDataProvider.getSubscriptions(parentEventFolder);
      }
      if (parentEventFolder.contextValue === EventingContextType.TRIGGER) {
        children = this.triggerDataProvider.getTriggers(parentEventFolder);
      }
    } catch (err) {
      // Catch the Rejected Promise of the Execute to list Eventing data.
      vscode.window.showErrorMessage(`Caught an error getting the Eventing data.\n ${err}`, { modal: true }, 'OK');
      return null;
    }

    return children;
  }

  /**
   * The Service is the highest level of the tree for Knative. This method sets it at the root if not already done.
   */
  public getEventingFolders(): EventingTreeItem[] {
    const eventingConcepts = ['Brokers', 'Channels', 'Sources', 'Subscriptions', 'Triggers'];

    const events: KEvent[] = eventingConcepts.map(
      (e): KEvent => {
        return new KEvent(e);
      },
    );

    this.events.addEvents(events);

    const eventingFolderNodes = [
      new EventingTreeItem(
        null,
        events[0],
        eventingConcepts[0],
        EventingContextType.BROKER,
        TreeItemCollapsibleState.Expanded,
        null,
        null,
      ),
      new EventingTreeItem(
        null,
        events[1],
        eventingConcepts[1],
        EventingContextType.CHANNEL,
        TreeItemCollapsibleState.Expanded,
        null,
        null,
      ),
      new EventingTreeItem(
        null,
        events[2],
        eventingConcepts[2],
        EventingContextType.SOURCE,
        TreeItemCollapsibleState.Expanded,
        null,
        null,
      ),
      new EventingTreeItem(
        null,
        events[3],
        eventingConcepts[3],
        EventingContextType.SUBSCRIPTION,
        TreeItemCollapsibleState.Expanded,
        null,
        null,
      ),
      new EventingTreeItem(
        null,
        events[4],
        eventingConcepts[4],
        EventingContextType.TRIGGER,
        TreeItemCollapsibleState.Expanded,
        null,
        null,
      ),
    ];

    return eventingFolderNodes;
  }
}
