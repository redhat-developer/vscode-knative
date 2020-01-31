/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { TreeItemCollapsibleState } from 'vscode';
import { Subject } from 'rxjs';
import { ContextType } from './config';
import KnAPI from './kn-api';
import KnativeObjectImpl, { KnativeTreeObject } from './knativeTreeObject';
import KnatvieTreeEventImpl, { KnatvieTreeEvent } from './knativeTreeEvent';
import KnativeTreeModel from './knativeTreeModel';
import { execute } from './knExecute';
import KnCli, { Cli, CliExitData } from './knCli';

import bs = require('binary-search');

const { Collapsed } = TreeItemCollapsibleState;

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

export interface Kn {
  getServices(): Promise<KnativeTreeObject[]>;
  requireLogin(): Promise<boolean>;
  clearCache?(): void;
  readonly subject: Subject<KnatvieTreeEvent>;
}

function compareNodes(a: KnativeTreeObject, b: KnativeTreeObject): number {
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

export class KnImpl implements Kn {
  public static data: KnativeTreeModel = new KnativeTreeModel();

  public static ROOT: KnativeTreeObject = new KnativeObjectImpl(
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

  private static cli: Cli = KnCli.getInstance();

  private static instance: Kn;

  private readonly knLoginMessages = [
    'Please log in to the cluster',
    'the server has asked for the client to provide credentials',
    'Please login to your server',
    'Unauthorized',
  ];

  private subjectInstance: Subject<KnatvieTreeEvent> = new Subject<KnatvieTreeEvent>();

  public static get Instance(): Kn {
    if (!KnImpl.instance) {
      KnImpl.instance = new KnImpl();
    }
    return KnImpl.instance;
  }

  get subject(): Subject<KnatvieTreeEvent> {
    return this.subjectInstance;
  }

  async getServices(): Promise<KnativeTreeObject[]> {
    let children = KnImpl.data.getChildrenByParent(KnImpl.ROOT);
    if (!children) {
      children = KnImpl.data.setParentToChildren(KnImpl.ROOT, await this._getServices());
    }
    return children;
  }

  public async _getServices(): Promise<KnativeTreeObject[]> {
    const result: CliExitData = await execute(KnAPI.listServices());
    const services: string[] = loadItems(result).map((value) => value.metadata.name);
    return services
      .map<KnativeTreeObject>((value) => {
        const obj: KnativeTreeObject = new KnativeObjectImpl(
          null,
          value,
          ContextType.SERVICE,
          false,
          this.CONTEXT_DATA,
          TreeItemCollapsibleState.Expanded,
        );
        KnImpl.data.setPathToObject(obj);
        return obj;
      })
      .sort(compareNodes);
  }

  public async requireLogin(): Promise<boolean> {
    const result: CliExitData = await execute(
      KnAPI.printKnVersionAndProjects(),
      process.cwd(),
      false,
    );
    return this.knLoginMessages.some((msg) => result.stderr.includes(msg));
  }

  // eslint-disable-next-line class-methods-use-this
  private insert(array: KnativeTreeObject[], item: KnativeTreeObject): KnativeTreeObject {
    const i = bs(array, item, compareNodes);
    array.splice(Math.abs(i) - 1, 0, item);
    return item;
  }

  private async insertAndReveal(item: KnativeTreeObject): Promise<KnativeTreeObject> {
    // await KnativeExplorer.getInstance().reveal(this.insert(await item.getParent().getChildren(), item));
    this.subject.next(
      new KnatvieTreeEventImpl(
        'inserted',
        this.insert(await item.getParent().getChildren(), item),
        true,
      ),
    );
    return item;
  }

  private async insertAndRefresh(item: KnativeTreeObject): Promise<KnativeTreeObject> {
    // await KnativeExplorer.getInstance().refresh(this.insert(await item.getParent().getChildren(), item).getParent());
    this.subject.next(
      new KnatvieTreeEventImpl(
        'changed',
        this.insert(await item.getParent().getChildren(), item).getParent(),
      ),
    );
    return item;
  }

  private deleteAndRefresh(item: KnativeTreeObject): KnativeTreeObject {
    KnImpl.data.delete(item);
    // KnativeExplorer.getInstance().refresh(item.getParent());
    this.subject.next(new KnatvieTreeEventImpl('changed', item.getParent()));
    return item;
  }

  // eslint-disable-next-line class-methods-use-this
  clearCache(): void {
    KnImpl.data.clearTreeData();
  }
}

export function getInstance(): Kn {
  return KnImpl.Instance;
}
