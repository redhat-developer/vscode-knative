/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { CliCommand, createCliCommand, CmdCli } from './cmdCli';
import { CreateService, UpdateService } from '../knative/service';

function knCliCommand(cmdArguments: string[]): CliCommand {
  return createCliCommand('kn', ...cmdArguments);
}

// function newOcCommand(...ocArguments: string[]): CliCommand {
//   return createCliCommand('oc', ...ocArguments);
// }

type op = Array<Array<string>>;

/**
 * A series of commands for the knative cli `kn`.
 */
export class KnAPI {
  /**
   *
   * @param createServiceObj - a CreateService object that requires name and URL.
   *
   * #### Create a service 'mySvc' using image at dev.local/ns/image:latest
   * `kn service create mySvc --image dev.local/ns/image:latest`
   *
   * #### Create a service with multiple environment variables
   * `kn service create mySvc --env KEY1=VALUE1 --env KEY2=VALUE2 --image dev.local/ns/image:latest`
   *
   * #### Create or replace a service 's1' with image dev.local/ns/image:v2 using --force flag
   * if service 's1' doesn't exist, it's just a normal create operation
   * `kn service create --force s1 --image dev.local/ns/image:v2`
   *
   * #### Create or replace environment variables of service 's1' using --force flag
   * `kn service create --force s1 --env KEY1=NEW_VALUE1 --env NEW_KEY2=NEW_VALUE2 --image dev.local/ns/image:v1`
   *
   * #### Create service 'mySvc' with port 80
   * `kn service create mySvc --port 80 --image dev.local/ns/image:latest`
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
    if (createServiceObj.force) {
      commandArguments.push('--force');
    }
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
        commandArguments.push(`${key}=${value.toString()}`);
      });
    }
    // If labels were added then include them all.
    if (createServiceObj.label) {
      createServiceObj.label.forEach((value, key) => {
        commandArguments.push('--label');
        commandArguments.push(`${key}=${value}`);
      });
    }

    return knCliCommand(commandArguments);
  }

  /**
   *
   * @param updateServiceObj - a UpdateService object that requires the service name.
   *
   * #### Updates a service 'svc' with new environment variables
   * `kn service update svc --env KEY1=VALUE1 --env KEY2=VALUE2`
   *
   * #### Update a service 'svc' with new port
   * `kn service update svc --port 80`
   *
   * #### Updates a service 'svc' with new request and limit parameters
   * `kn service update svc --request cpu=500m --limit memory=1024Mi --limit cpu=1000m`
   *
   * #### Assign tag 'latest' and 'stable' to revisions 'echo-v2' and 'echo-v1' respectively
   * `kn service update svc --tag echo-v2=latest --tag echo-v1=stable`
   * OR
   * `kn service update svc --tag echo-v2=latest,echo-v1=stable`
   *
   * #### Update tag from 'testing' to 'staging' for latest ready revision of service
   * `kn service update svc --untag testing --tag @latest=staging`
   *
   * #### Add tag 'test' to echo-v3 revision with 10% traffic and rest to latest ready revision of service
   * `kn service update svc --tag echo-v3=test --traffic test=10,@latest=90`
   */
  static updateService(updateServiceObj: UpdateService): CliCommand {
    // Set up the initial values for the command.
    const commandArguments: string[] = ['service', 'update', updateServiceObj.name];
    // If an image is list, use it.
    if (updateServiceObj.image) {
      commandArguments.push('--image');
      commandArguments.push(`${updateServiceObj.image}`);
    }
    // If the port was set, use it.
    if (updateServiceObj.port) {
      commandArguments.push('--port');
      commandArguments.push(`${updateServiceObj.port}`);
    }
    // If a namespace is listed, use it.
    if (updateServiceObj.namespace) {
      commandArguments.push('-n');
      commandArguments.push(`${updateServiceObj.namespace}`);
    }
    // If ENV variables were included, add them all.
    if (updateServiceObj.env) {
      updateServiceObj.env.forEach((value, key) => {
        commandArguments.push('--env');
        commandArguments.push(`${key.toUpperCase()}=${value.toUpperCase()}`);
      });
    }
    // If annotations were added then include them all.
    if (updateServiceObj.annotation) {
      updateServiceObj.annotation.forEach((value, key) => {
        commandArguments.push('--annotation');
        commandArguments.push(`${key}=${value.toString()}`);
      });
    }
    // If labels were added then include them all.
    if (updateServiceObj.label) {
      updateServiceObj.label.forEach((value, key) => {
        commandArguments.push('--label');
        commandArguments.push(`${key}=${value}`);
      });
    }
    // If labels were added then include them all.
    if (updateServiceObj.limit) {
      updateServiceObj.limit.forEach((value, key) => {
        commandArguments.push('--limit');
        commandArguments.push(`${key}=${value}`);
      });
    }
    // If labels were added then include them all.
    if (updateServiceObj.request) {
      updateServiceObj.request.forEach((value, key) => {
        commandArguments.push('--request');
        commandArguments.push(`${key}=${value}`);
      });
    }
    // If labels were added then include them all.
    if (updateServiceObj.tag) {
      updateServiceObj.tag.forEach((value, key) => {
        commandArguments.push('--tag');
        commandArguments.push(`${key}=${value}`);
      });
    }
    // If labels were added then include them all.
    if (updateServiceObj.traffic) {
      updateServiceObj.traffic.forEach((value, key) => {
        commandArguments.push('--traffic');
        commandArguments.push(`${key}=${value}`);
      });
    }
    // If labels were added then include them all.
    if (updateServiceObj.untag) {
      updateServiceObj.untag.forEach((value, key) => {
        commandArguments.push('--untag');
        commandArguments.push(`${key}=${value}`);
      });
    }

    return knCliCommand(commandArguments);
  }

