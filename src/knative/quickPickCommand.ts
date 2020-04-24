/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { QuickPickItem } from "vscode";

export class QuickPickCommand implements QuickPickItem {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    public label: string,
    public command: () => Promise<string>,
    public description?: string,
    public detail?: string,
    public picked?: boolean,
    public alwaysShow?: boolean,
    public getName?: () => string
  ) {}
}
