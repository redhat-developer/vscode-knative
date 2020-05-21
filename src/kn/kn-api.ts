/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { CliCommand, createCliCommand } from './knCli';
import { CreateService } from '../knative/service';

function newKnCommand(knArguments: string[]): CliCommand {
  return createCliCommand('kn', ...knArguments);
}

// function newOcCommand(...ocArguments: string[]): CliCommand {
//   return createCliCommand('oc', ...ocArguments);
// }

/**
 * A series of commands for the knative cli `kn`.
 */
export class KnAPI {
  /**
   *
   * @param createServiceObj - a CreateService object that requires name and URL.
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
  static createService(createServiceObj: CreateService): CliCommand {
    // Set up the initial values for the command.
    const commandArguments: string[] = ['service', 'create'];
    // check if --force was set
    if (createServiceObj.force) {commandArguments.push('--force');}
    // It should always have a name value.
    commandArguments.push(createServiceObj.name);
    // If the port was set, use it.
    if (createServiceObj.port) {
      commandArguments.push('--port');
      commandArguments.push(`${createServiceObj.port}`);
    }
    // If ENV variables were included, add them all.
    if (createServiceObj.env) {
      createServiceObj.env.forEach((value, key) => {
        commandArguments.push('--env');
        commandArguments.push(`${key.toUpperCase()}=${value.toUpperCase()}`);
      });
    }
    // It should always have an image value.
    commandArguments.push('--image');
    commandArguments.push(`${createServiceObj.image}`);
    // If a namespace is listed, use it.
    if (createServiceObj.namespace) {
      commandArguments.push('-n');
      commandArguments.push(`${createServiceObj.namespace}`);
    }
    // If annotations were added then include them all.
    if (createServiceObj.annotation) {
      createServiceObj.annotation.forEach((value, key) => {
        commandArguments.push('--annotation');
        commandArguments.push(`${key}=${value}`);
      });
    }
    // If labels were added then include them all.
    if (createServiceObj.label) {
      createServiceObj.label.forEach((value, key) => {
        commandArguments.push('--label');
        commandArguments.push(`${key}=${value}`);
      });
    }

    return newKnCommand(commandArguments);
  }

  /**
   * Return the list of Knative Services in JSON format.
   */
  static listServices(): CliCommand {
    const a = ['service', 'list', '-o', 'json'];
    return newKnCommand(a);
  }

  /**
   * Describe the Knative feature in the `outputFormat`, if provided, for the `name` given.
   *
   * @param feature - This should be `service`, `revision`, etc
   */
  static describeFeature(feature: string, name: string, outputFormat?: string): CliCommand {
    const a = [feature, 'describe', name];
    if (outputFormat) {
      a.push(...['-o', outputFormat]);
    }
    return newKnCommand(a);
  }

  /**
   * Delete a Knative Services.
   *
   * @param name - the Name of the Service to be deleted.
   */
  static deleteFeature(contextValue: string, name: string): CliCommand {
    return newKnCommand([contextValue, 'delete', name]);
  }

  /**
   * Return the list of all Knative Revisions in JSON format in the current namespace.
   */
  static listRevisions(): CliCommand {
    const a = ['revision', 'list', '-o', 'json'];
    return newKnCommand(a);
  }

  /**
   * Return the list of all Knative Revisions in JSON format in the current namespace.
   */
  static listRevisionsForService(service: string ): CliCommand {
    const a = ['revision', 'list', '-o', 'json', '-s', service];
    return newKnCommand(a);
  }

  /**
   * Return the list of all Knative routes in JSON format in the current namespace.
   */
  static listRoutes(): CliCommand {
    const a = ['route', 'list', '-o', 'json'];
    return newKnCommand(a);
  }

  /**
   * Return the list of all Knative routes in JSON format in the current namespace.
   */
  static listRoutesForService(service: string ): CliCommand {
    const a = ['route', 'list', service, '-o', 'json'];
    return newKnCommand(a);
  }


  static printKnVersion(): CliCommand {
    return newKnCommand(['version']);
  }

  // static printKnVersionAndProjects(): CliCommand {
  //   return newKnCommand(['version', '&&', 'kn', 'service', 'list']);
  // }

  static knLogout(): CliCommand {
    return newKnCommand(['logout']);
  }
}
