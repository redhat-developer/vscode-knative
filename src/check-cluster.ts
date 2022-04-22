/* eslint-disable import/no-cycle */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { knExecutor } from './cli/execute';
import { KubectlAPI } from './cli/kubectl-api';

export async function checkOpenShiftCluster(): Promise<boolean> {
  try {
    const result = await knExecutor.execute(KubectlAPI.checkOcpCluster(), process.cwd(), false);
    if (result?.stdout?.trim()) {
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}
