/* eslint-disable no-use-before-define */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { BaseSource, Metadata } from './baseSource';

export type sourceOptions = Array<Array<string>>;

export class APIServerSource extends BaseSource {
  constructor(
    public name: string,
    public parent: string,
    public resource: string,
    public sink: string,
    public details?: Items,
  ) {
    super(name, parent, details);
  }

  static JSONToSource(value: Items): APIServerSource {
    let controller: string;
    if (value.spec.resources) {
      controller = value.spec.resources[0].controllerSelector?.name;
    }
    let sinkNameOrUri: string;
    if (value.spec.sink) {
      if (value.spec.sink.ref) {
        sinkNameOrUri = value.spec.sink.ref.name;
      }
      if (value.spec.sink.uri) {
        sinkNameOrUri = value.spec.sink.uri;
      }
    }
    const source = new APIServerSource(value.metadata.name, 'Sources', controller, sinkNameOrUri, value);
    return source;
  }
}

export interface Items {
  apiVersion: string;
  kind: string;
  metadata: Metadata;
  spec: Spec;
  status: Status;
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
