/* eslint-disable import/no-cycle */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { CmdCliConfig } from '../../cli/cli-config';
import { CliCommand, cliCommandToString } from '../../cli/cmdCli';

export async function getFunctionTasks(
  workspace: vscode.WorkspaceFolder,
  commandName?: string,
  command?: CliCommand,
): Promise<vscode.Task> {
  const kind: vscode.TaskDefinition = {
    type: 'function',
    name: commandName,
  };
  const cmd = command;
  const toolLocation = await CmdCliConfig.detectOrDownload(cmd.cliCommand);

  if (toolLocation) {
    cmd.cliCommand = toolLocation;
  }
  return new vscode.Task(kind, workspace, commandName, kind.type, new vscode.ShellExecution(cliCommandToString(command)));
}
