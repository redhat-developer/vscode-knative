/* eslint-disable import/no-cycle */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { window } from 'vscode';
import { Namespace } from './function-type';
import { knExecutor } from '../cli/execute';
import { KubectlAPI } from '../cli/kubectl-api';
import { getStderrString } from '../util/stderrstring';

export async function activeNamespace(): Promise<string> {
  const result = await knExecutor.execute(KubectlAPI.currentNamespace(), process.cwd(), false);
  if (result.error) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    window.showErrorMessage(`Fail to fetch the Namespace Error: ${getStderrString(result.error)}`);
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const currentNamespace: Namespace = JSON.parse(result.stdout);
    return currentNamespace.contexts[0].context.namespace;
  } catch (err) {
    return null;
  }
}
