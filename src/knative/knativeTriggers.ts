/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Trigger } from './trigger';
import { KnativeChannels } from './knativeChannels';
import { KnativeServices } from './knativeServices';
import { KnativeBrokers } from './knativeBrokers';
import { Broker } from './broker';
import { Channel } from './channel';
import { Service } from './service';
import { Sink } from './sink';

/**
 * A singleton to hold the Triggers.
 * Public methods to control the list of Triggers.
 */
export class KnativeTriggers {
  private static instance: KnativeTriggers;

  // eslint-disable-next-line no-useless-constructor
  private constructor() {
    // do something if needed, but this is private for the singleton
  }

  public static get Instance(): KnativeTriggers {
    if (!KnativeTriggers.instance) {
      KnativeTriggers.instance = new KnativeTriggers();
    }
    return KnativeTriggers.instance;
  }

  private knChannel = KnativeChannels.Instance;

  private knService = KnativeServices.Instance;

  private knBroker = KnativeBrokers.Instance;

  private triggers: Trigger[];

  // eslint-disable-next-line class-methods-use-this
  private updateTree(): void {
    // TODO:
    // tell the tree view to refresh it's look at the data in 'triggers'
    // convert triggers to tree objects and then sort them
  }

  public getTriggers(): Trigger[] {
    return this.triggers;
  }

  public findTrigger(triggerName: string): Trigger {
    return this.triggers[this.triggers.findIndex((s) => s.name === triggerName)];
  }

  public addTrigger(trigger: Trigger): Trigger {
    this.triggers.push(trigger);
    this.addBroker(trigger);
    this.addSink(trigger);
    // this.triggers.sort(compareNodes);
    this.updateTree();
    return trigger;
  }

  public addTriggers(triggers: Trigger[]): Trigger[] {
    this.triggers = triggers;
    // Add the children objects to the Trigger
    triggers.forEach((trigger) => {
      this.addBroker(trigger);
      this.addSink(trigger);
    });
    // this.triggers.sort(compareNodes);
    this.updateTree();
    return this.triggers;
  }

  /**
   * Find a Channel from the static list of Channels that matches the name
   *  in the Subscription channel field.
   *
   * Then add that found Channel to the childChannel in the sub sent in.
   * @param subscription
   * @returns channel for the subscription
   */
  public addBroker(trigger: Trigger): Broker {
    const brokerName = trigger.broker;
    // if no channel was set on the subscription then don't try to add it.
    if (!brokerName) {
      return null;
    }

    const broker: Broker = this.knBroker.getBrokers().find((child): boolean => child.name === brokerName);
    if (broker) {
      this.findTrigger(trigger.name).childBroker = broker;
      this.updateTree();
    }
    return broker;
  }

  /**
   * Find a Channel from the static list of Channels that matches the name
   *  in the Subscription channel field.
   *
   * Then add that found Channel to the childChannel in the sub sent in.
   * @param subscription
   * @returns channel for the subscription
   */
  public addSink(trigger: Trigger): Sink {
    const sinkName = trigger.sink;
    // if no channel was set on the subscription then don't try to add it.
    if (!sinkName) {
      return null;
    }

    const broker: Broker = this.knBroker.getBrokers().find((child): boolean => child.name === sinkName);
    const channel: Channel = this.knChannel.getChannels().find((child): boolean => child.name === sinkName);
    const service: Service = this.knService.getServices().find((child): boolean => child.name === sinkName);
    const sink: Sink = broker || channel || service;
    if (sink) {
      this.findTrigger(trigger.name).childSink = sink;
      this.updateTree();
    }
    return sink;
  }

  public updateTrigger(trigger: Trigger): Trigger[] {
    const updated: Trigger[] = this.triggers.map((s) => {
      if (s.name === trigger.name) {
        return trigger;
      }
      return s;
    });
    // passing this through a variable to ensure we don't change values while working on them
    this.triggers = updated;
    return this.triggers;
  }

  public removeTrigger(name: string): Trigger[] {
    // find the index of the trigger passed in.
    const triggerIndex: number = this.triggers.findIndex((s) => s.name === name);
    // remove the trigger
    this.triggers.splice(triggerIndex, 1);

    this.updateTree();
    return this.triggers;
  }
}
