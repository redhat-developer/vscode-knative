/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { FileStat, FileType } from 'vscode';

export class VFSFileStat implements FileStat {
  readonly type = FileType.File;

  readonly ctime = 0;

  mtime = 0;

  size = 65536;

  changeStat(size: number): void {
    // eslint-disable-next-line no-plusplus
    this.mtime++;
    this.size = size;
  }
}
