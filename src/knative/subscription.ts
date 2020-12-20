/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Channel } from './channel';
import { Sink } from './sink';
import { KnativeItem } from './knativeItem';

export class Subscription extends KnativeItem {
  constructor(
    public name: string,
    public parent: string,
    public channel: string,
    public sink: string,
    public sinkDeadLetter?: string,
    public sinkReply?: string,
    public details?: Items,
  ) {
    super();
  }

  childChannel: Channel;

  childSink: Sink;

  childSinkDeadLetter?: Sink;

  childSinkReply?: Sink;

  annotation?: Map<string, boolean>;

  label?: Map<string, string>;

  namespace?: string;

  modified?: boolean;

  static JSONToSubscription(value: Items): Subscription {
    const subscription = new Subscription(
      value.metadata.name,
      'Subscriptions',
      value.spec.channel?.name,
      value.spec.subscriber?.ref?.name,
      value.spec.delivery?.deadLetterSink?.ref?.name,
      value.spec.reply?.ref?.name,
      value,
    );
    return subscription;
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
  managedFields?: ManagedFieldsEntity[] | null;
  name: string;
  namespace: string;
  resourceVersion: string;
  selfLink: string;
  uid: string;
  labels?: Labels | null;
  ownerReferences?: OwnerReferencesEntity[] | null;
}
export interface Annotations {
  'messaging.knative.dev/creator': string;
  'messaging.knative.dev/lastModifier': string;
}
export interface Labels {
  'eventing.knative.dev/broker': string;
  'eventing.knative.dev/trigger': string;
}
export interface ManagedFieldsEntity {
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
export interface OwnerReferencesEntity {
  apiVersion: string;
  blockOwnerDeletion: boolean;
  controller: boolean;
  kind: string;
  name: string;
  uid: string;
}
export interface Ref {
  apiVersion: string;
  kind: string;
  name: string;
  namespace: string;
}
export interface SinkRef {
  ref?: Ref | null;
  uri?: string | null;
}
export interface Spec {
  channel: Ref;
  subscriber: SinkRef;
  delivery?: Delivery | null;
  reply?: SinkRef | null;
}
export interface Delivery {
  deadLetterSink: SinkRef;
}
export interface Status {
  conditions?: ConditionsEntity[] | null;
  observedGeneration: number;
  physicalSubscription: PhysicalSubscription;
}
export interface ConditionsEntity {
  lastTransitionTime: string;
  status: string;
  type: string;
}
export interface PhysicalSubscription {
  subscriberUri: string;
  deadLetterSinkUri?: string | null;
  replyUri?: string | null;
}
