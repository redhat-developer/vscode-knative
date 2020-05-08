/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Terminal } from 'vscode';
import * as path from 'path';
import { KnCliConfig } from './kn-cli-config';
import { KnCli, Cli, CliCommand, CliExitData, cliCommandToString } from './knCli';
import { WindowUtil } from '../util/windowUtils';

export class KnExecute {
  private cli: Cli = KnCli.getInstance();

  // eslint-disable-next-line class-methods-use-this
  public async executeInTerminal(command: CliCommand, cwd: string = process.cwd(), name = 'Knative'): Promise<void> {
    // Get the first word in the command string sent.
    const cmd = command.cliCommand;
    // Get the location of the installed cli tool.
    let toolLocation = await KnCliConfig.detectOrDownload(cmd);
    if (toolLocation) {
      toolLocation = path.dirname(toolLocation);
    }
    const terminal: Terminal = WindowUtil.createTerminal(name, cwd, toolLocation);
    terminal.sendText(cliCommandToString(command), true);
    terminal.show();
  }

  public async execute(command: CliCommand, cwd?: string, fail = true): Promise<CliExitData> {
    const cmd = command;
    const cmdProgram = command.cliCommand;
    const toolLocation = await KnCliConfig.detectOrDownload(cmdProgram);
    if (toolLocation) {
      cmd.cliCommand = toolLocation;
    }
    return this.cli
      .execute(cmd, cwd ? { cwd } : {})
      .then(async (result) => (result.error && fail ? Promise.reject(result.error) : result))
      .catch((err) => (fail ? Promise.reject(err) : Promise.resolve({ error: null, stdout: '', stderr: '' })));
  }
}

export function loadItems(result: CliExitData): any[] {
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
