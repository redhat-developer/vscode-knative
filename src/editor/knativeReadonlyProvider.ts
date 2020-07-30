/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { KnativeResourceVirtualFileSystemProvider } from '../cli/virtualfs';

const resourceDocProvider = new KnativeResourceVirtualFileSystemProvider();

/**
 * This implements the VSCode Text Document Content Provider, loading knative resources as read only yaml files in the editor.
 *
 * It is registered in the extension.ts and automatically called whenever the registered scheme is used to open a doc.
 */
export class KnativeReadonlyProvider implements vscode.TextDocumentContentProvider {
  // emitter and its event
  onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();

  onDidChange = this.onDidChangeEmitter.event;

  // eslint-disable-next-line class-methods-use-this
  provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
    // simply invoke cowsay, use uri-path as text
    return resourceDocProvider.loadResource(uri);
  }
}
