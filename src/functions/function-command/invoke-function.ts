/* eslint-disable no-use-before-define */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import {
  BUTTONS,
  IWizardPage,
  SEVERITY,
  Template,
  ValidatorResponse,
  WebviewWizard,
  WizardDefinition,
} from '@redhat-developer/vscode-wizard';
import * as fs from 'fs-extra';
import {
  invokeContextType,
  invokeDataFile,
  invokeDataText,
  invokeFormat,
  invokeID,
  invokeInstance,
  invokeNamespace,
  invokePath,
  invokeSource,
  invokeType,
} from './invoke-function-def';
// eslint-disable-next-line import/no-cycle
import { contextGlobalState } from '../../extension';
import { createValidationItem } from '../validate-item';

export const invokeItemMap = new Map<string, boolean>();

export interface ParametersType {
  invokeInstance?: string;
  invokeNamespace?: string;
  invokeId?: string;
  invokePath?: string;
  invokeDataText?: string;
  invokeDataFile?: string;
  invokeDataDesc?: string;
  invokeDataModeText?: string;
  invokeDataModeFile?: string;
  invokeContextType?: string;
  invokeSource?: string;
  invokeType?: string;
  invokeFormat?: string;
  Local?: string;
  Remote?: string;
  File?: string;
  Text?: string;
}

export interface ValidatorResponseItem {
  template: Template;
  severity: SEVERITY;
}

export function validateInputField(
  pathValue: string,
  message: string,
  id: string,
  items: ValidatorResponseItem[],
): ValidatorResponse {
  if (fs.existsSync(pathValue)) {
    items.push(createValidationItem(SEVERITY.ERROR, id, message));
    invokeItemMap.set('folder_present', true);
    return { items };
  }
  invokeItemMap.set('folder_present', false);
}

const localInvokeTextDef = [
  invokeInstance,
  invokeID,
  invokePath,
  invokeContextType,
  invokeFormat,
  invokeSource,
  invokeType,
  invokeDataText,
];
const localInvokeFileDef = [
  invokeInstance,
  invokeID,
  invokePath,
  invokeContextType,
  invokeFormat,
  invokeSource,
  invokeType,
  invokeDataFile,
];
const remoteInvokeTextDef = [
  invokeInstance,
  invokeID,
  invokeNamespace,
  invokeContextType,
  invokeFormat,
  invokeSource,
  invokeType,
  invokeDataText,
];
const remoteInvokeFileDef = [
  invokeInstance,
  invokeID,
  invokeNamespace,
  invokeContextType,
  invokeFormat,
  invokeSource,
  invokeType,
  invokeDataFile,
];

export const def: WizardDefinition = {
  title: `Local Invoke Function`,
  showDirtyState: true,
  pages: [
    {
      id: 'invoke-function-page',
      hideWizardPageHeader: true,
      fields: localInvokeTextDef,
      // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
      validator: () => {
        const items = [];
        return { items };
      },
    },
  ],
  buttons: [
    {
      id: BUTTONS.FINISH,
      label: 'Invoke',
    },
  ],
  workflowManager: {
    canFinish(wizard: WebviewWizard, data: ParametersType): boolean {
      const remoteFunctionInvokeText = invokeItemMap.get('remote_function_invoke_text');
      const remoteFunctionInvokeFile = invokeItemMap.get('remote_function_invoke_file');
      const localFunctionInvokeText = invokeItemMap.get('local_function_invoke_text');
      const localFunctionInvokeFile = invokeItemMap.get('local_function_invoke_file');
      if (
        (data?.Remote !== undefined || data.invokeInstance === 'Remote') &&
        data?.File === undefined &&
        (data.invokeDataModeFile !== 'File' || data.Text === 'Text') &&
        !remoteFunctionInvokeText
      ) {
        const newDef = def;
        invokeInstance.initialValue = 'Remote';
        newDef.pages[0].fields = remoteInvokeTextDef;
        invokeItemMap.set('remote_function_invoke_text', true);
        invokeItemMap.set('remote_function_invoke_file', false);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        invokeFunction(contextGlobalState);
      }
      if (
        (data?.Remote !== undefined || data.invokeInstance === 'Remote') &&
        data?.File !== undefined &&
        !remoteFunctionInvokeFile
      ) {
        const newDef = def;
        invokeInstance.initialValue = 'Remote';
        newDef.pages[0].fields = remoteInvokeFileDef;
        invokeItemMap.set('remote_function_invoke_text', false);
        invokeItemMap.set('remote_function_invoke_file', true);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        invokeFunction(contextGlobalState);
      }
      if (
        (data?.Local !== undefined || data.invokeInstance === 'Local') &&
        data?.File === undefined &&
        data?.invokeDataModeFile === 'File' &&
        data?.Text === 'Text' &&
        !localFunctionInvokeText
      ) {
        const newDef = def;
        invokeInstance.initialValue = 'Local';
        newDef.pages[0].fields = localInvokeTextDef;
        invokeItemMap.set('local_function_invoke_text', true);
        invokeItemMap.set('local_function_invoke_file', false);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        invokeFunction(contextGlobalState);
      }
      if (
        (data?.Local !== undefined || data.invokeInstance === 'Local') &&
        data?.File !== undefined &&
        !localFunctionInvokeFile
      ) {
        const newDef = def;
        invokeInstance.initialValue = 'Local';
        newDef.pages[0].fields = localInvokeFileDef;
        invokeItemMap.set('local_function_invoke_text', false);
        invokeItemMap.set('local_function_invoke_file', true);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        invokeFunction(contextGlobalState);
      }
      return true;
    },
    performFinish(): null {
      return null;
    },
    getNextPage(): IWizardPage | null {
      return null;
    },
    getPreviousPage(): IWizardPage | null {
      return null;
    },
  },
};

function invokeFunctionForm(context: vscode.ExtensionContext): WebviewWizard {
  const data: Map<string, string> = new Map<string, string>();
  const wiz: WebviewWizard = new WebviewWizard('invoke-function', 'invoke-function', context, def, data);
  return wiz;
}

export function invokeFunction(context: vscode.ExtensionContext): void {
  const wiz: WebviewWizard = invokeFunctionForm(context);
  wiz.open();
}
