/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as fs from 'fs-extra';
import { throttleTime } from 'rxjs/operators';
import { fromEvent } from 'rxjs';
import { stream } from 'got';
import { promisify } from 'util';
import { Stream } from 'stream';

const pipeline = promisify(Stream.pipeline);

/**
 *
 */
export default class DownloadUtil {
  /**
   *
   *
   * @param fromUrl
   * @param toFile
   * @param progressCb
   * @param throttle
   */
  static async downloadFile(
    fromUrl: string,
    toFile: string,
    progressCb?: (current: number, increment: number) => void,
  ): Promise<void> {
    const dls = stream(fromUrl);
    let previous = 0;
    // Process progress event from 'got'
    const processProgress = fromEvent(dls, 'downloadProgress')
      .pipe(throttleTime(250))
      .subscribe((progress: { percent: number }) => {
        const current = Math.round(progress.percent * 100);
        if (previous && progressCb) {progressCb(current, current - previous)}
        previous = current;
      });
    // process end event from 'got'
    const end = fromEvent(dls, 'end').subscribe(() => {
      if (progressCb) {progressCb(100, 100 - previous)}
    });
    // Pipe url to file
    try {
      await pipeline(dls, fs.createWriteStream(toFile));
    } finally {
      // Unsubscribe form 'downloadProgress' and 'end' events
      // Is it really required?
      processProgress.unsubscribe();
      end.unsubscribe();
    }
  }
}
