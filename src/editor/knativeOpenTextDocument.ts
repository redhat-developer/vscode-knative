/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { vfsUri, KN_RESOURCE_SCHEME } from '../cli/virtualfs';
import { KnativeTreeItem } from '../tree/knativeTreeItem';

/**
 * This is set up as a Command. It can be called from a menu or by clicking on the tree item.
 *
 * @param treeItem
 * @param outputFormat
 * @param editable
 */
export function openTreeItemInEditor(treeItem: KnativeTreeItem, outputFormat: string, editable: boolean): void {
  const schema: string = editable ? KN_RESOURCE_SCHEME : 'knreadonly';
  const { contextValue } = treeItem;
  const name: string = treeItem.getName();
  const uri = vfsUri(schema, contextValue, name, outputFormat);
  vscode.workspace.openTextDocument(uri).then(
    (doc) => {
      if (doc) {
        vscode.window.showTextDocument(doc, { preserveFocus: true, preview: true });
      }
    },
    (err) => vscode.window.showErrorMessage(`Error loading document: ${err}`),
  );
}
