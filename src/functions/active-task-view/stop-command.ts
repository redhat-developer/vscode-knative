/* eslint-disable import/no-cycle */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { CACHED_CHILDPROCESS } from '../../util/output_channels';
import { canceledBuildFromRun } from '../function-command/run-function';
import { FunctionNode } from '../function-tree-view/functionsTreeItem';

export function stopCommand(context: FunctionNode): void {
  if (!context) {
    return null;
  }
  canceledBuildFromRun.delete(context.getName());
  CACHED_CHILDPROCESS.get(context.getName()).kill('SIGTERM');
}
