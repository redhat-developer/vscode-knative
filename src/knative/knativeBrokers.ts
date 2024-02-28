/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Broker } from './broker';

/**
 * A singleton to hold the Brokers.
 * Public methods to control the list of Brokers.
 */
export class KnativeBrokers {
  // eslint-disable-next-line no-use-before-define
  private static instance: KnativeBrokers;

  // eslint-disable-next-line no-useless-constructor
  private constructor() {
    // do something if needed, but this is private for the singleton
  }

  public static get Instance(): KnativeBrokers {
    if (!KnativeBrokers.instance) {
      KnativeBrokers.instance = new KnativeBrokers();
    }
    return KnativeBrokers.instance;
  }

  private brokers: Broker[] = [];

  // eslint-disable-next-line class-methods-use-this
  private updateTree(): void {
    // TODO:
    // tell the tree view to refresh it's look at the data in 'brokers'
    // convert brokers to tree objects and then sort them
  }

  public getBrokers(): Broker[] {
    return this.brokers;
  }

  public findBroker(brokerName: string): Broker {
    return this.brokers[this.brokers.findIndex((s) => s.name === brokerName)];
  }

  public addBroker(broker: Broker): Broker {
    this.brokers.push(broker);
    // this.brokers.sort(compareNodes);
    this.updateTree();
    return broker;
  }

  public addBrokers(brokers: Broker[]): Broker[] {
    this.brokers = brokers;
    // this.brokers.sort(compareNodes);
    this.updateTree();
    return this.brokers;
  }

  public updateBroker(broker: Broker): Broker[] {
    const updated: Broker[] = this.brokers.map((s) => {
      if (s.name === broker.name) {
        return broker;
      }
      return s;
    });
    // passing this through a variable to ensure we don't change values while working on them
    this.brokers = updated;
    return this.brokers;
  }

  public removeBroker(name: string): Broker[] {
    // find the index of the broker passed in.
    const brokerIndex: number = this.brokers.findIndex((s) => s.name === name);
    // remove the broker
    this.brokers.splice(brokerIndex, 1);

    this.updateTree();
    return this.brokers;
  }
}
