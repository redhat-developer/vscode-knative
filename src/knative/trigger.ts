export interface Trigger {
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
  labels: Labels;
  managedFields?: ManagedFieldsEntity[] | null;
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
  conditions?: ConditionsEntity[] | null;
  observedGeneration: number;
  subscriberUri: string;
}
export interface ConditionsEntity {
  lastTransitionTime: string;
  status: string;
  type: string;
}
