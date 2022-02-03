/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { knExecutor } from '../../cli/execute';
import { FuncAPI } from '../../cli/func-api';
import { FunctionNode } from '../function-tree-view/functionsTreeItem';

export async function addEnvironmentVariables(context?: FunctionNode): Promise<void> {
  if (!context || !context.contextPath) {
    return null;
  }

  await knExecutor.executeInTerminal(FuncAPI.addEnvironmentVariable(context.contextPath.fsPath));
}
