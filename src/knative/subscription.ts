import { Channel } from './channel';

export interface Subscription {
  apiVersion: string;
  items?: ItemsEntity[] | null;
  kind: string;
}
export interface ItemsEntity {
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
}
export interface Annotations {
  'messaging.knative.dev/creator': string;
  'messaging.knative.dev/lastModifier': string;
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
  conditions?: ConditionsEntity[] | null;
  observedGeneration: number;
  physicalSubscription: PhysicalSubscription;
}
export interface ConditionsEntity {
  lastTransitionTime: string;
  status: string;
  type: string;
  message?: string | null;
  reason?: string | null;
}
export interface PhysicalSubscription {
  subscriberUri?: string | null;
}
