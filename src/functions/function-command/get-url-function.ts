/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { commands, Uri, window } from 'vscode';
// eslint-disable-next-line import/no-cycle
import { FunctionNode } from '../function-tree-view/functionsTreeItem';

export async function urlFunction(context?: FunctionNode): Promise<unknown> {
  if (!context) {
    return null;
  }
  if (!context.url) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    window.showErrorMessage('Fail to get URL');
    return null;
  }
  return commands.executeCommand('vscode.open', Uri.parse(context.url));
}
