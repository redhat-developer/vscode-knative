/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { TreeItemCollapsibleState, Uri } from 'vscode';
import { EventingTreeItem } from './eventingTreeItem';
import { CliExitData } from '../cli/cmdCli';
import { EventingContextType, ServingContextType } from '../cli/config';
import { Execute, loadItems } from '../cli/execute';
import { KnAPI } from '../cli/kn-api';
import { Broker } from '../knative/broker';
import { Channel } from '../knative/channel';
import { KnativeEvents } from '../knative/knativeEvents';
import { compareNodes } from '../knative/knativeItem';
import { KnativeTriggers } from '../knative/knativeTriggers';
import { Service } from '../knative/service';
import { Sink } from '../knative/sink';
import { Trigger } from '../knative/trigger';
import { ServingTreeItem } from '../servingTree/servingTreeItem';

export class TriggerDataProvider {
  public knExecutor = new Execute();

  private kTriggers: KnativeTriggers = KnativeTriggers.Instance;

  private events: KnativeEvents = KnativeEvents.Instance;

  /**
   * Fetch the Trigger data
   *
   * When creating a new Trigger on the cluster it takes time, however this fetch is called immediately.
   * It will continue to call itself until the data is complete on the cluster.
   */
  private async getTriggersList(): Promise<Trigger[]> {
    let triggers: Trigger[] = [];
    // Get the raw data from the cli call.
    let result: CliExitData;
    try {
      result = await this.knExecutor.execute(KnAPI.listTriggers());
    } catch (err) {
      // eslint-disable-next-line no-console, @typescript-eslint/restrict-template-expressions
      console.log(`Trigger data provider fetch had error.\n ${err}`);
    }
    triggers = this.kTriggers.addTriggers(loadItems(result).map((value) => Trigger.JSONToTrigger(value)));
    // If there are no Triggers found then stop looking and we can post 'No Triggers Found`
    if (triggers.length === 0) {
      return triggers;
    }

    let triggerNotReady: boolean;
    // Make sure there is Status info in the Trigger to confirm that it has finished being created.
    triggers.find((s): boolean => {
      if (s.details.status.conditions === undefined) {
        triggerNotReady = true;
        return triggerNotReady;
      }
      triggerNotReady = false;
      return triggerNotReady;
    });
    if (triggerNotReady) {
      return this.getTriggersList();
    }
    return triggers;
  }

  /**
   * The Trigger is the highest level of the tree for Knative. This method sets it at the root if not already done.
   */
  public async getTriggers(parent: EventingTreeItem): Promise<EventingTreeItem[]> {
    const triggers = await this.getTriggersList();

    // Pull out the name of the trigger from the raw data.
    // Create an empty state message when there is no Trigger.
    if (triggers.length === 0) {
      return [
        new EventingTreeItem(
          parent,
          null,
          { label: 'No Trigger Found' },
          EventingContextType.NONE,
          TreeItemCollapsibleState.None,
        ),
      ];
    }

    // Add the list of children to the parent for reference
    this.events.addChildren(triggers);

    // Convert the fetch Triggers into TreeItems
    const children = triggers
      .map<EventingTreeItem>((value) => {
        const obj: EventingTreeItem = new EventingTreeItem(
          parent,
          value,
          { label: value.name },
          EventingContextType.TRIGGER,
          TreeItemCollapsibleState.Expanded,
        );
        return obj;
      })
      .sort(compareNodes);

    return children;
  }

  /**
   * A Trigger should have 2 children, a Broker and a Sink. This will build a list of those children.
   */
  // eslint-disable-next-line class-methods-use-this
  public getTriggerChildren(parent: EventingTreeItem): Array<EventingTreeItem | ServingTreeItem> {
    const trigger: Trigger = parent.getKnativeItem() as Trigger;

    const children: Sink[] = [trigger.childBroker, trigger.childSink];
    const childrenLabel = ['Broker', 'Sink'];
    const treeItems: Array<EventingTreeItem | ServingTreeItem> = [];
    // Create an empty state message when there are no Children.
    children.forEach((child, index) => {
      if (child === null || child === undefined) {
        treeItems.push(
          new EventingTreeItem(
            parent,
            null,
            { label: `${childrenLabel[index]} Not Found` },
            EventingContextType.NONE,
            TreeItemCollapsibleState.None,
          ),
        );
      }
      if (child instanceof Broker) {
        treeItems.push(
          new EventingTreeItem(
            parent,
            child,
            { label: `${childrenLabel[index]} - ${child.name}` },
            EventingContextType.BROKER,
            TreeItemCollapsibleState.None,
          ),
        );
      }
      if (child instanceof Channel) {
        treeItems.push(
          new EventingTreeItem(
            parent,
            child,
            { label: `${childrenLabel[index]} - ${child.name}` },
            EventingContextType.CHANNEL,
            TreeItemCollapsibleState.None,
          ),
        );
      }
      if (child instanceof Service) {
        treeItems.push(
          new ServingTreeItem(
            parent,
            child,
            { label: `${childrenLabel[index]} - ${child.name}` },
            ServingContextType.SERVICE,
            TreeItemCollapsibleState.None,
          ),
        );
      }
      if (child instanceof Uri) {
        treeItems.push(
          new EventingTreeItem(
            parent,
            null,
            { label: `${childrenLabel[index]} - ${child.toString()}` },
            EventingContextType.URI,
            TreeItemCollapsibleState.None,
          ),
        );
      }
    });

    return treeItems;
  }
}
