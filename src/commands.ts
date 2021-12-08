/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { commands } from 'vscode';

export enum VSCodeCommands {
  SetContext = 'setContext',
}

export enum CommandContext {
  funcDisableRun = 'function:run',
}

export function setCommandContext(key: CommandContext | string, value: string | boolean): PromiseLike<void> {
  return commands.executeCommand(VSCodeCommands.SetContext, key, value);
}
