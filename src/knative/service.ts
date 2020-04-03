/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import KnativeItem from './knativeItem';

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

export default class Service extends KnativeItem {
  name: string;

  image: string;

  static services: Service[];

  static toService(value: any): Service {
    const service = new Service();
    service.name = value.metadata.name;
    service.image = value.status.url;
    return service;
  }
}
