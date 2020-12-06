/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Service } from './service';
import { Revision } from './revision';
// import { compareNodes } from '../kn/knativeTreeObject';

type revisionService = { revision: Revision; service: Service };
type revisionServiceIndex = { revisionIndex?: number; serviceIndex?: number };

/**
 * A singleton to hold the Services.
 * Public methods to control the list of Services.
 */
export class KnativeServices {
  private static instance: KnativeServices;

  // eslint-disable-next-line no-useless-constructor
  private constructor() {
    // do something if needed, but this is private for the singleton
  }

  public static get Instance(): KnativeServices {
    if (!KnativeServices.instance) {
      KnativeServices.instance = new KnativeServices();
    }
    return KnativeServices.instance;
  }

  private services: Service[];

  // eslint-disable-next-line class-methods-use-this
  private updateTree(): void {
    // tell the tree view to refresh it's look at the data in 'services'
    // convert services to tree objects and then sort them
  }

  public getServices(): Service[] {
    return this.services;
  }

  public findService(serviceName: string): Service {
    return this.services[this.services.findIndex((s) => s.name === serviceName)];
  }

  public findRevision(revisionName: string): Revision {
    let revision: Revision;

    this.services.find((s: Service) => {
      revision = s.revisions.find((r: Revision) => r.name === revisionName);
      if (revision === undefined) {
        return false;
      }
      return revision.name === revisionName;
    });

    return revision;
  }

  public findRevisionAndService(revisionName: string): revisionService {
    let revision: Revision;

    const service: Service = this.services.find((s: Service) => {
      revision = s.revisions.find((r: Revision) => r.name === revisionName);
      if (revision === undefined) {
        return false;
      }
      return revision.name === revisionName;
    });

    const rs: revisionService = { revision, service };
    return rs;
  }

  public findRevisionAndServiceIndex(revisionName: string): revisionServiceIndex {
    let revisionIndex: number;

    const serviceIndex: number = this.services.findIndex((s: Service) => {
      const revision: Revision = s.revisions.find((r: Revision) => r.name === revisionName);
      if (revision === undefined) {
        return false;
      }
      revisionIndex = s.revisions.findIndex((r: Revision) => r.name === revisionName);
      return revision.name === revisionName;
    });

    const rs: revisionServiceIndex = { revisionIndex, serviceIndex };
    return rs;
  }

  public addService(service: Service): Service {
    this.services.push(service);
    // this.services.sort(compareNodes);
    this.updateTree();
    return service;
  }

  public addServices(services: Service[]): Service[] {
    this.services = services;
    // this.services.sort(compareNodes);
    this.updateTree();
    return this.services;
  }

  public addRevisions(revisions: Revision[]): Revision[] {
    // The revision should know the name of the Service it belongs to.
    // The service should hold an array of it's revisions.
    // Set the revisions to the parent service item.
    this.findService(revisions[0].service).revisions = revisions;
    this.updateTree();
    return revisions;
  }

  public updateService(service: Service): Service[] {
    const updated: Service[] = this.services.map((s) => {
      if (s.name === service.name) {
        return service;
      }
      return s;
    });
    // passing this through a variable to ensure we don't change values while working on them
    this.services = updated;
    return this.services;
  }

  public removeService(name: string): Service[] {
    // find the index of the service passed in.
    const serviceIndex: number = this.services.findIndex((s) => s.name === name);
    // remove the service
    this.services.splice(serviceIndex, 1);

    this.updateTree();
    return this.services;
  }

  public removeRevision(name: string): void {
    // Find the Revision and it's Service
    const rs: revisionServiceIndex = this.findRevisionAndServiceIndex(name);

    // remove the revision
    this.services[rs.serviceIndex].revisions.splice(rs.revisionIndex, 1);

    this.updateTree();
  }
}
