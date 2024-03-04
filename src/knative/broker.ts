/* eslint-disable no-use-before-define */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { KnativeItem } from './knativeItem';

export class Broker extends KnativeItem {
  constructor(
    public name: string,
    public parent: string,
    public details?: Items,
  ) {
    super();
  }

  annotation?: Map<string, boolean>;

  label?: Map<string, string>;

  namespace?: string;

  modified?: boolean;

  static JSONToBroker(value: Items): Broker {
    const broker = new Broker(value.metadata.name, 'Brokers', value);
    return broker;
  }
}

export interface Items {
  apiVersion: string;
  kind: string;
  metadata: Metadata;
  spec: Spec;
  status: Status;
}
export interface Metadata {
  annotations: Annotations;
  creationTimestamp: string;
  finalizers?: string[] | null;
  generation: number;
  managedFields?: ManagedFields[] | null;
  name: string;
  namespace: string;
  resourceVersion: string;
  selfLink: string;
  uid: string;
}
export interface Annotations {
  'eventing.knative.dev/broker.class': string;
  'eventing.knative.dev/creator': string;
  'eventing.knative.dev/lastModifier': string;
}
export interface ManagedFields {
  apiVersion: string;
  fieldsType: string;
  fieldsV1: FieldsV1;
  manager: string;
  operation: string;
  time: string;
}
export interface FieldsV1 {
  'f:metadata'?: Record<string, unknown> | null;
  'f:spec'?: Record<string, unknown> | null;
  'f:status'?: Record<string, unknown> | null;
}
export interface Spec {
  config: Config;
}
export interface Config {
  apiVersion: string;
  kind: string;
  name: string;
  namespace: string;
}
export interface Status {
  address: Address;
  conditions?: Conditions[] | null;
  observedGeneration: number;
}
export interface Address {
  url: string;
}
export interface Conditions {
  lastTransitionTime: string;
  status: string;
  type: string;
}
