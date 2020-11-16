/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Trigger } from './trigger';

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
    // this.triggers.sort(compareNodes);
    this.updateTree();
    return trigger;
  }

  public addTriggers(triggers: Trigger[]): Trigger[] {
    this.triggers = triggers;
    // this.triggers.sort(compareNodes);
    this.updateTree();
    return this.triggers;
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
