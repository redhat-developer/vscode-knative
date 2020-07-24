/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Event, ProviderResult, EventEmitter, TreeDataProvider, TreeItem, TreeItemCollapsibleState, window, Uri } from 'vscode';
import * as validator from 'validator';
import * as path from 'path';
import * as yaml from 'yaml';
import { KnativeTreeItem, compareNodes } from './knativeTreeItem';
import { Execute, loadItems } from '../cli/execute';
import { CliExitData } from '../cli/cmdCli';
import { KnAPI } from '../cli/kn-api';
import { KubectlAPI } from '../cli/kubectl-api';
import { ContextType } from '../cli/config';
import { Service, CreateService, UpdateService } from '../knative/service';
import { Revision, Items, Traffic } from '../knative/revision';
import { KnativeServices } from '../knative/knativeServices';
import { KnativeResourceVirtualFileSystemProvider, getFilePathAsync, vfsUri } from '../cli/virtualfs';
import { KnOutputChannel, OutputChannel } from '../output/knOutputChannel';

export class ServiceDataProvider implements TreeDataProvider<KnativeTreeItem> {
  public knExecutor = new Execute();

  public knvfs = new KnativeResourceVirtualFileSystemProvider();

  private knOutputChannel: OutputChannel = new KnOutputChannel();

  private onDidChangeTreeDataEmitter: EventEmitter<KnativeTreeItem | undefined | null> = new EventEmitter<
    KnativeTreeItem | undefined | null
  >();

  readonly onDidChangeTreeData: Event<KnativeTreeItem | undefined | null> = this.onDidChangeTreeDataEmitter.event;

  refresh(target?: KnativeTreeItem): void {
    this.onDidChangeTreeDataEmitter.fire(target);
  }

  /**
   * Display info in the Knative Output channel/window
   */
  showOutputChannel(): void {
    this.knOutputChannel.show();
  }

