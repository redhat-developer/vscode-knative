/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { ProviderResult, TreeItemCollapsibleState, Uri, TreeItem, Command } from 'vscode';
import * as path from 'path';
import { ContextType } from '../cli/config';
import { KnativeItem } from '../knative/knativeItem';
import { Revision, Traffic } from '../knative/revision';

import format = require('string-format');

const { Collapsed } = TreeItemCollapsibleState;

const CONTEXT_DATA = {
  none: {
    icon: '',
    tooltip: 'Not Found',
    description: '',
    getChildren: (): undefined[] => [],
  },
  revision: {
    icon: 'REV.svg',
    tooltip: 'Revision: {name}',
    description: '',
    getChildren: (): undefined[] => [],
  },
  // eslint-disable-next-line @typescript-eslint/camelcase
  revision_tagged: {
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
  // eslint-disable-next-line @typescript-eslint/camelcase
  service_modified: {
    icon: 'SVC.svg',
    tooltip: 'Service: {name} modified',
    description: 'modified',
    getChildren: (): undefined[] => [],
  },
  // route: {
  //   icon: 'RTE.svg',
  //   tooltip: 'Route: {name}',
  //   description: '',
  //   getChildren: (): undefined[] => [],
  // },
  // event: {
  //   icon: 'EVT.svg',
  //   tooltip: 'Event: {name}',
  //   description: '',
  //   getChildren: (): undefined[] => [],
  // },
};

/**
 * The Sort compare function will compare the context type first, then compare the label.
 *
 * All non-undefined array elements are sorted according to the return value of the compare function (all undefined elements are sorted to the end of the array, with no call to compareFunction). If a and b are two elements being compared, then:
 *
 * If compareFunction(a, b) returns less than 0, sort a to an index lower than b (i.e. a comes first).
 * If compareFunction(a, b) returns 0, leave a and b unchanged with respect to each other, but sorted with respect to all different elements. Note: the ECMAscript standard does not guarantee this behavior, thus, not all browsers (e.g. Mozilla versions dating back to at least 2003) respect this.
 * If compareFunction(a, b) returns greater than 0, sort b to an index lower than a (i.e. b comes first).
 * compareFunction(a, b) must always return the same value when given a specific pair of elements a and b as its two arguments. If inconsistent results are returned, then the sort order is undefined.
 *
 * @param a TreeObject
 * @param b TreeObject
 */
export function compareNodes(a: ServingTreeItem, b: ServingTreeItem): number {
  if (!a.contextValue) {
    return -1;
  }
  if (!b.contextValue) {
    return 1;
  }
  // We do not want to consider sorting on anything after the underscore.
  const aContext = a.contextValue.includes('_') ? a.contextValue.substr(0, a.contextValue.indexOf('_')) : a.contextValue;
  const bContext = b.contextValue.includes('_') ? b.contextValue.substr(0, b.contextValue.indexOf('_')) : b.contextValue;
  const t = aContext.localeCompare(bContext);
  return t || a.label.localeCompare(b.label);
}

export class ServingTreeItem extends TreeItem {
  private name: string;

  private desc: string;

  constructor(
    private parent: ServingTreeItem,
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
    if (parent && (parent.contextValue === 'service' || parent.contextValue === 'service_modified')) {
      // Ensure we only update revisions with traffic, leaving the others alone.
      const rev: Revision = item as Revision;
      if (rev && rev.traffic && rev.traffic.length > 0) {
        let tagComposite = '';
        let percentTraffic = 0;
        // Look through the traffic list for revisions.
        // When you find one that matches the revision of this Item, pull it out to update the label.
        rev.traffic.forEach((val: Traffic) => {
          if (val.revisionName === this.label) {
            // Traffic percent can be assigned to latest and a tag. It needs to be totalled.
            percentTraffic += val.percent ? val.percent : 0;
            // There can be more than one tag, so collect all of them. Then add it to the Description.
            tagComposite += `${val.latestRevision ? 'latest' : ''}`;
            tagComposite += `${val.tag ? val.tag : ''} `;
          }
        });
        this.desc = tagComposite;
        // Revisions with tags are traffic with 0% until the traffic is set. Only show the percentage when traffic is set.
        if (percentTraffic > 0) {
          this.label = `${this.label} (${percentTraffic}%)`;
        }
      }
    }
  }

  // private explorerPath: string;

  // get path(): string {
  //   if (!this.explorerPath) {
  //     let parent: ServingTreeItem;
  //     const segments: string[] = [];
  //     do {
  //       segments.splice(0, 0, this.getName());
  //       parent = this.getParent();
  //     } while (parent);
  //     this.explorerPath = path.join(...segments);
  //   }
  //   return this.explorerPath;
  // }

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
    if (this.name === 'No Service Found') {
      return;
    }
    let c: Command;
    if (this.contextValue === 'service_modified') {
      c = {
        command: 'service.explorer.edit',
        title: 'Edit',
        arguments: [this],
      };
    } else {
      c = {
        command: 'service.explorer.openFile',
        title: 'Describe',
        arguments: [this],
      };
    }
    return c;
  }

  getName(): string {
    return this.name;
  }

  getChildren(): ProviderResult<ServingTreeItem[]> {
    return CONTEXT_DATA[this.contextValue].getChildren();
  }

  getParent(): ServingTreeItem {
    return this.parent;
  }

  getKnativeItem(): KnativeItem {
    return this.item;
  }
}
