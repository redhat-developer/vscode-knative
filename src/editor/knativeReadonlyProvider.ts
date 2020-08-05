/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { KnativeResourceVirtualFileSystemProvider } from '../cli/virtualfs';

export const KN_READONLY_SCHEME = 'knreadonly';

/**
 * This implements the VSCode Text Document Content Provider, loading knative resources as read only yaml files in the editor.
 *
 * It is registered in the extension.ts and automatically called whenever the registered scheme is used to open a doc.
 */
export class KnativeReadonlyProvider implements vscode.TextDocumentContentProvider {
  // emitter and its event
  onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();

  onDidChange = this.onDidChangeEmitter.event;

  knvfs: KnativeResourceVirtualFileSystemProvider;

  constructor(knv: KnativeResourceVirtualFileSystemProvider) {
    this.knvfs = knv;
  }

  provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
    return this.knvfs.loadResource(uri);
  }
}
