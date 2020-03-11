/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { ExtensionContext } from 'vscode';
import KnativeItem from './knativeItem';
import Platform from '../util/platform';
import KnAPI from '../kn/kn-api';
import { executeInTerminal } from '../kn/knExecute';

export default class Service extends KnativeItem {
  public static extensionContext: ExtensionContext;

  static list(): Promise<void> {
    return executeInTerminal(KnAPI.listServices(), Platform.getUserHomePath());
  }

  static refresh(): void {
    Service.explorer.refresh();
}

static async about(): Promise<void> {
    await executeInTerminal(KnAPI.printKnVersion());
}

}
