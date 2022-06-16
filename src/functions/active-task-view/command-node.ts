/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { ProviderResult, QuickPickItem, TreeItemCollapsibleState, Uri, Command as vsCommand } from 'vscode';
import format = require('string-format');
import { FunctionContextType } from '../../cli/config';
import { IMAGES } from '../../icon-path';

export interface CommandNode extends QuickPickItem {
  getChildren(): ProviderResult<CommandNode[]>;
  getParent(): CommandNode | undefined;
  getName(): string;
  refresh(): Promise<void>;
  contextValue?: string;
  visibleChildren?: number;
}

export class ActiveCommandNodeImpl implements CommandNode {
  protected readonly CONTEXT_DATA = {
    none: {
      icon: '',
      tooltip: '{label}',
      description: '',
      getChildren: (): undefined[] => [],
    },
    activecommand: {
      icon: 'running.gif',
      tooltip: '{label}',
      getChildren: (): undefined[] => [],
    },
  };

  // eslint-disable-next-line no-useless-constructor
  constructor(
    private parent: CommandNode,
    public readonly name: string,
    public readonly contextValue: FunctionContextType,
    public readonly collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.Collapsed,
  ) {}

  get iconPath(): Uri {
    return Uri.file(path.join(__dirname, IMAGES, this.CONTEXT_DATA[this.contextValue].icon));
  }

  get tooltip(): string {
    if (this.contextValue === FunctionContextType.ACTIVECOMMAND) {
      let name: string;
      let state: string;
      if (this.name.startsWith('Build:')) {
        state = 'building';
        name = this.name.replace('Build:', '').trim();
      }
      if (this.name.startsWith('Run:')) {
        state = 'running';
        name = this.name.replace('Run:', '').trim();
      }
      return format(`The function ${name} is ${state} locally`, this);
    }
    return format(this.CONTEXT_DATA[this.contextValue].tooltip, this);
  }

  get command(): vsCommand | undefined {
    const arrName = ['activecommand'];
    if (arrName.includes(this.contextValue)) {
      return { command: 'activeCommand.focus', title: 'Focus', arguments: [this] };
    }
  }

  get label(): string {
    return this.name;
  }

  // eslint-disable-next-line class-methods-use-this
  get description(): string {
    if (this.contextValue === 'activecommand') {
      return 'Running.....';
    }
  }

  getName(): string {
    return this.name;
  }

  getChildren(): ProviderResult<CommandNode[]> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.CONTEXT_DATA[this.contextValue].getChildren();
  }

  getParent(): CommandNode {
    return this.parent;
  }

  // eslint-disable-next-line class-methods-use-this
  refresh(): Promise<void> {
    return Promise.resolve();
  }
}
