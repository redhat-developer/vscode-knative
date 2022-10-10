/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as path from 'path';
import * as fs from 'fs-extra';
import * as yaml from 'js-yaml';
import { FuncContent } from './function-type';

export async function getFuncYamlContent(dir: string): Promise<FuncContent> {
  let funcData: FuncContent[];
  try {
    const funcYaml: string = await fs.readFile(path.join(dir, 'func.yaml'), 'utf-8');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    funcData = yaml.safeLoadAll(funcYaml);
  } catch (error) {
    // ignore
  }
  return funcData?.[0];
}
