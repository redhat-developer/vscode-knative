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
import { APIServerSource } from '../knative/apiServerSource';
import { Items, BaseSource } from '../knative/baseSource';
import { BindingSource } from '../knative/bindingSource';
import { Broker } from '../knative/broker';
import { Channel } from '../knative/channel';
import { GenericSource } from '../knative/genericSource';
import { KnativeEvents } from '../knative/knativeEvents';
import { compareNodes } from '../knative/knativeItem';
import { KnativeSources, SourceTypes } from '../knative/knativeSources';
import { PingSource } from '../knative/pingSource';
import { Service } from '../knative/service';
import { Sink } from '../knative/sink';
import { ServingTreeItem } from '../servingTree/servingTreeItem';

export class SourceDataProvider {
  public knExecutor = new Execute();

  private kSources: KnativeSources = KnativeSources.Instance;

  private events: KnativeEvents = KnativeEvents.Instance;

  /**
   * Fetch the Source data
   *
   * When creating a new Source on the cluster it takes time, however this fetch is called immediately.
   * It will continue to call itself until the data is complete on the cluster.
   */
  private async getSourcesList(): Promise<Array<SourceTypes>> {
    let sources: Array<SourceTypes> = [];
    // Get the raw data from the cli call.
    let result: CliExitData;
    try {
      result = await this.knExecutor.execute(KnAPI.listSources());
    } catch (err) {
      // eslint-disable-next-line no-console, @typescript-eslint/restrict-template-expressions
      console.log(`Source data provider fetch had error.\n ${err}`);
    }

    // Figure out the source type, create that object type, and store it.
    sources = this.kSources.addSources(
      loadItems(result).map((value: Items) => {
        if (value.kind === 'ApiServerSource') {
          return APIServerSource.JSONToSource(value);
        }
        if (value.kind === 'SinkBinding') {
          return BindingSource.JSONToSource(value);
        }
        if (value.kind === 'PingSource') {
          return PingSource.JSONToSource(value);
        }
        return GenericSource.JSONToSource(value);
      }),
    );
    // If there are no Sources found then stop looking and we can post 'No Sources Found`
    if (sources.length === 0) {
      return sources;
    }

    let sourceNotReady: boolean;
    // Make sure there is Status info in the Source to confirm that it has finished being created.
    sources.find((s): boolean => {
      if (s.details.status.conditions === undefined) {
        sourceNotReady = true;
        return sourceNotReady;
      }
      sourceNotReady = false;
      return sourceNotReady;
    });
    if (sourceNotReady) {
      return this.getSourcesList();
    }
    return sources;
  }

  // eslint-disable-next-line class-methods-use-this
  private getSourceType(kind: string): EventingContextType {
    let context: EventingContextType;
    switch (kind) {
      case 'ApiServerSource':
        context = EventingContextType.SOURCE_APISERVER;
        break;
      case 'SinkBinding':
        context = EventingContextType.SOURCE_BINDING;
        break;
      case 'PingSource':
        context = EventingContextType.SOURCE_PING;
        break;
      default:
        context = EventingContextType.SOURCE;
    }
    return context;
  }

  /**
   * The Source is the highest level of the tree for Knative. This method sets it at the root if not already done.
   */
  public async getSources(parent: EventingTreeItem): Promise<EventingTreeItem[]> {
    const sources = await this.getSourcesList();

    // Pull out the name of the source from the raw data.
    // Create an empty state message when there is no Source.
    if (sources.length === 0) {
      return [
        new EventingTreeItem(parent, null, { label: 'No Source Found' }, EventingContextType.NONE, TreeItemCollapsibleState.None),
      ];
    }

    // Add the list of children to the parent for reference
    this.events.addChildren(sources);

    // Convert the fetched Sources into TreeItems
    const children = sources
      .map<EventingTreeItem>((value) => {
        const obj: EventingTreeItem = new EventingTreeItem(
          parent,
          value,
          { label: value.name },
          this.getSourceType(value.details.kind),
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
  public getSourceChildren(parent: EventingTreeItem): Array<EventingTreeItem | ServingTreeItem> {
    const source: BaseSource = parent.getKnativeItem() as BaseSource;

    const children: Sink[] = [source.childSink];
    const childrenLabel = ['Sink'];
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
