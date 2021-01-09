/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { BaseSource, Items } from './baseSource';

export type sourceOptions = Array<Array<string>>;

export class GenericSource extends BaseSource {
  constructor(
    public name: string,
    public parent: string,
    public sourceType: string,
    public sink: string,
    public options?: sourceOptions,
    public details?: Items,
  ) {
    super(name, parent, details);
  }

  static JSONToSource(value: Items): GenericSource {
    let snk: string;
    if (value.spec.sink) {
      if (value.spec.sink.ref) {
        snk = value.spec.sink.ref.name;
      }
      if (value.spec.sink.uri) {
        snk = value.spec.sink.uri;
      }
    }
    const source = new GenericSource(value.metadata.name, 'Sources', value.kind, snk, null, value);
    return source;
  }
}
