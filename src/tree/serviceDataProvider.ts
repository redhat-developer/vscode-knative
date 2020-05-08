/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Event, ProviderResult, EventEmitter, TreeDataProvider, TreeItem, TreeItemCollapsibleState, window } from 'vscode';
import * as validator from 'validator';
import { TreeObject, KnativeTreeObject, compareNodes } from './knativeTreeObject';
import { KnExecute, loadItems } from '../kn/knExecute';
import { CliExitData } from '../kn/knCli';
import { KnAPI } from '../kn/kn-api';
import { ContextType } from '../kn/config';
import { Service, CreateService } from '../knative/service';
import { Revision } from '../knative/revision';
import { KnativeServices } from '../knative/knativeServices';

export class ServiceDataProvider implements TreeDataProvider<TreeObject> {

  public knExecutor = new KnExecute();

  private onDidChangeTreeDataEmitter: EventEmitter<TreeObject | undefined | null> = new EventEmitter<
    TreeObject | undefined | null
  >();

  readonly onDidChangeTreeData: Event<TreeObject | undefined | null> = this.onDidChangeTreeDataEmitter.event;

  // eslint-disable-next-line no-useless-constructor
  public constructor() {
    // do something if needed, but this is private for the singleton
  }

  refresh(target?: TreeObject): void {
    this.onDidChangeTreeDataEmitter.fire(target);
  }

  /**
   * Get the UI representation of the TreeObject.
   *
   * Required to fulfill the `TreeDataProvider` API.
   * @param element TreeObject
   */
  // eslint-disable-next-line class-methods-use-this
  getTreeItem(element: TreeObject): TreeItem | Thenable<TreeItem> {
    return element;
  }

  /**
   * When the user opens the Tree View, the getChildren method will be called without
   * an element. From there, your TreeDataProvider should return your top-level tree
   * items. getChildren is then called for each of your top-level tree items, so that
   * you can provide the children of those items.
   *
   * Get the children of the TreeObject passed in or get the root if none is passed in.
   *
   * Required to fulfill the `TreeDataProvider` API.
   *
   * @param element TreeObject
   */
  getChildren(element?: TreeObject): ProviderResult<TreeObject[]> {
    let children: ProviderResult<TreeObject[]>;
    if (element) {
      if (element.contextValue === 'service') {
        children = this.getRevisions(element);
      } else {
        children = element.getChildren();
      }
    } else {
      children = this.getServices() as ProviderResult<TreeObject[]>;
    }
    // eslint-disable-next-line no-console
    return children;
  }

  // eslint-disable-next-line class-methods-use-this
  getParent?(element: TreeObject): TreeObject {
    return element.getParent();
  }


  private ksvc: KnativeServices = KnativeServices.Instance;

  private readonly knLoginMessages = [
    'Please log in to the cluster',
    'the server has asked for the client to provide credentials',
    'Please login to your server',
    'Unauthorized',
  ];


  public ROOT: TreeObject = new KnativeTreeObject(undefined, undefined, '/', undefined, undefined);

  /**
   * The Revision is a child of Service. Every update makes a new Revision.
   * Fetch the Revisions and associate them with their parent Services.
   */
  public async getRevisions(parentService: TreeObject): Promise<TreeObject[]> {
    const revisionTreeObjects: TreeObject[] = await this._getRevisions(parentService);
    return revisionTreeObjects;
  }

  private async _getRevisions(parentService: TreeObject): Promise<TreeObject[]> {
    const result: CliExitData = await this.knExecutor.execute(KnAPI.listRevisionsForService(parentService.getName()));
    const revisions: Revision[] = this.ksvc.addRevisions(loadItems(result).map((value) => Revision.toRevision(value)));

    if (revisions.length === 0) {
      // If there are no Revisions then there is either no Service or an error.
      return;
    }

    // Create the Service tree item for each one found.
    const revisionTreeObjects: TreeObject[] = revisions
      .map<TreeObject>((value) => {
        const obj: TreeObject = new KnativeTreeObject(
          parentService,
          value,
          value.name,
          ContextType.REVISION,
          TreeItemCollapsibleState.None,
          null,
          null,
        );
        // this.data.setPathToObject(obj);
        return obj;
      })
      .sort(compareNodes);
    return revisionTreeObjects;
  }

