/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { window, Terminal, TerminalOptions } from 'vscode';
import * as path from 'path';

/**
 * Utility for VSCode windows.
 */
export class WindowUtil {
  /**
   * Create a new Terminal in VSCode with the CLI tool location on the PATH.
   *
   * @param name
   * @param cwd
   * @param toolLocation
   * @param env
   *
   * @returns terminal
   */
  static createTerminal(
    name: string,
    cwd: string,
    toolLocation?: string,
    env: NodeJS.ProcessEnv = process.env,
  ): Terminal {
    const finalEnv: NodeJS.ProcessEnv = {};
    // Copy everything from 'env' to 'finalEnv' so that we don't change the param 'env'
    Object.assign(finalEnv, env);
    // Check if we are on a 'win32' machine and set the key to Path, if not then use PATH
    const key = process.platform === 'win32' ? 'Path' : 'PATH';

    // If there is a toolLocation and and env.PATH and the env.PATH doesn't have the toolLocation on it.
    // Then set the toolLocation on the PATH in the new finalEnv.
    if (toolLocation && env[key] && !env[key].includes(toolLocation)) {
      finalEnv[key] = `${toolLocation}${path.delimiter}${env[key]}`;
    }
    // Set up the options to be passed into the new terminal.
    const options: TerminalOptions = {
      cwd,
      name,
      env: finalEnv,
      shellPath: process.platform === 'win32' ? undefined : '/bin/bash',
    };
    // Make a new terminal in VSCode with the toolLocation on the PATH.
    return window.createTerminal(options);
  }
}