  /**
   * Get the UI representation of the TreeObject.
   *
   * Required to fulfill the `TreeDataProvider` API.
   * @param element TreeObject
   */
  // eslint-disable-next-line class-methods-use-this
  getTreeItem(element: KnativeTreeItem): TreeItem | Thenable<TreeItem> {
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
  getChildren(element?: KnativeTreeItem): ProviderResult<KnativeTreeItem[]> {
    let children: ProviderResult<KnativeTreeItem[]>;
    if (element) {
      if (element.contextValue === 'service') {
        children = this.getRevisions(element);
      } else if (element.getName() === 'No Service Found') {
        children = [];
      } else {
        children = element.getChildren();
      }
    } else {
      children = this.getServices() as ProviderResult<KnativeTreeItem[]>;
    }
    return children;
  }

  // eslint-disable-next-line class-methods-use-this
  getParent?(element: KnativeTreeItem): KnativeTreeItem {
    return element.getParent();
  }

  private ksvc: KnativeServices = KnativeServices.Instance;

  private readonly knLoginMessages = [
    'Please log in to the cluster',
    'the server has asked for the client to provide credentials',
    'Please login to your server',
    'Unauthorized',
  ];

  /**
   * The Revision is a child of Service. Every update makes a new Revision.
   * Fetch the Revisions and associate them with their parent Services.
   *
   * @param parentService
   */
  public async getRevisions(parentService: KnativeTreeItem): Promise<KnativeTreeItem[]> {
    const result: CliExitData = await this.knExecutor.execute(KnAPI.listRevisionsForService(parentService.getName()));

    const service: Service = parentService.getKnativeItem() as Service;
    const { traffic } = service.details.status;

    const revisions: Revision[] = this.ksvc.addRevisions(
      loadItems(result).map((value: Items) => {
        // get the revision name, check it against the list of traffic from the parent, then pass in the traffic if found
        const revisionTraffic: Traffic[] = traffic.filter((val): boolean => {
          return value.metadata.name === val.revisionName;
        });
        return Revision.toRevision(value, revisionTraffic);
      }),
    );

    // If there are no Revisions then there is either no Service or an error.
    if (revisions.length === 0) {
      return;
    }

    // Create the Revision tree item for each one found.
    const revisionTreeObjects: KnativeTreeItem[] = revisions.map<KnativeTreeItem>((value) => {
      let context = ContextType.REVISION;
      if (value.traffic && value.traffic.find((val) => val.tag)) {
        context = ContextType.REVISION_TAGGED;
      }

      const obj: KnativeTreeItem = new KnativeTreeItem(
        parentService,
        value,
        value.name,
        context,
        TreeItemCollapsibleState.None,
        null,
        null,
      );
      return obj;
    });
    return revisionTreeObjects;
  }

  /**
   * The Service is the highest level of the tree for Knative. This method sets it at the root if not already done.
   */
  public async getServices(): Promise<KnativeTreeItem[]> {
    // Get the raw data from the cli call.
    const result: CliExitData = await this.knExecutor.execute(KnAPI.listServices());
    const services: Service[] = this.ksvc.addServices(loadItems(result).map((value) => Service.toService(value)));
    // Pull out the name of the service from the raw data.
    // Create an empty state message when there is no Service.
    if (services.length === 0) {
      return [new KnativeTreeItem(null, null, 'No Service Found', ContextType.NONE, TreeItemCollapsibleState.None, null, null)];
    }
    // Convert the fetch Services into TreeItems
    const children = services
      .map<KnativeTreeItem>((value) => {
        const obj: KnativeTreeItem = new KnativeTreeItem(
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

    return children;
  }

  public async deleteFeature(node: KnativeTreeItem): Promise<void> {
    const response = await window.showInformationMessage(`Please confirm deletion.`, { modal: true }, 'Delete');
    if (response === 'Delete') {
      await this.knExecutor.execute(KnAPI.deleteFeature(node.contextValue, node.getName()));
      this.refresh();
      if (node.contextValue === 'service') {
        this.ksvc.removeService(node.getName());
      } else if (node.contextValue === 'revision') {
        this.ksvc.removeRevision(node.getName());
      }
      return null;
    }
    return null;
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
        const found: Service = this.ksvc.findService(nameUsed);
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

    const service: CreateService = { name, image, force };
    return service;
  }

  public async addService(): Promise<KnativeTreeItem[]> {
    const image: string = await this.getUrl();

    if (!image) {
      return null;
    }

    const servObj: CreateService = await this.getName(image);

    if (!servObj.name) {
      return null;
    }

    // Get the raw data from the cli call.
    // const result: CliExitData = await this.knExecutor.execute(KnAPI.createService(servObj));
    const service: Service = new Service(servObj.name, servObj.image);

    this.ksvc.addService(service);

    // *** As a hack, make a file for the yaml, use kubectl apply to create, then delete the file
    // Check the local files for the URL for YAML file
    const serviceName = servObj.name;
    const files = await this.knvfs.readDirectoryAsync();
    let filePath = '';
    files.forEach((loc): void => {
      // eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
      const fileName = loc[0].slice(loc[0].lastIndexOf(path.sep) + 1);
      if (fileName === `service-${serviceName}.yaml`) {
        [filePath] = loc;
      }
    });
    if (filePath === '') {
      // The file doesn't exist, so write it
      const newUri = vfsUri('service', serviceName, 'yaml');
      // eslint-disable-next-line prettier/prettier
      const stringContent = yaml.parse(`apiVersion: serving.knative.dev/v1\nkind: Service\nmetadata:\n  name: ${servObj.name}\nspec:\n  template:\n    spec:\n      containers:\n      - image: ${servObj.image}`);
      const yamlContent = yaml.stringify(stringContent);
      await this.knvfs.writeFile(newUri, Buffer.from(yamlContent, 'utf8'), {
        create: true,
        overwrite: false,
      });
      filePath = await getFilePathAsync('.knative', newUri.path);
      try {
        await this.knExecutor.execute(KubectlAPI.applyYAML(filePath, { override: true }));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log(`Error while using kubectl apply to create. ${err}`);
      }

      await this.knvfs.delete(Uri.file(filePath), { recursive: false });
    }
    // *** End Hack

    // if (result.error) {
    //   // TODO: handle the error
    //   // check the kind of errors we can get back
    // }
    this.refresh();
    // return this.insertAndRevealService(createKnObj(servObj.name));
  }

  public async addTag(node: KnativeTreeItem): Promise<KnativeTreeItem[]> {
    const tagName: string = await window.showInputBox({
      ignoreFocusOut: true,
      prompt: 'Enter a Tag name',
    });

    const revisionName = node.getName();
    const serviceName = node.getParent().getName();
    const tagContent = new Map([[revisionName, tagName]]);

    const servObj: UpdateService = { name: serviceName, tag: tagContent };

    if (!servObj.name) {
      return null;
    }

    // Get the raw data from the cli call.
    const result: CliExitData = await this.knExecutor.execute(KnAPI.updateService(servObj));
    const service: Service = new Service(servObj.name, servObj.image);

    this.ksvc.updateService(service);

    if (result.error) {
      // TODO: handle the error
      // check the kind of errors we can get back
    }
    this.refresh();
    // return this.insertAndRevealService(createKnObj(servObj.name));
  }

  public async getLocalYamlPathForNode(node: KnativeTreeItem): Promise<string> {
    // get local URL for YAML file
    const serviceName = node.getName();
    const files = await this.knvfs.readDirectoryAsync();
    let fileURI = '';
    files.forEach((loc): void => {
      // eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
      const fileName = loc[0].slice(loc[0].lastIndexOf(path.sep) + 1);
      if (fileName === `service-${serviceName}.yaml`) {
        [fileURI] = loc;
      }
    });
    return fileURI;
  }

  public async updateServiceFromYaml(node: KnativeTreeItem): Promise<void> {
    const fileURI = await this.getLocalYamlPathForNode(node);

    try {
      // push the updated YAML back to the cluster
      const result: CliExitData = await this.knExecutor.execute(KubectlAPI.applyYAML(fileURI, { override: false }));
      // Delete the yaml that was pushed if there was no error
      if (result.error) {
        // eslint-disable-next-line no-console
        console.log(`updateServiceFromYaml result.error = ${result.error}`);
        // deal with the error that is passed on but not thrown by the Promise.
        throw result.error;
      }
      if (typeof result.stdout === 'string' && result.stdout.search('unchanged') > 0) {
        // Delete the local YAML file that was uploaded.
        const response = await window.showInformationMessage(
          `The file is unchange.\nDo you want to delete the local copy?`,
          { modal: true },
          'Delete',
        );
        if (response === 'Delete') {
          this.knvfs.delete(Uri.file(fileURI), { recursive: false });
        }
      } else {
        // Delete the local YAML file that was uploaded.
        const response = await window.showInformationMessage(
          `The file was uploaded. Do you want to delete the local copy and download the updated version?`,
          { modal: true },
          'Delete',
        );
        if (response === 'Delete') {
          this.knvfs.delete(Uri.file(fileURI), { recursive: false });
        }
      }
      // eslint-disable-next-line no-console
      console.log(`updateServiceFromYaml result.stdout = ${result.stdout}`);
      // eslint-disable-next-line no-console
      console.log(`updateServiceFromYaml result.stderr = ${result.stderr}`);
      // eslint-disable-next-line no-console
      console.log(`updateServiceFromYaml result.error = ${result.error}`);
    } catch (error) {
      if (typeof error === 'string' && error.search('validation failed') > 0) {
        // eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
        const fileName = error.slice(error.lastIndexOf('validation failed:'));
        window.showErrorMessage(
          `The YAMl file failed validation with the following error.\n\n${fileName}`,
          { modal: true },
          'OK',
        );
      } else if (typeof error === 'string' && error.search('undefinedWarning') > 0) {
        // eslint-disable-next-line no-console
        console.log(`updateServiceFromYaml error = ${error}`);
        // do nothing it was a warning
      } else {
        // eslint-disable-next-line no-console
        console.log(`updateServiceFromYaml error = ${error}`);
        await window.showErrorMessage(`There was an error while uploading the YAML. `, { modal: true }, 'OK');
      }
    }
    // Refresh the list to read the update
    this.refresh();
  }

  public async deleteLocalYaml(node: KnativeTreeItem): Promise<void> {
    const fileURI = await this.getLocalYamlPathForNode(node);

    // Delete the local YAML file that was uploaded.
    const response = await window.showInformationMessage(
      `Are you sure you want to delete the local copy.`,
      { modal: true },
      'Delete',
    );
    if (response === 'Delete') {
      this.knvfs.delete(Uri.file(fileURI), { recursive: false });
      this.refresh();
    }
  }

  public async requireLogin(): Promise<boolean> {
    const result: CliExitData = await this.knExecutor.execute(KnAPI.printKnVersion(), process.cwd(), false);
    return this.knLoginMessages.some((msg) => result.stderr.includes(msg));
  }
}
