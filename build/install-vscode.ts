/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { execSync } from 'child_process';
import { platform } from 'os';
import { dirname, join } from 'path';
import { downloadAndUnzipVSCode } from '@vscode/test-electron';

downloadAndUnzipVSCode()
  .then((executable: string): void => {
    let exe: string = executable;
    if (platform() === 'darwin') {
      exe = `'${join(exe.substring(0, exe.indexOf('.app') + 4), 'Contents', 'Resources', 'app', 'bin', 'code')}'`;
    } else {
      exe = join(dirname(exe), 'bin', 'code');
    }
    const installMsg = execSync(`${exe} --install-extension ms-kubernetes-tools.vscode-kubernetes-tools`);
    // eslint-disable-next-line no-console
    console.log('Installing message', installMsg.toString());
    execSync(`${exe} --install-extension redhat.vscode-yaml`);
  })
  // eslint-disable-next-line no-console, @typescript-eslint/restrict-template-expressions
  .catch((err) => console.log(`There was an error while downloading and unzipping, error = ${err}`));
