export interface Broker {
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
  'eventing.knative.dev/broker.class': string;
  'eventing.knative.dev/creator': string;
  'eventing.knative.dev/lastModifier': string;
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
  conditions?: ConditionsEntity[] | null;
  observedGeneration: number;
}
export interface Address {
  url: string;
}
export interface ConditionsEntity {
  lastTransitionTime: string;
  status: string;
  type: string;
}
