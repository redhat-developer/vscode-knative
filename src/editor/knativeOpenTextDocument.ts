/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { KN_READONLY_SCHEME } from './knativeReadonlyProvider';
import { vfsUri, KN_RESOURCE_SCHEME } from '../cli/virtualfs';
import { EventingTreeItem } from '../eventingTree/eventingTreeItem';
import { ServingTreeItem } from '../servingTree/servingTreeItem';

/**
 * This is set up as a Command. It can be called from a menu or by clicking on the tree item.
 *
 * @param treeItem
 * @param outputFormat
 * @param editable
 */
export async function openTreeItemInEditor(
  treeItem: ServingTreeItem | EventingTreeItem,
  outputFormat: string,
  editable: boolean,
): Promise<void> {
  const schema: string = editable ? KN_RESOURCE_SCHEME : KN_READONLY_SCHEME;
  let contextValue: string;
  if (treeItem.contextValue.startsWith('source_')) {
    contextValue = treeItem.contextValue;
  } else {
    contextValue = treeItem.contextValue.includes('_')
      ? treeItem.contextValue.substr(0, treeItem.contextValue.indexOf('_'))
      : treeItem.contextValue;
  }
  const foundName: string = treeItem.getName();
  const name: string = foundName.includes(' - ') ? foundName.slice(foundName.lastIndexOf(' - ') + 3) : foundName;
  const uri = vfsUri(schema, contextValue, name, outputFormat);

  await vscode.workspace.openTextDocument(uri).then(
    async (doc) => {
      if (doc) {
        await vscode.window.showTextDocument(doc, { preserveFocus: true, preview: true });
      } else {
        throw Error(`Error loading resource located at ${uri.toString()}`);
      }
    },
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    (err) => vscode.window.showErrorMessage(`Error loading document: ${err}`),
  );
}
