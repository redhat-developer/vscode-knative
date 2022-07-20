/* eslint-disable no-restricted-syntax */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { readdir } from 'fs-extra';

export async function getHelpers(): Promise<Array<string>> {
  const isCredHelper = (f: string) => f.startsWith('docker-credential');

  return process.env.PATH.split(path.delimiter)
    .map(async (dir) => {
      try {
        return (await readdir(dir)).filter(isCredHelper);
      } catch (e) {
        // maybe log error (as warning) via some other facility than `console`
        return [];
      }
    })
    .reduce(async (a, b) => (await a).concat(await b), Promise.resolve<Array<string>>([]));
}
