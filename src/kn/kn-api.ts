/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { workspace } from 'vscode';


function verbose(_target: any, key: string, descriptor: any) {
	let fnKey: string | undefined;
	let fn: Function | undefined;

	if (typeof descriptor.value === 'function') {
		fnKey = 'value';
		fn = descriptor.value;
	} else {
		throw new Error('not supported');
	}

	descriptor[fnKey] = function (...args: any[]) {
        const v = workspace.getConfiguration('openshiftConnector').get('outputVerbosityLevel');
        const command = fn!.apply(this, args);
        return command + (v > 0 ? ` -v ${v}` : '');
	};
}


export interface CreateService {
  name: string;
  image: string;
  env?: Map<string, string>;
  port?: number;
  force?: boolean;
  annotation?: Map<string, boolean>;
  label?: Map<string, string>;
  namespace?: string;
}

 /**
  * A series of commands for the knative cli `kn`.
  */
export class KnAPI {

  /**
   * 
   * #### Create a service 'mysvc' using image at dev.local/ns/image:latest  
   * `kn service create mysvc --image dev.local/ns/image:latest`
   * 
   * #### Create a service with multiple environment variables  
   * `kn service create mysvc --env KEY1=VALUE1 --env KEY2=VALUE2 --image dev.local/ns/image:latest`
   * 
   * #### Create or replace a service 's1' with image dev.local/ns/image:v2 using --force flag 
   * if service 's1' doesn't exist, it's just a normal create operation  
   * `kn service create --force s1 --image dev.local/ns/image:v2`

   * #### Create or replace environment variables of service 's1' using --force flag  
   * `kn service create --force s1 --env KEY1=NEW_VALUE1 --env NEW_KEY2=NEW_VALUE2 --image dev.local/ns/image:v1`

   * #### Create service 'mysvc' with port 80  
   * `kn service create mysvc --port 80 --image dev.local/ns/image:latest`
   * 
   * #### Create or replace default resources of a service 's1' using --force flag
   * * (earlier configured resource requests and limits will be replaced with default)  
   * * (earlier configured environment variables will be cleared too if any)  
   * 
   * `kn service create --force s1 --image dev.local/ns/image:v1`
   * 
   * #### Create a service with annotation
   * `kn service create s1 --image dev.local/ns/image:v3 --annotation sidecar.istio.io/inject=false`
   */
  static createService(createServiceObj: CreateService): string {
    let annotationString: string = '';
    if (createServiceObj.annotation) {
      createServiceObj.annotation.forEach((value, key) => {
        annotationString += ` --annotation ${key}=${value}`;
      });
    }
    let labelString: string = '';
    if (createServiceObj.label) {
      createServiceObj.label.forEach((value, key) => {
        labelString += ` --label ${key}=${value}`;
      });
    }
    let envString: string = '';
    if (createServiceObj.env) {
      createServiceObj.env.forEach((value, key) => {
        envString += ` --env ${key.toUpperCase()}=${value.toUpperCase()}`;
      });
    }
    const commandString: string = 
      'kn service create ' + 
      (createServiceObj.force ? '--force ' : '') +
      createServiceObj.name + 
      (createServiceObj.port ? ' --port ' + createServiceObj.port : '' ) +
      envString +
      ' --image ' + createServiceObj.image +
      (createServiceObj.namespace ? ' -n ' + createServiceObj.namespace : '') +
      annotationString +
      labelString
      ;

    return commandString;
  }

  /**
   * Return the list of Knative Services in JSON format.
   */
  static listServices() {
    return `kn service list -o json`;
  }


