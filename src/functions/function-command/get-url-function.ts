/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { commands, Uri, window } from 'vscode';
import { getFunctionInfo } from '../func-info';
import { FunctionNode } from '../function-tree-view/functionsTreeItem';

export async function urlFunction(context?: FunctionNode): Promise<unknown> {
  if (!context) {
    return null;
  }
  const functionUrl = await getFunctionInfo(context.contextPath);
  if (!functionUrl) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    window.showWarningMessage('Fail to fetch URL');
    return null;
  }
  if (functionUrl.routes.length === 1) {
    return commands.executeCommand('vscode.open', Uri.parse(functionUrl.routes[0]));
  }
  const URL = await window.showQuickPick(functionUrl.routes, {
    placeHolder: 'Select route',
    ignoreFocusOut: true,
  });
  return commands.executeCommand('vscode.open', Uri.parse(URL));
}
