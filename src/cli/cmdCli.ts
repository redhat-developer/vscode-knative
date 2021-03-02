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
export interface CliCommand {
  cliCommand: string;
  cliArguments: string[];
}

export interface Cli {
  execute(cmd: CliCommand, opts?: SpawnOptions): Promise<CliExitData>;
}

export function createCliCommand(cliCommand: string, ...cliArguments: string[]): CliCommand {
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

  private static clusterErrorNotReported = true;

  private static kubeconfigErrorNotReported = true;

  private static servingErrorNotReported = true;

  /**
   * Reset the error flags after 5 sec, so they can be checked again the next time execute is run.
   */
  // eslint-disable-next-line class-methods-use-this
  static resetErrorFlags(): void {
    setTimeout(() => {
      CmdCli.clusterErrorNotReported = true;

      CmdCli.kubeconfigErrorNotReported = true;

      CmdCli.servingErrorNotReported = true;
    }, 5000);
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
        console.error(`error: ${err.message}`);
        error = err;
      });
      command.on('exit', () => {
        if (error) {
          // let message: string | undefined;
          if (typeof error === 'string' && error.search('no such host') > 0 && error.search('failed to resolve image') === 0) {
            if (CmdCli.clusterErrorNotReported) {
              CmdCli.clusterErrorNotReported = false;
              window.showErrorMessage(`The cluster is not up. Please log into a running cluster.`, { modal: true }, 'OK').then(
                () => 'OK',
                () => undefined,
              );
            }
          } else if (typeof error === 'string' && error.search('Config not found') > 0) {
            if (CmdCli.kubeconfigErrorNotReported) {
              CmdCli.kubeconfigErrorNotReported = false;
              window.showErrorMessage(`The kubeconfig file can't be found.`, { modal: true }, 'OK').then(
                () => 'OK',
                () => undefined,
              );
            }
          } else if (
            typeof error === 'string' &&
            (error.search('no Knative') > 0 || error.search('knative.dev is forbidden: User') > 0)
          ) {
            if (CmdCli.servingErrorNotReported) {
              CmdCli.servingErrorNotReported = false;
              window
                .showErrorMessage(
                  `The Knative / Serving Operator is not installed. Please install it to use this extension.`,
                  { modal: true },
                  'OK',
                )
                .then(
                  () => 'OK',
                  () => undefined,
                );
            }
          } else {
            reject(error);
          }
        } else {
          resolve({ error, stdout });
        }
      });
      // command.on('close', () => {
      //   resolve({ error, stdout });
      // });
    });
  }
}
