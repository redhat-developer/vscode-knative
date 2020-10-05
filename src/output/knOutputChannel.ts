/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { prettifyJson } from '../util/format';

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
export class KnOutputChannel implements OutputChannel {
  private readonly channel: vscode.OutputChannel = vscode.window.createOutputChannel('Knative');

  /**
   * Display the output channel.
   */
  show(): void {
    this.channel.show();
  }

  /**
   * Take and display it in the output channel.
   *
   * If it has `--token=xxx` convert it to `--token= *****`.
   *
   * Open the Knative Output channel if set in config.
   * @param text
   */
  public print(text: string): void {
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
