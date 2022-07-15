/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable no-octal-escape */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-console */
/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint no-octal-escape: "error" */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { ChildProcess, spawn } from 'child_process';
import * as vscode from 'vscode';
import validator from 'validator';
import { multiStep } from './multiStepInput';
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

async function credHelper(startProcess: ChildProcess): Promise<void> {
  const resourceGroups: vscode.QuickPickItem[] = [
    'docker-credential-desktop',
    'docker-credential-ecr-login',
    'docker-credential-osxkeychain',
    'None',
  ].map((label) => ({ label }));
  const credentialHelper = await multiStep.showQuickPick({
    title: 'Select credentials helper',
    placeholder: 'Choose credentials helper',
    items: resourceGroups,
  });
  if (!credentialHelper) {
    startProcess.stdin.end();
    return null;
  }
  if (credentialHelper.label === 'None') {
    startProcess.stdin.write(`\n`);
  } else {
    startProcess.stdin.write(`${credentialHelper.label}\n`);
  }
}

async function getUsernameOrPassword(
  message: string,
  prompt: string,
  placeholder: string,
  passwordType?: boolean,
  errorMessage?: string,
  reattemptForLogin?: boolean,
): Promise<string | null> {
  return multiStep.showInputBox({
    title: message,
    prompt,
    placeholder,
    reattemptForLogin,
    validate: (value: string) => {
      if (validator.isEmpty(value)) {
        return errorMessage;
      }
      return null;
    },
    password: passwordType,
  });
}

async function provideUserNameAndPassword(
  startProcess: ChildProcess,
  message: string,
  reattemptForLogin?: boolean,
): Promise<void> {
  const userInfo = 'Provide username for image registry.';
  const userName = await getUsernameOrPassword(
    message,
    userInfo,
    userInfo,
    false,
    'Provide an username for image registry.',
    reattemptForLogin,
  );
  if (!userName) {
    startProcess.stdin.end();
    return null;
  }
  const passMessage = 'Provide password for image registry.';
  const userPassword = await getUsernameOrPassword(
    message,
    passMessage,
    passMessage,
    true,
    'Provide an password for image registry.',
  );
  if (!userPassword) {
    startProcess.stdin.end();
    return null;
  }
  startProcess.stdin.write(`${userName}\n${userPassword}\n`);
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
    const titleMessage = 'Please provide credentials for image registry.';
    STILL_EXECUTING_COMMAND.set(name, true);
    const channel = openNamedOutputChannel(name);
    channel.append(
      `\n\n------------------------------------------- Starting ${name} -------------------------------------------\n`,
    );
    channel.append(`\n${cliCommandToString(cmd)}\n`);
    // eslint-disable-next-line prefer-const
    startProcess = spawn(cmd.cliCommand, cmd.cliArguments);
    CACHED_CHILDPROCESS.set(name, startProcess);

    startProcess.stdout.on('data', async (chunk) => {
      if (chunk.toString().includes('Please provide credentials for image registry')) {
        await provideUserNameAndPassword(startProcess, titleMessage);
      }
      const incorrectCred = 'Incorrect credentials, please try again';
      if (chunk.toString().includes(incorrectCred)) {
        await provideUserNameAndPassword(startProcess, titleMessage, true);
      }
      if (chunk.toString().includes('Choose credentials helper')) {
        await credHelper(startProcess);
      }
      // eslint-disable-next-line no-control-regex
      channel.append(chunk.toString().replace(/\[94m|\x1b|\[0m|\[90m/gi, ''));
      stdout += chunk;
    });
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    startProcess.stderr.on('data', async (chunk) => {
      if (command.cliArguments[0] !== 'run' && command.cliArguments[0] !== 'deploy') {
        STILL_EXECUTING_COMMAND.set(name, false);
        CACHED_CHILDPROCESS.delete(name);
      }
      error += chunk;
      if (chunk.toString().includes('Choose credentials helper')) {
        await credHelper(startProcess);
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      channel.append(chunk.toString());
    });
    startProcess.on('close', (code) => {
      if (multiStep.current && command.cliArguments[0] === 'deploy') {
        startProcess.stdin.end();
        multiStep.current.dispose();
      }
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
