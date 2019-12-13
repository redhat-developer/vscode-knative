/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { exec, ExecException, ExecOptions } from 'child_process';
import KnChannel, { KnOutputChannel } from './knChannel';

export interface CliExitData {
  readonly error: ExecException;
  readonly stdout: string;
  readonly stderr: string;
}
export interface Cli {
  execute(cmd: string, opts?: ExecOptions): Promise<CliExitData>;
}

export default class KnCli implements Cli {
  private static instance: KnCli;

  private knOutputChannel: KnOutputChannel = new KnChannel();

  static getInstance(): KnCli {
    if (!KnCli.instance) {
      KnCli.instance = new KnCli();
    }
    return KnCli.instance;
  }

  showOutputChannel(): void {
    this.knOutputChannel.show();
  }

  async execute(cmd: string, opts: ExecOptions = {}): Promise<CliExitData> {
    return new Promise<CliExitData>((resolve) => {
      const exopt = opts;
      this.knOutputChannel.print(cmd);
      if (exopt.maxBuffer === undefined) {
        exopt.maxBuffer = 2 * 1024 * 1024;
      }
      exec(cmd, exopt, (error: ExecException, stdout: string, stderr: string) => {
        const stdoutFiltered = stdout.replace(/---[\s\S]*$/g, '').trim();
        this.knOutputChannel.print(stdoutFiltered);
        this.knOutputChannel.print(stderr);
        // do not reject it here, because caller in some cases need the error and the streams
        // to make a decision
        // Filter update message text which starts with `---`
        resolve({ error, stdout: stdoutFiltered, stderr });
      });
    });
  }
}
