/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { KN_RESOURCE_SCHEME } from './cli/virtualfs';
import { openTreeItemInEditor } from './editor/knativeOpenTextDocument';
import { KnativeReadonlyProvider, KN_READONLY_SCHEME } from './editor/knativeReadonlyProvider';
import { Revision } from './knative/revision';
import { Service } from './knative/service';
import { ServingTreeItem } from './servingTree/servingTreeItem';
import { ServingExplorer } from './servingTree/servingExplorer';

let disposable: vscode.Disposable[];

/**
 * This method is called when your extension is activated.
 * The extension is activated the very first time the command is executed.
 *
 * @param extensionContext
 */
export function activate(extensionContext: vscode.ExtensionContext): void {
  const servingExplorer = new ServingExplorer();
  // register a content provider for the knative readonly scheme
  const knReadonlyProvider = new KnativeReadonlyProvider(servingExplorer.treeDataProvider.knvfs);

  // The command has been defined in the package.json file.
  // Now provide the implementation of the command with registerCommand.
  // The commandId parameter must match the command field in package.json.
  disposable = [
    vscode.commands.registerCommand('knative.service.open-in-browser', (treeItem: ServingTreeItem) => {
      const item = treeItem.getKnativeItem();
      if (item instanceof Service) {
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(item.image));
      }
      if (item instanceof Revision) {
        if (item.traffic) {
          // Find the first tagged traffic & open the URL. There can be more than one tagged traffics
          // however for our purposes opening the first one should be enough.
          const taggedTraffic = item.traffic.find((val) => {
            return val.tag;
          });
          if (taggedTraffic) {
            vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(taggedTraffic.url.toString()));
          }
        }
      }
    }),
    vscode.workspace.registerTextDocumentContentProvider(KN_READONLY_SCHEME, knReadonlyProvider),
    vscode.commands.registerCommand('service.explorer.openFile', (treeItem: ServingTreeItem) =>
      openTreeItemInEditor(treeItem, vscode.workspace.getConfiguration('vs-knative')['vs-knative.outputFormat'], false),
    ),

    vscode.commands.registerCommand('service.explorer.edit', (treeItem: ServingTreeItem) =>
      openTreeItemInEditor(treeItem, vscode.workspace.getConfiguration('vs-knative')['vs-knative.outputFormat'], true),
    ),

    // Temporarily loaded resource providers
    vscode.workspace.registerFileSystemProvider(KN_RESOURCE_SCHEME, servingExplorer.treeDataProvider.knvfs, {
      /* TODO: case sensitive? */
    }),

    servingExplorer,
  ];

  // extensionContext.subscriptions.push(disposable);
  disposable.forEach((value) => extensionContext.subscriptions.push(value));
}

// this method is called when your extension is deactivated
export function deactivate(): void {
  disposable.forEach((command) => {
    command.dispose();
  });
}
