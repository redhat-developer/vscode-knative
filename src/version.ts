/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { knExecutor } from './cli/execute';
import { FuncAPI } from './cli/func-api';
import { KnAPI } from './cli/kn-api';
import { telemetryLog } from './telemetry';

export function knativeVersion(): void {
  telemetryLog('knative.version', 'Knative Version command click');
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  knExecutor.executeInTerminal(KnAPI.printKnVersion());
}

export function functionVersion(): void {
  telemetryLog('function.version', 'Function Version command click');
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  knExecutor.executeInTerminal(FuncAPI.printFunctionVersion());
}
