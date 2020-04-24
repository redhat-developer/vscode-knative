/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { TreeObject } from './knativeTreeObject';

export interface KnativeEvent {
  readonly type: 'deleted' | 'inserted' | 'changed';
  readonly data: TreeObject;
  readonly reveal: boolean;
}

export class KnativeTreeEvent implements KnativeEvent {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    readonly type: 'deleted' | 'inserted' | 'changed',
    readonly data: TreeObject,
    readonly reveal: boolean = false,
  ) {}
}
