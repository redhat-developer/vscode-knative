/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Filters } from './filters';

export function prettifyJson(str: string): string {
  let jsonData: string;
  try {
    jsonData = JSON.stringify(JSON.parse(str), null, 2);
  } catch (ignore) {
    const hidePass = Filters.filterToken(str);
    return Filters.filterPassword(hidePass);
  }
  return jsonData;
}
