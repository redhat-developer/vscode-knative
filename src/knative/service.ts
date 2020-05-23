/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { KnativeItem } from './knativeItem';
import { Revision } from './revision';

export interface CreateService {
  name: string;
  image: string;
  env?: Map<string, string>;
  port?: number;
  force?: boolean;
  annotation?: Map<string, boolean>;
  label?: Map<string, string>;
  namespace?: string;
}

export class Service extends KnativeItem implements CreateService {

  constructor(
    public name: string,
    public image: string,
    public details?: Items
  ) {
    super();
  }

  env?: Map<string, string>;

  port?: number;

  force?: boolean;

  annotation?: Map<string, boolean>;

  label?: Map<string, string>;

  namespace?: string;

  revisions: Revision[];

  static toService(value: Items): Service {
    const service = new Service(
      value.metadata.name,
      value.status.url,
      value
    );
    return service;
  }
}

export interface JSONService {
  apiVersion?: string;
  items?: Items[] | null;
  kind?: string;
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
  labels?: Labels | null;
  managedFields?: ManagedFields[] | null;
  name: string;
  namespace: string;
  resourceVersion: string;
  selfLink: string;
  uid: string;
}
export interface Annotations {
  'openshift.io/generated-by'?: string | null;
  'serving.knative.dev/creator': string;
  'serving.knative.dev/lastModifier': string;
  'client.knative.dev/user-image'?: string | null;
}
export interface Spec {
  template: Template;
  traffic?: Traffic[] | null;
}
export interface Template {
  metadata: Metadata;
  spec: TemplateSpec;
}

export interface Labels {
  'app.kubernetes.io/component': string;
  'app.kubernetes.io/instance': string;
  'app.kubernetes.io/name': string;
  'app.kubernetes.io/part-of': string;
  'app.openshift.io/runtime': string;
  'app.openshift.io/runtime-namespace': string;
  'app.openshift.io/runtime-version': string;
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
export interface TemplateSpec {
  containerConcurrency: number;
  containers?: Containers[] | null;
  timeoutSeconds: number;
}
export interface Containers {
  image: string;
  name: string;
  ports?: Ports[] | null;
  readinessProbe: ReadinessProbe;
  resources: Resources;
}
export interface Ports {
  containerPort: number;
}
export interface ReadinessProbe {
  successThreshold: number;
  tcpSocket: TcpSocket;
}
export interface TcpSocket {
  port: number;
}
export interface Resources {
  limits: {};
  requests: {};
}
export interface Traffic {
  latestRevision: boolean;
  percent: number;
  revisionName: string;
}
export interface Status {
  address: Address;
  conditions?: Conditions[] | null;
  latestCreatedRevisionName: string;
  latestReadyRevisionName: string;
  observedGeneration: number;
  traffic?: Traffic[] | null;
  url: string;
}
export interface Address {
  url: string;
}
export interface Conditions {
  lastTransitionTime: string;
  status: string;
  type: string;
}
