/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { API, Branch, Ref, Remote } from './git.d';

const GIT_EXTENSION_ID = 'vscode.git';

export interface GitState {
  readonly remotes: Remote[];
  readonly refs: Ref[];
  readonly remote: Remote;
  readonly branch: Branch;
  readonly isGit: boolean;
}

export interface GitModel {
  readonly remoteUrl: string;
  readonly branchName: string;
}

export function getGitAPI(): API {
  const extension = vscode.extensions.getExtension(GIT_EXTENSION_ID);
  if (!extension) {
    return null;
  }
  const gitExtension = extension.exports;
  if (!gitExtension) {
    return null;
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return gitExtension.getAPI(1);
}
