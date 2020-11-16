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
import { Broker } from '../knative/broker';
import { KnativeBrokers } from '../knative/knativeBrokers';

export class BrokerDataProvider implements TreeDataProvider<EventingTreeItem> {
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
    if (element && element.contextValue === EventingContextType.BROKER) {
      children = this.getBrokers(element);
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

  private ksrc: KnativeBrokers = KnativeBrokers.Instance;

  /**
   * Fetch the Broker data
   *
   * When creating a new Broker on the cluster it takes time, however this fetch is called immediately.
   * It will continue to call itself until the data is complete on the cluster.
   */
  private async getBrokersList(): Promise<Broker[]> {
    let brokers: Broker[] = [];
    // Get the raw data from the cli call.
    const result: CliExitData = await this.knExecutor.execute(KnAPI.listBrokers());
    brokers = this.ksrc.addBrokers(loadItems(result).map((value) => Broker.JSONToBroker(value)));
    // If there are no Brokers found then stop looking and we can post 'No Brokers Found`
    if (brokers.length === 0) {
      return brokers;
    }

    let brokerNotReady: boolean;
    // Make sure there is Status info in the Broker to confirm that it has finished being created.
    brokers.find((s): boolean => {
      if (s.details.status.conditions === undefined) {
        brokerNotReady = true;
        return brokerNotReady;
      }
      brokerNotReady = false;
      return brokerNotReady;
    });
    if (brokerNotReady) {
      return this.getBrokersList();
    }
    return brokers;
  }

  /**
   * The Broker is the highest level of the tree for Knative. This method sets it at the root if not already done.
   */
  public async getBrokers(parent: EventingTreeItem): Promise<EventingTreeItem[]> {
    const brokers = await this.getBrokersList();

    // Pull out the name of the broker from the raw data.
    // Create an empty state message when there is no Broker.
    if (brokers.length === 0) {
      return [
        new EventingTreeItem(
          parent,
          null,
          'No Broker Found',
          EventingContextType.NONE,
          TreeItemCollapsibleState.None,
          null,
          null,
        ),
      ];
    }

    // Convert the fetch Brokers into TreeItems
    const children = brokers
      .map<EventingTreeItem>((value) => {
        const obj: EventingTreeItem = new EventingTreeItem(
          parent,
          value,
          value.name,
          EventingContextType.BROKER,
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
