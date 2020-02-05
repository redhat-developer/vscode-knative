/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import KnativeItem from './knativeItem';
import Platform from '../util/platform';
import KnAPI from '../kn/kn-api';
import { executeInTerminal } from '../kn/knExecute';

export default class Service extends KnativeItem {
  static list(): Promise<void> {
    return executeInTerminal(KnAPI.listServices(), Platform.getUserHomePath());
  }
}
