/* eslint-disable import/no-cycle */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { buildFunction } from './build-and-deploy-function';
import { buildAndRun, canceledBuildFromRun, recursive } from './run-function';
import { CliCommand, CliExitData } from '../../cli/cmdCli';
import { executeCommandInOutputChannels } from '../../util/output_channels';
import { FunctionNode } from '../function-tree-view/functionsTreeItem';

export async function executeBuildOrRunOnRestart(context: FunctionNode, command: CliCommand, name: string): Promise<CliExitData> {
  // eslint-disable-next-line no-return-await
  const result = await executeCommandInOutputChannels(command, name);
  const getCanceledBuildFromRun = canceledBuildFromRun.get(name);
  if (getCanceledBuildFromRun?.statusBuildOrRun) {
    const buildResult = await buildFunction(context, getCanceledBuildFromRun.statusBuildOrRun);
    if (!buildResult?.error) {
      await buildAndRun(context, getCanceledBuildFromRun.commandToRun, true);
    }
  } else if (recursive.get(name)) {
    await buildFunction(context, recursive.get(name));
  }
  return result;
}
