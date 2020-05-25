/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { Service } from './knative/service';
import { ServiceExplorer } from './tree/serviceExplorer';
import { KnativeTreeItem } from './tree/knativeTreeItem';
import { vfsUri, KnativeResourceVirtualFileSystemProvider, KN_RESOURCE_SCHEME } from './util/virtualfs';

/**
 * This is set up as a Command. It can be called from a menu or by clicking on the tree item.
 *
 * @param treeItem
 */
export function openInEditor(treeItem: KnativeTreeItem): void {
  const { contextValue } = treeItem;
  const name: string = treeItem.getName();
  const outputFormat = vscode.workspace.getConfiguration('vs-knative')['vs-knative.outputFormat'];
  const uri = vfsUri(contextValue, name, outputFormat);
  vscode.workspace.openTextDocument(uri).then(
    (doc) => {
      if (doc) {
        vscode.window.showTextDocument(doc, { preserveFocus: true, preview: true });
      }
    },
    (err) => vscode.window.showErrorMessage(`Error loading document: ${err}`),
  );
}

/**
 * This method is called when your extension is activated.
 * The extension is activated the very first time the command is executed.
 *
 * @param extensionContext
 */
export function activate(extensionContext: vscode.ExtensionContext): void {
  const resourceDocProvider = new KnativeResourceVirtualFileSystemProvider();
  // The command has been defined in the package.json file.
  // Now provide the implementation of the command with registerCommand.
  // The commandId parameter must match the command field in package.json.
  const disposable = [
    vscode.commands.registerCommand('knative.service.open-in-browser', (treeItem: KnativeTreeItem) => {
      const service = treeItem.getKnativeItem() as Service;
      vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(service.image));
    }),
    vscode.commands.registerCommand('service.explorer.openFile', (treeItem: KnativeTreeItem) => openInEditor(treeItem)),

    // Temporarily loaded resource providers
    vscode.workspace.registerFileSystemProvider(KN_RESOURCE_SCHEME, resourceDocProvider, {
      /* TODO: case sensitive? */
    }),

    // eslint-disable-next-line no-new
    new ServiceExplorer(),
  ];

  // extensionContext.subscriptions.push(disposable);
  disposable.forEach((value) => extensionContext.subscriptions.push(value));
}

// this method is called when your extension is deactivated
export function deactivate(): void {
  // do nothing
}
