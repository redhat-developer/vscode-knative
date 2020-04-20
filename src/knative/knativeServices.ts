/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import Service from './service';
import Revision from './revision';
// import { compareNodes } from '../kn/knativeTreeObject';

export default class KnativeServices {
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

  private revisions: Revision[];

  // eslint-disable-next-line class-methods-use-this
  private updateTree(): void {
    // tell the tree view to refresh it's look at the data in 'services'
    // convert services to tree objects and then sort them
  }

  public getServices(): Service[] {
    return this.services;
  }

  public findServices(name: string): Service {
    return this.services[this.services.findIndex((s)=> s.name === name)];
  }

  public addService(service: Service): Service[] {
    this.services.push(service);
    // this.services.sort(compareNodes);
    this.updateTree();
    return this.services;
  }

  public addServices(services: Service[]): Service[] {
    this.services = services;
    // this.services.sort(compareNodes);
    this.updateTree();
    return this.services;
  }

  public addRevisions(revisions: Revision[]): Revision[] {
    this.revisions = revisions;
    // this.revisions.sort(compareNodes);
    this.updateTree();
    return this.revisions;
  }

  public updateService(service: Service): Service[] {
    const updated: Service[] = this.services.map((s)=> {
      if (s.name === service.name) {
        return service;
      }
      return s;
    });
    // passing this through a variable to ensure we don't change values while working on them
    this.services = updated;
    return this.services;
  }

  public removeService(service: Service): Service[] {
    // find the index of the service passed in.
    const servicdIndex: number = this.services.findIndex((s)=> s.name === service.name)
    // remove the service
    this.services.splice(servicdIndex, 1);
    this.updateTree();
    return this.services;
  }
}
