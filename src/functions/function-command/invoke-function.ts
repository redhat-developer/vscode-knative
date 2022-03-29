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
import { CliExitData, executeCmdCli } from '../../cli/cmdCli';
import { FuncAPI } from '../../cli/func-api';
// eslint-disable-next-line import/no-cycle
import { contextGlobalState } from '../../extension';
import { getStderrString } from '../../util/stderrstring';
import { createValidationItem, inputFieldValidation, pathValidation, selectLocationValidation } from '../validate-item';
import { invokeFunctionID } from '../webview-id';

export const invokeItemMap = new Map<string, boolean>();

export interface ParametersType {
  invokeInstance?: string;
  invokeNamespace?: string;
  invokeId?: string;
  invokePath?: string;
  invokeDataText?: string;
  invokeDataFile?: string;
  invokeDataDesc?: string;
  invokeDataMode?: string;
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
      validator: (parameters: ParametersType) => {
        const items: ValidatorResponseItem[] = [];
        // if (parameters.invokeId !== undefined && !Number.isNaN(parameters.invokeId) && !parameters.invokeId?.trim()) {
        //   inputFieldValidation(
        //     {
        //       value: parameters.invokeId,
        //       id: invokeFunctionID.invoke_ID,
        //       message: 'Provide id',
        //     },
        //     items,
        //   );
        // }
        if (
          parameters.invokeNamespace !== undefined &&
          !Number.isNaN(parameters.invokeNamespace) &&
          !parameters.invokeNamespace?.trim()
        ) {
          inputFieldValidation(
            {
              value: parameters.invokeNamespace,
              id: invokeFunctionID.invoke_namespace,
              message: 'Provide namespace',
            },
            items,
          );
        }
        if (parameters.invokePath !== undefined && !Number.isNaN(parameters.invokePath)) {
          selectLocationValidation(
            {
              value: parameters.invokePath,
              id: invokeFunctionID.invoke_path,
              message: 'Provide path.',
            },
            items,
          );
        }
        if (
          parameters.invokeContextType !== undefined &&
          !Number.isNaN(parameters.invokeContextType) &&
          !parameters.invokeContextType?.trim()
        ) {
          inputFieldValidation(
            {
              value: parameters.invokeContextType,
              id: invokeFunctionID.invoke_context_type,
              message: 'Provide context type',
            },
            items,
          );
        }
        if (parameters.invokeSource !== undefined && !Number.isNaN(parameters.invokeSource) && !parameters.invokeSource?.trim()) {
          inputFieldValidation(
            {
              value: parameters.invokeSource,
              id: invokeFunctionID.invoke_source,
              message: 'Provide source',
            },
            items,
          );
        }
        if (parameters.invokeType !== undefined && !Number.isNaN(parameters.invokeType) && !parameters.invokeType?.trim()) {
          inputFieldValidation(
            {
              value: parameters.invokeType,
              id: invokeFunctionID.invoke_type,
              message: 'Provide type',
            },
            items,
          );
        }
        if (
          parameters.invokeDataText !== undefined &&
          !Number.isNaN(parameters.invokeDataText) &&
          !parameters.invokeDataText?.trim() &&
          parameters.invokeDataMode === 'Text'
        ) {
          inputFieldValidation(
            {
              value: parameters.invokeDataText,
              id: invokeFunctionID.invoke_data_text,
              message: 'Provide data',
            },
            items,
          );
        }
        if (
          parameters.invokeDataFile !== undefined &&
          !Number.isNaN(parameters.invokeDataFile) &&
          !parameters.invokeDataFile?.trim() &&
          parameters.invokeDataMode === 'File'
        ) {
          inputFieldValidation(
            {
              value: parameters.invokeDataFile,
              id: invokeFunctionID.invoke_data_file,
              message: 'Select file',
            },
            items,
          );
        }
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
      invokeID.initialValue = data.invokeId;
      invokePath.initialValue = data.invokePath;
      invokeContextType.initialValue = data.invokeContextType;
      invokeFormat.initialValue = data.invokeFormat;
      invokeSource.initialValue = data.invokeSource;
      invokeType.initialValue = data.invokeType;
      invokeDataText.childFields[1].initialValue = data.invokeDataText;
      invokeNamespace.initialValue = data.invokeNamespace;
      invokeDataFile.childFields[1].initialValue = data.invokeDataFile;
      if (data.invokeInstance === 'Remote' && data.invokeDataMode === 'Text' && !remoteFunctionInvokeText) {
        const newDef = def;
        invokeInstance.initialValue = 'Remote';
        newDef.pages[0].fields = remoteInvokeTextDef;
        invokeItemMap.set('remote_function_invoke_text', true);
        invokeItemMap.set('remote_function_invoke_file', false);
        invokeItemMap.set('local_function_invoke_text', false);
        invokeItemMap.set('local_function_invoke_file', false);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        invokeFunction(contextGlobalState);
      }
      if (data.invokeInstance === 'Remote' && !remoteFunctionInvokeFile && data.invokeDataMode === 'File') {
        const newDef = def;
        invokeInstance.initialValue = 'Remote';
        newDef.pages[0].fields = remoteInvokeFileDef;
        invokeItemMap.set('remote_function_invoke_text', false);
        invokeItemMap.set('remote_function_invoke_file', true);
        invokeItemMap.set('local_function_invoke_text', false);
        invokeItemMap.set('local_function_invoke_file', false);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        invokeFunction(contextGlobalState);
      }
      if (data.invokeInstance === 'Local' && data?.invokeDataMode === 'Text' && !localFunctionInvokeText) {
        const newDef = def;
        invokeInstance.initialValue = 'Local';
        newDef.pages[0].fields = localInvokeTextDef;
        invokeItemMap.set('local_function_invoke_text', true);
        invokeItemMap.set('local_function_invoke_file', false);
        invokeItemMap.set('remote_function_invoke_text', false);
        invokeItemMap.set('remote_function_invoke_file', false);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        invokeFunction(contextGlobalState);
      }
      if (data.invokeInstance === 'Local' && !localFunctionInvokeFile && data.invokeDataMode === 'File') {
        const newDef = def;
        invokeInstance.initialValue = 'Local';
        newDef.pages[0].fields = localInvokeFileDef;
        invokeItemMap.set('local_function_invoke_text', false);
        invokeItemMap.set('local_function_invoke_file', true);
        invokeItemMap.set('remote_function_invoke_text', false);
        invokeItemMap.set('remote_function_invoke_file', false);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        invokeFunction(contextGlobalState);
      }
      const validPath = pathValidation.get('path_validation');
      return (
        // data.invokeId !== undefined &&
        // data.invokeId?.trim()?.length !== 0 &&
        data.invokeContextType !== undefined &&
        data.invokeContextType?.trim()?.length !== 0 &&
        data.invokeSource !== undefined &&
        data.invokeSource?.trim()?.length !== 0 &&
        data.invokeType !== undefined &&
        data.invokeType?.trim()?.length !== 0 &&
        (data.invokeDataMode === 'File'
          ? data.invokeDataFile !== undefined && data.invokeDataFile?.trim()?.length !== 0
          : data.invokeDataText !== undefined && data.invokeDataText?.trim()?.length !== 0) &&
        (data.invokeInstance === 'Local'
          ? data.invokePath !== undefined && data.invokePath?.trim()?.length !== 0 && validPath
          : data.invokeNamespace !== undefined && data.invokeNamespace?.trim()?.length !== 0)
      );
    },
    async performFinish(wizard: WebviewWizard, data: ParametersType): Promise<null> {
      await vscode.window.withProgress(
        {
          cancellable: false,
          location: vscode.ProgressLocation.Notification,
          title: `Function Successfully invoke`,
        },
        async () => {
          let invokeCommand: string;
          if (data.invokeInstance === 'Local') {
            invokeCommand = FuncAPI.invokeFunctionLocal(
              data.invokeId,
              data.invokePath,
              data.invokeContextType,
              data.invokeFormat,
              data.invokeSource,
              data.invokeType,
              data.invokeDataMode === 'File' ? data.invokeDataFile : data.invokeDataText,
            );
          } else {
            invokeCommand = FuncAPI.invokeFunctionRemote(
              data.invokeId,
              data.invokeNamespace,
              data.invokeContextType,
              data.invokeFormat,
              data.invokeSource,
              data.invokeType,
              data.invokeDataMode === 'File' ? data.invokeDataFile : data.invokeDataText,
            );
          }
          const result: CliExitData = await executeCmdCli.executeExec(invokeCommand);
          if (result.error) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            vscode.window.showErrorMessage(`Fail invoke Function: ${getStderrString(result.error)}`);
            return false;
          }

          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          vscode.window.showInformationMessage('Function Successfully invoke');
          return true;
        },
      );
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

export function createInvokeFunction(context: vscode.ExtensionContext): void {
  const getEnvFuncId = !process.env.FUNC_ID ? 'ca8758fc-3bcc-4057-871e-5cea37fa215b' : process.env.FUNC_ID;
  invokeInstance.initialValue = 'Local';
  invokeID.initialValue = getEnvFuncId;
  delete invokePath.initialValue;
  invokeContextType.initialValue = 'text/plain';
  invokeFormat.initialValue = 'http';
  invokeSource.initialValue = '/boson/fn';
  invokeType.initialValue = 'boson.fn';
  invokeDataText.childFields[0].initialValue = 'Text';
  invokeDataText.childFields[1].initialValue = 'Hello World';
  delete invokeNamespace.initialValue;
  delete invokeDataFile.childFields[1].initialValue;
  const wiz: WebviewWizard = invokeFunctionForm(context);
  wiz.open();
}
