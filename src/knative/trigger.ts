/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable no-use-before-define */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Broker } from './broker';
import { KnativeItem } from './knativeItem';
import { Sink } from './sink';

export class Trigger extends KnativeItem {
  constructor(
    public name: string,
    public parent: string,
    public broker: string,
    public filter: Map<string, string>,
    public sink: string,
    public details?: Items,
  ) {
    super();
  }

  childBroker: Broker;

  childSink: Sink;

  annotation?: Map<string, boolean>;

  label?: Map<string, string>;

  namespace?: string;

  modified?: boolean;

  static JSONToTrigger(value: Items): Trigger {
    // create a map of the filter key/value pairs
    const filters = new Map();
    if (value.spec.filter?.attributes) {
      // eslint-disable-next-line no-restricted-syntax, guard-for-in
      for (const f in value.spec.filter.attributes) {
        filters.set(f, value.spec.filter.attributes[f]);
      }
    }
    let sub: string;
    if (value.spec.subscriber) {
      if (value.spec.subscriber.ref) {
        sub = value.spec.subscriber.ref.name;
      }
      if (value.spec.subscriber.uri) {
        sub = value.spec.subscriber.uri;
      }
    }
    const trigger = new Trigger(value.metadata.name, 'Triggers', value.spec.broker, filters, sub, value);
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
  'f:metadata'?: Record<string, unknown> | null;
  'f:spec'?: Record<string, unknown> | null;
  'f:status'?: Record<string, unknown> | null;
}
export interface Spec {
  broker: string;
  filter: Filter;
  subscriber: Subscriber;
}
export interface Filter {
  attributes: Attributes;
}
export interface Attributes {
  name: string;
  type: string;
}
export interface Subscriber {
  ref?: Ref | null;
  uri?: string | null;
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
