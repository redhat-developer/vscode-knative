/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import KnativeExplorer from './explorer';
import Service from './knative/service';
import { Kn, KnController } from './kn/knController';
import { KnativeObject } from './kn/knativeTreeObject';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(extensionContext: vscode.ExtensionContext): void {
  const knctl: Kn = KnController.Instance;
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = [
    vscode.commands.registerCommand('knative.service.create', () => knctl.addService()),
    // vscode.commands.registerCommand('knative.service.create', () => Service.create()),

    // vscode.commands.registerCommand('knative.service.create', async (context) =>
    //   execute(await knctl.addService(`foo1`, `invinciblejai/tag-portal-v1`) , context),
    // ),
    vscode.commands.registerCommand('knative.explorer.refresh', () =>
      KnativeExplorer.getInstance().refresh()
    ),
    vscode.commands.registerCommand('knative.explorer.reportIssue', () =>
      KnativeExplorer.reportIssue(),
    ),
    vscode.commands.registerCommand('knative.service.open-in-browser', (context:KnativeObject)=>{
     const service  = context.getKnativeItem() as Service;
     vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(service.url));
    }),
    KnativeExplorer.getInstance(),
  ];

  // extensionContext.subscriptions.push(disposable);
  disposable.forEach((value) => extensionContext.subscriptions.push(value));
}

// this method is called when your extension is deactivated
export function deactivate(): void {
  // do nothing
}
