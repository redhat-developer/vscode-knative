/* eslint-disable no-return-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { extensions, version } from 'vscode';
import { Platform } from './util/platform';

function issueUrl(): string {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { packageJSON } = extensions.getExtension('redhat.vscode-knative');
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access
  const body = [`VS Code version: ${version}`, `OS: ${Platform.OS}`, `Extension version: ${packageJSON.version}`].join('\n');
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access
  return `${packageJSON.bugs}/new?labels=kind/bug&title=&body=**Environment**\n${body}\n**Description**`;
}

export async function reportIssue(): Promise<unknown> {
  return await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(issueUrl()));
}
