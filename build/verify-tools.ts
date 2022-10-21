/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable no-await-in-loop */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { exec } from 'child_process';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { existsSync } from 'fs-extra';
import { fromFile } from 'hasha';
import { sync } from 'mkdirp';
import { exit } from 'shelljs';
import configData = require('../src/cli/cli-config.json');
import { DownloadUtil } from '../src/util/download';

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
  await DownloadUtil.downloadFile(reqURL, currentFile, (current) => console.log(`${current}%`));
  const currentSHA256 = await fromFile(currentFile, { algorithm: 'sha256' });
  if (currentSHA256 === sha256sum) {
    console.log(`[INFO] ${currentFile} is downloaded and sha256 is correct`);
  } else {
    throw Error(`${currentFile} is downloaded and sha256 is not correct`);
  }
}

async function verifyTools(): Promise<void> {
  for (const key in configData) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    for (const OS in configData[key].platform) {
      const targetFolder = resolve(tmpdir(), OS);
      await downloadFileAndCreateSha256(
        targetFolder,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        configData[key].platform[OS].dlFileName,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        configData[key].platform[OS].url,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        configData[key].platform[OS].sha256sum,
      );
    }
  }
}

const fileCheckRegex = /\w*cli-config.json/;

exec('git diff --name-only origin/main -- .', async (error, stdout) => {
  if (error) {
    throw error;
  }
  console.log('The changed files:');
  console.log(stdout);
  if (fileCheckRegex.test(stdout)) {
    console.log('cli-config.json is changed, starting download verification');
    try {
      await verifyTools();
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      exit(1);
    }
  } else {
    console.log('cli-config.json is not changed, skipping download verification');
  }
});
