/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Uri } from 'vscode';
import { readFile } from 'fs';

/**
 * Promisify fs.readFile to parse JSON from a file.
 *
 * @param filePath Takes the path to a JSON file.
 * @returns Promise<any>
 */
export function loadJSON<T>(filePath: string): Promise<T> {
  return new Promise((resolve, reject) => {
    readFile(require.resolve(filePath), 'utf-8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        try {
          resolve(JSON.parse(data));
        } catch (parseErr) {
          reject(parseErr);
        }
      }
    });
  });
}

/**
 * Take a potential URI string, check if it starts with `http://` or `https://` and create URI for it.
 * @param uriString
 * @returns vscode.Uri
 */
export function convertStringToURI(uriString: string): Uri {
  let uri: Uri;
  if (uriString.startsWith('http://') || uriString.startsWith('https://')) {
    uri = Uri.parse(uriString);
  }
  return uri;
}
