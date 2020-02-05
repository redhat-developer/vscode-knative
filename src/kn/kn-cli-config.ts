/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as fs from 'fs';
import * as fsExtra from 'fs-extra';
import * as path from 'path';
import * as vscode from 'vscode';
import { which } from 'shelljs';
import { fromFile } from 'hasha';
import { satisfies } from 'semver';
import KnCli, { CliExitData } from './knCli';
import Archive from '../util/archive';
import DownloadUtil from '../util/download';
import loadJSON from '../util/parse';
import Platform from '../util/platform';

const configData = './kn-cli-config.json';

export interface KnConfig {
  kn: CliConfig;
}
export interface CliConfig {
  description: string;
  vendor: string;
  name: string;
  version: string;
  versionRange: string;
  versionRangeLabel: string;
  filePrefix: string;
  platform?: PlatformOS;
  url?: string;
  sha256sum?: string;
  dlFileName?: string;
  cmdFileName?: string;
}
export interface PlatformOS {
  win32: PlatformData;
  darwin: PlatformData;
  linux: PlatformData;
}
export interface PlatformData {
  url: string;
  sha256sum: string;
  dlFileName?: string;
  cmdFileName: string;
}

/**
 *
 * @param location
 */
export function getVersion(location: string): Promise<string> {
  return new Promise((resolve) => {
    let detectedVersion: string;
    if (fs.existsSync(location)) {
      const version = new RegExp(
        `Version:(\\s+)v((([0-9]+)\\.([0-9]+)\\.([0-9]+)(?:-([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?)(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?).*`,
      );
      const result: Promise<CliExitData> = KnCli.getInstance().execute(`"${location}" version`);
      result.then((data) => {
        if (data.stdout) {
          const toolVersion: string[] = data.stdout
            .trim()
            .split('\n')
            .filter((value) => {
              return version.exec(value);
            })
            .map((value) => version.exec(value)[2]);
          if (toolVersion.length) {
            [detectedVersion] = toolVersion;
          }
        }
      });
    }
    resolve(detectedVersion);
  });
}

/**
 * Find which kn cli is installed.
 *
 * @param locations
 * @param versionRange
 */
function selectTool(locations: string[], versionRange: string): Promise<string> {
  return new Promise((resolve) => {
    resolve(
      locations.find((location: string): string => {
        let versionLocation: string;
        getVersion(location).then((value: string): void => {
          versionLocation = value;
        });
        if (location && satisfies(versionLocation, versionRange)) {
          return location;
        }
        return undefined;
      }),
    );
  });
}

/**
 * Get the kn cli config information. Then set OS platform so we know which version of kn to us.
 *
 * @param requirements
 * @param platform
 */
function loadMetadata(requirements: Promise<KnConfig>, platform: string): KnConfig | void {
  // const reqs = requirements;
  requirements
    .then((config) => {
      const data = config;
      if (data.kn.platform) {
        // move the platform that matches the users platform to the main list
        Object.assign(data.kn, data.kn.platform[platform]);
        // Delete the whole platfrom from the config
        delete data.kn.platform;
        return data;
      }
      return data;
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.log(new Error('Something failed loading the JSON file.'), err);
    });
}

export default class KnCliConfig {
  /**
   * This contains the knative cli config data needed to access and run the commands.
   */
  static tools: KnConfig | void = loadMetadata(loadJSON<KnConfig>(configData), Platform.OS);

  /**
   * Reset the knative cli config data
   */
  static resetConfiguration(): void {
    KnCliConfig.tools = loadMetadata(loadJSON<KnConfig>(configData), Platform.OS);
  }

