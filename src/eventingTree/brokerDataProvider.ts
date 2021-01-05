/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { TreeItemCollapsibleState } from 'vscode';
import { EventingTreeItem } from './eventingTreeItem';
import { Execute, loadItems } from '../cli/execute';
import { CliExitData } from '../cli/cmdCli';
import { KnAPI } from '../cli/kn-api';
import { EventingContextType } from '../cli/config';
import { compareNodes } from '../knative/knativeItem';
import { Broker } from '../knative/broker';
import { KnativeBrokers } from '../knative/knativeBrokers';
import { KnativeEvents } from '../knative/knativeEvents';

export class BrokerDataProvider {
  public knExecutor = new Execute();

  private kBrokers: KnativeBrokers = KnativeBrokers.Instance;

  private events: KnativeEvents = KnativeEvents.Instance;

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
    brokers = this.kBrokers.addBrokers(loadItems(result).map((value) => Broker.JSONToBroker(value)));
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
          { label: 'No Broker Found' },
          EventingContextType.NONE,
          TreeItemCollapsibleState.None,
          null,
          null,
        ),
      ];
    }

    // Add the list of children to the parent for reference
    this.events.addChildren(brokers);

    // Convert the fetch Brokers into TreeItems
    const children = brokers
      .map<EventingTreeItem>((value) => {
        const obj: EventingTreeItem = new EventingTreeItem(
          parent,
          value,
          { label: value.name },
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
