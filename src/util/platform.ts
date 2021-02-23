/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

export class Platform {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static identify(map: { [x: string]: () => any; win32?: () => string; default: any }): any | undefined {
    if (map[Platform.OS]) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return map[Platform.OS]();
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return map.default ? map.default() : undefined;
  }

  static getOS(): string {
    return process.platform;
  }

  static get OS(): string {
    return Platform.getOS();
  }

  static get ENV(): NodeJS.ProcessEnv {
    return Platform.getEnv();
  }

  static getEnv(): NodeJS.ProcessEnv {
    return process.env;
  }

  static getUserHomePath(): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return Platform.identify({
      win32: () => Platform.ENV.USERPROFILE,
      default: () => Platform.ENV.HOME,
    });
  }
}
