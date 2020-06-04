/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { URL } from 'url';
import { KnativeItem } from './knativeItem';

export class Revision extends KnativeItem {
  constructor(public name: string, public service: string, public details?: Items, public traffic?: Traffic[] | null) {
    super();
  }

  status: boolean;

  static toRevision(value: Items, revisionTraffic: Traffic[]): Revision {
    const revision = new Revision(value.metadata.name, value.metadata.ownerReferences[0].name, value, revisionTraffic);
    return revision;
  }
}
export interface Traffic {
  tag: string;
  revisionName: string;
  confgiurationName: string;
  latestRevision: boolean;
  percent: number;
  url: URL;
}
export interface JSONRevision {
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
  generateName?: string | null;
  generation: number;
  labels: Labels;
  managedFields?: ManagedFields[] | null;
  name: string;
  namespace: string;
  ownerReferences?: OwnerReferencesEntity[] | null;
  resourceVersion: string;
  selfLink: string;
  uid: string;
}
export interface Annotations {
  'image.openshift.io/triggers'?: string | null;
  'serving.knative.dev/creator': string;
  'serving.knative.dev/lastPinned': string;
  'client.knative.dev/user-image'?: string | null;
}
export interface Labels {
  'app.kubernetes.io/component'?: string | null;
  'app.kubernetes.io/instance'?: string | null;
  'app.kubernetes.io/name'?: string | null;
  'app.kubernetes.io/part-of'?: string | null;
  'app.openshift.io/runtime'?: string | null;
  'app.openshift.io/runtime-namespace'?: string | null;
  'app.openshift.io/runtime-version'?: string | null;
  'serving.knative.dev/configuration': string;
  'serving.knative.dev/configurationGeneration': string;
  'serving.knative.dev/route'?: string | null;
  'serving.knative.dev/service': string;
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
export interface OwnerReferencesEntity {
  apiVersion: string;
  blockOwnerDeletion: boolean;
  controller: boolean;
  kind: string;
  name: string;
  uid: string;
}
export interface Spec {
  containerConcurrency: number;
  containers?: Containers[] | null;
  timeoutSeconds: number;
}
export interface Containers {
  image: string;
  imagePullPolicy?: string | null;
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
export interface Status {
  conditions?: Conditions[] | null;
  imageDigest: string;
  logUrl: string;
  observedGeneration: number;
  serviceName: string;
}
export interface Conditions {
  lastTransitionTime: string;
  message?: string | null;
  reason?: string | null;
  severity?: string | null;
  status: string;
  type: string;
}
