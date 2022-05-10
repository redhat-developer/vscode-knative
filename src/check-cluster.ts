/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable import/no-cycle */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { knExecutor } from './cli/execute';
import { KubectlAPI } from './cli/kubectl-api';

interface clusterVersion {
  items: [
    {
      status: {
        desired: {
          version: string;
        };
      };
    },
  ];
}

export async function checkOpenShiftCluster(): Promise<clusterVersion> {
  try {
    const result = await knExecutor.execute(KubectlAPI.checkOcpCluster(), process.cwd(), false);
    if (result?.stdout?.trim()) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return JSON.parse(result?.stdout);
    }
    return null;
  } catch (err) {
    return null;
  }
}
