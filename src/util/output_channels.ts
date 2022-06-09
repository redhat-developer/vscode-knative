/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-console */
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
import { activeCommandExplorer } from '../functions/active-task-view/activeExplorer';

export const CACHED_OUTPUT_CHANNELS = new Map<string, vscode.OutputChannel>();
export const SHADOW_CACHED_OUTPUT_CHANNELS = new Map<string, vscode.OutputChannel>();
export const STILL_EXECUTING_COMMAND = new Map<string, boolean>();
export const CACHED_CHILDPROCESS = new Map<string, ChildProcess>();

export function clearOutputChannels(): void {
  CACHED_OUTPUT_CHANNELS.forEach((value, key) => {
    CACHED_OUTPUT_CHANNELS.get(key).dispose();
  });
}

export function openNamedOutputChannel(name?: string): vscode.OutputChannel | undefined {
  let channel: vscode.OutputChannel | undefined;
  if (!CACHED_OUTPUT_CHANNELS.get(name)) {
    channel = vscode.window.createOutputChannel(name);
    CACHED_OUTPUT_CHANNELS.set(name, channel);
    SHADOW_CACHED_OUTPUT_CHANNELS.set(name, channel);
  } else {
    channel = CACHED_OUTPUT_CHANNELS.get(name);
    SHADOW_CACHED_OUTPUT_CHANNELS.set(name, channel);
    if (!channel) {
      channel = vscode.window.createOutputChannel(name);
    }
  }
  if (channel) {
    channel.show();
  }
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  activeCommandExplorer.refresh();
  return channel;
}

export async function executeCommandInOutputChannels(command: CliCommand, name: string): Promise<CliExitData> {
  let toolLocation: string;
  if (command.cliCommand === 'func') {
    toolLocation = await CmdCliConfig.detectOrDownload(command.cliCommand);
  }

  const cmd = command;
  if (toolLocation) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    cmd.cliCommand = toolLocation;
  }

  return new Promise<CliExitData>((resolve) => {
    let stdout = '';
    let error: string | Error;
    let startProcess: ChildProcess;
    STILL_EXECUTING_COMMAND.set(name, true);
    const channel = openNamedOutputChannel(name);
    channel.append(
      `\n\n------------------------------------------- Starting ${name} -------------------------------------------\n`,
    );
    channel.append(`\n${cliCommandToString(cmd)}\n`);
    // eslint-disable-next-line prefer-const
    startProcess = spawn(cmd.cliCommand, cmd.cliArguments);
    CACHED_CHILDPROCESS.set(name, startProcess);
    startProcess.stdout.on('data', (chunk) => {
      // eslint-disable-next-line no-control-regex
      channel.append(chunk.toString().replace(/\[94m|\x1b|\[0m/gi, ''));
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
      SHADOW_CACHED_OUTPUT_CHANNELS.delete(name);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      activeCommandExplorer.refresh();
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
