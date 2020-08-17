/* eslint-disable @typescript-eslint/no-unused-vars */
// Copied from https://github.com/Azure/vscode-kubernetes-tools/blob/master/src/kuberesources.virtualfs.ts

/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import {
  Disposable,
  Event,
  EventEmitter,
  FileChangeEvent,
  FileChangeType,
  FileStat,
  FileSystemProvider,
  FileType,
  Uri,
  window,
  workspace,
  WorkspaceFolder,
} from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as querystring from 'querystring';
import * as yaml from 'yaml';
import { Execute } from './execute';
import { CliExitData } from './cmdCli';
import { KnAPI } from './kn-api';
import * as config from './config';
import { Errorable } from '../util/errorable';

export const KN_RESOURCE_SCHEME = 'knmsx';
export const KN_RESOURCE_AUTHORITY = 'loadknativecore';

export function vfsUri(
  schema: string,
  contextValue: string,
  name: string,
  outputFormat: string,
  namespace?: string | null | undefined /* TODO: rationalize null and undefined */,
): Uri {
  const c1 = contextValue.replace('/', '-');
  const context = c1.replace('.', '-');
  const docName = `${context}-${name}.${outputFormat}`;
  const nonce = new Date().getTime();
  const nsQuery = namespace ? `ns=${namespace}&` : '';
  // "knmsx://loadknativecore/serviceknative-tutorial-greeter.yaml?contextValue=service&name=knative-tutorial-greeter&_=1593030763939"
  const uri = `${schema}://${KN_RESOURCE_AUTHORITY}/${docName}?${nsQuery}contextValue=${context}&name=${name}&_=${nonce}`;
  return Uri.parse(uri);
}

export async function showWorkspaceFolderPick(): Promise<WorkspaceFolder | undefined> {
  if (!workspace.workspaceFolders) {
    window.showErrorMessage('This command requires an open Workspace folder.', { modal: true }, 'OK');
    return undefined;
  }
  if (workspace.workspaceFolders.length === 1) {
    return workspace.workspaceFolders[0];
  }
  return window.showWorkspaceFolderPick();
}

export async function selectRootFolder(): Promise<string | undefined> {
  const folder = await showWorkspaceFolderPick();
  if (!folder) {
    return undefined;
  }
  if (folder.uri.scheme !== 'file') {
    window.showErrorMessage('This command requires a filesystem folder'); // TODO: make it not
    return undefined;
  }
  return folder.uri.fsPath;
}

export async function saveAsync(uri: Uri, content: Uint8Array, subFolder?: string): Promise<void> {
  const rootPath = await selectRootFolder();
  if (!rootPath) {
    return;
  }
  if (!uri.fsPath.startsWith(`${path.sep}revision`)) {
    const fspath = path.join(rootPath, subFolder || '', uri.fsPath);
    fs.writeFileSync(fspath, content);
  }
}

export async function getFilePathAsync(subFolder?: string, fileName?: string): Promise<string> {
  const rootPath = await selectRootFolder();
  if (!rootPath) {
    return;
  }
  const fspath = path.join(rootPath, subFolder || '', fileName || '');
  return fspath;
}

export class KnativeResourceVirtualFileSystemProvider implements FileSystemProvider {
  private readonly onDidChangeFileEmitter: EventEmitter<FileChangeEvent[]> = new EventEmitter<FileChangeEvent[]>();

  onDidChangeFile: Event<FileChangeEvent[]> = this.onDidChangeFileEmitter.event;

  private yamlDirName = '.knative';

  public knExecutor = new Execute();

  // eslint-disable-next-line class-methods-use-this
  watch(_uri: Uri, _options: { recursive: boolean; excludes: string[] }): Disposable {
    // ignore, fires for all changes
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return new Disposable(() => {});
  }

  async stat(_uri: Uri): Promise<FileStat> {
    let fileType: FileType = FileType.File;
    let createTime = 0;
    let modifiedTime = 0;
    let fileSize = 0;

    const pathInWorkSpace: string = await getFilePathAsync(this.yamlDirName, _uri.fsPath);
    fs.stat(pathInWorkSpace, (err, stats) => {
      if (err) {
        throw err;
      }
      fileType = FileType.File;
      createTime = stats.ctimeMs;
      modifiedTime = stats.mtimeMs;
      fileSize = stats.size;
    });

    return {
      type: fileType,
      ctime: createTime,
      mtime: modifiedTime,
      size: fileSize,
    };
  }

  readDirectory(_uri: Uri): [string, FileType][] | Thenable<[string, FileType][]> {
    return this.readDirectoryAsync();
  }

  async readDirectoryAsync(): Promise<[string, FileType][]> {
    const files: [string, FileType][] = [];
    await this.createDirectoryAsync(null);
    const dir = await getFilePathAsync(this.yamlDirName, null);
    fs.readdirSync(dir).forEach((localFile) => {
      files.push([path.join(dir, localFile), FileType.File]);
    });
    return files;
  }

  createDirectory(_uri: Uri): void | Thenable<void> {
    return this.createDirectoryAsync(_uri);
  }

