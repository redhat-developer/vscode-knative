/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { ProviderResult, TreeItemCollapsibleState, Uri, TreeItem, Command } from 'vscode';
import * as path from 'path';
import { ContextType } from '../kn/config';
import { KnativeItem } from '../knative/knativeItem';

import format = require('string-format');

const { Collapsed } = TreeItemCollapsibleState;

const CONTEXT_DATA = {
  revision: {
    icon: 'REV.svg',
    tooltip: 'Revision: {label}',
    getChildren: (): undefined[] => [],
  },
  service: {
    icon: 'SVC.svg',
    tooltip: 'Service: {label}',
    getChildren: (): undefined[] => [],
  },
  route: {
    icon: 'RTE.svg',
    tooltip: 'Route: {label}',
    getChildren: (): undefined[] => [],
  },
  event: {
    icon: 'EVT.svg',
    tooltip: 'Event: {label}',
    getChildren: (): undefined[] => [],
  },
};

/**
 * Compare the context type first, then compare the label.
 *
 * @param a TreeObject
 * @param b TreeObject
 */
export function compareNodes(a: KnativeTreeItem, b: KnativeTreeItem): number {
  if (!a.contextValue) {
    return -1;
  }
  if (!b.contextValue) {
    return 1;
  }
  const acontext = a.contextValue.includes('_') ? a.contextValue.substr(0, a.contextValue.indexOf('_')) : a.contextValue;
  const bcontext = b.contextValue.includes('_') ? b.contextValue.substr(0, b.contextValue.indexOf('_')) : b.contextValue;
  const t = acontext.localeCompare(bcontext);
  return t || a.label.localeCompare(b.label);
}

export class KnativeTreeItem extends TreeItem {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    private parent: KnativeTreeItem,
    public readonly item: KnativeItem,
    public readonly label: string,
    public readonly contextValue: ContextType,
    public readonly collapsibleState: TreeItemCollapsibleState = Collapsed,
    public contextPath?: Uri,
    public readonly compType?: string,
  ) {
    super(label, collapsibleState);
  }

  private explorerPath: string;

  get path(): string {
    if (!this.explorerPath) {
      let parent: KnativeTreeItem;
      const segments: string[] = [];
      do {
        segments.splice(0, 0, this.getName());
        parent = this.getParent();
      } while (parent);
      this.explorerPath = path.join(...segments);
    }
    return this.explorerPath;
  }

  get iconPath(): Uri {
    return Uri.file(path.join(__dirname, '../../../images/context', CONTEXT_DATA[this.contextValue].icon));
  }

  get tooltip(): string {
    return format(CONTEXT_DATA[this.contextValue].tooltip, this);
  }

  // The description is the text after the label. It is grey and a smaller font.
  // eslint-disable-next-line class-methods-use-this
  get description(): string {
    return '';
  }

  get command(): Command {
    const c: Command = {
      command: 'service.explorer.openFile',
      title: 'Load',
      arguments: [this],
    };
    return c;
  }

  getName(): string {
    return this.label;
  }

  getChildren(): ProviderResult<KnativeTreeItem[]> {
    return CONTEXT_DATA[this.contextValue].getChildren();
  }

  getParent(): KnativeTreeItem {
    return this.parent;
  }

  getKnativeItem(): KnativeItem {
    return this.item;
  }
}
