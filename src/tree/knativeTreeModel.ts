/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Uri, workspace, WorkspaceFolder } from 'vscode';
import * as path from 'path';
import { TreeObject } from './knativeTreeObject';
import { ComponentSettings, Config } from '../kn/config';

import yaml = require('js-yaml');
import fs = require('fs');

export class KnativeTreeModel {
  /**
   * A map of a parent in the tree to it's child objects.
   */
  private parentToChildren: Map<TreeObject, TreeObject[]> = new Map<TreeObject, TreeObject[]>();

  /**
   * A map of the path from one object to the next for each object.
   */
  private pathToObject = new Map<string, TreeObject>();

  private contextToObject = new Map<Uri, TreeObject>();

  private contextToSettings = new Map<Uri, ComponentSettings>();

  /**
   * Remove all the tree data.
   */
  public clearTreeData(): void {
    this.parentToChildren.clear();
    this.pathToObject.clear();
    this.contextToObject.clear();
    this.addContexts(workspace.workspaceFolders ? workspace.workspaceFolders : []);
  }

  /**
   * Assigns children to the parent object and stores it in a map.
   *
   * @param parent
   * @param children
   * @returns children
   */
  public setParentToChildren(parent: TreeObject, children: TreeObject[]): TreeObject[] {
    // eslint-disable-next-line no-console
    console.log(`knativeTreeModel.setParentToChildren parent.Name = ${parent.getName()}`);
    if (!this.parentToChildren.has(parent)) {
      // eslint-disable-next-line no-console
      console.log(`knativeTreeModel.setParentToChildren child.Name = ${children.forEach((v) => v.getName())}`);
      this.parentToChildren.set(parent, children);
    }
    return children;
  }

  /**
   * Add one TreeObject child to the array of children associated with a given parent TreeObject
   *
   * @param child
   * @param parent
   */
  public addChildToParent(child: TreeObject, parent: TreeObject): TreeObject[] {
    // get the children from the parent or set an empty array
    const children: TreeObject[] = this.parentToChildren.has(parent) ? this.getChildrenByParent(parent) : [];

    // look in the array of children for the child we are adding
    const foundChild = children.find((value) => value.getName() === child.getName())
    if (foundChild) {
      // Since this child already exists we need to replace it.
      const i = children.findIndex((value) => value.getName() === child.getName());
      children[i] = child;
    } else {
      // add the child to the children array
      children.push(child);
    }
    // replace the children array with the updated one
    this.parentToChildren.set(parent, children);
    return children;
  }

  /**
   * Gets the children in the tree that are under a parent object.
   * @param parent
   * @returns children
   */
  public getChildrenByParent(parent: TreeObject): TreeObject[] {
    return this.parentToChildren.get(parent);
  }

  public setPathToObject(object: TreeObject): void {
    if (!this.pathToObject.get(object.path)) {
      this.pathToObject.set(object.path, object);
    }
  }

  public getObjectByPath(objPath: string): TreeObject {
    return this.pathToObject.get(objPath);
  }

  public setContextToObject(object: TreeObject): void {
    if (object.contextPath) {
      if (!this.contextToObject.has(object.contextPath)) {
        this.contextToObject.set(object.contextPath, object);
      }
    }
  }

  public getObjectByContext(context: Uri): TreeObject {
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
    });
  }

  public async delete(item: TreeObject): Promise<void> {
    const array = await item.getParent().getChildren();
    array.splice(array.indexOf(item), 1);
    this.pathToObject.delete(item.path);
    this.contextToObject.delete(item.contextPath);
  }

  public deleteContext(context: Uri): void {
    this.contextToSettings.delete(context);
  }
}
