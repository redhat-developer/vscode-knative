/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { ProviderResult, TreeItemCollapsibleState, Uri, TreeItem, Command, TreeItemLabel } from 'vscode';
import format = require('string-format');
import { ServingContextType } from '../cli/config';
import { EventingTreeItem } from '../eventingTree/eventingTreeItem';
import { KnativeItem } from '../knative/knativeItem';
import { Revision, Traffic } from '../knative/revision';
import { Service } from '../knative/service';

const { Collapsed } = TreeItemCollapsibleState;

type contextTreeItemDataType = {
  icon: string;
  tooltip: string;
  description: string;
  getChildren: () => [];
};

type contextDataType = {
  none: contextTreeItemDataType;
  revision: contextTreeItemDataType;
  // eslint-disable-next-line camelcase
  revision_tagged: contextTreeItemDataType;
  service: contextTreeItemDataType;
  // eslint-disable-next-line camelcase
  service_modified: contextTreeItemDataType;
};

const CONTEXT_DATA: contextDataType = {
  none: {
    icon: '',
    tooltip: 'Not Found',
    description: '',
    getChildren: () => [],
  },
  revision: {
    icon: 'revision.svg',
    // icon: 'REV.svg',
    tooltip: 'Revision: {name}',
    description: '',
    getChildren: () => [],
  },
  revision_tagged: {
    icon: 'revision.svg',
    // icon: 'REV.svg',
    tooltip: 'Revision: {name}',
    description: '',
    getChildren: () => [],
  },
  service: {
    icon: 'service.svg',
    // icon: 'SVC.svg',
    tooltip: 'Service: {name}',
    description: '',
    getChildren: () => [],
  },
  service_modified: {
    icon: 'service.svg',
    // icon: 'SVC.svg',
    tooltip: 'Service: {name} modified',
    description: 'modified',
    getChildren: () => [],
  },
};

export class ServingTreeItem extends TreeItem {
  private name: string = undefined;

  private desc: string = undefined;

  public command: Command = undefined;

  public tooltip: string = undefined;

  public iconPath: Uri = undefined;

  public description: string = undefined;

  constructor(
    private parent: ServingTreeItem | EventingTreeItem,
    public readonly item: KnativeItem,
    public readonly label: TreeItemLabel,
    public readonly contextValue: ServingContextType,
    public readonly collapsibleState: TreeItemCollapsibleState = Collapsed,
    public contextPath?: Uri,
    public readonly compType?: string,
  ) {
    super(label, collapsibleState);
    // Set the name since the label can have the traffic and we need the actual name for the yaml
    this.name = label.label;
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
          if (val.revisionName === this.label.label) {
            // Traffic percent can be assigned to latest and a tag. It needs to be totalled.
            percentTraffic += val.percent ? val.percent : 0;
            // There can be more than one tag, so collect all of them. Then add it to the Description.
            tagComposite += `${val.latestRevision ? 'latest ' : ''}`;
            tagComposite += `${val.tag ? `${val.tag} ` : ''}`;
          }
        });
        this.desc = tagComposite;
        // Revisions with tags are traffic with 0% until the traffic is set. Only show the percentage when traffic is set.
        if (percentTraffic > 0) {
          this.label.label = `${this.label.label} (${percentTraffic}%)`;
        }
      }
      if (
        rev.details &&
        rev.details.status.conditions[0].status === 'False' &&
        rev.details.status.conditions[0].type === 'ContainerHealthy' &&
        rev.details.status.conditions[0].reason
      ) {
        this.tooltip = rev.details.status.conditions[0].message;
      }
    } else if (contextValue === 'service' || contextValue === 'service_modified') {
      const svc: Service = item as Service;
      if (
        svc.details &&
        svc.details.status.conditions[0].status === 'False' &&
        svc.details.status.conditions[0].type === 'ConfigurationsReady' &&
        svc.details.status.conditions[0].reason
      ) {
        this.tooltip = svc.details.status.conditions[0].message;
      }
    }
    if (this.contextValue === 'service_modified') {
      this.command = {
        command: 'service.explorer.edit',
        title: 'Edit',
        arguments: [this],
      };
    } else if (this.name !== 'No Service Found') {
      this.command = {
        command: 'service.explorer.openFile',
        title: 'Describe',
        arguments: [this],
      };
    }
    if (CONTEXT_DATA[this.contextValue]) {
      this.tooltip = this.tooltip || format((CONTEXT_DATA[this.contextValue] as contextTreeItemDataType).tooltip, this);
      this.iconPath = Uri.file(
        path.join(__dirname, `../../../images/context`, (CONTEXT_DATA[this.contextValue] as contextTreeItemDataType).icon),
      );
      this.description = this.desc || (CONTEXT_DATA[this.contextValue] as contextTreeItemDataType).description;
    }
  }

  getName(): string {
    return this.name;
  }

  getChildren(): ProviderResult<ServingTreeItem[]> {
    return (CONTEXT_DATA[this.contextValue] as contextTreeItemDataType).getChildren();
  }

  getParent(): ServingTreeItem | EventingTreeItem {
    return this.parent;
  }

  getKnativeItem(): KnativeItem {
    return this.item;
  }
}
