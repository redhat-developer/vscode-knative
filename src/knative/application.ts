/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { window } from 'vscode';
import KnativeItem from './knativeItem';
import KnAPI from '../kn/kn-api';
import { KnativeTreeObject } from '../kn/knativeTreeObject';
import Progress from '../util/progress';

export default class Application extends KnativeItem {

    static async describe(treeItem: KnativeTreeObject): Promise<void> {
        const application = await Application.getKnativeCmdData(treeItem,
            "From which project you want to describe Application",
            "Select Application you want to describe");
        if (application) { Application.kn.executeInTerminal(KnAPI.describeApplication(application.getParent().getName(), application.getName())); }
    }

    static async del(treeItem: KnativeTreeObject): Promise<string> {
        const application = await Application.getKnativeCmdData(treeItem,
            "From which Project you want to delete Application",
            "Select Application to delete");
        if (application) {
            const appName = application.getName();
            const value = await window.showWarningMessage(`Do you want to delete Application '${appName}?'`, 'Yes', 'Cancel');
            if (value === 'Yes') {
                return Progress.execFunctionWithProgress(`Deleting the Application '${appName}'`, () => Application.kn.deleteApplication(application))
                    .then(() => `Application '${appName}' successfully deleted`)
                    .catch((err) => Promise.reject(`Failed to delete Application with error '${err}'`));
            }
        }
        return null;
    }
}
