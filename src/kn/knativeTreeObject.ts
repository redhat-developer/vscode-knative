/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { ProviderResult, TreeItemCollapsibleState, Uri, QuickPickItem } from 'vscode';
import * as path from 'path';
import { ContextType, ComponentType } from './config';
import GlyphChars from '../util/constants';

import format = require('string-format');

const { Collapsed } = TreeItemCollapsibleState;

export interface KnativeObject extends QuickPickItem {
  getChildren(): ProviderResult<KnativeObject[]>;
  getParent(): KnativeObject;
  getName(): string;
  contextValue: string;
  compType?: string;
  contextPath?: Uri;
  deployed: boolean;
  path?: string;
}

export default class KnativeTreeObject implements KnativeObject {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    private parent: KnativeObject,
    public readonly name: string,
    public readonly contextValue: ContextType,
    public deployed: boolean,
    private readonly contextData: object,
    public readonly collapsibleState: TreeItemCollapsibleState = Collapsed,
    public contextPath?: Uri,
    public readonly compType?: string,
  ) {}

  private explorerPath: string;

  get path(): string {
    if (!this.explorerPath) {
      let parent: KnativeObject;
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
    if (
      this.contextValue === ContextType.COMPONENT_PUSHED ||
      this.contextValue === ContextType.COMPONENT ||
      this.contextValue === ContextType.COMPONENT_NO_CONTEXT
    ) {
      if (this.compType === ComponentType.GIT) {
        return Uri.file(path.join(__dirname, '../images/component', 'git.png'));
      }
      if (this.compType === ComponentType.LOCAL) {
        return Uri.file(path.join(__dirname, '../images/component', 'workspace.png'));
      }
      if (this.compType === ComponentType.BINARY) {
        return Uri.file(path.join(__dirname, '../images/component', 'binary.png'));
      }
    }
    return Uri.file(
      path.join(__dirname, '../images/context', this.contextData[this.contextValue].icon),
    );
  }

  get tooltip(): string {
    return format(this.contextData[this.contextValue].tooltip, this);
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

  getChildren(): ProviderResult<KnativeObject[]> {
    return this.contextData[this.contextValue].getChildren();
  }

  getParent(): KnativeObject {
    return this.parent;
  }
}
