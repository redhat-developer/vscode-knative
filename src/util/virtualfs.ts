/* eslint-disable @typescript-eslint/no-unused-vars */
// Copied from https://github.com/Azure/vscode-kubernetes-tools/blob/master/src/kuberesources.virtualfs.ts

/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import {
  Uri,
  FileSystemProvider,
  FileType,
  FileStat,
  FileChangeEvent,
  Event,
  EventEmitter,
  Disposable,
  window,
  workspace,
  WorkspaceFolder,
} from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as querystring from 'querystring';

import { Execute } from '../cli/execute';
import { CliExitData } from '../cli/cmdCli';
import { KnAPI } from '../cli/kn-api';
import * as config from '../cli/config';
import { Errorable } from './errorable';

export const KN_RESOURCE_SCHEME = 'knmsx';
export const KN_RESOURCE_AUTHORITY = 'loadknativecore';
export const HELM_RESOURCE_AUTHORITY = 'helmget';

export function vfsUri(
  contextValue: string,
  name: string,
  outputFormat: string,
  namespace?: string | null | undefined /* TODO: rationalise null and undefined */,
): Uri {
  const docname = `${contextValue.replace('/', '-')}${name}.${outputFormat}`;
  const nonce = new Date().getTime();
  const nsquery = namespace ? `ns=${namespace}&` : '';
  const uri = `${KN_RESOURCE_SCHEME}://${KN_RESOURCE_AUTHORITY}/${docname}?${nsquery}contextValue=${contextValue}&name=${name}&_=${nonce}`;
  return Uri.parse(uri);
}

export class KnativeResourceVirtualFileSystemProvider implements FileSystemProvider {
  private readonly onDidChangeFileEmitter: EventEmitter<FileChangeEvent[]> = new EventEmitter<FileChangeEvent[]>();

  onDidChangeFile: Event<FileChangeEvent[]> = this.onDidChangeFileEmitter.event;

  public knExecutor = new Execute();

  // eslint-disable-next-line class-methods-use-this
  watch(_uri: Uri, _options: { recursive: boolean; excludes: string[] }): Disposable {
    // It would be quite neat to implement this to watch for changes
    // in the cluster and update the doc accordingly.  But that is very
    // definitely a future enhancement thing!
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return new Disposable(() => {});
  }

  // eslint-disable-next-line class-methods-use-this
  stat(_uri: Uri): FileStat {
    return {
      type: FileType.File,
      ctime: 0,
      mtime: 0,
      size: 65536, // These files don't seem to matter for us
    };
  }

  // eslint-disable-next-line class-methods-use-this
  readDirectory(_uri: Uri): [string, FileType][] | Thenable<[string, FileType][]> {
    return [];
  }

  // eslint-disable-next-line class-methods-use-this
  createDirectory(_uri: Uri): void | Thenable<void> {
    // no-op
  }

  readFile(uri: Uri): Uint8Array | Thenable<Uint8Array> {
    return this.readFileAsync(uri);
  }

  async readFileAsync(uri: Uri): Promise<Uint8Array> {
    const content = await this.loadResource(uri);
    return Buffer.from(content, 'utf8');
  }

  async loadResource(uri: Uri): Promise<string> {
    const query = querystring.parse(uri.query);

    const outputFormat = config.getOutputFormat();
    const contextValue = query.contextValue as string;
    const name = query.name as string;
    const ns = query.ns as string | undefined;
    const resourceAuthority = uri.authority;

    const eer = await this.execLoadResource(resourceAuthority, ns, contextValue, name, outputFormat);

    if (Errorable.failed(eer)) {
      window.showErrorMessage(eer.error[0]);
      throw eer.error[0];
    }

    const er = eer.result;

    return er.stdout;
  }

  // eslint-disable-next-line class-methods-use-this
  async execLoadResource(
    resourceAuthority: string,
    ns: string | undefined,
    contextValue: string,
    name: string,
    outputFormat: string,
  ): Promise<Errorable<CliExitData>> {
    let ker: CliExitData;
    switch (resourceAuthority) {
      case KN_RESOURCE_AUTHORITY:
        ker = await this.knExecutor.execute(KnAPI.describeFeature(contextValue, name, outputFormat));
        return { succeeded: true, result: ker };
      default:
        return {
          succeeded: false,
          error: [
            `Internal error: please raise an issue with the error code InvalidObjectLoadURI and report authority ${resourceAuthority}.`,
          ],
        };
    }
  }

  writeFile(uri: Uri, content: Uint8Array, _options: { create: boolean; overwrite: boolean }): void | Thenable<void> {
    return this.saveAsync(uri, content); // TODO: respect options
  }

  // eslint-disable-next-line class-methods-use-this
  async showWorkspaceFolderPick(): Promise<WorkspaceFolder | undefined> {
    if (!workspace.workspaceFolders) {
      window.showErrorMessage('This command requires an open folder.');
      return undefined;
    }
    if (workspace.workspaceFolders.length === 1) {
      return workspace.workspaceFolders[0];
    }
    return window.showWorkspaceFolderPick();
  }

  // eslint-disable-next-line class-methods-use-this
  async selectRootFolder(): Promise<string | undefined> {
    const folder = await this.showWorkspaceFolderPick();
    if (!folder) {
      return undefined;
    }
    if (folder.uri.scheme !== 'file') {
      window.showErrorMessage('This command requires a filesystem folder'); // TODO: make it not
      return undefined;
    }
    return folder.uri.fsPath;
  }

  private async saveAsync(uri: Uri, content: Uint8Array): Promise<void> {
    // This assumes no pathing in the URI - if this changes, we'll need to
    // create subdirectories.
    // TODO: not loving prompting as part of the write when it should really be part of a separate
    // 'save' workflow - but needs must, I think
    const rootPath = await this.selectRootFolder();
    if (!rootPath) {
      return;
    }
    const fspath = path.join(rootPath, uri.fsPath);
    fs.writeFileSync(fspath, content);
  }

  // eslint-disable-next-line class-methods-use-this
  delete(_uri: Uri, _options: { recursive: boolean }): void | Thenable<void> {
    // no-op
  }

  // eslint-disable-next-line class-methods-use-this
  rename(_oldUri: Uri, _newUri: Uri, _options: { overwrite: boolean }): void | Thenable<void> {
    // no-op
  }
}
