/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
// eslint-disable-next-line import/no-cycle
import { CliCommand, cliCommandToString } from '../../cli/cmdCli';

export function getFunctionTasks(workspace: vscode.WorkspaceFolder, commandName?: string, command?: CliCommand): vscode.Task {
  const kind: vscode.TaskDefinition = {
    type: 'function',
    name: commandName,
  };

  return new vscode.Task(kind, workspace, commandName, kind.type, new vscode.ShellExecution(cliCommandToString(command)));
}
