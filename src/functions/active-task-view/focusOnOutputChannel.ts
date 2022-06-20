/* eslint-disable import/no-cycle */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { CACHED_OUTPUT_CHANNELS } from '../../util/output_channels';
import { FunctionNode } from '../function-tree-view/functionsTreeItem';

export function focusOnOutputChannel(context: FunctionNode): void {
  if (!context) {
    return null;
  }
  const getOutputChannel = CACHED_OUTPUT_CHANNELS.get(context.getName());
  getOutputChannel.show();
}
