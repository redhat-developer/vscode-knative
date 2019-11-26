/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as cliInstance from "./cli";
import {
  TreeItemCollapsibleState,
  window,
  Terminal,
  Uri,
  commands,
  workspace,
  WorkspaceFoldersChangeEvent,
  WorkspaceFolder,
  Disposable
} from "vscode";
import { WindowUtil } from "../util/windowUtils";
import { CliExitData } from "./cli";
import * as path from "path";
import { KnCliConfig } from "./kn-cli-config";
import { statSync } from "fs";
import bs = require("binary-search");
import { Platform } from "../util/platform";
import { ComponentSettings } from "./config";
import { Subject } from "rxjs";
import { Progress } from "../util/progress";
import { V1ServicePort, V1Service } from "@kubernetes/client-node";
import {
  ComponentType,
  ContextType,
  KnativeTreeObject,
  KnativeObjectImpl
} from "./knativeTreeObject";
import { KnatvieTreeEvent, KnatvieTreeEventImpl } from "./knativeTreeEvent";
import { KnativeTreeModel } from "./knativeTreeModel";
import { KnAPI } from "./kn-api";

const Collapsed = TreeItemCollapsibleState.Collapsed;

export interface Kn {
  getServices(): Promise<KnativeTreeObject[]>;
  getClusters(): Promise<KnativeTreeObject[]>;
  getProjects(): Promise<KnativeTreeObject[]>;
  loadWorkspaceComponents(event: WorkspaceFoldersChangeEvent): void;
  addWorkspaceComponent(
    WorkspaceFolder: WorkspaceFolder,
    component: KnativeTreeObject
  );
  getApplications(project: KnativeTreeObject): Promise<KnativeTreeObject[]>;
  getApplicationChildren(
    application: KnativeTreeObject
  ): Promise<KnativeTreeObject[]>;
  getComponents(
    application: KnativeTreeObject,
    condition?: (value: KnativeTreeObject) => boolean
  ): Promise<KnativeTreeObject[]>;
  getComponentTypes(): Promise<string[]>;
  getComponentChildren(
    component: KnativeTreeObject
  ): Promise<KnativeTreeObject[]>;
  getRoutes(component: KnativeTreeObject): Promise<KnativeTreeObject[]>;
  getComponentPorts(component: KnativeTreeObject): Promise<V1ServicePort[]>;
  getComponentTypeVersions(componentName: string): Promise<string[]>;
  getStorageNames(component: KnativeTreeObject): Promise<KnativeTreeObject[]>;
  getServiceTemplates(): Promise<string[]>;
  getServiceTemplatePlans(svc: string): Promise<string[]>;
  getOsServices(application: KnativeTreeObject): Promise<KnativeTreeObject[]>;
  execute(command: string, cwd?: string, fail?: boolean): Promise<CliExitData>;
  executeInTerminal(command: string, cwd?: string): void;
  requireLogin(): Promise<boolean>;
  clearCache?(): void;
  createProject(name: string): Promise<KnativeTreeObject>;
  deleteProject(project: KnativeTreeObject): Promise<KnativeTreeObject>;
  createApplication(application: KnativeTreeObject): Promise<KnativeTreeObject>;
  deleteApplication(application: KnativeTreeObject): Promise<KnativeTreeObject>;
  createComponentFromGit(
    application: KnativeTreeObject,
    type: string,
    version: string,
    name: string,
    repoUri: string,
    context: Uri,
    ref: string
  ): Promise<KnativeTreeObject>;
  createComponentFromFolder(
    application: KnativeTreeObject,
    type: string,
    version: string,
    name: string,
    path: Uri
  ): Promise<KnativeTreeObject>;
  createComponentFromBinary(
    application: KnativeTreeObject,
    type: string,
    version: string,
    name: string,
    path: Uri,
    context: Uri
  ): Promise<KnativeTreeObject>;
  deleteComponent(component: KnativeTreeObject): Promise<KnativeTreeObject>;
  undeployComponent(component: KnativeTreeObject): Promise<KnativeTreeObject>;
  deleteNotPushedComponent(
    component: KnativeTreeObject
  ): Promise<KnativeTreeObject>;
  createStorage(
    component: KnativeTreeObject,
    name: string,
    mountPath: string,
    size: string
  ): Promise<KnativeTreeObject>;
  deleteStorage(storage: KnativeTreeObject): Promise<KnativeTreeObject>;
  createOSService(
    application: KnativeTreeObject,
    templateName: string,
    planName: string,
    name: string
  ): Promise<KnativeTreeObject>;
  deleteService(service: KnativeTreeObject): Promise<KnativeTreeObject>;
  deleteURL(url: KnativeTreeObject): Promise<KnativeTreeObject>;
  createComponentCustomUrl(
    component: KnativeTreeObject,
    name: string,
    port: string
  ): Promise<KnativeTreeObject>;
  readonly subject: Subject<KnatvieTreeEvent>;
}

export function getInstance(): Kn {
  return KnImpl.Instance;
}

function compareNodes(a: KnativeTreeObject, b: KnativeTreeObject): number {
  if (!a.contextValue) {
    return -1;
  }
  if (!b.contextValue) {
    return 1;
  }
  const acontext = a.contextValue.includes("_")
    ? a.contextValue.substr(0, a.contextValue.indexOf("_"))
    : a.contextValue;
  const bcontext = b.contextValue.includes("_")
    ? b.contextValue.substr(0, b.contextValue.indexOf("_"))
    : b.contextValue;
  const t = acontext.localeCompare(bcontext);
  return t ? t : a.label.localeCompare(b.label);
}

