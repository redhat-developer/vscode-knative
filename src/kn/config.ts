/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Uri } from 'vscode';

export const enum Kind {
  LocalConfig,
}

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

export const enum SourceType {
  GIT = 'git',
  LOCAL = 'local',
  BINARY = 'binary',
}

export interface Config {
  kind: Kind;
  apiversion: string;
  ComponentSettings: ComponentSettings;
}

export interface ComponentSettings {
  Type: string;
  SourceLocation: string;
  Ref: string;
  SourceType: SourceType;
  Application: string;
  Project: string;
  Name: string;
  ContextPath?: Uri;
  Ports: string[];
}
