/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable import/no-cycle */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { knExecutor } from './cli/execute';
import { KubectlAPI } from './cli/kubectl-api';
import { telemetryLog } from './telemetry';

export async function checkOpenShiftCluster(checkClusterVersion?: boolean): Promise<boolean> {
  try {
    const result = await knExecutor.execute(KubectlAPI.checkOcpCluster(), process.cwd(), false);
    if (result?.stdout?.trim()) {
      if (checkClusterVersion) {
        telemetryLog(
          'openshift_version_on_deploy',
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          `openshift version: ${JSON.parse(result?.stdout).items[0].status.desired.version}`,
        );
      }
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}
