/* eslint-disable no-use-before-define */
/* eslint-disable import/no-cycle */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { window } from 'vscode';
import { buildFunction, restartBuildCommand } from './build-and-deploy-function';
import { CliCommand, CliExitData } from '../../cli/cmdCli';
import { FuncAPI } from '../../cli/func-api';
import { telemetryLog } from '../../telemetry';
import { CACHED_CHILDPROCESS, executeCommandInOutputChannels, STILL_EXECUTING_COMMAND } from '../../util/output_channels';
import { FunctionNode } from '../function-tree-view/functionsTreeItem';

export const restartRunCommand = new Map<string, boolean>();
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function executeRunCommand(command: CliCommand, context: FunctionNode, name: string): Promise<void> {
  if (!STILL_EXECUTING_COMMAND.get(name)) {
    command.cliArguments.push('--build=false');
    await executeCommandInOutputChannels(command, name);
    if (restartRunCommand.get(context.getName())) {
      restartRunCommand.set(context.getName(), false);
      await executeRunCommand(command, context, name);
    }
    return null;
  }
  const status = await window.showWarningMessage(`The Run for function:${context.getName()} is already active.`, 'Restart');
  if (status === 'Restart') {
    CACHED_CHILDPROCESS.get(name)?.kill('SIGTERM');
    restartRunCommand.set(context.getName(), true);
  }
}

export async function buildAndRun(context: FunctionNode, command: CliCommand): Promise<void> {
  let buildOrRunName: string;
  const runName = `Run: ${context.getName()}`;
  const buildName = `Build: ${context.getName()}`;
  if (STILL_EXECUTING_COMMAND.get(buildName)) {
    buildOrRunName = buildName;
  } else if (STILL_EXECUTING_COMMAND.get(runName)) {
    buildOrRunName = runName;
  }
  if (!STILL_EXECUTING_COMMAND.get(runName) && !STILL_EXECUTING_COMMAND.get(buildName)) {
    const buildResult: CliExitData = await buildFunction(context);
    if (buildResult?.stdout) {
      command.cliArguments.push('--build=true');
      await executeRunCommand(command, context, runName);
    }
    return null;
  }
  const status = await window.showWarningMessage(`The Function ${buildOrRunName} is already active.`, 'Restart');
  if (status === 'Restart') {
    CACHED_CHILDPROCESS.get(buildName)?.kill('SIGTERM');
    CACHED_CHILDPROCESS.get(runName)?.kill('SIGTERM');
    if (restartBuildCommand.get(context.getName())) {
      restartBuildCommand.set(context.getName(), false);
    }
    await delay(1000);
    await buildAndRun(context, command);
  }
}

export async function runFunction(context?: FunctionNode): Promise<void> {
  if (!context) {
    return null;
  }
  telemetryLog('Function_run_command', `Function run command click name: ${context.getName()}`);
  // TO DO
  const command = FuncAPI.runFunc(context.contextPath.fsPath);
  const name = `Run: ${context.getName()}`;
  // const buildName = `Build: ${context.getName()}`;
  const result = await window.showInformationMessage('Do you want to run with build?', 'Yes', 'No');
  if (result === 'No') {
    await executeRunCommand(command, context, name);
  } else if (result === 'Yes') {
    await buildAndRun(context, command);
  }
}