  async createDirectoryAsync(_uri: Uri): Promise<void> {
    const dir = await getFilePathAsync(this.yamlDirName, null);

    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(`Error while createDirectoryAsync() ${err}`);
      throw err;
    }
  }

  readFile(uri: Uri): Uint8Array | Thenable<Uint8Array> {
    return this.readFileAsync(uri);
  }

  async readFileAsync(uri: Uri): Promise<Uint8Array> {
    await this.createDirectory(uri);
    // Check if there is an edited local version.
    // TODO: Check if the version on the cluster is newer,
    // Then if it is, ask the user if they want to replace the edited version.
    const localFile = await getFilePathAsync(this.yamlDirName, uri.fsPath);
    // (example) localFile = "/home/josh/git/vscode-extension-samples/basic-multi-root-sample/.knative/service-example.yaml"
    if (fs.existsSync(localFile)) {
      // use local file
      const localContent = fs.readFileSync(localFile, { encoding: 'utf8' });
      return Buffer.from(localContent, 'utf8');
    }
    const content = await this.loadResource(uri);
    return Buffer.from(content, 'utf8');
  }

  async loadResource(uri: Uri): Promise<string> {
    const query = querystring.parse(uri.query);

    const outputFormat = config.getOutputFormat();
    const contextValue = query.contextValue as string;
    const context = contextValue === 'revision_tagged' ? 'revision' : contextValue;
    const name = query.name as string;
    const ns = query.ns as string | undefined;
    const resourceAuthority = uri.authority;
    const eced = await this.execLoadResource(uri.scheme, resourceAuthority, ns, context, name, outputFormat);

    if (Errorable.failed(eced)) {
      window.showErrorMessage(eced.error[0]);
      throw eced.error[0];
    }

    const ced = eced.result;

    return ced.stdout;
  }

  async execLoadResource(
    scheme: string,
    resourceAuthority: string,
    ns: string | undefined,
    contextValue: string,
    name: string,
    outputFormat: string,
  ): Promise<Errorable<CliExitData>> {
    let ced: CliExitData;
    let cleanedCed: CliExitData;
    const feature: string = contextValue.includes('_') ? contextValue.substr(0, contextValue.indexOf('_')) : contextValue;
    switch (resourceAuthority) {
      case KN_RESOURCE_AUTHORITY:
        // fetch the YAML output
        ced = await this.knExecutor.execute(KnAPI.describeFeature(feature, name, outputFormat));
        if (contextValue === 'service' && scheme === KN_RESOURCE_SCHEME) {
          cleanedCed = this.removeServerSideYamlElements(ced);
        } else {
          cleanedCed = ced;
        }
        return { succeeded: true, result: cleanedCed };
      default:
        return {
          succeeded: false,
          error: [
            `Internal error: please raise an issue with the error code InvalidObjectLoadURI and report authority ${resourceAuthority}.`,
          ],
        };
    }
  }

  // eslint-disable-next-line class-methods-use-this
  removeServerSideYamlElements(ced: CliExitData): CliExitData {
    if (ced.error) {
      return ced;
    }
    const doc = yaml.parse(ced.stdout);
    delete doc.metadata.creationTimestamp;
    delete doc.metadata.generation;
    delete doc.metadata.managedFields;
    delete doc.metadata.resourceVersion;
    delete doc.metadata.selfLink;
    delete doc.metadata.uid;
    delete doc.spec.template.metadata;
    delete doc.status;

    const cleanStdout = yaml.stringify(doc);
    const cleanCED: CliExitData = { error: ced.error, stdout: cleanStdout };
    return cleanCED;
  }

  writeFile(uri: Uri, content: Uint8Array, _options: { create: boolean; overwrite: boolean }): void | Thenable<void> {
    const s = saveAsync(uri, content, this.yamlDirName); // TODO: respect options
    this.onDidChangeFileEmitter.fire([{ type: FileChangeType.Created, uri }]);
    return s;
  }

  delete(uri: Uri, _options: { recursive: boolean }): void | Thenable<void> {
    if (fs.existsSync(uri.fsPath)) {
      fs.unlink(uri.fsPath, (err) => {
        if (err) {
          throw err;
        }
        this.onDidChangeFileEmitter.fire([{ type: FileChangeType.Deleted, uri }]);
      });
    }
  }

  rename(_oldUri: Uri, _newUri: Uri, _options: { overwrite: boolean }): void | Thenable<void> {
    return this.renameAsync(_oldUri, _newUri, _options);
  }

  async renameAsync(oldUri: Uri, newUri: Uri, options: { overwrite: boolean }): Promise<void> {
    const oldLocalFile = await getFilePathAsync(this.yamlDirName, oldUri.fsPath);
    const newLocalFile = await getFilePathAsync(this.yamlDirName, newUri.fsPath);
    if (fs.existsSync(oldLocalFile)) {
      fs.rename(oldLocalFile, newLocalFile, (err) => {
        if (err) {
          throw err;
        }
      });
    }
  }
}
