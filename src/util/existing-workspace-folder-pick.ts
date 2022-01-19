/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

export class ExistingWorkspaceFolderPick {
  // eslint-disable-next-line no-useless-constructor
  constructor(public readonly workspaceFolder: vscode.WorkspaceFolder) {}

  get label(): string {
    return this.workspaceFolder.name;
  }

  get description(): string {
    return this.workspaceFolder.uri.fsPath;
  }
}
