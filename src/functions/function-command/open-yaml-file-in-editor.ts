/* eslint-disable import/no-cycle */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { Uri, window, workspace } from 'vscode';
import { FunctionNode } from '../function-tree-view/functionsTreeItem';

export function openInEditor(context: FunctionNode): void {
  if (!context) {
    return null;
  }
  const uriPath = Uri.file(path.join(context.contextPath.fsPath, 'func.yaml'));
  workspace.openTextDocument(uriPath).then(
    (doc) => {
      if (doc) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        window.showTextDocument(doc, { preserveFocus: true, preview: true });
      }
    },
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    (err) => window.showErrorMessage(`Error loading document: ${err}`),
  );
}
