/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Uri, workspace, WorkspaceFolder } from 'vscode';
import * as path from 'path';
import yaml = require('js-yaml');
import fs = require('fs');
import * as kn from './config';
import { ComponentSettings } from './config';
import { KnativeTreeObject } from './knativeTreeObject';
import { KnImpl } from './knController';

export class KnativeTreeModel {
    private parentToChildren: Map<KnativeTreeObject, KnativeTreeObject[]> = new Map();
    private pathToObject = new Map<string, KnativeTreeObject>();
    private contextToObject = new Map<Uri, KnativeTreeObject>();
    private contextToSettings = new Map<Uri, ComponentSettings>();

    public setParentToChildren(parent: KnativeTreeObject, children: KnativeTreeObject[]): KnativeTreeObject[] {
        if (!this.parentToChildren.has(parent)) {
            this.parentToChildren.set(parent, children);
        }
        return children;
    }

    public getChildrenByParent(parent: KnativeTreeObject) {
        return this.parentToChildren.get(parent);
    }

    public clearTreeData() {
        this.parentToChildren.clear();
        this.pathToObject.clear();
        this.contextToObject.clear();
        this.addContexts(workspace.workspaceFolders? workspace.workspaceFolders : []);
    }

    public setPathToObject(object: KnativeTreeObject) {
        if (!this.pathToObject.get(object.path)) {
            this.pathToObject.set(object.path, object);
        }
    }

    public getObjectByPath(path: string): KnativeTreeObject {
        return this.pathToObject.get(path);
    }

    public setContextToObject(object: KnativeTreeObject) {
        if (object.contextPath) {
            if (!this.contextToObject.has(object.contextPath)) {
                this.contextToObject.set(object.contextPath, object );
            }
        }
    }

    public getObjectByContext(context: Uri) {
        return this.contextToObject.get(context);
    }

    public setContextToSettings (settings: ComponentSettings) {
        if (!this.contextToSettings.has(settings.ContextPath)) {
            this.contextToSettings.set(settings.ContextPath, settings);
        }
    }

    public getSettingsByContext(context: Uri) {
        return this.contextToSettings.get(context);
    }

    public getSettings(): kn.ComponentSettings[] {
        return Array.from(this.contextToSettings.values());
    }

    public addContexts(folders: ReadonlyArray<WorkspaceFolder>) {
        for (const folder of folders) {
            try {
                const compData = yaml.safeLoad(fs.readFileSync(path.join(folder.uri.fsPath, '.kn', 'config.yaml'), 'utf8')) as kn.Config;
                compData.ComponentSettings.ContextPath = folder.uri;
                KnImpl.data.setContextToSettings(compData.ComponentSettings);
            } catch (ignore) {
            }
        }
    }

    public async delete(item: KnativeTreeObject): Promise<void> {
        const array = await item.getParent().getChildren();
        array.splice(array.indexOf(item), 1);
        this.pathToObject.delete(item.path);
        this.contextToObject.delete(item.contextPath);
    }

    public deleteContext(context: Uri) {
        this.contextToSettings.delete(context);
    }
}
