/* eslint-disable no-use-before-define */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

// import { Sink } from './event';
import { KnativeItem } from './knativeItem';
import { Sink as sinkType } from './sink';

export type sourceOptions = Array<Array<string>>;

export class BaseSource extends KnativeItem {
  constructor(
    public name: string,
    public parent: string,
    public details?: Items,
  ) {
    super();
  }

  childSink: sinkType;

  annotation?: Map<string, boolean>;

  label?: Map<string, string>;

  namespace?: string;

  modified?: boolean;
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
  finalizers?: string[] | null;
}
export interface Annotations {
  'sources.knative.dev/creator': string;
  'sources.knative.dev/lastModifier': string;
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
  'f:metadata'?: Record<string, unknown> | null;
  'f:spec'?: Record<string, unknown> | null;
  'f:status'?: Record<string, unknown> | null;
}
export interface Spec {
  mode?: string | null;
  resources?: Resources[] | null;
  serviceAccountName?: string | null;
  sink: Sink;
  jsonData?: string | null;
  schedule?: string | null;
  subject?: RefOrSubject | null;
}
export interface Resources {
  apiVersion: string;
  controller: boolean;
  controllerSelector: ControllerSelector;
  kind: string;
  labelSelector: Record<string, unknown>;
}
export interface ControllerSelector {
  apiVersion: string;
  kind: string;
  name: string;
  uid: string;
}
export interface Sink {
  ref?: RefOrSubject | null;
  uri?: string | null;
}
export interface RefOrSubject {
  apiVersion: string;
  kind: string;
  name: string;
  namespace: string;
}
export interface Status {
  conditions?: Conditions[] | null;
  observedGeneration: number;
  sinkUri: string;
  ceAttributes?: CeAttributes[] | null;
}
export interface Conditions {
  lastTransitionTime: string;
  status: string;
  type: string;
  message?: string | null;
}
export interface CeAttributes {
  source: string;
  type: string;
}
