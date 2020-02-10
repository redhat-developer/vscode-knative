/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { window } from 'vscode';
import KnativeExplorer from '../explorer';
// import QuickPickCommand from './quickPickCommand';
import Validation from './validation';
import { KnativeTreeObject } from '../kn/knativeTreeObject';
import { Kn, KnImpl } from '../kn/knController';

const errorMessage = {
  Project:
    'You need at least one Project available. Please create new OpenShift Project and try again.',
  Application:
    'You need at least one Application available. Please create new OpenShift Application and try again.',
  Component:
    'You need at least one Component available. Please create new OpenShift Component and try again.',
  OsService:
    'You need at least one OsService available. Please create new OpenShift OsService and try again.',
  Service:
    'You need at least one Service available. Please create new Knative OsService and try again.',
  Storage:
    'You need at least one Storage available. Please create new OpenShift Storage and try again.',
  Route: 'You need to add one URL to the component. Please create a new URL and try again.',
};

// function isCommand(item: QuickPickItem | QuickPickCommand): item is QuickPickCommand {
//   // eslint-disable-next-line dot-notation
//   return item['command'];
// }

export default abstract class KnativeItem {
  protected static readonly kn: Kn = KnImpl.Instance;

  protected static readonly explorer: KnativeExplorer = KnativeExplorer.getInstance();

  static validateUniqueName(data: Array<KnativeTreeObject>, value: string): undefined | string {
    const knativeObject = data.find(() => knativeObject.getName() === value);
    return knativeObject && `This name is already used, please enter different name.`;
  }

  static async getName(
    message: string,
    data: Array<KnativeTreeObject>,
    offset?: string,
  ): Promise<string> {
    return window.showInputBox({
      prompt: `Provide ${message}`,
      validateInput: (value: string) => {
        let validationMessage = Validation.emptyName(`Empty ${message}`, value.trim());
        if (!validationMessage) {
          validationMessage = Validation.validateMatches(
            `Not a valid ${message}. Please use lower case alphanumeric characters or "-", start with an alphabetic character, and end with an alphanumeric character`,
            value,
          );
        }
        if (!validationMessage) {
          validationMessage = Validation.lengthName(
            `${message} should be between 2-63 characters`,
            value,
            offset ? offset.length : 0,
          );
        }
        if (!validationMessage) {
          validationMessage = KnativeItem.validateUniqueName(data, value);
        }
        return validationMessage;
      },
    });
  }

  static async getServiceNames(): Promise<KnativeTreeObject[]> {
    const serviceList: Array<KnativeTreeObject> = await KnativeItem.kn.getServices();
    if (serviceList.length === 0) {
      throw Error(errorMessage.Project);
    }
    return serviceList;
  }
}
