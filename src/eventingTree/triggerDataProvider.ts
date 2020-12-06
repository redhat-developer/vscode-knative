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
import { Trigger } from '../knative/trigger';
import { KnativeTriggers } from '../knative/knativeTriggers';
import { KnativeEvents } from '../knative/knativeEvents';

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
    const result: CliExitData = await this.knExecutor.execute(KnAPI.listTriggers());
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
          'No Trigger Found',
          EventingContextType.NONE,
          TreeItemCollapsibleState.None,
          null,
          null,
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
          value.name,
          EventingContextType.TRIGGER,
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
