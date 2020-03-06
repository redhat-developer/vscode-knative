/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/
/* eslint-disable no-console */

// import { CancellationToken } from 'vscode';
import { exec } from 'child_process';
import { existsSync } from 'fs-extra';
import { fromFile } from 'hasha';
import { sync } from 'mkdirp';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
// import { KnConfig } from '../src/kn/kn-cli-config';
import DownloadUtil from '../src/util/download';
// import loadJSON from '../src/util/parse';

// const configData = '../src/kn/kn-cli-config.json';
import configData = require('../src/kn/kn-cli-config.json');

async function downloadFileAndCreateSha256(
  targetFolder: string,
  fileName: string,
  reqURL: string,
  sha256sum: string,
): Promise<void> {
  if (!existsSync(targetFolder)) {
    sync(targetFolder);
  }
  const currentFile = join(targetFolder, fileName);
  console.log(`${currentFile} download started from ${reqURL}`);
  // const token: CancellationToken = null;
  await DownloadUtil.downloadFile(reqURL, currentFile, (current) => console.log(`${current}%`));
  const currentSHA256 = await fromFile(currentFile, { algorithm: 'sha256' });
  if (currentSHA256 === sha256sum) {
    console.log(`[INFO] ${currentFile} is downloaded and sha256 is correct`);
  } else {
    throw Error(`${currentFile} is downloaded and sha256 is not correct`);
  }
}

function verifyTools(): void {
  Object.keys(configData).forEach((key) => {
    Object.keys(configData[key].platform).forEach((OS) => {
      const targetFolder = resolve(tmpdir(), OS);
      downloadFileAndCreateSha256(
        targetFolder,
        configData[key].platform[OS].dlFileName,
        configData[key].platform[OS].url,
        configData[key].platform[OS].sha256sum,
      );
    });
  });
}
// function verifyTools(): void {
//   loadJSON<KnConfig>(configData).then((data: KnConfig): void => {
//     Object.keys(data).forEach((key) => {
//       Object.keys(data[key].platform).forEach((OS) => {
//         const targetFolder = resolve(tmpdir(), OS);
//         downloadFileAndCreateSha256(
//           targetFolder,
//           data[key].platform[OS].dlFileName,
//           data[key].platform[OS].url,
//           data[key].platform[OS].sha256sum,
//         );
//       });
//     });
//   });
// }

const fileCheckRegex = /\w*kn-cli-config.json/;

exec('git diff --name-only origin/master -- .', (error, stdout) => {
  if (error) {
    throw error;
  }
  console.log('The changed files:');
  console.log(stdout);
  if (fileCheckRegex.test(stdout)) {
    console.log('tools.json is changed, starting download verification');
    verifyTools();
  } else {
    console.log('tools.json is not changed, skipping download verification');
  }
});
