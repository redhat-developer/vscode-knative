/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
  WizardPageSectionDefinition,
} from '@redhat-developer/vscode-wizard';
import * as fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
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
  invokeUrl,
} from './invoke-function-def';
// eslint-disable-next-line import/no-cycle
import { CliCommand, CliExitData, executeCmdCli } from '../../cli/cmdCli';
// eslint-disable-next-line import/no-cycle
import { FuncAPI } from '../../cli/func-api';
// eslint-disable-next-line import/no-cycle
import { contextGlobalState } from '../../extension';
import { telemetryLog, telemetryLogError } from '../../telemetry';
import { getStderrString } from '../../util/stderrstring';
// eslint-disable-next-line import/no-cycle
import { FunctionNode } from '../function-tree-view/functionsTreeItem';
import { createValidationItem, inputFieldValidation, pathValidation, selectLocationValidation } from '../validate-item';
import { invokeFunctionID } from '../webview-id';

export const invokeItemMap = new Map<string, boolean>();

let functionName: string;

export interface ParametersType {
  invokeInstance?: string;
  invokeNamespace?: string;
  invokeUrl?: string;
  invokeUrlCheck?: boolean;
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
  invokePath,
  invokeNamespace,
  invokeContextType,
  invokeFormat,
  invokeSource,
  invokeType,
  invokeUrl,
  invokeDataText,
];
const remoteInvokeFileDef = [
  invokeInstance,
  invokeID,
  invokePath,
  invokeNamespace,
  invokeContextType,
  invokeFormat,
  invokeSource,
  invokeType,
  invokeUrl,
  invokeDataFile,
];

const localOnlyInvokeTextDef = [invokeID, invokePath, invokeContextType, invokeFormat, invokeSource, invokeType, invokeDataText];
const localOnlyInvokeFileDef = [invokeID, invokePath, invokeContextType, invokeFormat, invokeSource, invokeType, invokeDataFile];

