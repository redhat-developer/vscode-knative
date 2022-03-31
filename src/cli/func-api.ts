/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as path from 'path';
// eslint-disable-next-line import/no-cycle
import { CliCommand, CmdCli, createCliCommand } from './cmdCli';
import { quote } from '../util/quote';

function funcCliCommand(cmdArguments?: string[]): CliCommand {
  return createCliCommand('func', ...cmdArguments);
}

export class FuncAPI {
  static printFunctionVersion(): CliCommand {
    return funcCliCommand(['version']);
  }

  static invokeFunctionLocal(
    id: string,
    location: string,
    contextType: string,
    format: string,
    source: string,
    type: string,
    data: string,
  ): string {
    if (id) {
      return `func invoke --id ${id} -p ${location} --content-type ${contextType} -f ${format} --source ${source} --type ${type} --data ${data}`;
    }
    return `func invoke -p ${location} --content-type ${contextType} -f ${format} --source ${source} --type ${type} --data ${data}`;
  }

  static invokeFunctionRemote(
    id: string,
    namespace: string,
    contextType: string,
    format: string,
    source: string,
    type: string,
    data: string,
    url: string,
    location: string,
  ): string {
    if (id?.trim() && url?.trim()) {
      return `func invoke -p ${location} --id ${id} -t ${url} -n ${namespace} --content-type ${contextType} -f ${format} --source ${source} --type ${type} --data ${data}`;
    }
    if (id?.trim()) {
      return `func invoke -p ${location} --id ${id} -n ${namespace} --content-type ${contextType} -f ${format} --source ${source} --type ${type} --data ${data}`;
    }
    if (url?.trim()) {
      return `func invoke -p ${location} -t ${url} -n ${namespace} --content-type ${contextType} -f ${format} --source ${source} --type ${type} --data ${data}`;
    }
    return `func invoke -p ${location} -n ${namespace} --content-type ${contextType} -f ${format} --source ${source} --type ${type} --data ${data}`;
  }

  static createFunc(name: string, language: string, template: string, location: string): CliCommand {
    const createCommand = ['create', path.join(location, name), '-l', language, '-t', template];
    return funcCliCommand(createCommand);
  }

  static functionInfo(location: string): CliCommand {
    const createCommand = ['info', '-p', location, '-o', 'json'];
    return funcCliCommand(createCommand);
  }

  static buildFunc(location: string, image: string, builder?: string): CliCommand {
    let buildCommand: string[];
    if (builder) {
      buildCommand = ['build', '-p', `${quote}${location}${quote}`, '-i', image, '-b', builder];
    } else {
      buildCommand = ['build', '-p', `${quote}${location}${quote}`, '-i', image];
    }
    return funcCliCommand(buildCommand);
  }

  static deployFunc(location: string, image: string): CliCommand {
    const deployCommand = ['deploy', '-p', `${quote}${location}${quote}`, '-i', image];
    return funcCliCommand(deployCommand);
  }

  static runFunc(location: string): CliCommand {
    const deployCommand = ['run', '-p', `${quote}${location}${quote}`];
    return funcCliCommand(deployCommand);
  }

  static deleteFunc(name: string): CliCommand {
    const deleteCommand = ['delete', name];
    return funcCliCommand(deleteCommand);
  }

  static funcList(): CliCommand {
    const createCommand = ['list', '-o', 'json'];
    return funcCliCommand(createCommand);
  }

  static addEnvironmentVariable(location: string): CliCommand {
    const addEnvCommand = ['config', 'envs', 'add', '-p', `${quote}${location}${quote}`];
    return funcCliCommand(addEnvCommand);
  }

  static removeEnvironmentVariable(location: string): CliCommand {
    const removeEnvCommand = ['config', 'envs', 'remove', '-p', `${quote}${location}${quote}`];
    return funcCliCommand(removeEnvCommand);
  }

  static addVolumes(location: string): CliCommand {
    const addEnvCommand = ['config', 'volumes', 'add', '-p', `${quote}${location}${quote}`];
    return funcCliCommand(addEnvCommand);
  }

  static removeVolumes(location: string): CliCommand {
    const removeEnvCommand = ['config', 'volumes', 'remove', '-p', `${quote}${location}${quote}`];
    return funcCliCommand(removeEnvCommand);
  }

  static async getFuncVersion(location: string): Promise<string> {
    const version = new RegExp(`[v]?([0-9]+\\.[0-9]+\\.[0-9]+)$`);
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
      // console.log(`GetVersion had an error: ${error}`);
      return undefined;
    }
  }
}
