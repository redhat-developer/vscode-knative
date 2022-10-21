/* eslint-disable no-console */
/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { TreeItemCollapsibleState } from 'vscode';
import { CommandNode, ActiveCommandNodeImpl } from './command-node';
import { FunctionContextType } from '../../cli/config';
import { CACHED_OUTPUT_CHANNELS, STATUS_CACHED_OUTPUT_CHANNELS } from '../../util/output_channels';

export interface ActiveCommand {
  name?: string;
}

export function activeCommandTreeView(): CommandNode[] {
  const children = [];
  if (CACHED_OUTPUT_CHANNELS && CACHED_OUTPUT_CHANNELS.size !== 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const [key] of CACHED_OUTPUT_CHANNELS) {
      let obj: ActiveCommandNodeImpl;
      const getStatusCachedOutputChannel: string = STATUS_CACHED_OUTPUT_CHANNELS.get(key);
      if (getStatusCachedOutputChannel === 'successful') {
        obj = new ActiveCommandNodeImpl(null, key, FunctionContextType.PASSCOMMAND, TreeItemCollapsibleState.None);
      } else if (getStatusCachedOutputChannel === 'error') {
        obj = new ActiveCommandNodeImpl(null, key, FunctionContextType.ERRORCOMMAND, TreeItemCollapsibleState.None);
      } else {
        obj = new ActiveCommandNodeImpl(null, key, FunctionContextType.ACTIVECOMMAND, TreeItemCollapsibleState.None);
      }

      children.unshift(obj);
    }
  } else {
    const obj: ActiveCommandNodeImpl = new ActiveCommandNodeImpl(
      null,
      'No function is currently being run (or executed).',
      FunctionContextType.NONE,
      TreeItemCollapsibleState.None,
    );
    children.push(obj);
  }

  return children;
}
