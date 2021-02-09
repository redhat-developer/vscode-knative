/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { ProviderResult, TreeItemCollapsibleState, Uri, TreeItem, Command, TreeItemLabel } from 'vscode';
import * as path from 'path';
import { EventingContextType } from '../cli/config';
import { KnativeItem } from '../knative/knativeItem';

import format = require('string-format');

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
  // eslint-disable-next-line @typescript-eslint/camelcase
  broker_folder: {
    icon: 'folder-opened.svg',
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
  // eslint-disable-next-line @typescript-eslint/camelcase
  channel_folder: {
    icon: 'folder-opened.svg',
    tooltip: '',
    description: '',
    getChildren: (): undefined[] => [],
  },
  // eslint-disable-next-line @typescript-eslint/camelcase
  source_apiserver: {
    icon: 'source-generic.svg',
    // icon: 'EVT.svg',
    tooltip: '',
    description: '',
    getChildren: (): undefined[] => [],
  },
  // eslint-disable-next-line @typescript-eslint/camelcase
  source_binding: {
    icon: 'source-generic.svg',
    // icon: 'EVT.svg',
    tooltip: '',
    description: '',
    getChildren: (): undefined[] => [],
  },
  // eslint-disable-next-line @typescript-eslint/camelcase
  source_folder: {
    icon: 'folder-opened.svg',
    tooltip: '',
    description: '',
    getChildren: (): undefined[] => [],
  },
  source: {
    icon: 'source-generic.svg',
    // icon: 'EVT.svg',
    tooltip: '',
    description: '',
    getChildren: (): undefined[] => [],
  },
  // eslint-disable-next-line @typescript-eslint/camelcase
  source_ping: {
    icon: 'source-generic.svg',
    // icon: 'EVT.svg',
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
  // eslint-disable-next-line @typescript-eslint/camelcase
  subscription_folder: {
    icon: 'folder-opened.svg',
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
  // eslint-disable-next-line @typescript-eslint/camelcase
  trigger_folder: {
    icon: 'folder-opened.svg',
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

  private desc: string;

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
  }

  get iconPath(): Uri {
    return Uri.file(path.join(__dirname, `../../../images/context`, CONTEXT_DATA[this.contextValue].icon));
  }

  get tooltip(): string {
    return format(CONTEXT_DATA[this.contextValue].tooltip, this);
  }

  // The description is the text after the label. It is grey and a smaller font.
  get description(): string {
    return this.desc || CONTEXT_DATA[this.contextValue].description;
  }

  get command(): Command {
    const empty = [
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
    if (empty.find((element) => element === this.name)) {
      return;
    }
    const c: Command = {
      command: 'eventing.explorer.openFile',
      title: 'Describe',
      arguments: [this],
    };
    return c;
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