  /**
   * The Service is the highest level of the tree for Knative. This method sets it at the root if not already done.
   */
  public async getServices(): Promise<TreeObject[]> {
    const children = await this._getServices();
    if (children.length === 1 && children[0].label === 'No Service Found') {
      return children;
    }
    return children;
  }

  private async _getServices(): Promise<TreeObject[]> {
    // Get the raw data from the cli call.
    const result: CliExitData = await this.knExecutor.execute(KnAPI.listServices());
    const services: Service[] = this.ksvc.addServices(loadItems(result).map((value) => Service.toService(value)));
    // Pull out the name of the service from the raw data.
    // Create an empty state message when there is no Service.
    if (services.length === 0) {
      return [
        new KnativeTreeObject(
          null,
          null,
          'No Service Found',
          ContextType.SERVICE,
          TreeItemCollapsibleState.Collapsed,
          null,
          null,
        ),
      ];
    }
    // Create the Service tree item for each one found.
    return services
      .map<TreeObject>((value) => {
        const obj: TreeObject = new KnativeTreeObject(
          null,
          value,
          value.name,
          ContextType.SERVICE,
          TreeItemCollapsibleState.Expanded,
          null,
          null,
        );
        return obj;
      })
      .sort(compareNodes);
  }


  public async deleteService(service: TreeObject): Promise<void>{
    await this.knExecutor.execute(KnAPI.deleteServices(service.getName()));
    this.refresh();
  }

  // eslint-disable-next-line class-methods-use-this
  validateUrl(message: string, value: string): string | null {
    return validator.default.isURL(value) ? null : message;
  }

  // eslint-disable-next-line class-methods-use-this
  async getUrl(): Promise<string | null> {
    // const createUrl: QuickPickItem = { label: `$(plus) Provide new URL...` };
    // const clusterItems: QuickPickItem[] = [{ label: 'invinciblejai/tag-portal-v1' }];
    // const choice = await window.showQuickPick([createUrl, ...clusterItems], {
    //   placeHolder: 'Provide Image URL to connect',
    //   ignoreFocusOut: true,
    // });
    // if (!choice) {
    //   return null;
    // }
    // return choice.label === createUrl.label
    //   ? window.showInputBox({
    //       ignoreFocusOut: true,
    //       prompt: 'Enter an Image URL',
    //       validateInput: (value: string) => serviceDataProvider.validateUrl('Invalid URL provided', value),
    //     })
    //   : choice.label;
    return window.showInputBox({
      ignoreFocusOut: true,
      prompt: 'Enter an Image URL',
      // validateInput: (value: string) => serviceDataProvider.validateUrl('Invalid URL provided', value),
    });
  }

  // eslint-disable-next-line class-methods-use-this
  private async getName(image: string): Promise<CreateService | null> {
    const imageSplit: string[] = image.split('/');
    const imageName: string = imageSplit[imageSplit.length - 1];
    let force = false;

    const name: string = await window.showInputBox({
      value: imageName,
      ignoreFocusOut: true,
      prompt: 'Enter a Name for the Service',
      validateInput: async (nameUsed: string) => {
        const found: Service = this.ksvc.findServices(nameUsed);
        if (found) {
          const response = await window.showInformationMessage(
            `That name has already been used. Do you want to overwrite the Service?`,
            { modal: true },
            'Yes',
            'No',
          );
          if (response === 'Yes') {
            force = true;
            return null;
          }
          return 'Please use a unique name.';
        }
        return null;
      },
    });
    if (!name) {
      return null;
    }
    if (name === imageName && !force) {
      return null;
    }
    const service: CreateService = { name, image, force };
    return service;
  }

  public async addService(): Promise<TreeObject[]> {
    const image: string = await this.getUrl();

    if (!image) {
      return null;
    }

    const servObj: CreateService = await this.getName(image);

    if (!servObj.name) {
      return null;
    }

    // Get the raw data from the cli call.
    const result: CliExitData = await this.knExecutor.execute(KnAPI.createService(servObj));
    const service: Service = new Service(servObj.name, servObj.image);

    this.ksvc.addService(service);

    if (result.error) {
      // TODO: handle the error
      // check the kind of errors we can get back
    }
    this.refresh();
    // return this.insertAndRevealService(createKnObj(servObj.name));
  }

  public async requireLogin(): Promise<boolean> {
    const result: CliExitData = await this.knExecutor.execute(KnAPI.printKnVersion(), process.cwd(), false);
    return this.knLoginMessages.some((msg) => result.stderr.includes(msg));
  }

}
