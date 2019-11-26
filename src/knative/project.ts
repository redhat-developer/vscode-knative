/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { KnativeItem } from './knativeItem';
import { Progress } from '../util/progress';
import { window } from 'vscode';
import { KnativeTreeObject } from '../kn/knativeTreeObject';

export class Project extends KnativeItem {

    static async create(): Promise<string> {
        const projectList: Array<KnativeTreeObject> = await KnativeItem.kn.getProjects();
        let projectName = await Project.getName('Project name', projectList);
        if (!projectName) { return null; }
        projectName = projectName.trim();
        return Project.kn.createProject(projectName)
            .then(() => `Project '${projectName}' successfully created`)
            .catch((error) => Promise.reject(`Failed to create Project with error '${error}'`));
    }

    static async del(context: KnativeTreeObject): Promise<string> {
        let result: Promise<string> = null;
        const project = await Project.getKnativeCmdData(context,
            "Select Project to delete"
        );
        if (project) {
            const value = await window.showWarningMessage(`Do you want to delete Project '${project.getName()}'?`, 'Yes', 'Cancel');
            if (value === 'Yes') {
                result = Progress.execFunctionWithProgress(`Deleting Project '${project.getName()}'`,
                    () => Project.kn.deleteProject(project)
                        .then(() => `Project '${project.getName()}' successfully deleted`)
                        .catch((err) => Promise.reject(`Failed to delete Project with error '${err}'`))
                );
            }
        }
        return result;
    }
}