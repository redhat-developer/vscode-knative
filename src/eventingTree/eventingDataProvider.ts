/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import {
  Event,
  EventEmitter,
  // FileChangeEvent,
  // FileType,
  ProviderResult,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  // Uri,
} from 'vscode';
// import * as vscode from 'vscode';
// import * as validator from 'validator';
// import * as path from 'path';
// import * as yaml from 'yaml';
import { EventingTreeItem } from './eventingTreeItem';
import { BrokerDataProvider } from './brokerDataProvider';
import { ChannelDataProvider } from './channelDataProvider';
import { SourceDataProvider } from './sourceDataProvider';
import { SubscriptionDataProvider } from './subscriptionDataProvider';
import { TriggerDataProvider } from './triggerDataProvider';
import { Execute } from '../cli/execute';
// import { KubectlAPI } from '../cli/kubectl-api';
import { EventingContextType } from '../cli/config';
import { KnativeResourceVirtualFileSystemProvider } from '../cli/virtualfs';
// import * as vfs from '../cli/virtualfs';
// import { KnOutputChannel, OutputChannel } from '../output/knOutputChannel';

export class EventingDataProvider implements TreeDataProvider<EventingTreeItem> {
  public knExecutor = new Execute();

  public brokerDataProvider = new BrokerDataProvider();

  public channelDataProvider = new ChannelDataProvider();

  public sourceDataProvider = new SourceDataProvider();

  public subscriptionDataProvider = new SubscriptionDataProvider();

  public triggerDataProvider = new TriggerDataProvider();

  public knvfs = new KnativeResourceVirtualFileSystemProvider();

  // private knOutputChannel: OutputChannel = new KnOutputChannel();

  /**
   * 0 - Broker
   *
   * 1 - Channel
   *
   * 2 - Source
   *
   * 3 - Subscription
   *
   * 4 - Trigger
   */
  public eventingFolderNodes = [
    new EventingTreeItem(null, null, 'Broker', EventingContextType.BROKER, TreeItemCollapsibleState.Expanded, null, null),
    new EventingTreeItem(null, null, 'Channel', EventingContextType.CHANNEL, TreeItemCollapsibleState.Expanded, null, null),
    new EventingTreeItem(null, null, 'Source', EventingContextType.SOURCE, TreeItemCollapsibleState.Expanded, null, null),
    new EventingTreeItem(
      null,
      null,
      'Subscription',
      EventingContextType.SUBSCRIPTION,
      TreeItemCollapsibleState.Expanded,
      null,
      null,
    ),
    new EventingTreeItem(null, null, 'Trigger', EventingContextType.TRIGGER, TreeItemCollapsibleState.Expanded, null, null),
  ];

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
    // switch (element.contextValue) {
    //   case EventingContextType.BROKER:
    //     children = this.brokerDataProvider.getBrokers(element);
    //     break;
    //   case EventingContextType.CHANNEL:
    //     children = this.channelDataProvider.getChannels(element);
    //     break;
    //   case EventingContextType.SOURCE:
    //     children = this.sourceDataProvider.getSources(element);
    //     break;
    //   case EventingContextType.SUBSCRIPTION:
    //     children = this.subscriptionDataProvider.getSubscriptions(element);
    //     break;
    //   case EventingContextType.TRIGGER:
    //     children = this.triggerDataProvider.getTriggers(element);
    //     break;
    //   default:
    //     children = [
    //       new EventingTreeItem(element, null, 'Empty', EventingContextType.NONE, TreeItemCollapsibleState.None, null, null),
    //     ];
    // }
    if (element && element.contextValue === EventingContextType.BROKER) {
      children = this.brokerDataProvider.getBrokers(element);
    } else if (element && element.contextValue === EventingContextType.CHANNEL) {
      children = this.channelDataProvider.getChannels(element);
    } else if (element && element.contextValue === EventingContextType.SOURCE) {
      children = this.sourceDataProvider.getSources(element);
    } else if (element && element.contextValue === EventingContextType.SUBSCRIPTION) {
      children = this.subscriptionDataProvider.getSubscriptions(element);
    } else if (element && element.contextValue === EventingContextType.TRIGGER) {
      children = this.triggerDataProvider.getTriggers(element);
    } else {
      children = this.eventingFolderNodes;
    }
    return children;
  }

  // eslint-disable-next-line class-methods-use-this
  getParent?(element: EventingTreeItem): EventingTreeItem {
    return element.getParent();
  }
}
