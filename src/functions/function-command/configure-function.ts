/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { selectFunctionFolder } from './build-and-deploy-function';
import { CliCommand } from '../../cli/cmdCli';
import { knExecutor } from '../../cli/execute';
import { FuncAPI } from '../../cli/func-api';
import { FunctionNode } from '../function-tree-view/functionsTreeItem';

export const enum ConfigAction {
  Add,
  Remove,
}

export const ENV_VARIABLES = 'Environment Variables';
export const VOLUMES = 'Volumes';

function getConfigEnvsCliCommand(action: ConfigAction, funcPath: string) {
  if (action === ConfigAction.Add) {
    return FuncAPI.addEnvironmentVariable(funcPath);
  }
  return FuncAPI.removeEnvironmentVariable(funcPath);
}

function getConfigVolumesCliCommand(action: ConfigAction, funcPath: string) {
  if (action === ConfigAction.Add) {
    return FuncAPI.addVolumes(funcPath);
  }
  return FuncAPI.removeVolumes(funcPath);
}

function getCliCommand(action: ConfigAction, objectToConfigure: string, funcPath: string): CliCommand {
  switch (objectToConfigure) {
    case ENV_VARIABLES: {
      return getConfigEnvsCliCommand(action, funcPath);
    }
    case VOLUMES: {
      return getConfigVolumesCliCommand(action, funcPath);
    }
    default: {
      return null;
    }
  }
}

async function getFuncPath(context?: FunctionNode) {
  if (!context || !context.contextPath) {
    const selectedFolderPick = await selectFunctionFolder();
    if (!selectedFolderPick) {
      return null;
    }
    return selectedFolderPick.workspaceFolder.uri.fsPath;
  }
  return context.contextPath.fsPath;
}

export async function configureFunction(action: ConfigAction, objectToConfigure?: string, context?: FunctionNode): Promise<void> {
  const funcPath = await getFuncPath(context);
  if (!funcPath) {
    return null;
  }
  if (!objectToConfigure) {
    // eslint-disable-next-line no-param-reassign
    objectToConfigure = await vscode.window.showQuickPick([ENV_VARIABLES, VOLUMES], {
      placeHolder: 'Select what you want to configure',
    });
    if (!objectToConfigure) {
      return null;
    }
  }

  await knExecutor.executeInTerminal(getCliCommand(action, objectToConfigure, funcPath));
}

export async function configureEnvs(action: ConfigAction, context?: FunctionNode): Promise<void> {
  await configureFunction(action, ENV_VARIABLES, context);
}

export async function configureVolumes(action: ConfigAction, context?: FunctionNode): Promise<void> {
  await configureFunction(action, VOLUMES, context);
}
