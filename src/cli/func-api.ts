/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { CliCommand, createCliCommand } from "./cmdCli";

function funcCliCommand(cmdArguments: string[]): CliCommand {
  return createCliCommand('func', ...cmdArguments);
}

export class FuncAPI {

  createFunc(language: string, template: string): CliCommand {
    const createCommand = ['-l', language, '-t', template];
    return funcCliCommand(createCommand);
  }

}
