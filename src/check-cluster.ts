/* eslint-disable import/no-cycle */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { executeCmdCli } from './cli/cmdCli';
import { KubectlAPI } from './cli/kubectl-api';

export async function checkOpenShiftCluster(): Promise<boolean> {
  try {
    const result = await executeCmdCli.executeExec(KubectlAPI.checkOcpCluster());
    if (result?.stdout?.trim()) {
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}
