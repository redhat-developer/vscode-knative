/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as fs from 'fs';
import * as zlib from 'zlib';

import targz = require('targz');
import unzipm = require('unzip-stream');

export default class Archive {
  static async unzip(zipFile: string, extractTo: string, prefix?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (zipFile.endsWith('.tar.gz')) {
        targz.decompress(
          {
            src: zipFile,
            dest: extractTo,
            tar: {
              map: (header: { name: string }): { name: string } => {
                const top: { name: string } = header;
                if (prefix && header.name.startsWith(prefix)) {
                  top.name = header.name.substring(prefix.length);
                }
                return header;
              },
            },
          },
          (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          },
        );
      } else if (zipFile.endsWith('.gz')) {
        Archive.gunzip(zipFile, extractTo)
          .then(resolve)
          .catch(reject);
      } else if (zipFile.endsWith('.zip')) {
        fs.createReadStream(zipFile)
          .pipe(unzipm.Extract({ path: extractTo }))
          .on('error', reject)
          .on('close', resolve);
      } else {
        reject(new Error(`Unsupported extension for '${zipFile}'`));
      }
    });
  }

  static async gunzip(source, destination): Promise<void> {
    return new Promise((res, rej) => {
      const src = fs.createReadStream(source);
      const dest = fs.createWriteStream(destination);
      src.pipe(zlib.createGunzip()).pipe(dest);
      dest.on('close', res);
      dest.on('error', rej);
      src.on('error', rej);
    });
  }
}
