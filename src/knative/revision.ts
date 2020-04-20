/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import KnativeItem from './knativeItem';

export default class Revision extends KnativeItem {
  name: string;

  service: string;

  status: boolean;

  static revisions: Revision[];

  static toRevision(value: any): Revision {
    const revision = new Revision();
    revision.name = value.metadata.name;
    revision.service = value.metadata.ownerReferences[0].name;
    return revision;
  }
}
