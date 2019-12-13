/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { Filters } from '../util/filters';

function prettifyJson(str: string): string {
  let jsonData: string;
  try {
    jsonData = JSON.stringify(JSON.parse(str), null, 2);
  } catch (ignore) {
    const hidePass = Filters.filterToken(str);
    return Filters.filterPassword(hidePass);
  }
  return jsonData;
}

export interface KnOutputChannel {
  print(text: string): void;
  show(): void;
}

export default class KnChannel implements KnOutputChannel {
  private readonly channel: vscode.OutputChannel = vscode.window.createOutputChannel('Knative');

  show(): void {
    this.channel.show();
  }

  print(text: string): void {
    const textData: string = prettifyJson(text);
    this.channel.append(textData);
    if (!textData.endsWith('\n')) {
      this.channel.append('\n');
    }
    if (vscode.workspace.getConfiguration('knative').get<boolean>('showChannelOnOutput')) {
      this.channel.show();
    }
  }
}
