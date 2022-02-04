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

export async function configureFunction(action: ConfigAction, context?: FunctionNode): Promise<void> {
  let funcPath = '';
  if (!context || !context.contextPath) {
    const selectedFolderPick = await selectFunctionFolder();
    if (!selectedFolderPick) {
      return null;
    }
    funcPath = selectedFolderPick.workspaceFolder.uri.fsPath;
  } else {
    funcPath = context.contextPath.fsPath;
  }

  const objectToConfigure = await vscode.window.showQuickPick([ENV_VARIABLES, VOLUMES], {
    placeHolder: 'Select what you want to configure',
  });

  if (!objectToConfigure) {
    return null;
  }

  await knExecutor.executeInTerminal(getCliCommand(action, objectToConfigure, funcPath));
}
