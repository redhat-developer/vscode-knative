/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { execSync } from 'child_process';
import { platform } from 'os';
import { dirname, join } from 'path';
import path = require('path');
import { downloadAndUnzipVSCode } from '@vscode/test-electron';

downloadAndUnzipVSCode()
  .then((executable: string): void => {
    // Install extensions that openshift-toolkit depends on
    // eslint-disable-next-line global-require, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
    const packageJson = require('../package.json');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const extensionsToInstall = packageJson.extensionDependencies;
    let exe: string = executable;
    if (platform() === 'darwin') {
      exe = `'${join(exe.substring(0, exe.indexOf('.app') + 4), 'Contents', 'Resources', 'app', 'bin', 'code')}'`;
    } else {
      exe = join(dirname(exe), 'bin', 'code');
    }
    const extensionRootPath = path.resolve(__dirname, '..', '..');
    const vsCodeTest = path.resolve(path.join(extensionRootPath, '.vscode-test'));
    const userDataDir = path.join(vsCodeTest, 'user-data');
    const extDir = path.join(vsCodeTest, 'extensions');
    // eslint-disable-next-line no-restricted-syntax
    for (const extension of extensionsToInstall) {
      // eslint-disable-next-line no-console
      console.log('Installing extension: ', extension);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      execSync(`${exe} --install-extension ${extension} --user-data-dir ${userDataDir} --extensions-dir ${extDir}`);
    }
  })
  // eslint-disable-next-line no-console, @typescript-eslint/restrict-template-expressions
  .catch((err) => console.log(`There was an error while downloading and unzipping, error = ${err}`));
