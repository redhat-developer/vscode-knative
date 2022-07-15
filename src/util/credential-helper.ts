/* eslint-disable no-restricted-syntax */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { readdir } from 'fs-extra';

export async function getHelpers(): Promise<Array<string>> {
  const isCredHelper = (f: string) => f.startsWith('docker-credential');
  let helpers: string[] = [];
  for (const dir of process.env.PATH.split(path.delimiter)) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const files = await readdir(dir);
      helpers = helpers.concat(files.filter(isCredHelper));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
  }
  return helpers;
}
