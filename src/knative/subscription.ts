/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Channel } from './channel';
import { Sink } from './event';
import { KnativeItem } from './knativeItem';

export class Subscription extends KnativeItem {
  constructor(
    public name: string,
    public channel: Channel,
    public sink: Sink,
    public sinkDeadLetter?: Sink,
    public sinkReply?: Sink,
    public details?: Items,
  ) {
    super();
  }

  annotation?: Map<string, boolean>;

  label?: Map<string, string>;

  namespace?: string;

  modified?: boolean;

  static JSONToSubscription(value: Items): Subscription {
    const subscription = new Subscription(value.metadata.name, value.spec.channel, null, null, null, value);
    return subscription;
  }
}

export interface JSONSubscription {
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
  'messaging.knative.dev/creator': string;
  'messaging.knative.dev/lastModifier': string;
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
  channel: Channel;
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
  physicalSubscription: PhysicalSubscription;
}
export interface Conditions {
  lastTransitionTime: string;
  status: string;
  type: string;
  message?: string | null;
  reason?: string | null;
}
export interface PhysicalSubscription {
  subscriberUri?: string | null;
}
