/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

// import * as vscode from 'vscode';
import { SpawnOptions, spawn } from 'child_process';
import KnOutputChannel, { OutputChannel } from './knOutputChannel';

export interface CliExitData {
  readonly error: string | Error;
  readonly stdout: string;
  readonly stderr?: string;
}
export interface Cli {
  execute(cmd: CliCommand, opts?: SpawnOptions): Promise<CliExitData>;
}

export interface CliCommand {
  cliCommand: string;
  cliArguments: string[];
}

export function createCliCommand(cliCommand: string, ...cliArguments: string[]): CliCommand {
  if (!cliArguments) {
    // eslint-disable-next-line no-param-reassign
    cliArguments = [];
  }
  return { cliCommand, cliArguments };
}

export function cliCommandToString(command: CliCommand): string {
  return `${command.cliCommand} ${command.cliArguments.join(' ')}`;
}

export default class KnCli implements Cli {
  private static instance: KnCli;

  /**
   * Print and Show info in the knative output channel/window.
   */
  private knOutputChannel: OutputChannel = new KnOutputChannel();

  static getInstance(): KnCli {
    if (!KnCli.instance) {
      KnCli.instance = new KnCli();
    }
    return KnCli.instance;
  }

  /**
   * Display info in the Knative Output channel/window
   */
  showOutputChannel(): void {
    this.knOutputChannel.show();
  }

  /**
   * Spin off a child process that will execute the cli command passed in.
   *
   * @param cmd
   * @param opts
   */
  execute(cmd: CliCommand, opts: SpawnOptions = {}): Promise<CliExitData> {
    return new Promise<CliExitData>((resolve) => {
      this.knOutputChannel.print(cliCommandToString(cmd));
      if (opts.windowsHide === undefined) {
        // eslint-disable-next-line no-param-reassign
        opts.windowsHide = true;
      }
      // if (opts.shell === undefined) {
      //   // eslint-disable-next-line no-param-reassign
      //   opts.shell = true;
      // }
      const kn = spawn(cmd.cliCommand, cmd.cliArguments, opts);
      let stdout = '';
      let error: string | Error;
      kn.stdout.on('data', (data) => {
        stdout += data;
      });
      kn.stderr.on('data', (data) => {
        error += data;
      });
      kn.on('error', err => {
        // do not reject it here, because caller in some cases need the error and the streams
        // to make a decision
        // eslint-disable-next-line no-console
        console.error(`error: ${err}`);
        error = err;
      });
      kn.on('close', () => {
        resolve({ error, stdout });
      });
      kn.on('exit', () => {
        resolve({ error, stdout });
      });
    });
  }
}