  // List of ODO commands, these should be removed.
  static listProjects() {
    return `odo project list -o json`;
}
@verbose
static listApplications(project: string) {
    return `odo application list --project ${project} -o json`;
}
static deleteProject(name: string) {
    return `odo project delete ${name} -o json`;
}
static waitForProjectToBeGone(project: string) {
    return `oc wait project/${project} --for delete`;
}
@verbose
static createProject(name: string) {
    return `odo project create ${name}`;
}
static listComponents(project: string, app: string) {
    return `odo list --app ${app} --project ${project} -o json`;
}
static listCatalogComponents() {
    return `odo catalog list components`;
}
static listCatalogComponentsJson() {
    return `${KnAPI.listCatalogComponents()} -o json`;
}
static listCatalogOsServices () {
    return `odo catalog list services`;
}
static listCatalogOsServicesJson () {
    return `${KnAPI.listCatalogOsServices()} -o json`;
}
static listStorageNames() {
    return `odo storage list -o json`;
}
static printOcVersion() {
    return 'oc version';
}
static listServiceInstances(project: string, app: string) {
    return `odo service list -o json --project ${project} --app ${app}`;
}
static describeApplication(project: string, app: string) {
    return `odo app describe ${app} --project ${project}`;
}
static deleteApplication(project: string, app: string) {
    return `odo app delete ${app} --project ${project} -f`;
}
static printOdoVersion() {
    return 'odo version';
}
static printOdoVersionAndProjects() {
    return 'odo version && odo project list';
}
static odoLogout() {
    return `odo logout`;
}
static setOpenshiftContext(context: string) {
    return `oc config use-context ${context}`;
}
static odoLoginWithUsernamePassword(clusterURL: string, username: string, passwd: string) {
    return `odo login ${clusterURL} -u '${username}' -p '${passwd}' --insecure-skip-tls-verify`;
}
static odoLoginWithToken(clusterURL: string, ocToken: string) {
    return `odo login ${clusterURL} --token=${ocToken} --insecure-skip-tls-verify`;
}
@verbose
static createStorage(storageName: string, mountPath: string, storageSize: string) {
    return `odo storage create ${storageName} --path=${mountPath} --size=${storageSize}}`;
}
static deleteStorage(storage: string) {
    return `odo storage delete ${storage} -f`;
}
static waitForStorageToBeGone(project: string, app: string, storage: string) {
    return `oc wait pvc/${storage}-${app}-pvc --for=delete --namespace ${project}`;
}
static undeployComponent(project: string, app: string, component: string) {
    return `odo delete ${component} -f --app ${app} --project ${project}`;
}
static deleteComponent(project: string, app: string, component: string) {
    return `odo delete ${component} -f --app ${app} --project ${project} --all`;
}
static describeComponent(project: string, app: string, component: string) {
    return `odo describe ${component} --app ${app} --project ${project}`;
}
static describeComponentJson(project: string, app: string, component: string) {
    return `${KnAPI.describeComponent(project, app, component)} -o json`;
}
static describeService(service: string) {
    return `odo catalog describe service ${service}`;
}
static showLog(project: string, app: string, component: string) {
    return `odo log ${component} --app ${app} --project ${project}`;
}
static showLogAndFollow(project: string, app: string, component: string) {
    return `odo log ${component} -f --app ${app} --project ${project}`;
}
static listComponentPorts(project: string, app: string, component: string) {
    return `oc get service ${component}-${app} --namespace ${project} -o jsonpath="{range .spec.ports[*]}{.port}{','}{end}"`;
}
static linkComponentTo(project: string, app: string, component: string, componentToLink: string, port?: string) {
    return `odo link ${componentToLink} --project ${project} --app ${app} --component ${component} --wait${port ? ' --port ' + port : ''}`;
}
static linkServiceTo(project: string, app: string, component: string, serviceToLink: string, port?: string) {
    return `odo link ${serviceToLink} --project ${project} --app ${app} --component ${component} --wait --wait-for-target`;
}
@verbose
static pushComponent() {
    return `odo push`;
}
@verbose
static watchComponent(project: string, app: string, component: string) {
    return `odo watch ${component} --app ${app} --project ${project}`;
}
@verbose
static createLocalComponent(project: string, app: string, type: string, version: string, name: string, folder: string) {
    return `odo create ${type}:${version} ${name} --context ${folder} --app ${app} --project ${project}`;
}
@verbose
static createGitComponent(project: string, app: string, type: string, version: string, name: string, git: string, ref: string) {
    return `odo create ${type}:${version} ${name} --git ${git} --ref ${ref} --app ${app} --project ${project}`;
}
@verbose
static createBinaryComponent(project: string, app: string, type: string, version: string, name: string, binary: string, context: string) {
    return `odo create ${type}:${version} ${name} --binary ${binary} --app ${app} --project ${project} --context ${context}`;
}
@verbose
static createOSService(project: string, app: string, template: string, plan: string, name: string) {
    return `odo service create ${template} --plan ${plan} ${name} --app ${app} --project ${project} -w`;
}
static deleteService(project: string, app: string, name: string) {
    return `odo service delete ${name} -f --project ${project} --app ${app}`;
}
static getServiceTemplate(project: string, service: string) {
    return `oc get ServiceInstance ${service} --namespace ${project} -o jsonpath="{$.metadata.labels.app\\.kubernetes\\.io/name}"`;
}
static waitForServiceToBeGone(project: string, service: string) {
    return `oc wait ServiceInstance/${service} --for delete --namespace ${project}`;
}
@verbose
static createComponentCustomUrl(name: string, port: string) {
    return `odo url create ${name} --port ${port}`;
}
static getComponentUrl() {
    return `odo url list -o json`;
}
static deleteComponentUrl(name: string) {
    return `odo url delete -f ${name}`;
}
static getComponentJson(project: string, app: string, component: string) {
    return `oc get service ${component}-${app} --namespace ${project} -o json`;
}
static unlinkComponents(project: string, app: string, comp1: string, comp2: string) {
    return `odo unlink --project ${project} --app ${app} ${comp2} --component ${comp1}`;
}
static unlinkService(project: string, app: string, service: string, comp: string) {
    return `odo unlink --project ${project} --app ${app} ${service} --component ${comp}`;
}
static getOpenshiftClusterRoute() {
    return `oc get routes -n openshift-console -ojson`;
}
static getclusterVersion() {
    return `oc get clusterversion -ojson`;
}
static showServerUrl() {
    return `oc whoami --show-server`;
}

}
