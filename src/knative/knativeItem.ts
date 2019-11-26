/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { KnativeExplorer } from "../explorer";
import { window, QuickPickItem, TreeItemCollapsibleState } from "vscode";
import {
  ContextType,
  KnativeTreeObject,
  KnativeObjectImpl
} from "../kn/knativeTreeObject";
import { Kn, KnImpl } from "../kn/knController";
import { Validation } from './validation';

const errorMessage = {
  Project:
    "You need at least one Project available. Please create new OpenShift Project and try again.",
  Application:
    "You need at least one Application available. Please create new OpenShift Application and try again.",
  Component:
    "You need at least one Component available. Please create new OpenShift Component and try again.",
  OsService:
    "You need at least one OsService available. Please create new OpenShift OsService and try again.",
  Service:
    "You need at least one Service available. Please create new Knative OsService and try again.",
  Storage:
    "You need at least one Storage available. Please create new OpenShift Storage and try again.",
  Route:
    "You need to add one URL to the component. Please create a new URL and try again."
};

export class QuickPickCommand implements QuickPickItem {
  constructor(
    public label: string,
    public command: () => Promise<string>,
    public description?: string,
    public detail?: string,
    public picked?: boolean,
    public alwaysShow?: boolean,
    public getName?: () => string
  ) {}
}

function isCommand(item: QuickPickItem | QuickPickCommand): item is QuickPickCommand {
  return item["command"];
}

export abstract class KnativeItem {
  protected static readonly kn: Kn = KnImpl.Instance;
  protected static readonly explorer: KnativeExplorer = KnativeExplorer.getInstance();

  static validateUniqueName(data: Array<KnativeTreeObject>, value: string) {
    const knativeObject = data.find(
      knativeObject => knativeObject.getName() === value
    );
    return (
      knativeObject && `This name is already used, please enter different name.`
    );
  }

  static async getName(
    message: string,
    data: Array<KnativeTreeObject>,
    offset?: string
  ): Promise<string> {
    return await window.showInputBox({
      prompt: `Provide ${message}`,
      validateInput: (value: string) => {
        let validationMessage = Validation.emptyName(
          `Empty ${message}`,
          value.trim()
        );
        if (!validationMessage) {
          validationMessage = Validation.validateMatches(
            `Not a valid ${message}. Please use lower case alphanumeric characters or "-", start with an alphabetic character, and end with an alphanumeric character`,
            value
          );
        }
        if (!validationMessage) {
          validationMessage = Validation.lengthName(
            `${message} should be between 2-63 characters`,
            value,
            offset ? offset.length : 0
          );
        }
        if (!validationMessage) {
          validationMessage = KnativeItem.validateUniqueName(data, value);
        }
        return validationMessage;
      }
    });
  }

  static async getServiceNames(): Promise<KnativeTreeObject[]> {
    const serviceList: Array<KnativeTreeObject> = await KnativeItem.kn.getServices();
    if (serviceList.length === 0) {
      throw Error(errorMessage.Project);
    }
    return serviceList;
  }

  static async getProjectNames(): Promise<KnativeTreeObject[]> {
    const projectList: Array<KnativeTreeObject> = await KnativeItem.kn.getProjects();
    if (projectList.length === 0) {
      throw Error(errorMessage.Project);
    }
    return projectList;
  }

  static async getApplicationNames(
    project: KnativeTreeObject,
    createCommand: boolean = false
  ): Promise<Array<KnativeTreeObject | QuickPickCommand>> {
    const applicationList: Array<KnativeTreeObject> = await KnativeItem.kn.getApplications(
      project
    );
    if (applicationList.length === 0 && !createCommand) {
      throw Error(errorMessage.Component);
    }
    return createCommand
      ? [
          new QuickPickCommand(
            `$(plus) Create new Application...`,
            async () => {
              return await KnativeItem.getName(
                "Application name",
                applicationList
              );
            }
          ),
          ...applicationList
        ]
      : applicationList;
  }

  static async getComponentNames(
    application: KnativeTreeObject,
    condition?: (value: KnativeTreeObject) => boolean
  ) {
    const applicationList: Array<KnativeTreeObject> = await KnativeItem.kn.getComponents(
      application,
      condition
    );
    if (applicationList.length === 0) {
      throw Error(errorMessage.Component);
    }
    return applicationList;
  }

  static async getOsServiceNames(application: KnativeTreeObject) {
    const osServiceList: Array<KnativeTreeObject> = await KnativeItem.kn.getOsServices(
      application
    );
    if (osServiceList.length === 0) {
      throw Error(errorMessage.OsService);
    }
    return osServiceList;
  }

  static async getStorageNames(component: KnativeTreeObject) {
    const storageList: Array<KnativeTreeObject> = await KnativeItem.kn.getStorageNames(
      component
    );
    if (storageList.length === 0) {
      throw Error(errorMessage.Storage);
    }
    return storageList;
  }

  static async getRoutes(component: KnativeTreeObject) {
    const urlList: Array<KnativeTreeObject> = await KnativeItem.kn.getRoutes(
      component
    );
    if (urlList.length === 0) {
      throw Error(errorMessage.Route);
    }
    return urlList;
  }

  static async getKnativeCmdData(
    treeItem: KnativeTreeObject,
    projectPlaceholder: string,
    appPlaceholder?: string,
    compPlaceholder?: string,
    condition?: (value: KnativeTreeObject) => boolean
  ) {
    let context: KnativeTreeObject | QuickPickCommand = treeItem;
    let project: KnativeTreeObject;
    if (!context) {
      context = await window.showQuickPick(KnativeItem.getProjectNames(), {
        placeHolder: projectPlaceholder
      });
    }
    if (
      context &&
      context.contextValue === ContextType.PROJECT &&
      appPlaceholder
    ) {
      project = context as KnativeTreeObject;
      context = await window.showQuickPick<KnativeTreeObject | QuickPickCommand>(
        KnativeItem.getApplicationNames(
          project,
          appPlaceholder.includes("create") && compPlaceholder === undefined
        ),
        { placeHolder: appPlaceholder }
      );
      if (context && isCommand(context)) {
        const newAppName = await context.command();
        if (newAppName) {
          context = new KnativeObjectImpl(
            project,
            newAppName,
            ContextType.APPLICATION,
            false,
            KnImpl.Instance,
            TreeItemCollapsibleState.Collapsed
          );
        } else {
          context = null;
        }
      }
    }
    if (
      context &&
      !isCommand(context) &&
      context.contextValue === ContextType.APPLICATION &&
      compPlaceholder
    ) {
      context = await window.showQuickPick(
        KnativeItem.getComponentNames(context as KnativeTreeObject, condition),
        { placeHolder: compPlaceholder }
      );
    }
    return context as KnativeTreeObject;
  }
}
