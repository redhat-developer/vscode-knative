/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { KnativeItem } from './knativeItem';
import { Revision } from './revision';

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

export class Service extends KnativeItem implements CreateService {
  constructor(public name: string, public image: string) {
    super();
  }

  revisions: Revision[];

  static toService(value: any): Service {
    const service = new Service(value.metadata.name, value.status.url);
    // service.name = value.metadata.name;
    // service.image = value.status.url;
    return service;
  }
}
