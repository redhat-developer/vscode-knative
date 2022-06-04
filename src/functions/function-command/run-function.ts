/* eslint-disable import/no-cycle */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { window } from 'vscode';
import { buildFunction } from './build-and-deploy-function';
import { CliCommand } from '../../cli/cmdCli';
import { FuncAPI } from '../../cli/func-api';
import { telemetryLog } from '../../telemetry';
import { CACHED_CHILDPROCESS, executeCommandInOutputChannels, STILL_EXECUTING_COMMAND } from '../../util/output_channels';
import { FunctionNode } from '../function-tree-view/functionsTreeItem';

async function executeRunCommand(command: CliCommand, context: FunctionNode, name: string): Promise<void> {
  if (!STILL_EXECUTING_COMMAND.get(name)) {
    await executeCommandInOutputChannels(command, name);
  } else {
    const status = await window.showWarningMessage(
      `The Function ${command.cliArguments[0]}: ${context.getName()} is already active.`,
      'Terminate',
      'Restart',
    );
    if (status === 'Terminate') {
      CACHED_CHILDPROCESS.get(name).kill('SIGTERM');
    } else {
      CACHED_CHILDPROCESS.get(name).kill('SIGTERM');
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      setTimeout(async () => {
        await executeCommandInOutputChannels(command, name);
      }, 4000);
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
  const name = `Function ${command.cliArguments[0]}: ${context.getName()}`;
  const result = await window.showInformationMessage('Do you want to run with build?', 'Yes', 'No');
  if (result === 'No') {
    await executeRunCommand(command, context, name);
  } else if (result === 'Yes') {
    if (!STILL_EXECUTING_COMMAND.get(name)) {
      const buildResult = await buildFunction(context);
      if (!buildResult.error) {
        await executeRunCommand(command, context, name);
      }
    } else {
      const status = await window.showWarningMessage(
        `The Function ${command.cliArguments[0]}: ${context.getName()} is already active.`,
        'Terminate',
        'Restart',
      );
      if (status === 'Terminate') {
        CACHED_CHILDPROCESS.get(name).kill('SIGTERM');
      } else {
        CACHED_CHILDPROCESS.get(name).kill('SIGTERM');
        const buildResult = await buildFunction(context);
        if (!buildResult.error) {
          await executeRunCommand(command, context, name);
        }
      }
    }
  }
}