export const def: WizardDefinition = {
  title: `Invoke Function`,
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
              message: 'Provide content type',
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
      const localOnlyFunctionInvokeText = invokeItemMap.get('local_only_function_invoke_text');
      const localOnlyFunctionInvokeFile = invokeItemMap.get('local_only_function_invoke_file');
      const remoteCheckUrlTrue = invokeItemMap.get('remote_check_url_true');
      const remoteCheckUrlFalse = invokeItemMap.get('remote_check_url_False');
      invokeID.initialValue = data.invokeId;
      invokePath.initialValue = data.invokePath ? data.invokePath : invokePath.initialValue;
      invokeContextType.initialValue = data.invokeContextType;
      invokeFormat.initialValue = data.invokeFormat;
      invokeSource.initialValue = data.invokeSource;
      invokeType.initialValue = data.invokeType;
      invokeDataText.childFields[1].initialValue = data.invokeDataText ?? invokeDataText.childFields[1].initialValue;
      invokeNamespace.initialValue = data.invokeNamespace ?? invokeNamespace.initialValue;
      invokeUrl.childFields[1].initialValue = data.invokeUrl ?? invokeUrl.childFields[1].initialValue;
      invokeDataFile.childFields[1].initialValue = data.invokeDataFile;
      if (!data.invokeInstance && data.invokeDataMode === 'Text' && !localOnlyFunctionInvokeText) {
        const newDef = def;
        newDef.pages[0].fields = localOnlyInvokeTextDef;
        invokeItemMap.set('local_only_function_invoke_text', true);
        invokeItemMap.set('local_only_function_invoke_file', false);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        invokeFunction(contextGlobalState, null);
      }
      if (!data.invokeInstance && data.invokeDataMode === 'File' && !localOnlyFunctionInvokeFile) {
        const newDef = def;
        newDef.pages[0].fields = localOnlyInvokeFileDef;
        invokeItemMap.set('local_only_function_invoke_text', false);
        invokeItemMap.set('local_only_function_invoke_file', true);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        invokeFunction(contextGlobalState, null);
      }
      if (data.invokeInstance === 'Remote' && data.invokeDataMode === 'Text' && !remoteFunctionInvokeText) {
        const newDef = def;
        invokeInstance.initialValue = 'Remote';
        newDef.pages[0].fields = remoteInvokeTextDef;
        invokeItemMap.set('remote_function_invoke_text', true);
        invokeItemMap.set('remote_function_invoke_file', false);
        invokeItemMap.set('local_function_invoke_text', false);
        invokeItemMap.set('local_function_invoke_file', false);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        invokeFunction(contextGlobalState, null);
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
        invokeFunction(contextGlobalState, null);
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
        invokeFunction(contextGlobalState, null);
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
        invokeFunction(contextGlobalState, null);
      }
      if (data.invokeUrlCheck === true && !remoteCheckUrlTrue) {
        const newDef = def;
        newDef.pages[0].fields.forEach((value: WizardPageSectionDefinition) => {
          if (value.id === invokeFunctionID.invoke_Url_Def) {
            // eslint-disable-next-line no-param-reassign
            value.childFields[0].initialValue = 'true';
            // eslint-disable-next-line no-param-reassign
            value.childFields[1].properties.disabled = false;
          }
        });
        invokeItemMap.set('remote_check_url_true', true);
        invokeItemMap.set('remote_check_url_False', false);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        invokeFunction(contextGlobalState, null);
      }
      if (data.invokeUrlCheck === false && !remoteCheckUrlFalse) {
        const newDef = def;
        newDef.pages[0].fields.forEach((value: WizardPageSectionDefinition) => {
          if (value.id === invokeFunctionID.invoke_Url_Def) {
            // eslint-disable-next-line no-param-reassign
            delete value.childFields[0].initialValue;
            // eslint-disable-next-line no-param-reassign
            value.childFields[1].properties.disabled = true;
          }
        });
        invokeItemMap.set('remote_check_url_true', false);
        invokeItemMap.set('remote_check_url_False', true);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        invokeFunction(contextGlobalState, null);
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
        (data.invokeInstance === 'Local' || !data.invokeInstance
          ? data.invokePath !== undefined && data.invokePath?.trim()?.length !== 0 && validPath
          : data.invokeNamespace !== undefined && data.invokeNamespace?.trim()?.length !== 0)
      );
    },
    async performFinish(wizard: WebviewWizard, data: ParametersType): Promise<null> {
      await vscode.window.withProgress(
        {
          cancellable: false,
          location: vscode.ProgressLocation.Notification,
          title: `Invoking function ${functionName}`,
        },
        async () => {
          const invokeCommand: CliCommand = FuncAPI.invokeFunction(data);
          const result: CliExitData = await executeCmdCli.executeExec(invokeCommand);
          if (result.error) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            vscode.window.showErrorMessage(
              `Fail invoke Function:${functionName} with the following error:\n ${getStderrString(result.error)}`,
            );
            telemetryLogError('Invoke_error', getStderrString(result.error));
            return false;
          }
          telemetryLog('Successfully_invoked', functionName);
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          vscode.window.showInformationMessage(`Function ${functionName} successfully invoked.`);
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

function invokeFunctionForm(context: vscode.ExtensionContext, funcContext: FunctionNode): WebviewWizard {
  const data: Map<string, string> = new Map<string, string>();
  if (funcContext?.contextValue === 'localFunctions') {
    const newDef = def;
    newDef.pages[0].fields = localOnlyInvokeTextDef;
  } else if (funcContext?.contextValue === 'localDeployFunctions') {
    const newDef = def;
    newDef.pages[0].fields = localInvokeTextDef;
  }
  const wiz: WebviewWizard = new WebviewWizard('invoke-function', 'invoke-function', context, def, data);
  return wiz;
}

export function invokeFunction(context: vscode.ExtensionContext, funcContext: FunctionNode): void {
  const wiz: WebviewWizard = invokeFunctionForm(context, funcContext);
  wiz.open();
}

export function createInvokeFunction(context: vscode.ExtensionContext, funcContext: FunctionNode): void {
  if (!funcContext) {
    return null;
  }
  if (funcContext) {
    functionName = funcContext.getName();
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const getEnvFuncId = uuidv4();
  invokeInstance.initialValue = 'Local';
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  invokeID.initialValue = getEnvFuncId;
  invokePath.initialValue = funcContext.contextPath.fsPath;
  invokeContextType.initialValue = 'text/plain';
  invokeFormat.initialValue = 'http';
  invokeSource.initialValue = '/boson/fn';
  invokeType.initialValue = 'boson.fn';
  invokeDataText.childFields[0].initialValue = 'Text';
  invokeDataText.childFields[1].initialValue = 'Hello World';
  invokeUrl.childFields[1].initialValue = funcContext.url;
  invokeNamespace.initialValue = funcContext.getParent().getName();
  delete invokeDataFile.childFields[1].initialValue;
  delete invokeUrl.childFields[0].initialValue;
  invokeUrl.childFields[1].properties.disabled = true;
  const wiz: WebviewWizard = invokeFunctionForm(context, funcContext);
  wiz.open();
}
