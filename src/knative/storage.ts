/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { window } from 'vscode';
import { isEmpty } from "validator";
import KnativeItem from "./knativeItem";
import Progress from "../util/progress";
import { KnativeTreeObject } from '../kn/knativeTreeObject';
import { ContextType } from '../kn/config';

export default class Storage extends KnativeItem {
    static async create(context: KnativeTreeObject): Promise<string> {
        const component = await Storage.getKnativeCmdData(context,
            "In which Project you want to create a Storage",
            "In which Application you want to create a Storage",
            "In which Component you want to create a Storage",
            (value: KnativeTreeObject) => value.contextValue === ContextType.COMPONENT_PUSHED);
        if (!component) { return null; }
        const storageList: Array<KnativeTreeObject> = await KnativeItem.kn.getStorageNames(component);
        const storageName = await Storage.getName('Storage name', storageList);

        if (!storageName) { return null; }

        const mountPath = await window.showInputBox({prompt: "Specify the mount path", validateInput: (value: string) => {
            if (isEmpty(value.trim())) {
                return 'Invalid mount path';
            }
        }});
        if (!mountPath) { return null; }

        const storageSize = await window.showQuickPick(['1Gi', '1.5Gi', '2Gi'], {placeHolder: 'Select the Storage size'});
        if (!storageSize) { return null; }

        return Progress.execFunctionWithProgress(`Creating the Storage '${component.getName()}'`, () => Storage.kn.createStorage(component, storageName, mountPath, storageSize))
            .then(() => `Storage '${storageName}' successfully created for Component '${component.getName()}'`)
            .catch((err) => Promise.reject(`New Storage command failed with error: '${err}'!`));
    }

    static async del(treeItem: KnativeTreeObject): Promise<string> {
        let storage = treeItem;
        const component = await Storage.getKnativeCmdData(storage,
            "From which Project you want to delete Storage",
            "From which Application you want to delete Storage",
            "From which Component you want to delete Storage");
        if (!storage && component) { storage = await window.showQuickPick(Storage.getStorageNames(component), {placeHolder: "Select Storage to delete"}); }
        if (storage) {
            const value = await window.showWarningMessage(`Do you want to delete Storage '${storage.getName()}' from Component '${storage.getParent().getName()}'?`, 'Yes', 'Cancel');
            if (value === 'Yes') {
                return Progress.execFunctionWithProgress(`Deleting Storage ${storage.getName()} from Component ${component.getName()}`, () => Storage.kn.deleteStorage(storage))
                    .then(() => `Storage '${storage.getName()}' from Component '${storage.getParent().getName()}' successfully deleted`)
                    .catch((err) => Promise.reject(`Failed to delete Storage with error '${err}'`));
            }
        }
        return null;
    }
}
