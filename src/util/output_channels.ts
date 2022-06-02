/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { ChildProcess, spawn } from 'child_process';
import * as vscode from 'vscode';
import { CmdCliConfig } from '../cli/cli-config';
import { CliCommand, cliCommandToString, CliExitData } from '../cli/cmdCli';
import { FunctionNode } from '../functions/function-tree-view/functionsTreeItem';

export const CACHED_OUTPUT_CHANNELS = new Map<string, vscode.OutputChannel>();
export const STILL_EXECUTING_COMMAND = new Map<string, boolean>();
export const CACHED_CHILDPROCESS = new Map<string, ChildProcess>();

export function clearOutputChannels(): void {
  CACHED_OUTPUT_CHANNELS.forEach((value, key) => {
    CACHED_OUTPUT_CHANNELS.get(key).dispose();
  });
}

export function openNamedOutputChannel(command?: CliCommand, context?: FunctionNode): vscode.OutputChannel | undefined {
  let channel: vscode.OutputChannel | undefined;
  const name = `Function ${command.cliArguments[0]}: ${context.getName()}`;
  if (!CACHED_OUTPUT_CHANNELS.get(name)) {
    channel = vscode.window.createOutputChannel(name);
    CACHED_OUTPUT_CHANNELS.set(name, channel);
  } else {
    channel = CACHED_OUTPUT_CHANNELS.get(name);
    if (!channel) {
      channel = vscode.window.createOutputChannel(name);
    }
  }
  if (channel) {
    channel.show();
  }
  return channel;
}

export async function executeCommandInOutputChannels(
  command: CliCommand,
  context: FunctionNode,
  name: string,
): Promise<CliExitData> {
  const toolLocation = await CmdCliConfig.detectOrDownload(command.cliCommand);
  const cmd = command;
  if (toolLocation) {
    cmd.cliCommand = toolLocation;
  }
  return new Promise<CliExitData>((resolve) => {
    let stdout = '';
    let error: string | Error;
    let startProcess: ChildProcess;
    STILL_EXECUTING_COMMAND.set(name, true);
    const channel = openNamedOutputChannel(command, context);
    channel.append(`${cliCommandToString(cmd)}\n`);
    // eslint-disable-next-line prefer-const
    startProcess = spawn(cmd.cliCommand, cmd.cliArguments);
    CACHED_CHILDPROCESS.set(name, startProcess);
    startProcess.stdout.on('data', (chunk) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      channel.append(chunk.toString());
      stdout += chunk;
    });
    startProcess.stderr.on('data', (chunk) => {
      if (command.cliArguments[0] !== 'run') {
        STILL_EXECUTING_COMMAND.set(name, false);
        CACHED_CHILDPROCESS.delete(name);
      }
      error += chunk;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      channel.append(chunk.toString());
    });
    startProcess.on('close', (code) => {
      STILL_EXECUTING_COMMAND.set(name, false);
      CACHED_CHILDPROCESS.delete(name);
      const message = `'${cliCommandToString(cmd)}' exited with code ${code}`;
      channel.append(message);
      resolve({ error, stdout });
    });
    startProcess.on('error', (err) => {
      STILL_EXECUTING_COMMAND.set(name, false);
      CACHED_CHILDPROCESS.delete(name);
      channel.append(err.toString());
      error = err;
      resolve({ error, stdout });
    });
  });
}
