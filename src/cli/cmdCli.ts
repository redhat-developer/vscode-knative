/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

// import * as vscode from 'vscode';
import { SpawnOptions, spawn } from 'child_process';
import { window } from 'vscode';
import { KnOutputChannel, OutputChannel } from '../output/knOutputChannel';

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

export class CmdCli implements Cli {
  private static instance: CmdCli;

  /**
   * Print and Show info in the knative output channel/window.
   */
  private knOutputChannel: OutputChannel = new KnOutputChannel();

  static getInstance(): CmdCli {
    if (!CmdCli.instance) {
      CmdCli.instance = new CmdCli();
    }
    return CmdCli.instance;
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
    return new Promise<CliExitData>((resolve, reject) => {
      this.knOutputChannel.print(cliCommandToString(cmd));
      if (opts.windowsHide === undefined) {
        // eslint-disable-next-line no-param-reassign
        opts.windowsHide = true;
      }
      // if (opts.shell === undefined) {
      //   // eslint-disable-next-line no-param-reassign
      //   opts.shell = true;
      // }
      const command = spawn(cmd.cliCommand, cmd.cliArguments, opts);
      let stdout = '';
      let error: string | Error;
      command.stdout.on('data', (data) => {
        stdout += data;
      });
      command.stderr.on('data', (data) => {
        error += data;
      });
      command.on('error', (err) => {
        // do not reject it here, because caller in some cases need the error and the streams
        // to make a decision
        // eslint-disable-next-line no-console
        console.error(`error: ${err}`);
        error = err;
      });
      command.on('exit', () => {
        if (error) {
          if (typeof error === 'string' && error.search('no such host') > 0) {
            window.showErrorMessage(`The cluster is not up. Please log into a running cluster.`, { modal: true }, 'OK');
          } else if (typeof error === 'string' && error.search('no configuration') > 0) {
            window.showErrorMessage(`The kubeconfig file can't be found.`, { modal: true }, 'OK');
          } else if (typeof error === 'string' && error.search('no Knative') > 0) {
            window.showErrorMessage(
              `The Knative / Serving Operator is not installed. Please install it to use this extension.`,
              { modal: true },
              'OK',
            );
          } else {
            reject(error);
          }
        }
        resolve({ error, stdout });
      });
      // command.on('close', () => {
      //   resolve({ error, stdout });
      // });
    });
  }
}
