/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { ExtensionContext, InputBoxOptions, window } from 'vscode';
import KnativeItem from './knativeItem';
import Platform from '../util/platform';
import KnAPI, { CreateService } from '../kn/kn-api';
import { executeInTerminal } from '../kn/knExecute';

// function askUserForValue(prompt: string, placeHolder: string): Promise<string> {
//   const options: InputBoxOptions = {
//       prompt,
//       placeHolder
//   }

//   return window.showInputBox(options).then((value) => {
//     if (!value) return;
//     return value;
//   })
// }

export default class Service extends KnativeItem {
  public static extensionContext: ExtensionContext;

  static list(): Promise<void> {
    return executeInTerminal(KnAPI.listServices(), Platform.getUserHomePath());
  }

  static async create(): Promise<void> {
    const options: InputBoxOptions = {
        prompt: 'New Service Name:',
        // placeHolder: '(placeholder)'
    }
    const urlOptions: InputBoxOptions = {
        prompt: 'Service Image URL:',
        // placeHolder: '(placeholder)'
    }

    let name: string;
    let image: string;
    await window.showInputBox(options).then(value => {
      if (!value) {return;}
      name = value;
    });
    await window.showInputBox(urlOptions).then(value => {
      if (!value) {return;}
      image = value;
    });
    const servObj: CreateService = {name, image};
    return executeInTerminal(KnAPI.createService(servObj), Platform.getUserHomePath());
  }

  static refresh(): void {
    Service.explorer.refresh();
}

static async about(): Promise<void> {
    await executeInTerminal(KnAPI.printKnVersion());
}

}
