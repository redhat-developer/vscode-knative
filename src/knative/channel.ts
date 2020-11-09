export interface Channel {
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
  'messaging.knative.dev/subscribable': string;
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
  channelTemplate: ChannelTemplate;
}
export interface ChannelTemplate {
  apiVersion: string;
  kind: string;
}
export interface Status {
  address: Address;
  channel: Channel1;
  conditions?: ConditionsEntity[] | null;
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
export interface ConditionsEntity {
  lastTransitionTime: string;
  status: string;
  type: string;
}
