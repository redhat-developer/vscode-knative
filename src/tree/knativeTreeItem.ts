/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { ProviderResult, TreeItemCollapsibleState, Uri, TreeItem, Command } from 'vscode';
import * as path from 'path';
import { ContextType } from '../kn/config';
import { KnativeItem } from '../knative/knativeItem';
import { Revision, Traffic } from '../knative/revision';

import format = require('string-format');

const { Collapsed } = TreeItemCollapsibleState;

const CONTEXT_DATA = {
  revision: {
    icon: 'REV.svg',
    tooltip: 'Revision: {name}',
    description: '',
    getChildren: (): undefined[] => [],
  },
  'revision.tagged': {
    icon: 'REV.svg',
    tooltip: 'Revision: {name}',
    description: '',
    getChildren: (): undefined[] => [],
  },
  service: {
    icon: 'SVC.svg',
    tooltip: 'Service: {name}',
    description: '',
    getChildren: (): undefined[] => [],
  },
  route: {
    icon: 'RTE.svg',
    tooltip: 'Route: {name}',
    description: '',
    getChildren: (): undefined[] => [],
  },
  event: {
    icon: 'EVT.svg',
    tooltip: 'Event: {name}',
    description: '',
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
  private name: string;

  private desc: string;

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
    // Set the name since the label can have the traffic and we need the actual name for the yaml
    this.name = label;
    // Check the type since only a Revision can have traffic.
    if (parent && parent.contextValue === 'service') {
      // Ensure we only update revisions with traffic, leaving the others alone.
      const rev: Revision = item as Revision;
      if (rev && rev.traffic.length > 0) {
        let tagComposit = '';
        let percentTraffic = 0;
        // Look through the traffic list for revisions.
        // When you find one that matches the revision of this Item, pull it out to update the label.
        rev.traffic.forEach((val: Traffic) => {
          if (val.revisionName === this.label) {
            // Traffic percent can be assigned to latest and a tag. It needs to be totalled.
            percentTraffic += val.percent ? val.percent : 0;
            // There can be more than one tag, so collect all of them. Then add it to the Description.
            tagComposit += `${val.latestRevision ? 'latest' : ''}`;
            tagComposit += `${val.tag ? val.tag : ''} `;
          }
        });
        this.desc = tagComposit;
        // Revisions with tags are traffic with 0% until the traffic is set. Only show the percentage when traffic is set.
        if (percentTraffic > 0) {
          this.label = `${this.label} (${percentTraffic}%)`;
        }
      }
    }
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
  get description(): string {
    return this.desc;
  }

  get command(): Command {
    if (this.name === 'No Service Found') {
      return;
    }
    const c: Command = {
      command: 'service.explorer.openFile',
      title: 'Load',
      arguments: [this],
    };
    return c;
  }

  getName(): string {
    return this.name;
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
