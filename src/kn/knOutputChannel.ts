/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import Filters from '../util/filters';

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

/**
 * An interface that requires the implementation of:
 * @function print
 * @function show
 */
export interface OutputChannel {
  print(text: string): void;
  show(): void;
}

/**
 * Write to and display information in the Knative Output window/channel.
 * An output channel is a container for readonly textual information.
 *
 * @function print
 * @function show
 */
export default class KnOutputChannel implements OutputChannel {
  private readonly channel: vscode.OutputChannel = vscode.window.createOutputChannel('Knative');

  /**
   * Display the output channel.
   */
  show(): void {
    this.channel.show();
  }

  /**
   * Take JSON, clean it up, and display it in the output channel.
   * @param text
   */
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
