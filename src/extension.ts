/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Service } from './knative/service';
// import { ServiceDataProvider } from './tree/serviceDataProvicer';
import { ServiceExplorer } from './tree/serviceExplorer';
// import { KnController } from './tree/knController';
import { TreeObject } from './tree/knativeTreeObject';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function activate(extensionContext: vscode.ExtensionContext): void {

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = [
    vscode.commands.registerCommand('knative.explorer.reportIssue', () => ServiceExplorer.reportIssue()),
    vscode.commands.registerCommand('knative.service.open-in-browser', (context: TreeObject) => {
      const service = context.getKnativeItem() as Service;
      vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(service.image));
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
