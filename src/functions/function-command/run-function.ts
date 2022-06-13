/* eslint-disable no-use-before-define */
/* eslint-disable import/no-cycle */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { window } from 'vscode';
import { buildFunction } from './build-and-deploy-function';
import { CliCommand, CliExitData } from '../../cli/cmdCli';
import { FuncAPI } from '../../cli/func-api';
import { telemetryLog } from '../../telemetry';
import { CACHED_CHILDPROCESS, executeCommandInOutputChannels, STILL_EXECUTING_COMMAND } from '../../util/output_channels';
import { FunctionNode } from '../function-tree-view/functionsTreeItem';

interface checkRunAndBuild {
  statusBuildOrRun?: boolean;
  commandToRun?: CliCommand;
}
export const recursive = new Map<string, boolean>();
export const canceledBuildFromRun = new Map<string, checkRunAndBuild>();

async function executeRunCommand(
  command: CliCommand,
  context: FunctionNode,
  name: string,
  recursiveCall?: boolean,
): Promise<void> {
  if (recursiveCall === false) {
    return null;
  }

  if (recursiveCall === true) {
    recursive.set(name, false);
    await executeCommandInOutputChannels(command, name);
    const runStatus = canceledBuildFromRun.get(name);
    if (runStatus?.statusBuildOrRun) {
      canceledBuildFromRun.set(name, { statusBuildOrRun: false, commandToRun: command });
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      await buildAndRun(context, command, false);
      return null;
    }
    await executeRunCommand(command, context, name, recursive.get(name) ?? false);
    return null;
  }

  if (!STILL_EXECUTING_COMMAND.get(name)) {
    await executeCommandInOutputChannels(command, name);
    const runStatus = canceledBuildFromRun.get(name);
    if (runStatus?.statusBuildOrRun) {
      canceledBuildFromRun.set(name, { statusBuildOrRun: false, commandToRun: command });
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      await buildAndRun(context, command, false);
      return null;
    }
    await executeRunCommand(command, context, name, recursive.get(name) ?? false);
    return null;
  }
  const status = await window.showWarningMessage(
    `The Function ${command.cliArguments[0]}: ${context.getName()} is already active.`,
    'Restart',
  );
  if (status === 'Restart') {
    recursive.set(name, true);
    CACHED_CHILDPROCESS.get(name)?.kill('SIGTERM');
  }
}

export async function buildAndRun(context: FunctionNode, command: CliCommand, runFromBuild?: boolean): Promise<void> {
  let buildOrRunName: string;
  const runName = `Run: ${context.getName()}`;
  const buildName = `Build: ${context.getName()}`;
  if (STILL_EXECUTING_COMMAND.get(buildName)) {
    buildOrRunName = buildName;
  } else if (STILL_EXECUTING_COMMAND.get(runName)) {
    buildOrRunName = runName;
  }
  if (!STILL_EXECUTING_COMMAND.get(runName) && !STILL_EXECUTING_COMMAND.get(buildName)) {
    let buildResult: CliExitData;
    if (!runFromBuild) {
      buildResult = await buildFunction(context);
    }
    if (!buildResult?.error) {
      await executeRunCommand(command, context, runName);
    }
  } else {
    const status = await window.showWarningMessage(`The Function ${buildOrRunName} is already active.`, 'Restart');
    if (status === 'Restart') {
      CACHED_CHILDPROCESS.get(buildName)?.kill('SIGTERM');
      CACHED_CHILDPROCESS.get(runName)?.kill('SIGTERM');
      if (buildOrRunName === buildName) {
        canceledBuildFromRun.set(buildName, { statusBuildOrRun: true, commandToRun: command });
      }
      if (buildOrRunName === runName) {
        canceledBuildFromRun.set(runName, { statusBuildOrRun: true, commandToRun: command });
      }
    }
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
