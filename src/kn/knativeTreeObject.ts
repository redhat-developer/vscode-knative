/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { ProviderResult, TreeItemCollapsibleState, Uri, QuickPickItem } from 'vscode';
import * as path from 'path';
import { Kn, KnImpl } from './knController';
import GlyphChars from '../util/constants';

import format = require('string-format');

const { Collapsed } = TreeItemCollapsibleState;

export enum ContextType {
  CLUSTER = 'cluster',
  PROJECT = 'project',
  APPLICATION = 'application',
  COMPONENT = 'component_not_pushed',
  COMPONENT_PUSHED = 'component',
  COMPONENT_NO_CONTEXT = 'component_no_context',
  REVISION = 'revision',
  SERVICE = 'service',
  OSSERVICE = 'osservice',
  STORAGE = 'storage',
  CLUSTER_DOWN = 'cluster_down',
  LOGIN_REQUIRED = 'login_required',
  COMPONENT_ROUTE = 'component_route',
}

export enum ComponentType {
  LOCAL = 'local',
  GIT = 'git',
  BINARY = 'binary',
}

export interface KnativeTreeObject extends QuickPickItem {
  getChildren(): ProviderResult<KnativeTreeObject[]>;
  getParent(): KnativeTreeObject;
  getName(): string;
  contextValue: string;
  compType?: string;
  contextPath?: Uri;
  deployed: boolean;
  path?: string;
}
export class KnativeObjectImpl implements KnativeTreeObject {
  constructor(
    private parent: KnativeTreeObject,
    public readonly name: string,
    public readonly contextValue: ContextType,
    public deployed: boolean,
    private readonly kn: Kn,
    public readonly collapsibleState: TreeItemCollapsibleState = Collapsed,
    public contextPath?: Uri,
    public readonly compType?: string,
  ) {
    KnImpl.data.setPathToObject(this);
  }

  private readonly CONTEXT_DATA = {
    cluster: {
      icon: 'cluster-node.png',
      tooltip: '{name}',
      getChildren: (): Promise<KnativeTreeObject[]> => this.kn.getProjects(),
    },
    project: {
      icon: 'project-node.png',
      tooltip: 'Project: {label}',
      getChildren: (): Promise<KnativeTreeObject[]> => this.kn.getApplications(this),
    },
    application: {
      icon: 'application-node.png',
      tooltip: 'Application: {label}',
      getChildren: (): Promise<KnativeTreeObject[]> => this.kn.getApplicationChildren(this),
    },
    component: {
      icon: '',
      tooltip: 'Component: {label}',
      description: '',
      getChildren: (): Promise<KnativeTreeObject[]> => this.kn.getComponentChildren(this),
    },
    componentNotPushed: {
      icon: '',
      tooltip: 'Component: {label}',
      description: '',
      getChildren: (): Promise<KnativeTreeObject[]> => this.kn.getComponentChildren(this),
    },
    componentNoContext: {
      icon: '',
      tooltip: 'Component: {label}',
      description: '',
      getChildren: (): Promise<KnativeTreeObject[]> => this.kn.getComponentChildren(this),
    },
    revision: {
      icon: 'service-node.png',
      tooltip: 'Revision: {label}',
      getChildren: (): undefined[] => [],
    },
    service: {
      icon: 'service-node.png',
      tooltip: 'Service: {label}',
      getChildren: (): undefined[] => [],
    },
    osservice: {
      icon: 'service-node.png',
      tooltip: 'Service: {label}',
      getChildren: (): undefined[] => [],
    },
    storage: {
      icon: 'storage-node.png',
      tooltip: 'Storage: {label}',
      getChildren: (): undefined[] => [],
    },
    clusterDown: {
      icon: 'cluster-down.png',
      tooltip: 'Cannot connect to the cluster',
      getChildren: (): undefined[] => [],
    },
    loginRequired: {
      icon: 'cluster-down.png',
      tooltip: 'Please Log in to the cluster',
      getChildren: (): undefined[] => [],
    },
    componentRoute: {
      icon: 'url-node.png',
      tooltip: 'URL: {label}',
      getChildren: (): undefined[] => [],
    },
  };

  private explorerPath: string;

  get path(): string {
    if (!this.explorerPath) {
      let parent: KnativeTreeObject = this;
      const segments: string[] = [];
      do {
        segments.splice(0, 0, parent.getName());
        parent = parent.getParent();
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
    } else {
      return Uri.file(
        path.join(__dirname, '../images/context', this.CONTEXT_DATA[this.contextValue].icon),
      );
    }
  }

  get tooltip(): string {
    return format(this.CONTEXT_DATA[this.contextValue].tooltip, this);
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

  getChildren(): ProviderResult<KnativeTreeObject[]> {
    return this.CONTEXT_DATA[this.contextValue].getChildren();
  }

  getParent(): KnativeTreeObject {
    return this.parent;
  }
}
