/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

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
export default class KnAPI {
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
    let annotationString = '';
    if (createServiceObj.annotation) {
      createServiceObj.annotation.forEach((value, key) => {
        annotationString += ` --annotation ${key}=${value}`;
      });
    }
    let labelString = '';
    if (createServiceObj.label) {
      createServiceObj.label.forEach((value, key) => {
        labelString += ` --label ${key}=${value}`;
      });
    }
    let envString = '';
    if (createServiceObj.env) {
      createServiceObj.env.forEach((value, key) => {
        envString += ` --env ${key.toUpperCase()}=${value.toUpperCase()}`;
      });
    }
    const commandString = `
      kn service create
      ${createServiceObj.force ? '--force ' : ''}
      ${createServiceObj.name}
      ${createServiceObj.port ? ` --port ${createServiceObj.port}` : ''}
      ${envString} --image ${createServiceObj.image}
      ${createServiceObj.namespace ? ` -n ${createServiceObj.namespace}` : ''}
      ${annotationString}
      ${labelString}`;

    return commandString;
  }

  /**
   * Return the list of Knative Services in JSON format.
   */
  static listServices(): string {
    return `kn service list -o json`;
  }

  static printKnVersion(): string {
    return 'kn version';
  }

  static printKnVersionAndProjects(): string {
    return 'kn version && kn service list';
  }

  static knLogout(): string {
    return `kn logout`;
  }
}
