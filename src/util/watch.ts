/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { createReadStream, FSWatcher } from 'fs';
import { ensureDirSync, watch } from 'fs-extra';
import { join } from 'path';
import { EventEmitter } from 'events';

import byline = require('byline');

export interface FileContentChangeNotifier {
  readonly watcher: FSWatcher;
  readonly emitter: EventEmitter;
}

export default class WatchUtil {
  static watchFileForContextChange(location: string, filename: string): FileContentChangeNotifier {
    const emitter: EventEmitter = new EventEmitter();
    let timer: NodeJS.Timer;
    let context = '';
    ensureDirSync(location);
    const watcher: FSWatcher = watch(location, (_eventType, changedFile) => {
      if (filename === changedFile) {
        if (timer) {
          clearTimeout(timer);
        }

        timer = setTimeout(() => {
          timer = undefined;
          let newContext: string;
          WatchUtil.grep(join(location, filename), /current-context:.*/).then((result) => {
            newContext = result;
          });
          if (context !== newContext) {
            emitter.emit('file-changed');
            context = newContext;
          }
        }, 500);
      }
    });
    return { watcher, emitter };
  }

  static grep(fileLocation: string, rx: RegExp): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const fileStream = createReadStream(fileLocation, { encoding: 'utf8' });
      byline(fileStream)
        .on('data', (line: string) => {
          if (rx.test(line)) {
            fileStream.close();
            resolve(line);
          }
        })
        .on('error', reject)
        .on('end', resolve);
    });
  }
}
