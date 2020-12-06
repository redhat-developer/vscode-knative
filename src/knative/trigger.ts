/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { KnativeItem } from './knativeItem';

export class Trigger extends KnativeItem {
  constructor(public name: string, public parent: string, public details?: Items) {
    super();
  }

  annotation?: Map<string, boolean>;

  label?: Map<string, string>;

  namespace?: string;

  modified?: boolean;

  static JSONToTrigger(value: Items): Trigger {
    const trigger = new Trigger(value.metadata.name, 'Triggers', value);
    return trigger;
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
  generation: number;
  labels: Labels;
  managedFields?: ManagedFields[] | null;
  name: string;
  namespace: string;
  resourceVersion: string;
  selfLink: string;
  uid: string;
}
export interface Annotations {
  'eventing.knative.dev/creator': string;
  'eventing.knative.dev/lastModifier': string;
}
export interface Labels {
  'eventing.knative.dev/broker': string;
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
  broker: string;
  filter: {};
  subscriber: Subscriber;
}
export interface Subscriber {
  ref: Ref;
}
export interface Ref {
  apiVersion: string;
  kind: string;
  name: string;
  namespace: string;
}
export interface Status {
  conditions?: Conditions[] | null;
  observedGeneration: number;
  subscriberUri: string;
}
export interface Conditions {
  lastTransitionTime: string;
  status: string;
  type: string;
}
