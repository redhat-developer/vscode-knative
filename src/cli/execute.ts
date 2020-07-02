/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Terminal } from 'vscode';
import * as path from 'path';
import { CmdCliConfig } from './cli-config';
import { CmdCli, Cli, CliCommand, CliExitData, cliCommandToString } from './cmdCli';
import { WindowUtil } from '../util/windowUtils';

export class Execute {
  private cli: Cli = CmdCli.getInstance();

  // eslint-disable-next-line class-methods-use-this
  public async executeInTerminal(command: CliCommand, cwd: string = process.cwd(), name = 'Knative'): Promise<void> {
    // Get the first word in the command string sent.
    const cmd = command.cliCommand;
    // Get the location of the installed cli tool.
    let toolLocation = await CmdCliConfig.detectOrDownload(cmd);
    if (toolLocation) {
      toolLocation = path.dirname(toolLocation);
    }
    const terminal: Terminal = WindowUtil.createTerminal(name, cwd, toolLocation);
    terminal.sendText(cliCommandToString(command), true);
    terminal.show();
  }

  public async execute(command: CliCommand, cwd?: string, fail = true): Promise<CliExitData> {
    const cmd = command;
    // Get the location of the cli tool and add it as a path to the command so that it will run.
    const toolLocation = await CmdCliConfig.detectOrDownload(cmd.cliCommand);
    if (toolLocation) {
      cmd.cliCommand = toolLocation;
    }
    return this.cli
      .execute(cmd, cwd ? { cwd } : {})
      .then((result) => (result.error && fail ? Promise.reject(result.error) : result))
      .catch((err) => (fail ? Promise.reject(err) : Promise.resolve({ error: null, stdout: '', stderr: '' })));
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function loadItems(result: CliExitData): any[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any[] = [];
  try {
    const { items } = JSON.parse(result.stdout);
    if (items) {
      data = items;
    }
  } catch (ignore) {
    // do nothing
  }
  return data;
}