  /**
   * Return the list of Knative Services in JSON format.
   */
  static listServices(): CliCommand {
    const a = ['service', 'list', '-o', 'json'];
    return knCliCommand(a);
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
    return knCliCommand(a);
  }

  /**
   * Delete a Knative Services.
   *
   * @param name - the Name of the Service to be deleted.
   */
  static deleteFeature(contextValue: string, name: string): CliCommand {
    const context = contextValue.split('_');
    return knCliCommand([context[0], 'delete', name]);
  }

  /**
   * Return the list of all Knative Revisions in JSON format in the current namespace.
   */
  static listRevisions(): CliCommand {
    const a = ['revision', 'list', '-o', 'json'];
    return knCliCommand(a);
  }

  /**
   * Return the list of all Knative Revisions in JSON format in the current namespace.
   */
  static listRevisionsForService(service: string): CliCommand {
    const a = ['revision', 'list', '-o', 'json', '-s', service];
    return knCliCommand(a);
  }

  /**
   * Return the list of all Knative routes in JSON format in the current namespace.
   */
  static listRoutes(): CliCommand {
    const a = ['route', 'list', '-o', 'json'];
    return knCliCommand(a);
  }

  /**
   * Return the list of all Knative routes in JSON format in the current namespace.
   */
  static listRoutesForService(service: string): CliCommand {
    const a = ['route', 'list', service, '-o', 'json'];
    return knCliCommand(a);
  }

  static printKnVersion(): CliCommand {
    return knCliCommand(['version']);
  }

  static async getKnVersion(location: string): Promise<string> {
    const version = new RegExp(
      `Version:\\s+v(((([0-9]+)\\.([0-9]+)\\.([0-9]+)|(([0-9]+)-([0-9a-zA-Z]+)-([0-9a-zA-Z]+)))(?:-([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?)(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?).*`,
    );
    let detectedVersion: string;

    try {
      const data = await CmdCli.getInstance().execute(createCliCommand(`${location}`, `version`));

      if (data.stdout) {
        const toolVersion: string[] = data.stdout
          .trim()
          .split('\n')
          // Find the line of text that has the version.
          .filter((value1) => version.exec(value1))
          // Pull out just the version from the line from above.
          .map((value2) => {
            const regexResult = version.exec(value2);
            if (regexResult[8]) {
              // if the version is a local build then we will find more regex value and we need to pull the 8th in the array
              return regexResult[8];
            }
            // if it is a released version then just get it
            return regexResult[1];
          });
        if (toolVersion.length) {
          [detectedVersion] = toolVersion;
        }
      }
      return detectedVersion;
    } catch (error) {
      // eslint-disable-next-line no-console
      // console.log(`GetVersion had an error: ${error}`);
      return undefined;
    }
  }

  /**
   * Return the list of all Knative Event Sources in JSON format in the current namespace.
   */
  static listSources(): CliCommand {
    const a = ['source', 'list', '-o', 'json'];
    return knCliCommand(a);
  }

  /**
   * Return the list of all Knative Event Sources in JSON format in the current namespace.
   */
  static listSourceTypes(): CliCommand {
    const a = ['source', 'list-types', '-o', 'json'];
    return knCliCommand(a);
  }

  /**
   * Create an Event Source.
   *
   * @param sourceType
   * @param name
   * @param options
   */
  static createSource(sourceType: string, name: string, options?: op): CliCommand {
    const a = ['source', sourceType, 'create', name];
    // Add each option flag and value to the command string.
    if (options) {
      options.forEach((option: string[]) => {
        a.push(option[0]);
        a.push(option[1]);
      });
    }
    return knCliCommand(a);
  }

