/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { ProviderResult, TreeItemCollapsibleState, Uri, QuickPickItem } from 'vscode';
import * as path from 'path';
import { ContextType } from '../kn/config';
import KnativeItem from '../knative/knativeItem';
import GlyphChars from '../util/constants';

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
export function compareNodes(a: TreeObject, b: TreeObject): number {
  if (!a.contextValue) {
    return -1;
  }
  if (!b.contextValue) {
    return 1;
  }
  const acontext = a.contextValue.includes('_')
    ? a.contextValue.substr(0, a.contextValue.indexOf('_'))
    : a.contextValue;
  const bcontext = b.contextValue.includes('_')
    ? b.contextValue.substr(0, b.contextValue.indexOf('_'))
    : b.contextValue;
  const t = acontext.localeCompare(bcontext);
  return t || a.label.localeCompare(b.label);
}

export interface TreeObject extends QuickPickItem {
  getChildren(): ProviderResult<TreeObject[]>;
  getParent(): TreeObject;
  getKnativeItem(): KnativeItem;
  getName(): string;
  contextValue: string;
  compType?: string;
  contextPath?: Uri;
  deployed: boolean;
  path?: string;
}

export default class KnativeTreeObject implements TreeObject {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    private parent: TreeObject,
    public readonly item: KnativeItem,
    public readonly name: string,
    public readonly contextValue: ContextType,
    public deployed: boolean,
    public readonly collapsibleState: TreeItemCollapsibleState = Collapsed,
    public contextPath?: Uri,
    public readonly compType?: string,
  ) {}

  detail?: string;

  picked?: boolean;

  alwaysShow?: boolean;

  private explorerPath: string;

  get path(): string {
    if (!this.explorerPath) {
      let parent: TreeObject;
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
    return Uri.file(
      path.join(__dirname, '../../../images/context', CONTEXT_DATA[this.contextValue].icon),
    );
  }

  get tooltip(): string {
    return format(CONTEXT_DATA[this.contextValue].tooltip, this);
  }

  get label(): string {
    const label = this.contextValue === ContextType.CLUSTER ? this.name.split('//')[1] : this.name;
    return label;
  }

  get description(): string {
    let suffix = '';
    if (this.contextValue === ContextType.COMPONENT) {
      suffix = `${GlyphChars.Space}${GlyphChars.NotPushed} not pushed`;
    } else if (this.contextValue === ContextType.COMPONENT_PUSHED) {
      suffix = `${GlyphChars.Space}${GlyphChars.Push} pushed`;
    } else if (this.contextValue === ContextType.COMPONENT_NO_CONTEXT) {
      suffix = `${GlyphChars.Space}${GlyphChars.NoContext} no context`;
    }
    return suffix;
  }

  getName(): string {
    return this.name;
  }

  getChildren(): ProviderResult<TreeObject[]> {
    return CONTEXT_DATA[this.contextValue].getChildren();
  }

  getParent(): TreeObject {
    return this.parent;
  }

  getKnativeItem(): KnativeItem {
    return this.item;
  }
}
