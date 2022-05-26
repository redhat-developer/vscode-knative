/* eslint-disable import/no-cycle */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { tasks, window } from 'vscode';
import { buildFunction } from './build-and-deploy-function';
import { getFunctionTasks } from './task-provider';
import { FuncAPI } from '../../cli/func-api';
import { telemetryLog } from '../../telemetry';
import { FunctionNode } from '../function-tree-view/functionsTreeItem';

async function runExecute(context: FunctionNode, buildAndRun?: string): Promise<void> {
  const runTaskToExecute = getFunctionTasks(
    { name: context.getName(), uri: context.contextPath, index: null },
    buildAndRun ?? 'run',
    FuncAPI.runFunc(context.contextPath.fsPath),
  );
  await tasks.executeTask(runTaskToExecute);
}

export async function runFunction(context?: FunctionNode): Promise<void> {
  if (!context) {
    return null;
  }
  telemetryLog('Function_run_command', `Function run command click name: ${context.getName()}`);
  // TO DO
  const result = await window.showInformationMessage('Do you want to run with build?', 'Yes', 'No');
  if (result === 'No') {
    await runExecute(context);
  } else if (result === 'Yes') {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    const buildAndRun = 'build/run';
    await buildFunction(context, buildAndRun);
    tasks.onDidEndTaskProcess(async (value) => {
      if (value.exitCode === 0 && value.execution.task.name === buildAndRun) {
        await runExecute(context, buildAndRun);
      }
    });
  }
}
