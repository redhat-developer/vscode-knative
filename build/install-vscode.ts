/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { downloadAndUnzipVSCode } from 'vscode-test';
import { execSync } from 'child_process';
import { dirname, join } from 'path';
import { platform } from 'os';

downloadAndUnzipVSCode().then((executable: string): void => {
  let exe: string = executable;
  if (platform() === 'darwin') {
    exe = `'${join(
      exe.substring(0, exe.indexOf('.app') + 4),
      'Contents',
      'Resources',
      'app',
      'bin',
      'code',
    )}'`;
  } else {
    exe = join(dirname(exe), 'bin', 'code');
  }
  execSync(`${exe} --install-extension ms-kubernetes-tools.vscode-kubernetes-tools`);
});
