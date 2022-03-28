/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { ProviderResult, TreeItemCollapsibleState, Uri, TreeItem, Command, TreeItemLabel } from 'vscode';
import format = require('string-format');
import { EventingContextType } from '../cli/config';
import { KnativeItem } from '../knative/knativeItem';

const { Collapsed } = TreeItemCollapsibleState;

const CONTEXT_DATA = {
  none: {
    icon: '',
    tooltip: 'Not Found',
    description: '',
    getChildren: (): undefined[] => [],
  },
  broker: {
    icon: 'broker.svg',
    // icon: 'EVT.svg',
    tooltip: '',
    description: '',
    getChildren: (): undefined[] => [],
  },
  broker_folder: {
    icon: 'broker.svg',
    tooltip: '',
    description: '',
    getChildren: (): undefined[] => [],
  },
  channel: {
    icon: 'channel.svg',
    // icon: 'EVT.svg',
    tooltip: '',
    description: '',
    getChildren: (): undefined[] => [],
  },
  channel_folder: {
    icon: 'channel.svg',
    tooltip: '',
    description: '',
    getChildren: (): undefined[] => [],
  },
  source_apiserver: {
    icon: 'source.svg',
    tooltip: '',
    description: '',
    getChildren: (): undefined[] => [],
  },
  source_binding: {
    icon: 'source.svg',
    tooltip: '',
    description: '',
    getChildren: (): undefined[] => [],
  },
  source_folder: {
    icon: 'source.svg',
    tooltip: '',
    description: '',
    getChildren: (): undefined[] => [],
  },
  source: {
    icon: 'source.svg',
    tooltip: '',
    description: '',
    getChildren: (): undefined[] => [],
  },
  source_ping: {
    icon: 'source.svg',
    tooltip: '',
    description: '',
    getChildren: (): undefined[] => [],
  },
  subscription: {
    icon: 'subscription.svg',
    // icon: 'EVT.svg',
    tooltip: '',
    description: '',
    getChildren: (): undefined[] => [],
  },
  subscription_folder: {
    icon: 'subscription.svg',
    tooltip: '',
    description: '',
    getChildren: (): undefined[] => [],
  },
  trigger: {
    icon: 'trigger.svg',
    // icon: 'EVT.svg',
    tooltip: '',
    description: '',
    getChildren: (): undefined[] => [],
  },
  trigger_folder: {
    icon: 'trigger.svg',
    tooltip: '',
    description: '',
    getChildren: (): undefined[] => [],
  },
  uri: {
    icon: 'link.svg',
    tooltip: '',
    description: '',
    getChildren: (): undefined[] => [],
  },
};

export class EventingTreeItem extends TreeItem {
  private name: string;

  private desc: string = undefined;

  private empty = [
    'No Broker Found',
    'No Channel Found',
    'No Source Found',
    'No Subscription Found',
    'No Trigger Found',
    'Brokers',
    'Channels',
    'Sources',
    'Subscriptions',
    'Triggers',
  ];

  public command: Command = undefined;

  public tooltip: string = undefined;

  public iconPath: Uri = undefined;

  public description: string = undefined;

  constructor(
    private parent: EventingTreeItem | null,
    public readonly item: KnativeItem,
    public readonly label: TreeItemLabel,
    public readonly contextValue: EventingContextType,
    public readonly collapsibleState: TreeItemCollapsibleState = Collapsed,
    public contextPath?: Uri,
    public readonly compType?: string,
  ) {
    super(label, collapsibleState);
    this.name = label.label;
    if (this.empty.find((element) => element === this.name)) {
      this.command = undefined;
    } else {
      this.command = {
        command: 'eventing.explorer.openFile',
        title: 'Describe',
        arguments: [this],
      };
    }
    if (CONTEXT_DATA[this.contextValue]) {
      this.tooltip = format(CONTEXT_DATA[this.contextValue].tooltip, this);
      this.iconPath = Uri.file(path.join(__dirname, `../../../images/context`, CONTEXT_DATA[this.contextValue].icon));
      this.description = this.desc || CONTEXT_DATA[this.contextValue].description;
    }
  }

  getName(): string {
    return this.name;
  }

  getChildren(): ProviderResult<EventingTreeItem[]> {
    return CONTEXT_DATA[this.contextValue].getChildren();
  }

  getParent(): EventingTreeItem {
    return this.parent;
  }

  getKnativeItem(): KnativeItem {
    return this.item;
  }
}