  /**
   * Update an Event Source.
   *
   * @param sourceType
   * @param name
   * @param options
   */
  static updateSource(sourceType: string, name: string, options?: op): CliCommand {
    const a = ['source', sourceType, 'update', name];
    // Add each option flag and value to the command string.
    if (options) {
      options.forEach((option: string[]) => {
        a.push(option[0]);
        a.push(option[1]);
      });
    }
    return knCliCommand(a);
  }

  /**
   * Delete an Event Source.
   *
   * @param sourceType
   * @param name
   */
  static deleteSource(sourceType: string, name: string): CliCommand {
    const a = ['source', sourceType, 'delete', name];
    return knCliCommand(a);
  }

  /**
   * Describe an Event Source.
   *
   * @param sourceType
   * @param name
   */
  static describeSource(sourceType: string, name: string): CliCommand {
    const a = ['source', sourceType, 'describe', name];
    return knCliCommand(a);
  }

  /**
   * Return the list of all Knative Event Subscriptions in JSON format in the current namespace.
   */
  static listSubscriptions(): CliCommand {
    const a = ['subscription', 'list', '-o', 'json'];
    return knCliCommand(a);
  }

  /**
   * Create an Event Subscription.
   *
   * @param name
   * @param options
   */
  static createSubscription(name: string, options?: op): CliCommand {
    const a = ['subscription', 'create', name];
    // Add each option flag and value to the command string.
    if (options) {
      options.forEach((option: string[]) => {
        a.push(option[0]);
        a.push(option[1]);
      });
    }
    return knCliCommand(a);
  }

  /**
   * Update an Event Subscription.
   *
   * @param name
   * @param options
   */
  static updateSubscription(name: string, options?: op): CliCommand {
    const a = ['subscription', 'update', name];
    // Add each option flag and value to the command string.
    if (options) {
      options.forEach((option: string[]) => {
        a.push(option[0]);
        a.push(option[1]);
      });
    }
    return knCliCommand(a);
  }

  /**
   * Delete an Event Subscription.
   *
   * @param name
   */
  static deleteSubscription(name: string): CliCommand {
    const a = ['subscription', 'delete', name];
    return knCliCommand(a);
  }

  /**
   * Return the list of all Knative Event Triggers in JSON format in the current namespace.
   */
  static listTriggers(): CliCommand {
    const a = ['trigger', 'list', '-o', 'json'];
    return knCliCommand(a);
  }

  /**
   * Create an Event Trigger.
   *
   * @param name
   * @param options
   */
  static createTrigger(name: string, options?: op): CliCommand {
    const a = ['trigger', 'create', name];
    // Add each option flag and value to the command string.
    if (options) {
      options.forEach((option: string[]) => {
        a.push(option[0]);
        a.push(option[1]);
      });
    }
    return knCliCommand(a);
  }

  /**
   * Update an Event Trigger.
   *
   * @param name
   * @param options
   */
  static updateTrigger(name: string, options?: op): CliCommand {
    const a = ['trigger', 'update', name];
    // Add each option flag and value to the command string.
    if (options) {
      options.forEach((option: string[]) => {
        a.push(option[0]);
        a.push(option[1]);
      });
    }
    return knCliCommand(a);
  }

  /**
   * Delete an Event Trigger.
   *
   * @param name
   */
  static deleteTrigger(name: string): CliCommand {
    const a = ['trigger', 'delete', name];
    return knCliCommand(a);
  }

  /**
   * Return the list of all Knative Event Brokers in JSON format in the current namespace.
   */
  static listBrokers(): CliCommand {
    const a = ['broker', 'list', '-o', 'json'];
    return knCliCommand(a);
  }

  /**
   * Create an Event Broker.
   *
   * @param name
   * @param options
   */
  static createBroker(name: string): CliCommand {
    const a = ['broker', 'create', name];
    return knCliCommand(a);
  }

  /**
   * Delete an Event Broker.
   *
   * @param name
   */
  static deleteBroker(name: string): CliCommand {
    const a = ['broker', 'delete', name];
    return knCliCommand(a);
  }

  /**
   * Return the list of all Knative Event Channels in JSON format in the current namespace.
   */
  static listChannels(): CliCommand {
    const a = ['channel', 'list', '-o', 'json'];
    return knCliCommand(a);
  }

  /**
   * Return the list of all Knative Event Channels in JSON format in the current namespace.
   */
  static listChannelTypes(): CliCommand {
    const a = ['channel', 'list-types', '-o', 'json'];
    return knCliCommand(a);
  }

  /**
   * Create an Event Channel.
   *
   * @param name
   * @param options
   */
  static createChannel(name: string): CliCommand {
    const a = ['channel', 'create', name];
    return knCliCommand(a);
  }

  /**
   * Delete an Event Channel.
   *
   * @param name
   */
  static deleteChannel(name: string): CliCommand {
    const a = ['channel', 'delete', name];
    return knCliCommand(a);
  }
}
