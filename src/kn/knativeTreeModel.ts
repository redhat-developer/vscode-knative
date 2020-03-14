/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Uri, workspace, WorkspaceFolder } from 'vscode';
import * as path from 'path';
import { ComponentSettings, Config } from './config';
import { KnativeObject } from './knativeTreeObject';

import yaml = require('js-yaml');
import fs = require('fs');

export default class KnativeTreeModel {
  private parentToChildren: Map<KnativeObject, KnativeObject[]> = new Map();

  private pathToObject = new Map<string, KnativeObject>();

  private contextToObject = new Map<Uri, KnativeObject>();

  private contextToSettings = new Map<Uri, ComponentSettings>();

  public clearTreeData(): void {
    this.parentToChildren.clear();
    this.pathToObject.clear();
    this.contextToObject.clear();
    this.addContexts(workspace.workspaceFolders ? workspace.workspaceFolders : []);
  }

  public setParentToChildren(
    parent: KnativeObject,
    children: KnativeObject[],
  ): KnativeObject[] {
    if (!this.parentToChildren.has(parent)) {
      this.parentToChildren.set(parent, children);
    }
    return children;
  }

  public getChildrenByParent(parent: KnativeObject): KnativeObject[] {
    return this.parentToChildren.get(parent);
  }

  public setPathToObject(object: KnativeObject): void {
    if (!this.pathToObject.get(object.path)) {
      this.pathToObject.set(object.path, object);
    }
  }

  public getObjectByPath(objPath: string): KnativeObject {
    return this.pathToObject.get(objPath);
  }

  public setContextToObject(object: KnativeObject): void {
    if (object.contextPath) {
      if (!this.contextToObject.has(object.contextPath)) {
        this.contextToObject.set(object.contextPath, object);
      }
    }
  }

  public getObjectByContext(context: Uri): KnativeObject {
    return this.contextToObject.get(context);
  }

  public setContextToSettings(settings: ComponentSettings): void {
    if (!this.contextToSettings.has(settings.ContextPath)) {
      this.contextToSettings.set(settings.ContextPath, settings);
    }
  }

  public getSettingsByContext(context: Uri): ComponentSettings {
    return this.contextToSettings.get(context);
  }

  public getSettings(): ComponentSettings[] {
    return Array.from(this.contextToSettings.values());
  }

  // eslint-disable-next-line class-methods-use-this
  public addContexts(folders: ReadonlyArray<WorkspaceFolder>): void {
    folders.forEach((folder: WorkspaceFolder): void => {
      try {
        const compData: Config = yaml.safeLoad(
          fs.readFileSync(path.join(folder.uri.fsPath, '.kn', 'config.yaml'), 'utf8'),
        ) as Config;
        compData.ComponentSettings.ContextPath = folder.uri;
        this.setContextToSettings(compData.ComponentSettings);
      } catch (ignore) {
        // do nothing
      }
    })
  }

  public async delete(item: KnativeObject): Promise<void> {
    const array = await item.getParent().getChildren();
    array.splice(array.indexOf(item), 1);
    this.pathToObject.delete(item.path);
    this.contextToObject.delete(item.contextPath);
  }

  public deleteContext(context: Uri): void {
    this.contextToSettings.delete(context);
  }
}
