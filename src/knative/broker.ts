/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { KnativeItem } from './knativeItem';

export class Broker extends KnativeItem {
  constructor(public name: string, public details?: Items) {
    super();
  }

  annotation?: Map<string, boolean>;

  label?: Map<string, string>;

  namespace?: string;

  modified?: boolean;

  static JSONToBroker(value: Items): Broker {
    const broker = new Broker(value.metadata.name, value);
    return broker;
  }
}

export interface JSONBroker {
  apiVersion: string;
  items?: Items[] | null;
  kind: string;
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
  'f:metadata'?: {} | null;
  'f:spec'?: {} | null;
  'f:status'?: {} | null;
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
