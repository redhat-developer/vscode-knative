/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as yaml from 'js-yaml';
import { FolderPick, ImageAndBuild } from './function-type';
import { CliExitData } from '../cli/cmdCli';
import { knExecutor } from '../cli/execute';
import { FuncAPI } from '../cli/func-api';
import { ExistingWorkspaceFolderPick } from '../util/existing-workspace-folder-pick';
import { getStderrString } from '../util/stderrstring';

async function executeBuildCommand(location: string, image: string, builder?: string): Promise<void> {
  const result: CliExitData = await knExecutor.execute(FuncAPI.buildFunc(location, image, builder));
  if (result.error) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    vscode.window.showErrorMessage(`Fail to build Project Error: ${getStderrString(result.error)}`);
    return null;
  }
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  vscode.window.showInformationMessage('Function successfully build.');
}

async function functionBuilder(image: string): Promise<ImageAndBuild> {
  const builder = await vscode.window.showInputBox({
    ignoreFocusOut: true,
    prompt: 'Provide Buildpack builder, either an as a an image name or a mapping name.',
  });
  if (!builder) {
    return null;
  }
  return { image, builder };
}

async function functionImage(selectedFolderPick: vscode.Uri): Promise<ImageAndBuild> {
  const imageList = [`$(plus) Provide new image`];
  let funcData;
  try {
    const funcYaml = await fs.readFile(path.join(selectedFolderPick.fsPath, 'func.yaml'), 'utf-8');
    funcData = yaml.safeLoadAll(funcYaml);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (funcData?.[0].image) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      imageList.push(funcData[0].image);
    }
  } catch (error) {
    // ignore
  }
  const imagePick =
    imageList.length === 1
      ? imageList[0]
      : await vscode.window.showQuickPick(imageList, {
          canPickMany: false,
          ignoreFocusOut: true,
        });
  if (!imagePick) {
    return null;
  }
  if (imagePick === `$(plus) Provide new image`) {
    const image = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      prompt: 'Provide full image name in the orm [registry]/[namespace]/[name]:[tag]',
    });
    if (!image) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!funcData?.[0]?.builder) {
      const builder = await functionBuilder(image);
      if (!builder) {
        return { image };
      }
      return builder;
    }
    return { image };
  }
  return { image: imagePick };
}

export async function buildFunction(): Promise<void> {
  const folderPicks: FolderPick[] = [
    {
      label: '$(plus) Select local folder',
    },
  ];
  if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const wf of vscode.workspace.workspaceFolders) {
      folderPicks.push(new ExistingWorkspaceFolderPick(wf));
    }
  }

  const selectedFolderPick =
    folderPicks.length === 1
      ? folderPicks[0]
      : await vscode.window.showQuickPick(folderPicks, {
          canPickMany: false,
          ignoreFocusOut: true,
          placeHolder: 'Select folder',
        });
  if (!selectedFolderPick) {
    return null;
  }
  if (selectedFolderPick && selectedFolderPick.label === '$(plus) Select local folder') {
    const folder = await vscode.window.showOpenDialog({
      canSelectFolders: true,
      canSelectFiles: false,
      canSelectMany: false,
      openLabel: 'Select folder',
    });
    if (!folder) {
      return null;
    }
    const funcData = await functionImage(folder[0]);
    if (!funcData) {
      return null;
    }
    await executeBuildCommand(folder[0].fsPath, funcData.image, funcData.builder);
    return null;
  }
  if (!selectedFolderPick && selectedFolderPick.workspaceFolder.uri) {
    return null;
  }
  const funcData = await functionImage(selectedFolderPick.workspaceFolder.uri);
  if (!funcData) {
    return null;
  }
  await executeBuildCommand(selectedFolderPick.workspaceFolder.uri.fsPath, funcData.image, funcData.builder);
}
