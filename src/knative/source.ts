import { Sink } from './event';

export interface Source {
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
  finalizers?: string[] | null;
}
export interface Annotations {
  'sources.knative.dev/creator': string;
  'sources.knative.dev/lastModifier': string;
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
  mode?: string | null;
  resources?: ResourcesEntity[] | null;
  serviceAccountName?: string | null;
  sink: Sink;
  jsonData?: string | null;
  schedule?: string | null;
  subject?: RefOrSubject | null;
}
export interface ResourcesEntity {
  apiVersion: string;
  controller: boolean;
  controllerSelector: ControllerSelector;
  kind: string;
  labelSelector: {};
}
export interface ControllerSelector {
  apiVersion: string;
  kind: string;
  name: string;
  uid: string;
}
export interface RefOrSubject {
  apiVersion: string;
  kind: string;
  name: string;
  namespace: string;
}
export interface Status {
  conditions?: ConditionsEntity[] | null;
  observedGeneration: number;
  sinkUri: string;
  ceAttributes?: CeAttributesEntity[] | null;
}
export interface ConditionsEntity {
  lastTransitionTime: string;
  status: string;
  type: string;
  message?: string | null;
}
export interface CeAttributesEntity {
  source: string;
  type: string;
}
