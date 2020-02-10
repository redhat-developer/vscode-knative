/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { readFile } from 'fs';

/**
 * Promisify fs.readFile to parse JSON from a file.
 *
 * @param filePath Takes the path to a JSON file.
 * @returns Promise<any>
 */
export default function loadJSON<T>(filePath: string): Promise<T> {
  return new Promise((resolve, reject) => {
    readFile(require.resolve(filePath), 'utf-8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(JSON.parse(data));
      }
    });
  });
}
