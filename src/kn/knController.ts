/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { TreeItemCollapsibleState } from 'vscode';
import { Subject } from 'rxjs';
import { ContextType } from './config';
import KnAPI from './kn-api';
import KnativeTreeObject, { KnativeObject } from './knativeTreeObject';
import { KnativeEvent } from './knativeTreeEvent';
import KnativeTreeModel from './knativeTreeModel';
import { execute } from './knExecute';
import { CliExitData } from './knCli';

// import bs = require('binary-search');

export function loadItems(result: CliExitData): any[] {
  let data: any[] = [];
  try {
    const { items } = JSON.parse(result.stdout);
    if (items) {
      data = items;
    }
  } catch (ignore) {
    // do nothing
  }
  return data;
}

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

export interface Kn {
  getServices(): Promise<KnativeObject[]>;
  requireLogin(): Promise<boolean>;
  clearCache?(): void;
  readonly subject: Subject<KnativeEvent>;
}

export class KnController implements Kn {
  public static data: KnativeTreeModel = new KnativeTreeModel();

  public static ROOT: KnativeObject = new KnativeTreeObject(
    undefined,
    '/',
    undefined,
    false,
    undefined,
  );

  private readonly CONTEXT_DATA = {
    revision: {
      icon: 'service-node.png',
      tooltip: 'Revision: {label}',
      getChildren: (): undefined[] => [],
    },
    service: {
      icon: 'service-node.png',
      tooltip: 'Service: {label}',
      getChildren: (): undefined[] => [],
    },
    clusterDown: {
      icon: 'cluster-down.png',
      tooltip: 'Cannot connect to the cluster',
      getChildren: (): undefined[] => [],
    },
    loginRequired: {
      icon: 'cluster-down.png',
      tooltip: 'Please Log in to the cluster',
      getChildren: (): undefined[] => [],
    },
  };

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

  async getServices(): Promise<KnativeObject[]> {
    let children = KnController.data.getChildrenByParent(KnController.ROOT);
    if (!children) {
      children = KnController.data.setParentToChildren(KnController.ROOT, await this._getServices());
    }
    return children;
  }

  public async _getServices(): Promise<KnativeObject[]> {
    const result: CliExitData = await execute(KnAPI.listServices());
    const services: string[] = loadItems(result).map((value) => value.metadata.name);
    if (services.length === 0) {services[0] = 'No Service found'}
    return services
      .map<KnativeObject>((value) => {
        const obj: KnativeObject = new KnativeTreeObject(
          null,
          value,
          ContextType.SERVICE,
          false,
          this.CONTEXT_DATA,
          TreeItemCollapsibleState.Expanded,
        );
        KnController.data.setPathToObject(obj);
        return obj;
      })
      .sort(compareNodes);
  }

  public async requireLogin(): Promise<boolean> {
    const result: CliExitData = await execute(
      KnAPI.printKnVersion(),
      process.cwd(),
      false,
    );
    return this.knLoginMessages.some((msg) => result.stderr.includes(msg));
  }

  // eslint-disable-next-line class-methods-use-this
  // private insert(array: KnativeObject[], item: KnativeObject): KnativeObject {
  //   const i = bs(array, item, compareNodes);
  //   array.splice(Math.abs(i) - 1, 0, item);
  //   return item;
  // }

  // private async insertAndReveal(item: KnativeObject): Promise<KnativeObject> {
  //   // await KnativeExplorer.getInstance().reveal(this.insert(await item.getParent().getChildren(), item));
  //   this.subject.next(
  //     new KnatvieTreeEvent(
  //       'inserted',
  //       this.insert(await item.getParent().getChildren(), item),
  //       true,
  //     ),
  //   );
  //   return item;
  // }

  // private async insertAndRefresh(item: KnativeObject): Promise<KnativeObject> {
  //   // await KnativeExplorer.getInstance().refresh(this.insert(await item.getParent().getChildren(), item).getParent());
  //   this.subject.next(
  //     new KnatvieTreeEvent(
  //       'changed',
  //       this.insert(await item.getParent().getChildren(), item).getParent(),
  //     ),
  //   );
  //   return item;
  // }

  // private deleteAndRefresh(item: KnativeObject): KnativeObject {
  //   KnController.data.delete(item);
  //   // KnativeExplorer.getInstance().refresh(item.getParent());
  //   this.subject.next(new KnatvieTreeEvent('changed', item.getParent()));
  //   return item;
  // }

  // eslint-disable-next-line class-methods-use-this
  clearCache(): void {
    KnController.data.clearTreeData();
  }
}

export function getInstance(): Kn {
  return KnController.Instance;
}
