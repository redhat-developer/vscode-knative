/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/
import { InputBoxOptions, window } from 'vscode';
import Platform from '../util/platform';
import { CliExitData } from '../kn/knCli';
import { execute, loadItems, executeInTerminal } from '../kn/knExecute';
import KnativeItem from './knativeItem';
import KnAPI, {CreateService} from '../kn/kn-api';

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
  public name : string;

  public url : string ;


  static async list(): Promise<Service[]> {
    const result: CliExitData = await execute(KnAPI.listServices());
    return loadItems(result).map((value) => this.toService(value));
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

  private static toService(value: any): Service{
    const service = new Service();
    service.name = value.metadata.name;
    service.url = value.status.url;
    return service;

  }
}
