/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { workspace, QuickPickItem, window, Uri } from 'vscode';
import { Platform } from './platform';

import path = require('path');
import fs = require('fs-extra');

interface WorkspaceFolderItem extends QuickPickItem {
  uri: Uri;
}

class CreateWorkspaceItem implements QuickPickItem {
  readonly label = `$(plus) Add new context folder.`;

  readonly description = 'Folder which does not have an OpenShift context';

  getLabel(): string {
    return this.label;
  }

  getDescription(): string {
    return this.description;
  }
}

function checkComponentFolder(folder: Uri): boolean {
  return fs.existsSync(path.join(folder.fsPath, '.odo', 'config.yaml'));
}

export async function selectWorkspaceFolder(): Promise<Uri> {
  let wsFolders: WorkspaceFolderItem[] = [];
  if (workspace.workspaceFolders && workspace.workspaceFolders.length > 0) {
    wsFolders = workspace.workspaceFolders
      .filter((value) => {
        let result = true;
        try {
          result = !fs.statSync(path.join(value.uri.fsPath, '.odo', 'config.yaml')).isFile();
        } catch (ignore) {
          // ignore it
        }
        return result;
      })
      .map((folder) => ({ label: `$(file-directory) ${folder.uri.fsPath}`, uri: folder.uri }));
  }
  const addWorkspaceFolder = new CreateWorkspaceItem();
  const choice: any = await window.showQuickPick([addWorkspaceFolder, ...wsFolders], {
    placeHolder: 'Select context folder',
  });
  if (!choice) {
    return null;
  }

  let workspacePath: Uri;

  if (choice.label === addWorkspaceFolder.label) {
    const folders = await window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      defaultUri: Uri.file(Platform.getUserHomePath()),
      openLabel: 'Add context folder for component in workspace.',
    });
    if (!folders) {
      return null;
    }
    if (checkComponentFolder(folders[0])) {
      window.showInformationMessage(
        'The folder selected already contains a component. Please select a different folder.',
      );
      return this.selectWorkspaceFolder();
    }
    [workspacePath] = folders;
  } else if (choice) {
    workspacePath = choice.uri;
  }
  return workspacePath;
}
