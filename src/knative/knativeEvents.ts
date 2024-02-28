/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Broker } from './broker';
import { Channel } from './channel';
import { KEvent } from './kEvent';
import { SourceTypes } from './knativeSources';
import { Subscription } from './subscription';
import { Trigger } from './trigger';

export type EventTypes = Broker | Channel | SourceTypes | Subscription | Trigger;
type childEvent = { child: EventTypes; event: KEvent };
type childEventIndex = { childIndex?: number; eventIndex?: number };

/**
 * A singleton to hold the Events.
 * Public methods to control the list of Events.
 */
export class KnativeEvents {
  // eslint-disable-next-line no-use-before-define
  private static instance: KnativeEvents;

  // eslint-disable-next-line no-useless-constructor
  private constructor() {
    // do something if needed, but this is private for the singleton
  }

  public static get Instance(): KnativeEvents {
    if (!KnativeEvents.instance) {
      KnativeEvents.instance = new KnativeEvents();
    }
    return KnativeEvents.instance;
  }

  private events: KEvent[] = [];

  // eslint-disable-next-line class-methods-use-this
  private updateTree(): void {
    // tell the tree view to refresh it's look at the data in 'events'
    // convert events to tree objects and then sort them
  }

  public getEvents(): KEvent[] {
    return this.events;
  }

  public findEvent(eventName: string): KEvent {
    return this.events[this.events.findIndex((s) => s.name === eventName)];
  }

  public findChild(childName: string): EventTypes {
    let child: EventTypes;

    this.events.find((parent: KEvent) => {
      if (parent.children === undefined) {
        return false;
      }
      child = parent.children.find((r: EventTypes) => r.name === childName);
      if (child === undefined) {
        return false;
      }
      return child.name === childName;
    });

    return child;
  }

  public findChildAndEvent(childName: string): childEvent {
    let child: EventTypes;

    const event: KEvent = this.events.find((parent: KEvent) => {
      if (parent.children === undefined) {
        return false;
      }
      child = parent.children.find((c: EventTypes) => c.name === childName);
      if (child === undefined) {
        return false;
      }
      return child.name === childName;
    });

    const rs: childEvent = { child, event };
    return rs;
  }

  public findChildAndEventIndex(childName: string): childEventIndex {
    let childIndex: number;

    const eventIndex: number = this.events.findIndex((parent: KEvent) => {
      if (parent.children === undefined) {
        return false;
      }
      const child: EventTypes = parent.children.find((c: EventTypes) => c.name === childName);
      if (child === undefined) {
        return false;
      }
      childIndex = parent.children.findIndex((c: EventTypes) => c.name === childName);
      return child.name === childName;
    });

    const rs: childEventIndex = { childIndex, eventIndex };
    return rs;
  }

  /**
   * This will add the Event passed in to the list of Events
   * @param event
   */
  public addEvent(event: KEvent): KEvent {
    this.events.push(event);
    // this.events.sort(compareNodes);
    this.updateTree();
    return event;
  }

  /**
   * This will replace the current list of Events with the list passed in.
   * @param events
   */
  public addEvents(events: KEvent[]): KEvent[] {
    this.events = events;
    // this.events.sort(compareNodes);
    this.updateTree();
    return this.events;
  }

  public addChildren(children: EventTypes[]): EventTypes[] {
    // The child should know the name of the Event it belongs to.
    // The event should hold an array of it's children.
    // Set the children to the parent event item.
    this.findEvent(children[0].parent).children = children;
    this.updateTree();
    return children;
  }

  public updateEvent(event: KEvent): KEvent[] {
    const updated: KEvent[] = this.events.map((e) => {
      if (e.name === event.name) {
        return event;
      }
      return e;
    });
    // passing this through a variable to ensure we don't change values while working on them
    this.events = updated;
    return this.events;
  }

  public removeEvent(name: string): KEvent[] {
    // find the index of the event passed in.
    const eventIndex: number = this.events.findIndex((s) => s.name === name);
    // remove the event
    this.events.splice(eventIndex, 1);

    this.updateTree();
    return this.events;
  }

  public removeChild(name: string): void {
    // Find the EventTypes and it's Event
    const rs: childEventIndex = this.findChildAndEventIndex(name);

    // remove the child
    this.events[rs.eventIndex].children.splice(rs.childIndex, 1);

    this.updateTree();
  }
}
