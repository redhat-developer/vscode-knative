/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable import/no-cycle */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as path from 'path';
// eslint-disable-next-line import/no-cycle
import { CliCommand, CmdCli, createCliCommand } from './cmdCli';
import { checkOpenShiftCluster } from '../check-cluster';
// eslint-disable-next-line import/no-cycle
import { ParametersType } from '../functions/function-command/invoke-function';
import { ImageAndBuild } from '../functions/function-type';
import { GitModel } from '../git/git';
import { quote } from '../util/quote';

function funcCliCommand(cmdArguments?: string[]): CliCommand {
  return createCliCommand('func', ...cmdArguments);
}

export class FuncAPI {
  static printFunctionVersion(): CliCommand {
    return funcCliCommand(['version']);
  }

  static invokeFunction(data: ParametersType): CliCommand {
    const args: string[] = ['invoke'];
    if (data.invokeId?.trim()) {
      args.push(`--id ${quote}${data.invokeId}${quote}`);
    }
    if (data.invokePath?.trim()) {
      args.push(`-p ${quote}${data.invokePath}${quote}`);
    }
    if (data.invokeInstance === 'Remote') {
      args.push(`-t ${data.invokeUrlCheck ? `${quote}${data.invokeUrl}${quote}` : 'remote'}`);
    }
    if (data.invokeInstance === 'Local' || !data.invokeInstance) {
      args.push('-t local');
    }
    if (data.invokeNamespace?.trim()) {
      args.push(`-n ${quote}${data.invokeNamespace}${quote}`);
    }
    if (data.invokeContextType?.trim()) {
      args.push(`--content-type ${quote}${data.invokeContextType}${quote}`);
    }
    if (data.invokeFormat?.trim()) {
      args.push(`-f ${quote}${data.invokeFormat}${quote}`);
    }
    if (data.invokeSource?.trim()) {
      args.push(`--source ${quote}${data.invokeSource}${quote}`);
    }
    if (data.invokeType?.trim()) {
      args.push(`--type ${quote}${data.invokeType}${quote}`);
    }
    if (data.invokeDataText?.trim() && data.invokeDataMode === 'Text') {
      args.push(`--data ${quote}${data.invokeDataText}${quote}`);
    }
    if (data.invokeDataFile?.trim() && data.invokeDataMode === 'File') {
      args.push(`--file ${quote}${data.invokeDataFile}${quote}`);
    }
    return funcCliCommand(args);
  }

  static createFunc(name: string, language: string, template: string, location: string): CliCommand {
    const createCommand = ['create', path.join(location, name), '-l', language, '-t', template];
    return funcCliCommand(createCommand);
  }

  static listTemplate(): CliCommand {
    const listTemplate = ['templates', '--json'];
    return funcCliCommand(listTemplate);
  }

  static createFuncWithRepository(
    name: string,
    language: string,
    template: string,
    location: string,
    repository: string,
  ): CliCommand {
    const createCommand = ['create', path.join(location, name), '-l', language, '-t', template, '-r', repository];
    return funcCliCommand(createCommand);
  }

  static functionInfo(location: string): CliCommand {
    const createCommand = ['info', '-p', location, '-o', 'json'];
    return funcCliCommand(createCommand);
  }

  static async buildFunc(location: string, image: string, namespace: string): Promise<CliCommand> {
    const buildCommand: string[] = ['build', `-p=${location}`, `-i=${image}`, `-n=${namespace}`, '-v'];
    if (await checkOpenShiftCluster()) {
      buildCommand.push('-r ""');
    }
    return funcCliCommand(buildCommand);
  }

  private static async createImageArgs(imageMode: ImageAndBuild): Promise<string[]> {
    if (imageMode.autoGenerateImage) {
      return [];
    }

    const args: string[] = [];
    /* eslint-disable no-unused-expressions */
    imageMode.image ? args.push(`-i=${imageMode.image}`) : undefined;
    (await checkOpenShiftCluster()) ? args.push('-r ""') : undefined;
    /* eslint-enable no-unused-expressions */
    return args;
  }

  private static async createDeployCommandArgs(
    location: string,
    imageMode: ImageAndBuild,
    namespace: string,
    gitModel: GitModel,
    disableBuild: boolean,
  ): Promise<string[]> {
    let args = ['deploy'];
    /* eslint-disable no-unused-expressions */
    location ? args.push(`-p=${location}`) : undefined;
    imageMode ? (args = [...args, ...(await this.createImageArgs(imageMode))]) : undefined;
    namespace ? args.push(`-n=${namespace}`) : undefined;
    gitModel
      ? (args = [...args, '--remote', `--git-url=${gitModel.remoteUrl}`, `--git-branch=${gitModel.branchName}`])
      : undefined;
    disableBuild ? args.push('--build=false') : undefined;
    /* eslint-enable no-unused-expressions */
    args.push('-v');
    return args;
  }

  static async deployFunc(location: string, image: ImageAndBuild, namespace: string): Promise<CliCommand> {
    const deployCommand = await this.createDeployCommandArgs(location, image, namespace, undefined, true);
    return funcCliCommand(deployCommand);
  }

  static async onClusterBuildFunc(
    location: string,
    imageMode: ImageAndBuild,
    namespace: string,
    gitModel: GitModel,
  ): Promise<CliCommand> {
    const deployCommand = await this.createDeployCommandArgs(location, imageMode, namespace, gitModel, false);
    return funcCliCommand(deployCommand);
  }

  static runFunc(location: string): CliCommand {
    const runCommand = ['run', `-p=${location}`, '-b=false', '-v'];
    return funcCliCommand(runCommand);
  }

  static addRepository(name: string, URL: string, namespace: string): CliCommand {
    const addRepositoryCommand = ['repository', 'add', name, URL, '-n', namespace];
    return funcCliCommand(addRepositoryCommand);
  }

  static listRepository(namespace: string): CliCommand {
    const listRepositoryCommand = ['repository', 'list', '-v', '-n', namespace];
    return funcCliCommand(listRepositoryCommand);
  }

  static renameRepository(name: string, rename: string, namespace: string): CliCommand {
    const renameRepositoryCommand = ['repository', 'rename', name, rename, '-n', namespace];
    return funcCliCommand(renameRepositoryCommand);
  }

  static removeRepository(name: string, namespace: string): CliCommand {
    const removeRepositoryCommand = ['repository', 'remove', name, '-n', namespace];
    return funcCliCommand(removeRepositoryCommand);
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
