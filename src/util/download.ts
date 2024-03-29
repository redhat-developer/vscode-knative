/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import * as fs from 'fs-extra';
import request = require('request');
import progress = require('request-progress');

export class DownloadUtil {
  static downloadFile(
    fromUrl: string,
    toFile: string,
    progressCallBack?: (current: number, increment: number) => void,
    throttle?: number,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let previous = 0;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      progress(request(fromUrl), {
        throttle: throttle || 250,
        delay: 0,
        lengthHeader: 'content-length',
      })
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        .on('response', () => {})
        .on('progress', (state: { percent: number }) => {
          const current = Math.round(state.percent * 100);
          if (current !== previous && progressCallBack) {
            progressCallBack(current, current - previous);
          }
          previous = current;
        })
        .on('error', reject)
        .on('end', () => progressCallBack && progressCallBack(100, 100 - previous))
        .pipe(fs.createWriteStream(toFile))
        .on('close', resolve)
        .on('error', reject);
    });
  }
}
