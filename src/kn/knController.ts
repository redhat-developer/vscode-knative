/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import {
  TreeItemCollapsibleState,
  InputBoxOptions,
  window
  // WorkspaceFoldersChangeEvent,
  // WorkspaceFolder,
  // workspace,
} from 'vscode';
import { Subject } from 'rxjs';
import { ContextType } from './config';
import KnAPI, { CreateService } from './kn-api';
import KnativeTreeObject, { KnativeObject } from './knativeTreeObject';
import KnativeTreeEvent, { KnativeEvent } from './knativeTreeEvent';
import KnativeTreeModel from './knativeTreeModel';
import { execute } from './knExecute';
import { CliExitData } from './knCli';
import Service from '../knative/service';

// import bs = require('binary-search');

function compareNodes(a: KnativeObject, b: KnativeObject): number {
  if (!a.contextValue) {
    return -1;
  }
  if (!b.contextValue) {
    return 1;
  }
  const acontext = a.contextValue.includes('_')
    ? a.contextValue.substr(0, a.contextValue.indexOf('_'))
    : a.contextValue;
  const bcontext = b.contextValue.includes('_')
    ? b.contextValue.substr(0, b.contextValue.indexOf('_'))
    : b.contextValue;
  const t = acontext.localeCompare(bcontext);
  return t || a.label.localeCompare(b.label);
}

/**
 * Insert a knative object into the array of knative objects.
 *
 * @param array
 * @param item
 * @returns knative object being added to the array
 */
// function insert(array: KnativeObject[], item: KnativeObject): KnativeObject {
//   const i = bs(array, item, compareNodes);
//   array.splice(Math.abs(i) - 1, 0, item);
//   return item;
// }

export interface Kn {
  getServices(): Promise<KnativeObject[]>;
  addService(): Promise<KnativeObject>;
  requireLogin(): Promise<boolean>;
  clearCache?(): void;
  readonly subject: Subject<KnativeEvent>;
}

export class KnController implements Kn {
  public static data: KnativeTreeModel = new KnativeTreeModel();

  public static ROOT: KnativeObject = new KnativeTreeObject(
    undefined,
    undefined,
    '/',
    undefined,
    false,
    undefined,
  );


  private static instance: Kn;

  private readonly knLoginMessages = [
    'Please log in to the cluster',
    'the server has asked for the client to provide credentials',
    'Please login to your server',
    'Unauthorized',
  ];

  private subjectInstance: Subject<KnativeEvent> = new Subject<KnativeEvent>();

  public static get Instance(): Kn {
    if (!KnController.instance) {
      KnController.instance = new KnController();
    }
    return KnController.instance;
  }

  get subject(): Subject<KnativeEvent> {
    return this.subjectInstance;
  }

  /**
   * The Service is the root level of the tree for Knative. This method sets it as the root if not already done.
   */
  public async getServices(): Promise<KnativeObject[]> {
    // If the ROOT has already been set then return it.
    // If not then the initial undefined version is returned.
    let children = KnController.data.getChildrenByParent(KnController.ROOT);
    // IF there is no ROOT then get the services and make them the ROOT.
    if (!children) {
      children = KnController.data.setParentToChildren(
        KnController.ROOT,
        await this._getServices(),
      );
    }
    // this.addService(`foo1`, `invinciblejai/tag-portal-v1`);
    return children;
  }

  // eslint-disable-next-line class-methods-use-this
  private async _getServices(): Promise<KnativeObject[]> {
    // Get the raw data from the cli call.
    const services = await Service.list();
    // Pull out the name of the service from the raw data.
    // Create an empty state message when there is no Service.
    if (services.length === 0) {
      return [new KnativeTreeObject(
        null,
        null,
        'No Service Found',
        ContextType.SERVICE,
        false,
        TreeItemCollapsibleState.Expanded,
        null, null
      )];
    }
    // Create the Service tree item for each one found.
    return services
      .map<KnativeObject>((value) => {
        const obj: KnativeObject = new KnativeTreeObject(
          null,
          value,
          value.name,
          ContextType.SERVICE,
          false,
          TreeItemCollapsibleState.Collapsed,
          null, null
        );
        KnController.data.setPathToObject(obj);
        return obj;
      })
      .sort(compareNodes);
  }

  // private async insertAndReveal(item: KnativeObject): Promise<KnativeObject> {
  //   // await OpenShiftExplorer.getInstance().reveal(this.insert(await item.getParent().getChildren(), item));
  //   this.subject.next(
  //     new KnatvieTreeEvent('inserted', insert(await item.getParent().getChildren(), item), true),
  //   );
  //   return item;
  // }

  private insertAndRevealService(item: KnativeObject): KnativeObject {
    // await OpenShiftExplorer.getInstance().reveal(this.insert(await item.getParent().getChildren(), item));
    this.subject.next(new KnativeTreeEvent('inserted', item, true));
    return item;
  }

  // private async insertAndRefresh(item: KnativeObject): Promise<KnativeObject> {
  //   // await OpenShiftExplorer.getInstance().refresh(this.insert(await item.getParent().getChildren(), item).getParent());
  //   this.subject.next(
  //     new KnatvieTreeEvent(
  //       'changed',
  //       insert(await item.getParent().getChildren(), item).getParent(),
  //     ),
  //   );
  //   return item;
  // }

  private async deleteAndRefresh(item: KnativeObject): Promise<KnativeObject> {
    await KnController.data.delete(item);
    // OpenShiftExplorer.getInstance().refresh(item.getParent());
    this.subject.next(new KnativeTreeEvent('changed', item.getParent()));
    return item;
  }

  public async deleteService(service: KnativeObject): Promise<KnativeObject> {
    await execute(KnAPI.deleteServices(service.getName()));
    return this.deleteAndRefresh(service);
  }

  public async addService(): Promise<KnativeObject> {
    const options: InputBoxOptions = {
      prompt: 'New Service Name:',
      // placeHolder: '(placeholder)'
    };
    const urlOptions: InputBoxOptions = {
      prompt: 'Service Image URL:',
      // placeHolder: '(placeholder)'
    };

    let name: string;
    let image: string;
    await window.showInputBox(options).then((value) => {
      if (!value) {
        return;
      }
      name = value;
    });
    await window.showInputBox(urlOptions).then((value) => {
      if (!value) {
        return;
      }
      image = value;
    });
    const servObj: CreateService = { name, image };
    // Get the raw data from the cli call.
    const result: CliExitData = await execute(KnAPI.createService(servObj));
    if (result.error) {
      // TODO: handle the error
      // check the kind of errors we can get back
    }
    const knObj = (value: string): KnativeObject => {
      const obj: KnativeObject = new KnativeTreeObject(
        null,
        null,
        value,
        ContextType.SERVICE,
        false,
        TreeItemCollapsibleState.Collapsed,
      );
      KnController.data.setPathToObject(obj);
      return obj;
    };
    return this.insertAndRevealService(knObj(name));
  }

  public async requireLogin(): Promise<boolean> {
    const result: CliExitData = await execute(KnAPI.printKnVersion(), process.cwd(), false);
    return this.knLoginMessages.some((msg) => result.stderr.includes(msg));
  }

  // eslint-disable-next-line class-methods-use-this
  clearCache(): void {
    KnController.data.clearTreeData();
  }
}

export function getInstance(): Kn {
  return KnController.Instance;
}
