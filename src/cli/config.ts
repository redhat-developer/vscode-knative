/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Uri, workspace } from 'vscode';

const EXTENSION_CONFIG_KEY = 'vs-knative';

export const enum Kind {
  LocalConfig,
}

export enum ContextType {
  REVISION = 'revision',
  REVISION_TAGGED = 'revision.tagged',
  SERVICE = 'service',
  LOGIN_REQUIRED = 'login_required',
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

export function getOutputFormat(): string {
  return workspace.getConfiguration(EXTENSION_CONFIG_KEY)['vs-knative.outputFormat'];
}
