/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { CliCommand, createCliCommand, CmdCli } from './cmdCli';

function kubectlCliCommand(cmdArguments: string[]): CliCommand {
  return createCliCommand('kubectl', ...cmdArguments);
}

/**
 * A series of commands for the kubernetes cli `kubectl`.
 */
export class KubectlAPI {
  /**
   * Create / Update by applying a yaml file.
   */
  static applyYAML(yamlPath: string, options: { override: boolean }): CliCommand {
    const a = ['apply', '-f', yamlPath];
    if (options.override) {
      a.push('--force');
    }
    return kubectlCliCommand(a);
  }

  /**
   * Prints the simple version info for kubectl.
   */
  static printVersion(): CliCommand {
    return kubectlCliCommand(['version', '--short', '--client']);
  }

  static currentNamespace(): CliCommand {
    return kubectlCliCommand(['config', 'view', '--minify', '-o', 'json']);
  }

  /**
   * Returns just the version number without the rest of the printed text.
   *
   * @param location The path of the kubectl executable
   */
  static async getKubectlVersion(location: string): Promise<string> {
    const version = new RegExp(
      `Client Version:\\s+v(((([0-9]+)\\.([0-9]+)\\.([0-9]+)|(([0-9]+)-([0-9a-zA-Z]+)-([0-9a-zA-Z]+)))(?:-([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?)?).*`,
    );
    let detectedVersion: string;

    try {
      const data = await CmdCli.getInstance().execute(createCliCommand(`${location}`, `version`, '--client', '--short'));

      if (data.stdout) {
        const toolVersion: string[] = data.stdout
          .trim()
          .split('\n')
          // Find the line of text that has the version.
          .filter((value1) => version.exec(value1))
          // Pull out just the version from the line from above.
          .map((value2) => {
            const regexResult = version.exec(value2);
            return regexResult[1];
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
