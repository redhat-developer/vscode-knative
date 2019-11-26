/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { KnativeItem } from './knativeItem';
import { window } from 'vscode';
import { Progress } from '../util/progress';
import { Platform } from '../util/platform';
import { KnAPI } from '../kn/kn-api';
import { KnativeTreeObject } from '../kn/knativeTreeObject';
import { Validation } from './validation';

export class Service extends KnativeItem {

    static list(): void {
        console.log('knative.service.ts');
        Service.kn.executeInTerminal(KnAPI.listServices(), Platform.getUserHomePath());
    }

    static async create(context: KnativeTreeObject): Promise<string>  {
        const application = await Service.getKnativeCmdData(context,
            "In which Project you want to create a Service",
            "In which Application you want to create a Service"
        );
        if (!application) { return null; }
        const serviceTemplateName = await window.showQuickPick(Service.kn.getServiceTemplates(), {
            placeHolder: "Service Template Name",
            ignoreFocusOut: true
        });
        if (!serviceTemplateName) { return null; }
        const plans: string[] = await Service.kn.getServiceTemplatePlans(serviceTemplateName);
        let serviceTemplatePlanName: string;
        if (plans.length === 1) {
            serviceTemplatePlanName = plans[0];
        } else if (plans.length > 1) {
            serviceTemplatePlanName = await window.showQuickPick(plans, {
                placeHolder: "Service Template Plan Name"
            });
        } else {
            window.showErrorMessage('No Service Plans available for selected Service Template');
        }
        if (!serviceTemplatePlanName) { return null; }
        const serviceList: Array<KnativeTreeObject> = await KnativeItem.kn.getOsServices(application);
        const serviceName = await Service.getName('Service name', serviceList, application.getName());
        if (!serviceName) { return null; }
        return Progress.execFunctionWithProgress(`Creating a new Service '${serviceName}'`, () => Service.kn.createOSService(application, serviceTemplateName, serviceTemplatePlanName, serviceName.trim()))
            .then(() => `Service '${serviceName}' successfully created`)
            .catch((err) => Promise.reject(`Failed to create Service with error '${err}'`));
    }

    static async del(treeItem: KnativeTreeObject): Promise<string> {
        let service = treeItem;

        if (!service) {
            const application: KnativeTreeObject = await Service.getKnativeCmdData(service,
                "From which Project you want to delete Service",
                "From which Application you want to delete Service"
            );
            if (application) {
                service = await window.showQuickPick(Service.getOsServiceNames(application), {placeHolder: "Select Service to delete"});
            }
        }
        if (service) {
            const answer = await window.showWarningMessage(`Do you want to delete Service '${service.getName()}'?`, 'Yes', 'Cancel');
            if (answer === 'Yes') {
                return Progress.execFunctionWithProgress(`Deleting Service '${service.getName()}' from Application '${service.getParent().getName()}'`, (progress) => Service.kn.deleteService(service))
                    .then(() => `Service '${service.getName()}' successfully deleted`)
                    .catch((err) => Promise.reject(`Failed to delete Service with error '${err}'`));
            }
        }
        return null;
    }

    static async describe(context: KnativeTreeObject): Promise<void> {
        let service = context;

        if (!service) {
            const application: KnativeTreeObject = await Service.getKnativeCmdData(context,
                "From which project you want to describe Service",
                "From which application you want to describe Service");
            if (application) {
                service = await window.showQuickPick(Service.getOsServiceNames(application), {placeHolder: "Select Service you want to describe"});
            }
        }
        if (service) {
            const template = await Service.getTemplate(service);
            if (template) {
                Service.kn.executeInTerminal(KnAPI.describeService(template), Platform.getUserHomePath());
            } else {
                throw Error(`Cannot get Service Type name for Service \'${service.getName()}\'`);
            }
        }
    }

    static async getTemplate(service: KnativeTreeObject): Promise<string> {
        const result = await Service.kn.execute(KnAPI.getServiceTemplate(service.getParent().getParent().getName(), service.getName()));
        return result.stdout.trim();
    }
}