export class KnImpl implements Kn {
  public static data: KnativeTreeModel = new KnativeTreeModel();
  public static ROOT: KnativeTreeObject = new KnativeObjectImpl(
    undefined,
    "/",
    undefined,
    false,
    undefined
  );
  private static cli: cliInstance.ICli = cliInstance.Cli.getInstance();
  private static instance: Kn;

  private readonly knLoginMessages = [
    "Please log in to the cluster",
    "the server has asked for the client to provide credentials",
    "Please login to your server",
    "Unauthorized"
  ];

  private subjectInstance: Subject<KnatvieTreeEvent> = new Subject<KnatvieTreeEvent>();

  private constructor() {}

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
    console.log('kn.kncontroller.ts : getServices()');
    if (!children) {
      children = KnImpl.data.setParentToChildren(
        KnImpl.ROOT,
        await this._getServices()
      );
    }
    return children;
  }

  public async _getServices(): Promise<KnativeTreeObject[]> {
    const result: cliInstance.CliExitData = await this.execute(
      KnAPI.listServices()
    );
    let services: string[] = this.loadItems(result).map(
      value => value.metadata.name
    );
    return services
      .map<KnativeTreeObject>(
        value =>
          new KnativeObjectImpl(
            null,
            value,
            ContextType.SERVICE,
            false,
            KnImpl.instance,
            TreeItemCollapsibleState.Expanded
          )
      )
      .sort(compareNodes);
  }








