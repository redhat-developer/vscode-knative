/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { TreeItemCollapsibleState } from 'vscode';
import { CommandNode, ActiveCommandNodeImpl } from './command-node';
import { FunctionContextType } from '../../cli/config';
import { SHADOW_CACHED_OUTPUT_CHANNELS } from '../../util/output_channels';

export interface ActiveCommand {
  name?: string;
}

export function activeCommandTreeView(): CommandNode[] {
  const children = [];
  if (SHADOW_CACHED_OUTPUT_CHANNELS && SHADOW_CACHED_OUTPUT_CHANNELS.size !== 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const [key] of SHADOW_CACHED_OUTPUT_CHANNELS) {
      const obj: ActiveCommandNodeImpl = new ActiveCommandNodeImpl(
        null,
        key,
        FunctionContextType.ACTIVECOMMAND,
        TreeItemCollapsibleState.None,
      );
      children.unshift(obj);
    }
  } else {
    const obj: ActiveCommandNodeImpl = new ActiveCommandNodeImpl(
      null,
      'No active function command is running.',
      FunctionContextType.NONE,
      TreeItemCollapsibleState.None,
    );
    children.push(obj);
  }

  return children;
}
