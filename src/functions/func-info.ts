/* eslint-disable import/no-cycle */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Uri } from 'vscode';
import { FunctionInfo } from './function-type';
import { knExecutor } from '../cli/execute';
import { FuncAPI } from '../cli/func-api';

export async function getFunctionInfo(folderUri: Uri): Promise<FunctionInfo> {
  const funcInfoResult = await knExecutor.execute(FuncAPI.functionInfo(folderUri.fsPath), process.cwd(), false);
  let functionNamespace: FunctionInfo;
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    functionNamespace = JSON.parse(funcInfoResult.stdout);
  } catch (e) {
    functionNamespace = undefined;
  }
  return functionNamespace;
}
