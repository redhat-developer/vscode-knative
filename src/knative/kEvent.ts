/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Broker } from './broker';
import { Channel } from './channel';
import { KnativeItem } from './knativeItem';
import { Subscription } from './subscription';
import { Trigger } from './trigger';
import { SourceTypes } from './knativeSources';

export class KEvent extends KnativeItem {
  constructor(public name: string) {
    super();
  }

  // public children: Broker[] | Channel[] | Source[] | Subscription[] | Trigger[];
  public children: Array<Broker | Channel | SourceTypes | Subscription | Trigger>;
}
