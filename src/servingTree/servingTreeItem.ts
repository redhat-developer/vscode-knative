/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { ProviderResult, TreeItemCollapsibleState, Uri, TreeItem, Command } from 'vscode';
import * as path from 'path';
import { ServingContextType } from '../cli/config';
import { KnativeItem } from '../knative/knativeItem';
import { Revision, Traffic } from '../knative/revision';
import { EventingTreeItem } from '../eventingTree/eventingTreeItem';

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
    // icon: 'revision-teal-r.svg',
    icon: 'REV.svg',
    tooltip: 'Revision: {name}',
    description: '',
    getChildren: (): undefined[] => [],
  },
  // eslint-disable-next-line @typescript-eslint/camelcase
  revision_tagged: {
    // icon: 'revision-teal-r.svg',
    icon: 'REV.svg',
    tooltip: 'Revision: {name}',
    description: '',
    getChildren: (): undefined[] => [],
  },
  service: {
    // icon: 'service-gear-teal.svg',
    icon: 'SVC.svg',
    tooltip: 'Service: {name}',
    description: '',
    getChildren: (): undefined[] => [],
  },
  // eslint-disable-next-line @typescript-eslint/camelcase
  service_modified: {
    // icon: 'service-gear-orange.svg',
    icon: 'SVC.svg',
    tooltip: 'Service: {name} modified',
    description: 'modified',
    getChildren: (): undefined[] => [],
  },
};

export class ServingTreeItem extends TreeItem {
  private name: string;

  private desc: string;

  constructor(
    private parent: ServingTreeItem | EventingTreeItem,
    public readonly item: KnativeItem,
    public readonly label: string,
    public readonly contextValue: ServingContextType,
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

  getParent(): ServingTreeItem | EventingTreeItem {
    return this.parent;
  }

  getKnativeItem(): KnativeItem {
    return this.item;
  }
}
