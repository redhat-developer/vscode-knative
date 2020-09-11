/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { URL } from 'url';
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

export interface UpdateService {
  name: string;
  /**
   * --image string
   *
   * Image to run.
   */
  image?: string;
  /**
   * -p, --port int32
   *
   * The port where application listens on.
   */
  port?: number;
  /**
   * -n, --namespace string
   *
   * Specify the namespace to operate in.
   */
  namespace?: string;
  /**
   * -e, --env stringArray
   *
   * Environment variable to set. NAME=value; you may provide this flag any number of times to set multiple environment variables. To unset, specify the environment variable name followed by a "-" (e.g., NAME-).
   */
  env?: Map<string, string>;
  /**
   * -a, --annotation stringArray
   *
   * Service annotation to set. name=value; you may provide this flag any number of times to set multiple annotations. To unset, specify the annotation name followed by a "-" (e.g., name-).
   */
  annotation?: Map<string, boolean>;
  /**
   * -l, --label stringArray
   *
   * Labels to set for both Service and Revision. name=value; you may provide this flag any number of times to set multiple labels. To unset, specify the label name followed by a "-" (e.g., name-).
   */
  label?: Map<string, string>;
  /**
   * --limit strings
   *
   * The resource requirement limits for this Service. For example, 'cpu=100m,memory=256Mi'. You can use this flag multiple times. To unset a resource limit, append "-" to the resource name, e.g. '--limit memory-'.
   */
  limit?: Map<string, string>;
  /**
   * --request strings
   *
   * The resource requirement requests for this Service. For example, 'cpu=100m,memory=256Mi'. You can use this flag multiple times. To unset a resource request, append "-" to the resource name, e.g. '--request cpu-'.
   */
  request?: Map<string, string>;
  /**
   * --tag strings
   *
   * Set tag (format: --tag revisionRef=tagName) where revisionRef can be a revision or '@latest' string representing latest ready revision. This flag can be specified multiple times.
   */
  tag?: Map<string, string>;
  /**
   * --traffic strings
   *
   * Set traffic distribution (format: --traffic revisionRef=percent) where revisionRef can be a revision or a tag or '@latest' string representing latest ready revision. This flag can be given multiple times with percent summing up to 100%.
   */
  traffic?: Map<string, string>;
  /**
   * --untag strings
   *
   * Untag revision (format: --untag tagName). This flag can be specified multiple times.
   */
  untag?: Map<string, string>;
}

export class Service extends KnativeItem implements CreateService {
  constructor(public name: string, public image: string, public details?: Items) {
    super();
  }

  env?: Map<string, string>;

  port?: number;

  force?: boolean;

  annotation?: Map<string, boolean>;

  label?: Map<string, string>;

  namespace?: string;

  modified?: boolean;

  revisions: Revision[];

  static toService(value: Items): Service {
    const service = new Service(value.metadata.name, value.status.url, value);
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
  tag: string;
  revisionName: string;
  configurationName: string;
  latestRevision: boolean;
  percent: number;
  url: URL;
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
