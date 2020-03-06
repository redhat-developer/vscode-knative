/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Terminal } from 'vscode';
import * as path from 'path';
import KnCliConfig from './kn-cli-config';
import KnCli, { Cli, CliCommand, CliExitData, cliCommandToString } from './knCli';
import WindowUtil from '../util/windowUtils';

const cli: Cli = KnCli.getInstance();

export async function executeInTerminal(
  command: CliCommand,
  cwd: string = process.cwd(),
  name = 'Knative',
): Promise<void> {
  // Get the first word in the command string sent.
  const cmd = command.cliCommand.split(' ')[0];
  // Get the location of the installed cli tool.
  let toolLocation = await KnCliConfig.detectOrDownload(cmd);
  if (toolLocation) {
    toolLocation = path.dirname(toolLocation);
  }
  const terminal: Terminal = WindowUtil.createTerminal(name, cwd, toolLocation);
  terminal.sendText(cliCommandToString(command), true);
  terminal.show();
}

export async function execute(command: CliCommand, cwd?: string, fail = true): Promise<CliExitData> {
  const cmd = command.cliCommand.split(' ')[0];
  const toolLocation = await KnCliConfig.detectOrDownload(cmd);
  if (toolLocation) {
    // eslint-disable-next-line no-param-reassign
    command.cliCommand = command.cliCommand
      .replace(cmd, `${toolLocation}`)
      .replace(new RegExp(`&& ${cmd}`, `g`), `&& ${toolLocation}`);
  }
  return cli
    .execute(command, cwd ? { cwd } : {},
    )
    .then(async (result) => (result.error && fail ? Promise.reject(result.error) : result))
    .catch((err) =>
      fail ? Promise.reject(err) : Promise.resolve({ error: null, stdout: '', stderr: '' }),
    );
}
