/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { execute } from '../kn/knExecute';

export interface Step {
  command: string;
  increment: number;
  total?: number;
}

export default class Progress {
  static execWithProgress(
    options: vscode.ProgressOptions,
    steps: Step[],
  ): Thenable<void> {
    return vscode.window.withProgress(
      options,
      (progress: vscode.Progress<{ increment: number; message: string }>) => {
        const calls: (() => Promise<any>)[] = [];
        steps.reduce(
          (previous: Step, current: Step, currentIndex: number, innerSteps: Step[]) => {
            let _current: Step;
            _current.total = previous.total + current.increment;
            calls.push(async () => {
              await Promise.resolve();
              progress.report({ increment: previous.increment, message: `${previous.total}%` });
              await execute(_current.command);
              if (currentIndex + 1 === innerSteps.length) {
                progress.report({
                  increment: _current.increment,
                  message: `${_current.total}%`,
                });
              }
            });
            return _current;
          },
          { increment: 0, command: '', total: 0 },
        );

        return calls.reduce<Promise<any>>((previous: Promise<any>, current: () => Promise<any>) => {
          return previous.then(current);
        }, Promise.resolve());
      },
    );
  }

  static async execCmdWithProgress(title: string, cmd: string): Promise<any> {
    return new Promise((resolve, reject) => {
      vscode.window.withProgress(
        {
          cancellable: false,
          location: vscode.ProgressLocation.Notification,
          title,
        },
        async () => {
          const result = await execute(cmd, process.cwd(), false);
          if (result.error) {
            reject(result.error);
          } else {
            resolve();
          }
        },
      );
    });
  }

  static async execFunctionWithProgress(
    title: string,
    func: (progress: vscode.Progress<{ increment: number; message: string }>) => Promise<any>,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      vscode.window.withProgress(
        {
          cancellable: false,
          location: vscode.ProgressLocation.Notification,
          title,
        },
        async (progress: vscode.Progress<{ increment: number; message: string }>) => {
          await func(progress)
            .then(resolve)
            .catch(reject);
        },
      );
    });
  }
}