  /**
   * Check for the presence of the cli `cmd` passed in.
   * Set the cli or download the needed cli tool and set it.
   *
   * @param cmd
   * @returns toolLocation
   */
  static async detectOrDownload(cmd: string): Promise<string> {
    // If the location of the cli has been set, then read it.
    let toolLocation: string = KnCliConfig.tools[cmd].location;

    // So if the tool location hasn't been set then we need to figure that out.
    if (toolLocation === undefined) {
      // Look in [HOME]/.vs-kn/ for the kn cli executable
      const toolCacheLocation = path.resolve(
        Platform.getUserHomePath(),
        '.vs-kn',
        KnCliConfig.tools[cmd].cmdFileName,
      );
      // If kn cli is installed, get it's install location/path
      const whichLocation = which(cmd);
      // Get a list of locations.
      const toolLocations: string[] = [
        whichLocation ? whichLocation.stdout : null,
        toolCacheLocation,
      ];
      // Check the list of locations and see if what we need is there.
      await selectTool(toolLocations, KnCliConfig.tools[cmd].versionRange).then((value) => {
        toolLocation = value;
      });

      // If the cli tool is still not found then we will need to install it.
      if (toolLocation === undefined) {
        // Set the download location for the cli executable.
        const toolDlLocation = path.resolve(
          Platform.getUserHomePath(),
          '.vs-kn',
          KnCliConfig.tools[cmd].dlFileName,
        );
        // Message for expected version number
        const installRequest = `Download and install v${KnCliConfig.tools[cmd].version}`;
        // Create a pop-up that asks to download and install.
        let response: string;
        await vscode.window
          .showInformationMessage(
            `Cannot find ${KnCliConfig.tools[cmd].description} ${KnCliConfig.tools[cmd].versionRangeLabel}.`,
            installRequest,
            'Help',
            'Cancel',
          )
          .then((value) => {
            response = value;
          });
        // Ensure that the directory exists. If the directory structure does not exist, then create it.
        fsExtra.ensureDirSync(path.resolve(Platform.getUserHomePath(), '.vs-kn'));
        // If the user selected to download and install then do this.
        if (response === installRequest) {
          let action: string;
          do {
            action = undefined;
            // Display a Progress notification while downloading
            vscode.window.withProgress(
              {
                cancellable: true,
                location: vscode.ProgressLocation.Notification,
                title: `Downloading ${KnCliConfig.tools[cmd].description}`,
              },
              (progress: vscode.Progress<{ increment: number; message: string }>) => {
                return DownloadUtil.downloadFile(
                  KnCliConfig.tools[cmd].url,
                  toolDlLocation,
                  (dlProgress, increment) =>
                    progress.report({ increment, message: `${dlProgress}%` }),
                );
              },
            );
            // Get the hash for the downloaded file.
            let sha256sum: string;
            fromFile(toolDlLocation, { algorithm: 'sha256' }).then((value) => {
              sha256sum = value;
            });
            // Check the hash against the one on file to make sure it downloaded. If it doesn't match tell the user,
            // so they can download it again.
            if (sha256sum !== KnCliConfig.tools[cmd].sha256sum) {
              fsExtra.removeSync(toolDlLocation);
              vscode.window
                .showInformationMessage(
                  `Checksum for downloaded ${KnCliConfig.tools[cmd].description} v${KnCliConfig.tools[cmd].version} is not correct.`,
                  'Download again',
                  'Cancel',
                )
                // eslint-disable-next-line no-loop-func
                .then((value) => {
                  action = value;
                });
            }
          } while (action === 'Download again');

          if (action !== 'Cancel') {
            if (toolDlLocation.endsWith('.zip') || toolDlLocation.endsWith('.tar.gz')) {
              await Archive.unzip(
                toolDlLocation,
                path.resolve(Platform.getUserHomePath(), '.vs-kn'),
                KnCliConfig.tools[cmd].filePrefix,
              );
            } else if (toolDlLocation.endsWith('.gz')) {
              await Archive.unzip(
                toolDlLocation,
                toolCacheLocation,
                KnCliConfig.tools[cmd].filePrefix,
              );
            }
            fsExtra.removeSync(toolDlLocation);
            if (Platform.OS !== 'win32') {
              fs.chmodSync(toolCacheLocation, 0o765);
            }
            // eslint-disable-next-line require-atomic-updates
            toolLocation = toolCacheLocation;
          }
        } else if (response === `Help`) {
          vscode.commands.executeCommand(
            'vscode.open',
            vscode.Uri.parse(
              `https://github.com/talamer/vscode-knative/blob/master/README.md#requirements`,
            ),
          );
        }
      }
      if (toolLocation) {
        // eslint-disable-next-line require-atomic-updates
        KnCliConfig.tools[cmd].location = toolLocation;
      }
    }
    return toolLocation;
  }
}