//----------Old OpenShift below this line--------
  async getClusters(): Promise<KnativeTreeObject[]> {
    let children = KnImpl.data.getChildrenByParent(KnImpl.ROOT);
    if (!children) {
      children = KnImpl.data.setParentToChildren(
        KnImpl.ROOT,
        await this._getClusters()
      );
    }
    return children;
  }

  public async _getClusters(): Promise<KnativeTreeObject[]> {
    let clusters: KnativeTreeObject[] = await this.getClustersWithKn();
    if (clusters.length === 0) {
      clusters = await this.getClustersWithOc();
    }
    if (
      clusters.length > 0 &&
      clusters[0].contextValue === ContextType.CLUSTER
    ) {
      // kick out migration if enabled
      if (
        !workspace
          .getConfiguration("knative")
          .get("disableCheckForMigration")
      ) {
        this.convertObjectsFromPreviousKnReleases();
      }
    }
    return clusters;
  }

  private async getClustersWithOc(): Promise<KnativeTreeObject[]> {
    let clusters: KnativeTreeObject[] = [];
    const result: cliInstance.CliExitData = await this.execute(
      KnAPI.printOcVersion(),
      process.cwd(),
      false
    );
    clusters = result.stdout
      .trim()
      .split("\n")
      .filter(value => {
        return value.indexOf("Server ") !== -1;
      })
      .map(value => {
        const server: string = value.substr(value.indexOf(" ") + 1).trim();
        return new KnativeObjectImpl(
          null,
          server,
          ContextType.CLUSTER,
          false,
          KnImpl.instance,
          TreeItemCollapsibleState.Expanded
        );
      });
    return clusters;
  }

  private async getClustersWithKn(): Promise<KnativeTreeObject[]> {
    let clusters: KnativeTreeObject[] = [];
    const result: cliInstance.CliExitData = await this.execute(
      KnAPI.printOdoVersionAndProjects(),
      process.cwd(),
      false
    );
    if (
      this.knLoginMessages.some(element =>
        result.stderr ? result.stderr.indexOf(element) > -1 : false
      )
    ) {
      const loginErrorMsg: string = "Please log in to the cluster";
      return [
        new KnativeObjectImpl(
          null,
          loginErrorMsg,
          ContextType.LOGIN_REQUIRED,
          false,
          KnImpl.instance,
          TreeItemCollapsibleState.None
        )
      ];
    }
    if (
      result.stderr.indexOf(
        "Unable to connect to Knative cluster, is it down?"
      ) > -1
    ) {
      const clusterDownMsg: string = "Please start the Knative cluster";
      return [
        new KnativeObjectImpl(
          null,
          clusterDownMsg,
          ContextType.CLUSTER_DOWN,
          false,
          KnImpl.instance,
          TreeItemCollapsibleState.None
        )
      ];
    }
    commands.executeCommand("setContext", "isLoggedIn", true);
    clusters = result.stdout
      .trim()
      .split("\n")
      .filter(value => {
        return value.indexOf("Server:") !== -1;
      })
      .map(value => {
        const server: string = value.substr(value.indexOf(":") + 1).trim();
        return new KnativeObjectImpl(
          null,
          server,
          ContextType.CLUSTER,
          false,
          KnImpl.instance,
          TreeItemCollapsibleState.Expanded
        );
      });
    return clusters;
  }

  async getProjects(): Promise<KnativeTreeObject[]> {
    const clusters = await this.getClusters();
    let projects = KnImpl.data.getChildrenByParent(clusters[0]);
    if (!projects) {
      projects = KnImpl.data.setParentToChildren(
        clusters[0],
        await this._getProjects(clusters[0])
      );
    }
    return projects;
  }

  public async _getProjects(
    cluster: KnativeTreeObject
  ): Promise<KnativeTreeObject[]> {
    return this.execute(KnAPI.listProjects())
      .then(result => {
        const projs = this.loadItems(result).map(value => value.metadata.name);
        return projs.map<KnativeTreeObject>(
          value =>
            new KnativeObjectImpl(
              cluster,
              value,
              ContextType.PROJECT,
              false,
              KnImpl.instance
            )
        );

        // TODO: load projects form workspace folders and add missing ones to the model even they
        // are not created in cluster they should be visible in Knative Application Tree
      })
      .catch(error => {
        window.showErrorMessage(
          `Cannot retrieve projects for current cluster. Error: ${error}`
        );
        return [];
      });
  }

  async getApplications(
    project: KnativeTreeObject
  ): Promise<KnativeTreeObject[]> {
    let applications = KnImpl.data.getChildrenByParent(project);
    if (!applications) {
      applications = KnImpl.data.setParentToChildren(
        project,
        await this._getApplications(project)
      );
    }
    return applications;
  }

  public async _getApplications(
    project: KnativeTreeObject
  ): Promise<KnativeTreeObject[]> {
    const result: cliInstance.CliExitData = await this.execute(
      KnAPI.listApplications(project.getName())
    );
    let apps: string[] = this.loadItems(result).map(
      value => value.metadata.name
    );
    apps = [...new Set(apps)]; // remove duplicates form array
    // extract apps from local not yet deployed components
    KnImpl.data.getSettings().forEach(component => {
      if (
        component.Project === project.getName() &&
        !apps.find(item => item === component.Application)
      ) {
        apps.push(component.Application);
      }
    });
    return apps
      .map<KnativeTreeObject>(
        value =>
          new KnativeObjectImpl(
            project,
            value,
            ContextType.APPLICATION,
            false,
            KnImpl.instance
          )
      )
      .sort(compareNodes);
  }

  public async getApplicationChildren(
    application: KnativeTreeObject
  ): Promise<KnativeTreeObject[]> {
    let children = KnImpl.data.getChildrenByParent(application);
    if (!children) {
      children = KnImpl.data.setParentToChildren(
        application,
        await this._getApplicationChildren(application)
      );
    }
    return children;
  }

  async _getApplicationChildren(
    application: KnativeTreeObject
  ): Promise<KnativeTreeObject[]> {
    return [
      ...(await this._getComponents(application)),
      ...(await this._getOsServices(application))
    ].sort(compareNodes);
  }

  async getComponents(
    application: KnativeTreeObject,
    condition: (value: KnativeTreeObject) => boolean = value =>
      value.contextValue === ContextType.COMPONENT ||
      value.contextValue === ContextType.COMPONENT_NO_CONTEXT ||
      value.contextValue === ContextType.COMPONENT_PUSHED
  ): Promise<KnativeTreeObject[]> {
    return (await this.getApplicationChildren(application)).filter(condition);
  }

  public async _getComponents(
    application: KnativeTreeObject
  ): Promise<KnativeTreeObject[]> {
    const result: cliInstance.CliExitData = await this.execute(
      KnAPI.listComponents(
        application.getParent().getName(),
        application.getName()
      ),
      Platform.getUserHomePath()
    );
    const componentObject = this.loadItems(result).map(value => ({
      name: value.metadata.name,
      source: value.spec.source
    }));

    const deployedComponents = componentObject.map<KnativeTreeObject>(value => {
      let compSource: string = "";
      try {
        if (value.source.startsWith("https://")) {
          compSource = ComponentType.GIT;
        } else if (statSync(Uri.parse(value.source).fsPath).isFile()) {
          compSource = ComponentType.BINARY;
        } else if (statSync(Uri.parse(value.source).fsPath).isDirectory()) {
          compSource = ComponentType.LOCAL;
        }
      } catch (ignore) {
        // treat component as local in case of error when calling statSync
        // for not existing file or folder
        compSource = ComponentType.LOCAL;
      }
      return new KnativeObjectImpl(
        application,
        value.name,
        ContextType.COMPONENT_NO_CONTEXT,
        true,
        this,
        Collapsed,
        undefined,
        compSource
      );
    });
    const targetAppName = application.getName(),
      targetPrjName = application.getParent().getName();

    KnImpl.data
      .getSettings()
      .filter(
        comp =>
          comp.Application === targetAppName && comp.Project === targetPrjName
      )
      .forEach((comp, index) => {
        const item = deployedComponents.find(
          component => component.getName() === comp.Name
        );
        if (item) {
          item.contextPath = comp.ContextPath;
          item.deployed = true;
          item.contextValue = ContextType.COMPONENT_PUSHED;
        } else {
          deployedComponents.push(
            new KnativeObjectImpl(
              application,
              comp.Name,
              ContextType.COMPONENT,
              false,
              this,
              Collapsed,
              comp.ContextPath,
              comp.SourceType
            )
          );
        }
      });

    return deployedComponents;
  }

  public async getComponentTypes(): Promise<string[]> {
    const result: cliInstance.CliExitData = await this.execute(
      KnAPI.listCatalogComponentsJson()
    );
    return this.loadItems(result).map(value => value.metadata.name);
  }

  public async getComponentChildren(
    component: KnativeTreeObject
  ): Promise<KnativeTreeObject[]> {
    let children = KnImpl.data.getChildrenByParent(component);
    if (!children) {
      children = KnImpl.data.setParentToChildren(
        component,
        await this._getComponentChildren(component)
      );
    }
    return children;
  }

  async _getComponentChildren(
    component: KnativeTreeObject
  ): Promise<KnativeTreeObject[]> {
    return [
      ...(await this._getStorageNames(component)),
      ...(await this._getRoutes(component))
    ].sort(compareNodes);
  }

  async getRoutes(component: KnativeTreeObject): Promise<KnativeTreeObject[]> {
    return (await this.getComponentChildren(component)).filter(
      value => value.contextValue === ContextType.COMPONENT_ROUTE
    );
  }

  async getComponentPorts(
    component: KnativeTreeObject
  ): Promise<V1ServicePort[]> {
    let ports: V1ServicePort[] = [];
    if (component.contextValue === ContextType.COMPONENT_PUSHED) {
      const app: KnativeTreeObject = component.getParent();
      const project: KnativeTreeObject = app.getParent();
      const portsResult: CliExitData = await this.execute(
        KnAPI.getComponentJson(
          project.getName(),
          app.getName(),
          component.getName()
        ),
        component.contextPath.fsPath
      );
      const serviceOpj: V1Service = JSON.parse(portsResult.stdout) as V1Service;
      return serviceOpj.spec.ports;
    } else {
      const settings: ComponentSettings = KnImpl.data.getSettingsByContext(
        component.contextPath
      );
      if (settings) {
        ports = settings.Ports.map<V1ServicePort>((port: string) => {
          const data = port.split("/");
          return {
            port: Number.parseInt(data[0]),
            protocol: data[1],
            name: port
          };
        });
      }
    }
    return ports;
  }

  public async _getRoutes(
    component: KnativeTreeObject
  ): Promise<KnativeTreeObject[]> {
    const result: cliInstance.CliExitData = await this.execute(
      KnAPI.getComponentUrl(),
      component.contextPath
        ? component.contextPath.fsPath
        : Platform.getUserHomePath(),
      false
    );
    return this.loadItems(result).map(
      value =>
        new KnativeObjectImpl(
          component,
          value.metadata.name,
          ContextType.COMPONENT_ROUTE,
          false,
          KnImpl.instance,
          TreeItemCollapsibleState.None
        )
    );
  }

  async getStorageNames(
    component: KnativeTreeObject
  ): Promise<KnativeTreeObject[]> {
    return (await this.getComponentChildren(component)).filter(
      value => value.contextValue === ContextType.STORAGE
    );
  }

  public async _getStorageNames(
    component: KnativeTreeObject
  ): Promise<KnativeTreeObject[]> {
    const result: cliInstance.CliExitData = await this.execute(
      KnAPI.listStorageNames(),
      component.contextPath
        ? component.contextPath.fsPath
        : Platform.getUserHomePath()
    );
    return this.loadItems(result).map<KnativeTreeObject>(
      value =>
        new KnativeObjectImpl(
          component,
          value.metadata.name,
          ContextType.STORAGE,
          false,
          KnImpl.instance,
          TreeItemCollapsibleState.None
        )
    );
  }

  public async getComponentTypeVersions(componentName: string) {
    const result: cliInstance.CliExitData = await this.execute(
      KnAPI.listCatalogComponentsJson()
    );
    return this.loadItems(result).filter(
      value => value.metadata.name === componentName
    )[0].spec.allTags;
  }

  public async getServiceTemplates(): Promise<string[]> {
    let items: any[] = [];
    const result: cliInstance.CliExitData = await this.execute(
      KnAPI.listCatalogOsServicesJson(),
      Platform.getUserHomePath(),
      false
    );
    try {
      items = JSON.parse(result.stdout).items;
    } catch (err) {
      throw new Error(JSON.parse(result.stderr).message);
    }
    return items.map(value => value.metadata.name);
  }

  public async getServiceTemplatePlans(svcName: string): Promise<string[]> {
    const result: cliInstance.CliExitData = await this.execute(
      KnAPI.listCatalogOsServicesJson(),
      Platform.getUserHomePath()
    );
    return this.loadItems(result).filter(
      value => value.metadata.name === svcName
    )[0].spec.planList;
  }

  async getOsServices(
    application: KnativeTreeObject
  ): Promise<KnativeTreeObject[]> {
    return (await this.getApplicationChildren(application)).filter(
      value => value.contextValue === ContextType.SERVICE
    );
  }

  public async _getOsServices(
    application: KnativeTreeObject
  ): Promise<KnativeTreeObject[]> {
    const appName: string = application.getName();
    const projName: string = application.getParent().getName();
    let services: KnativeTreeObject[] = [];
    try {
      const result: cliInstance.CliExitData = await this.execute(
        KnAPI.listServiceInstances(projName, appName)
      );
      services = this.loadItems(result).map(
        value =>
          new KnativeObjectImpl(
            application,
            value.metadata.name,
            ContextType.SERVICE,
            true,
            KnImpl.instance,
            TreeItemCollapsibleState.None
          )
      );
    } catch (ignore) {
      // ignore error in case service catalog is not configured
    }
    commands.executeCommand(
      "setContext",
      "servicePresent",
      services.length > 0
    );
    return services;
  }

  public async executeInTerminal(
    command: string,
    cwd: string = process.cwd(),
    name: string = "Knative"
  ) {
    const cmd = command.split(" ")[0];
    let toolLocation = await KnCliConfig.detectOrDownload(cmd);
    if (toolLocation) {
      toolLocation = path.dirname(toolLocation);
    }
    const terminal: Terminal = WindowUtil.createTerminal(
      name,
      cwd,
      toolLocation
    );
    terminal.sendText(command, true);
    terminal.show();
  }

  public async execute(
    command: string,
    cwd?: string,
    fail: boolean = true
  ): Promise<CliExitData> {
    const cmd = command.split(" ")[0];
    const toolLocation = await KnCliConfig.detectOrDownload(cmd);
    return KnImpl.cli
      .execute(
        toolLocation
          ? command
              .replace(cmd, `"${toolLocation}"`)
              .replace(new RegExp(`&& ${cmd}`, "g"), `&& "${toolLocation}"`)
          : command,
        cwd ? { cwd } : {}
      )
      .then(async result =>
        result.error && fail ? Promise.reject(result.error) : result
      )
      .catch(err =>
        fail
          ? Promise.reject(err)
          : Promise.resolve({ error: null, stdout: "", stderr: "" })
      );
  }

  public async requireLogin(): Promise<boolean> {
    const result: cliInstance.CliExitData = await this.execute(
      KnAPI.printOdoVersionAndProjects(),
      process.cwd(),
      false
    );
    return this.knLoginMessages.some(msg => result.stderr.indexOf(msg) > -1);
  }

  private insert(
    array: KnativeTreeObject[],
    item: KnativeTreeObject
  ): KnativeTreeObject {
    const i = bs(array, item, compareNodes);
    array.splice(Math.abs(i) - 1, 0, item);
    return item;
  }

  private async insertAndReveal(
    item: KnativeTreeObject
  ): Promise<KnativeTreeObject> {
    // await KnativeExplorer.getInstance().reveal(this.insert(await item.getParent().getChildren(), item));
    this.subject.next(
      new KnatvieTreeEventImpl(
        "inserted",
        this.insert(await item.getParent().getChildren(), item),
        true
      )
    );
    return item;
  }

  private async insertAndRefresh(
    item: KnativeTreeObject
  ): Promise<KnativeTreeObject> {
    // await KnativeExplorer.getInstance().refresh(this.insert(await item.getParent().getChildren(), item).getParent());
    this.subject.next(
      new KnatvieTreeEventImpl(
        "changed",
        this.insert(await item.getParent().getChildren(), item).getParent()
      )
    );
    return item;
  }

  private deleteAndRefresh(item: KnativeTreeObject): KnativeTreeObject {
    KnImpl.data.delete(item);
    // KnativeExplorer.getInstance().refresh(item.getParent());
    this.subject.next(new KnatvieTreeEventImpl("changed", item.getParent()));
    return item;
  }

  public async deleteProject(
    project: KnativeTreeObject
  ): Promise<KnativeTreeObject> {
    await this.execute(KnAPI.deleteProject(project.getName()));
    await this.execute(
      KnAPI.waitForProjectToBeGone(project.getName()),
      process.cwd(),
      false
    );
    return this.deleteAndRefresh(project);
  }

  public async createProject(projectName: string): Promise<KnativeTreeObject> {
    await KnImpl.instance.execute(KnAPI.createProject(projectName));
    const clusters = await this.getClusters();
    return this.insertAndReveal(
      new KnativeObjectImpl(
        clusters[0],
        projectName,
        ContextType.PROJECT,
        false,
        this
      )
    );
  }

  public async deleteApplication(
    app: KnativeTreeObject
  ): Promise<KnativeTreeObject> {
    const allComps = await KnImpl.instance.getComponents(app);
    const allContexts = [];
    let callDelete = false;
    allComps.forEach(component => {
      KnImpl.data.delete(component); // delete component from model
      if (
        (!callDelete &&
          component.contextValue === ContextType.COMPONENT_PUSHED) ||
        component.contextValue === ContextType.COMPONENT_NO_CONTEXT
      ) {
        callDelete = true; // if there is at least one component deployed in application `kn app delete` command should be called
      }
      if (component.contextPath) {
        // if component has context folder save it to remove from settings cache
        allContexts.push(workspace.getWorkspaceFolder(component.contextPath));
      }
    });

    if (callDelete) {
      await this.execute(
        KnAPI.deleteApplication(app.getParent().getName(), app.getName())
      );
    }
    // Chain workspace folder deltions, because when updateWorkspaceFoder called next call is possible only after
    // listener registered with onDidChangeWorkspaceFolders called.
    let result = Promise.resolve();
    allContexts.forEach(wsFolder => {
      result = result.then(() => {
        workspace.updateWorkspaceFolders(wsFolder.index, 1);
        return new Promise<void>(resolve => {
          const disposable = workspace.onDidChangeWorkspaceFolders(() => {
            disposable.dispose();
            resolve();
          });
        });
      });
    });
    return result.then(() => {
      return this.deleteAndRefresh(app);
    });
  }

  public async createApplication(
    application: KnativeTreeObject
  ): Promise<KnativeTreeObject> {
    const targetApplication = (
      await this.getApplications(application.getParent())
    ).find(value => value === application);
    if (!targetApplication) {
      await this.insertAndReveal(application);
    }
    return application;
  }

  public async createComponentFromFolder(
    application: KnativeTreeObject,
    type: string,
    version: string,
    name: string,
    location: Uri
  ): Promise<KnativeTreeObject> {
    await this.execute(
      KnAPI.createLocalComponent(
        application.getParent().getName(),
        application.getName(),
        type,
        version,
        name,
        location.fsPath
      ),
      location.fsPath
    );
    if (workspace.workspaceFolders) {
      const targetApplication = (
        await this.getApplications(application.getParent())
      ).find(value => value === application);
      if (!targetApplication) {
        await this.insertAndReveal(application);
      }
      await this.insertAndReveal(
        new KnativeObjectImpl(
          application,
          name,
          ContextType.COMPONENT,
          false,
          this,
          Collapsed,
          location,
          "local"
        )
      );
    }
    let wsFolder: WorkspaceFolder;
    if (workspace.workspaceFolders) {
      // could be new or existing folder
      wsFolder = workspace.getWorkspaceFolder(location);
      if (wsFolder) {
        // existing workspace folder
        KnImpl.data.addContexts([wsFolder]);
      }
    }
    if (!workspace.workspaceFolders || !wsFolder) {
      workspace.updateWorkspaceFolders(
        workspace.workspaceFolders ? workspace.workspaceFolders.length : 0,
        null,
        { uri: location }
      );
    }
    return null;
  }

  public async createComponentFromGit(
    application: KnativeTreeObject,
    type: string,
    version: string,
    name: string,
    location: string,
    context: Uri,
    ref: string = "master"
  ): Promise<KnativeTreeObject> {
    await this.execute(
      KnAPI.createGitComponent(
        application.getParent().getName(),
        application.getName(),
        type,
        version,
        name,
        location,
        ref ? ref : "master"
      ),
      context.fsPath
    );
    // This check is here to skip any model updates when there are not workspace folders yet,
    // because when first folder added to workspace extesion is going to be reloaded anyway and
    // model loaded when extension is reactivated
    if (workspace.workspaceFolders) {
      const targetApplication = (
        await this.getApplications(application.getParent())
      ).find(value => value === application);
      if (!targetApplication) {
        await this.insertAndReveal(application);
      }
      await this.insertAndReveal(
        new KnativeObjectImpl(
          application,
          name,
          ContextType.COMPONENT,
          false,
          this,
          Collapsed,
          context,
          ComponentType.GIT
        )
      );
    }
    workspace.updateWorkspaceFolders(
      workspace.workspaceFolders ? workspace.workspaceFolders.length : 0,
      null,
      { uri: context }
    );
    return null;
  }

  public async createComponentFromBinary(
    application: KnativeTreeObject,
    type: string,
    version: string,
    name: string,
    location: Uri,
    context: Uri
  ): Promise<KnativeTreeObject> {
    await this.execute(
      KnAPI.createBinaryComponent(
        application.getParent().getName(),
        application.getName(),
        type,
        version,
        name,
        location.fsPath,
        context.fsPath
      )
    );
    if (workspace.workspaceFolders) {
      const targetApplication = (
        await this.getApplications(application.getParent())
      ).find(value => value === application);
      if (!targetApplication) {
        await this.insertAndReveal(application);
      }
      this.insertAndReveal(
        new KnativeObjectImpl(
          application,
          name,
          ContextType.COMPONENT,
          false,
          this,
          Collapsed,
          context,
          ComponentType.BINARY
        )
      );
    }
    workspace.updateWorkspaceFolders(
      workspace.workspaceFolders ? workspace.workspaceFolders.length : 0,
      null,
      { uri: context }
    );
    return null;
  }

  public async deleteComponent(
    component: KnativeTreeObject
  ): Promise<KnativeTreeObject> {
    const app = component.getParent();
    if (component.contextValue !== ContextType.COMPONENT) {
      await this.execute(
        KnAPI.deleteComponent(
          app.getParent().getName(),
          app.getName(),
          component.getName()
        ),
        component.contextPath
          ? component.contextPath.fsPath
          : Platform.getUserHomePath()
      );
    }
    this.deleteAndRefresh(component);
    const children = await app.getChildren();
    if (children.length === 0) {
      this.deleteApplication(app);
    }
    if (component.contextPath) {
      const wsFolder = workspace.getWorkspaceFolder(component.contextPath);
      workspace.updateWorkspaceFolders(wsFolder.index, 1);
      await new Promise<Disposable>(resolve => {
        const disposabel = workspace.onDidChangeWorkspaceFolders(() => {
          disposabel.dispose();
          resolve();
        });
      });
    }
    return component;
  }

  public async undeployComponent(
    component: KnativeTreeObject
  ): Promise<KnativeTreeObject> {
    const app = component.getParent();
    await this.execute(
      KnAPI.undeployComponent(
        app.getParent().getName(),
        app.getName(),
        component.getName()
      ),
      component.contextPath
        ? component.contextPath.fsPath
        : Platform.getUserHomePath()
    );
    component.contextValue = ContextType.COMPONENT;
    //  KnativeExplorer.getInstance().refresh(component);
    this.subject.next(new KnatvieTreeEventImpl("changed", component));
    return component;
  }

  public async deleteNotPushedComponent(
    component: KnativeTreeObject
  ): Promise<KnativeTreeObject> {
    return this.deleteAndRefresh(component);
  }

  public async createOSService(
    application: KnativeTreeObject,
    templateName: string,
    planName: string,
    name: string
  ): Promise<KnativeTreeObject> {
    await this.execute(
      KnAPI.createOSService(
        application.getParent().getName(),
        application.getName(),
        templateName,
        planName,
        name.trim()
      ),
      Platform.getUserHomePath()
    );
    await this.createApplication(application);
    return this.insertAndReveal(
      new KnativeObjectImpl(
        application,
        name,
        ContextType.SERVICE,
        false,
        this,
        TreeItemCollapsibleState.None
      )
    );
  }

  public async deleteService(
    service: KnativeTreeObject
  ): Promise<KnativeTreeObject> {
    const app = service.getParent();
    await this.execute(
      KnAPI.deleteService(
        app.getParent().getName(),
        app.getName(),
        service.getName()
      ),
      Platform.getUserHomePath()
    );
    await this.execute(
      KnAPI.waitForServiceToBeGone(app.getParent().getName(), service.getName())
    );
    this.deleteAndRefresh(service);
    const children = await app.getChildren();
    if (children.length === 0) {
      this.deleteApplication(app);
    }
    return service;
  }

  public async createStorage(
    component: KnativeTreeObject,
    name: string,
    mountPath: string,
    size: string
  ): Promise<KnativeTreeObject> {
    await this.execute(
      KnAPI.createStorage(name, mountPath, size),
      component.contextPath.fsPath
    );
    return this.insertAndReveal(
      new KnativeObjectImpl(
        component,
        name,
        ContextType.STORAGE,
        false,
        this,
        TreeItemCollapsibleState.None
      )
    );
  }

  public async deleteStorage(
    storage: KnativeTreeObject
  ): Promise<KnativeTreeObject> {
    const component = storage.getParent();
    await this.execute(
      KnAPI.deleteStorage(storage.getName()),
      component.contextPath.fsPath
    );
    await this.execute(
      KnAPI.waitForStorageToBeGone(
        storage
          .getParent()
          .getParent()
          .getParent()
          .getName(),
        storage
          .getParent()
          .getParent()
          .getName(),
        storage.getName()
      ),
      process.cwd(),
      false
    );
    return this.deleteAndRefresh(storage);
  }

  public async createComponentCustomUrl(
    component: KnativeTreeObject,
    name: string,
    port: string
  ): Promise<KnativeTreeObject> {
    await this.execute(
      KnAPI.createComponentCustomUrl(name, port),
      component.contextPath.fsPath
    );
    return this.insertAndReveal(
      new KnativeObjectImpl(
        component,
        name,
        ContextType.COMPONENT_ROUTE,
        false,
        this,
        TreeItemCollapsibleState.None
      )
    );
  }

  public async deleteURL(route: KnativeTreeObject): Promise<KnativeTreeObject> {
    await this.execute(
      KnAPI.deleteComponentUrl(route.getName()),
      route.getParent().contextPath.fsPath
    );
    return this.deleteAndRefresh(route);
  }

  clearCache() {
    KnImpl.data.clearTreeData();
  }

  addWorkspaceComponent(folder: WorkspaceFolder, component: KnativeTreeObject) {
    KnImpl.data.addContexts([folder]);
    this.subject.next(new KnatvieTreeEventImpl("changed", null));
  }

  loadWorkspaceComponents(event: WorkspaceFoldersChangeEvent): void {
    if (event === null && workspace.workspaceFolders) {
      KnImpl.data.addContexts(workspace.workspaceFolders);
    }

    if (event && event.added && event.added.length > 0) {
      KnImpl.data.addContexts(event.added);

      event.added.forEach(async (folder: WorkspaceFolder) => {
        const added: ComponentSettings = KnImpl.data.getSettingsByContext(
          folder.uri
        );
        if (added) {
          const cluster = (await this.getClusters())[0];
          const prj = KnImpl.data.getObjectByPath(
            path.join(cluster.path, added.Project)
          );
          if (prj && !!KnImpl.data.getChildrenByParent(prj)) {
            const app = KnImpl.data.getObjectByPath(
              path.join(prj.path, added.Application)
            );
            if (app && !!KnImpl.data.getChildrenByParent(app)) {
              const comp = KnImpl.data.getObjectByPath(
                path.join(app.path, added.Name)
              );
              if (comp && !comp.contextPath) {
                comp.contextPath = added.ContextPath;
                comp.contextValue = ContextType.COMPONENT_PUSHED;
                // await KnativeExplorer.getInstance().refresh(comp);
                this.subject.next(new KnatvieTreeEventImpl("changed", comp));
              } else if (!comp) {
                const newComponent = new KnativeObjectImpl(
                  app,
                  added.Name,
                  ContextType.COMPONENT,
                  false,
                  this,
                  Collapsed,
                  added.ContextPath,
                  added.SourceType
                );
                await this.insertAndRefresh(newComponent);
              }
            } else if (!app) {
              const newApp = new KnativeObjectImpl(
                prj,
                added.Application,
                ContextType.APPLICATION,
                false,
                this,
                Collapsed
              );
              await this.insertAndRefresh(newApp);
            }
          }
        }
      });
    }

    if (event && event.removed && event.removed.length > 0) {
      event.removed.forEach(async (wsFolder: WorkspaceFolder) => {
        const settings = KnImpl.data.getSettingsByContext(wsFolder.uri);
        if (settings) {
          const cluster = (await this.getClusters())[0];
          const item = KnImpl.data.getObjectByPath(
            path.join(
              cluster.path,
              settings.Project,
              settings.Application,
              settings.Name
            )
          );
          if (item && item.contextValue === ContextType.COMPONENT) {
            this.deleteAndRefresh(item);
          } else if (item) {
            item.contextValue = ContextType.COMPONENT_NO_CONTEXT;
            item.contextPath = undefined;
            // KnativeExplorer.getInstance().refresh(item);
            this.subject.next(new KnatvieTreeEventImpl("changed", item));
          }
          KnImpl.data.deleteContext(wsFolder.uri);
        }
      });
    }
  }

  loadItems(result: cliInstance.CliExitData) {
    let data: any[] = [];
    try {
      const items = JSON.parse(result.stdout).items;
      if (items) {
        data = items;
      }
    } catch (ignore) {}
    return data;
  }

  async convertObjectsFromPreviousKnReleases() {
    const projectsResult = await this.execute(
      `oc get project -o jsonpath="{range .items[*]}{.metadata.name}{\\"\\n\\"}{end}"`
    );
    const projects = projectsResult.stdout.split("\n");
    const projectsToMigrate: string[] = [];
    const getPreviosKnResourceNames = (resourceId: string, project: string) =>
      `oc get ${resourceId} -l app.kubernetes.io/component-name -o jsonpath="{range .items[*]}{.metadata.name}{\\"\\n\\"}{end}" --namespace=${project}`;

    for (const project of projects) {
      const result1 = await this.execute(
        getPreviosKnResourceNames("dc", project),
        __dirname,
        false
      );
      const dcs = result1.stdout.split("\n");
      const result2 = await this.execute(
        getPreviosKnResourceNames("ServiceInstance", project),
        __dirname,
        false
      );
      const sis = result2.stdout.split("\n");
      if (
        (result2.stdout !== "" && sis.length > 0) ||
        (result1.stdout !== "" && dcs.length > 0)
      ) {
        projectsToMigrate.push(project);
      }
    }
    if (projectsToMigrate.length > 0) {
      const choice = await window.showWarningMessage(
        `Some of the resources in cluster must be updated to work with latest release of Knative Connector Extension.`,
        "Update",
        "Don't check again",
        "Help",
        "Cancel"
      );
      if (choice === "Help") {
        commands.executeCommand(
          "vscode.open",
          Uri.parse(
            `https://github.com/redhat-developer/vscode-openshift-tools/wiki/Migration-to-v0.1.0`
          )
        );
        this.subject.next(new KnatvieTreeEventImpl("changed", this.getClusters()[0]));
      } else if (choice === "Don't check again") {
        workspace
          .getConfiguration("knative")
          .update("disableCheckForMigration", true, true);
      } else if (choice === "Update") {
        const errors = [];
        await Progress.execFunctionWithProgress(
          "Updating cluster resources to work with latest Knative Connector release",
          async progress => {
            for (const project of projectsToMigrate) {
              for (const resourceId of [
                "DeploymentConfig",
                "Route",
                "BuildConfig",
                "ImageStream",
                "Service",
                "pvc",
                "Secret",
                "ServiceInstance"
              ]) {
                progress.report({ increment: 100 / 8, message: resourceId });
                const result = await this.execute(
                  getPreviosKnResourceNames(resourceId, project),
                  __dirname,
                  false
                );
                const resourceNames =
                  result.error || result.stdout === ""
                    ? []
                    : result.stdout.split("\n");
                for (const resourceName of resourceNames) {
                  try {
                    const result = await this.execute(
                      `oc get ${resourceId} ${resourceName} -o json --namespace=${project}`
                    );
                    const labels = JSON.parse(result.stdout).metadata.labels;
                    let command = `oc label ${resourceId} ${resourceName} --overwrite app.kubernetes.io/instance=${labels["app.kubernetes.io/component-name"]}`;
                    command =
                      command +
                      ` app.kubernetes.io/part-of=${labels["app.kubernetes.io/name"]}`;
                    if (labels["app.kubernetes.io/component-type"]) {
                      command =
                        command +
                        ` app.kubernetes.io/name=${labels["app.kubernetes.io/component-type"]}`;
                    }
                    if (labels["app.kubernetes.io/component-version"]) {
                      command =
                        command +
                        ` app.openshift.io/runtime-version=${labels["app.kubernetes.io/component-version"]}`;
                    }
                    if (labels["app.kubernetes.io/url-name"]) {
                      command =
                        command +
                        ` kn.openshift.io/url-name=${labels["app.kubernetes.io/url-name"]}`;
                    }
                    await this.execute(command + ` --namespace=${project}`);
                    await this.execute(
                      `oc label ${resourceId} ${resourceName} app.kubernetes.io/component-name- --namespace=${project}`
                    );
                    await this.execute(
                      `oc label ${resourceId} ${resourceName} kn.openshift.io/migrated=true --namespace=${project}`
                    );
                  } catch (err) {
                    errors.push(err);
                  }
                }
              }
            }
            this.subject.next(
              new KnatvieTreeEventImpl("changed", this.getClusters()[0])
            );
          }
        );
        if (errors.length) {
          window.showErrorMessage(
            "Not all resources were updated, please see Knative output channel for details."
          );
        } else {
          window.showInformationMessage(
            "Cluster resources have been successfuly updated."
          );
        }
      }
    }
  }
}
