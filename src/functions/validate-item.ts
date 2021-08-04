/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { SEVERITY, ValidatorResponse, ValidatorResponseItem } from '@redhat-developer/vscode-wizard';
import * as fs from 'fs-extra';
import { Platform } from '../util/platform';

export const pathValidation = new Map<string, boolean>();

const pathWindowsRegex = /^[a-zA-Z]:\\(?:[^#%\\/:*?"<>|\r\n\\[\]{}]+\\)*[^#%\\/:*?"<>|\r\n\\[\]{}]*$/;

export interface content {
  value: string;
  message: string;
  id: string;
}

export function createValidationItem(sev: SEVERITY, id: string, content: string): ValidatorResponseItem {
  return {
    severity: sev,
    template: {
      id,
      content,
    },
  };
}

export function inputFieldValidation(inputField: content, items: ValidatorResponseItem[]): ValidatorResponse {
  items.push(createValidationItem(SEVERITY.ERROR, inputField.id, inputField.message));
  return { items };
}

export function selectLocationValidation(selectLocation: content, items: ValidatorResponseItem[]): ValidatorResponse {
  if (!selectLocation.value.trim()) {
    items.push(createValidationItem(SEVERITY.ERROR, selectLocation.id, selectLocation.message));
  }
  if (selectLocation.value.trim() && Platform.OS === 'win32') {
    if (pathWindowsRegex.test(selectLocation.value)) {
      items.push(createValidationItem(SEVERITY.ERROR, selectLocation.id, 'Selected path has invalid format.'));
      pathValidation.set('path_validation', false);
    } else {
      pathValidation.set('path_validation', true);
    }
  }
  // eslint-disable-next-line no-extra-boolean-cast
  if (selectLocation.value.trim()) {
    if (!path.isAbsolute(selectLocation.value)) {
      items.push(createValidationItem(SEVERITY.ERROR, selectLocation.id, 'The selection is not a valid absolute path.'));
      pathValidation.set('path_validation', false);
    } else {
      pathValidation.set('path_validation', true);
    }
  }
  // eslint-disable-next-line no-extra-boolean-cast
  if (selectLocation.value.trim()) {
    const stats = path.parse(selectLocation.value);
    if (stats.root.length === 0 && !fs.existsSync(stats.root)) {
      items.push(createValidationItem(SEVERITY.ERROR, selectLocation.id, 'Selected disk does not exist.'));
      pathValidation.set('path_validation', false);
    } else {
      pathValidation.set('path_validation', true);
    }
  }
  return { items };
}
