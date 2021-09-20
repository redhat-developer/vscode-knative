/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { TreeItemCollapsibleState } from 'vscode';
import { FunctionNodeImpl } from './functionsTreeItem';
import { FunctionContextType } from '../cli/config';

export function functionTreeView(): FunctionNodeImpl[] {
  return [new FunctionNodeImpl(null, 'No Function Found', FunctionContextType.NONE, TreeItemCollapsibleState.None, null)];
}
