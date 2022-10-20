/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

export interface FunctionList {
  name: string;
  namespace?: string;
  runtime?: string;
  url?: string;
  ready?: string;
}

export interface FuncContent {
  name?: string;
  namespace?: string;
  runtime?: string;
  image?: string;
  imageDigest?: string;
  builder?: string;
  invocation?: { format?: string };
}

export interface FolderPick extends vscode.QuickPickItem {
  test?: string;
  workspaceFolder?: vscode.WorkspaceFolder;
}

export interface ImageAndBuild {
  image?: string;
  builder?: string;
}

export interface ContextList {
  name?: string;
  context?: { namespace: string };
}

export interface Namespace {
  contexts?: [ContextList];
}

export interface FunctionInfo {
  name?: string;
  image?: string;
  namespace?: string;
  routes?: [string];
}
