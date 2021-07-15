/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { CliCommand, CmdCli, createCliCommand } from "./cmdCli";

function funcCliCommand(cmdArguments: string[]): CliCommand {
  return createCliCommand('func', ...cmdArguments);
}

export class FuncAPI {

  createFunc(name: string, language: string, template: string, location: string): CliCommand {
    const createCommand = ['create', path.join(location, name), '-l', language, '-t', template];
    return funcCliCommand(createCommand);
  }

  funcList(): CliCommand {
    const createCommand = ['list', '-o', 'json'];
    return funcCliCommand(createCommand);
  }

  async getFuncVersion(location: string): Promise<string> {
    const version = new RegExp(
      `[v]?([0-9]+\.[0-9]+\.[0-9]+)$`,
    );
    let detectedVersion: string;

    try {
      const data = await CmdCli.getInstance().execute(createCliCommand(`${location}`, `version`));

      if (data.stdout) {
        const toolVersion: string[] = data.stdout
          .trim()
          .split('\n')
          // Find the line of text that has the version.
          .filter((value1) => version.exec(value1))
          // Pull out just the version from the line from above.
          .map((value2) => {
            const regexResult = version.exec(value2);
            return regexResult?.[1];
          });
        if (toolVersion.length) {
          [detectedVersion] = toolVersion;
        }
      }
      return detectedVersion;
    } catch (error) {
      // eslint-disable-next-line no-console
      // console.log(`GetVersion had an error: ${error}`);
      return undefined;
    }
  }
}

export const funcApi = new FuncAPI();
