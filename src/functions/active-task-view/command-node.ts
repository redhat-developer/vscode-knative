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
    errorcommand: {
      icon: 'error.svg',
      tooltip: '{label}',
      getChildren: (): undefined[] => [],
    },
    passcommand: {
      icon: 'pass.svg',
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

  generateNameAndStateInner(command: string): string {
    if (this.name.startsWith(command)) {
      return this.name.replace('command', '').trim();
    }
    return undefined;
  }

  // eslint-disable-next-line class-methods-use-this
  generateNameAndState(): { name: string; state: string; isLocal: boolean } {
    let name = this.generateNameAndStateInner('Build:');
    if (name) {
      return { name, state: 'building', isLocal: true };
    }
    name = this.generateNameAndStateInner('Run:');
    if (name) {
      return { name, state: 'running', isLocal: true };
    }
    name = this.generateNameAndStateInner('Deploy:');
    if (name) {
      return { name, state: 'deploying', isLocal: false };
    }
    name = this.generateNameAndStateInner('On Cluster Build:');
    if (name) {
      return { name, state: 'building on cluster and deploying', isLocal: false };
    }
    return undefined;
  }

  get tooltip(): string {
    if (this.contextValue === FunctionContextType.ACTIVECOMMAND) {
      const nameAndState = this.generateNameAndState();
      if (nameAndState) {
        return format(
          `The function ${nameAndState.name} is ${nameAndState.state} ${nameAndState.isLocal ? 'locally' : ''}`,
          this,
        );
      }
    }
    return format(this.CONTEXT_DATA[this.contextValue].tooltip, this);
  }

  get command(): vsCommand | undefined {
    const arrName = [FunctionContextType.ACTIVECOMMAND, FunctionContextType.ERRORCOMMAND, FunctionContextType.PASSCOMMAND];
    if (arrName.includes(this.contextValue)) {
      return { command: 'activeCommand.focus', title: 'Focus', arguments: [this] };
    }
  }

  get label(): string {
    return this.name;
  }

  // eslint-disable-next-line class-methods-use-this
  get description(): string {
    if (this.contextValue === FunctionContextType.ACTIVECOMMAND) {
      return 'Running.....';
    }
    if (this.contextValue === FunctionContextType.ERRORCOMMAND) {
      return 'Error';
    }
    if (this.contextValue === FunctionContextType.PASSCOMMAND) {
      return 'Successful';
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
