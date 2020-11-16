/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { KnativeItem } from './knativeItem';

export class Channel extends KnativeItem {
  constructor(public name: string, public channelType: string, public details?: Items) {
    super();
  }

  annotation?: Map<string, boolean>;

  label?: Map<string, string>;

  namespace?: string;

  modified?: boolean;

  static JSONToChannel(value: Items): Channel {
    const channel = new Channel(value.metadata.name, value.spec.channelTemplate.kind, value);
    return channel;
  }
}

export interface JSONChannel {
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
  'messaging.knative.dev/subscribable': string;
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
  channelTemplate: ChannelTemplate;
}
export interface ChannelTemplate {
  apiVersion: string;
  kind: string;
}
export interface Status {
  address: Address;
  channel: Channel1;
  conditions?: Conditions[] | null;
  observedGeneration: number;
}
export interface Address {
  url: string;
}
export interface Channel1 {
  apiVersion: string;
  kind: string;
  name: string;
  namespace: string;
}
export interface Conditions {
  lastTransitionTime: string;
  status: string;
  type: string;
}
