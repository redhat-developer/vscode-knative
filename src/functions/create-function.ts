/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as path from 'path';
import * as vscode from 'vscode';
import {
  BUTTONS,
  IWizardPage,
  PerformFinishResponse,
  SEVERITY,
  Template,
  ValidatorResponse,
  WebviewWizard,
  WizardDefinition,
} from '@redhat-developer/vscode-wizard';
import * as fs from 'fs-extra';
import { createValidationItem, inputFieldValidation, pathValidation, selectLocationValidation } from './validate-item';
import { createFunctionID } from './webview-id';
import { CliExitData } from '../cli/cmdCli';
import { knExecutor } from '../cli/execute';
import { FuncAPI } from '../cli/func-api';
import { getStderrString } from '../util/stderrstring';

const folderStatus = new Map<string, boolean>();

interface Select {
  key: string;
  label: string;
}

interface ParametersType {
  functionName: string;
  selectLanguage: string;
  selectLocation: string;
  selectTemplate: string;
}

export interface ValidatorResponseItem {
  template: Template;
  severity: SEVERITY;
}

const languageSelect: Array<Select> = [
  { key: 'node', label: 'node' },
  { key: 'go', label: 'go' },
  { key: 'python', label: 'python' },
  { key: 'quarkus', label: 'quarkus' },
  { key: 'rust', label: 'rust' },
  { key: 'springboot', label: 'springboot' },
  { key: 'typescript', label: 'typescript' },
];

const templateSelect: Array<Select> = [
  { key: 'http', label: 'http' },
  { key: 'events', label: 'events' },
];

function validateInputField(pathValue: string, message: string, id: string, items: ValidatorResponseItem[]): ValidatorResponse {
  if (fs.existsSync(pathValue) && pathValue) {
    items.push(createValidationItem(SEVERITY.ERROR, id, message));
    folderStatus.set('folder_present', true);
    return { items };
  }
  folderStatus.set('folder_present', false);
}

function createFunctionForm(context: vscode.ExtensionContext): WebviewWizard {
  const def: WizardDefinition = {
    title: `Create Function`,
    description: 'This will create new project including func.yaml in it.',
    showDirtyState: true,
    pages: [
      {
        id: 'create-function-page',
        hideWizardPageHeader: true,
        fields: [
          {
            id: createFunctionID.function_name,
            label: 'Name',
            type: 'textbox',
            placeholder: 'Provide function name',
          },
          {
            id: createFunctionID.select_language,
            label: 'Select Language',
            type: 'select',
            initialValue: 'node',
            optionProvider: {
              getItems() {
                return languageSelect;
              },

              getValueItem(language: Select) {
                return language.key;
              },

              getLabelItem(language: Select) {
                return language.label;
              },
            },
          },
          {
            id: createFunctionID.select_template,
            label: 'Select Template',
            type: 'select',
            initialValue: 'http',
            optionProvider: {
              getItems() {
                return templateSelect;
              },

              getValueItem(template: Select) {
                return template.key;
              },

              getLabelItem(template: Select) {
                return template.label;
              },
            },
          },
          {
            id: createFunctionID.select_location,
            label: 'Select location',
            type: 'file-picker',
            placeholder: 'Select location to create Function.',
            dialogOptions: {
              canSelectMany: false,
              canSelectFiles: false,
              canSelectFolders: true,
              openLabel: 'Select location',
            },
          },
        ],
        validator: (parameters: ParametersType) => {
          const items: ValidatorResponseItem[] = [];
          if (
            parameters.functionName !== undefined &&
            !Number.isNaN(parameters.functionName) &&
            !parameters.functionName?.trim()
          ) {
            inputFieldValidation(
              {
                value: parameters.functionName,
                id: createFunctionID.function_name,
                message: 'Provide name for function',
              },
              items,
            );
          }
          if (parameters.selectLocation !== undefined && !Number.isNaN(parameters.selectLanguage)) {
            selectLocationValidation(
              {
                value: parameters.selectLocation,
                id: createFunctionID.select_location,
                message: 'Provide path to create function',
              },
              items,
            );
          }
          if (
            parameters.selectLocation !== undefined &&
            !Number.isNaN(parameters.selectLanguage) &&
            parameters.functionName?.trim() &&
            parameters.functionName !== undefined &&
            !Number.isNaN(parameters.functionName) &&
            parameters.functionName?.trim()
          ) {
            validateInputField(
              path.join(parameters.selectLocation, parameters.functionName),
              'Chose other name it is already exit as folder.',
              createFunctionID.function_name,
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
        label: 'Create Function',
      },
    ],
    workflowManager: {
      canFinish(wizard: WebviewWizard, data: ParametersType): boolean {
        return (
          data.functionName !== undefined &&
          data.selectLocation !== undefined &&
          data.functionName?.trim() &&
          data.selectLocation?.trim() &&
          pathValidation.get('path_validation') &&
          !folderStatus.get('folder_present')
        );
      },
      async performFinish(wizard: WebviewWizard, data: ParametersType): Promise<PerformFinishResponse | null> {
        const status: boolean = await vscode.window.withProgress(
          {
            cancellable: false,
            location: vscode.ProgressLocation.Notification,
            title: `Function Successfully created`,
          },
          async () => {
            const result: CliExitData = await knExecutor.execute(
              FuncAPI.createFunc(data.functionName, data.selectLanguage, data.selectTemplate, data.selectLocation),
            );
            if (result.error) {
              // eslint-disable-next-line @typescript-eslint/no-floating-promises
              vscode.window.showErrorMessage(`Fail create Function: ${getStderrString(result.error)}`);
              return false;
            }
            return true;
          },
        );
        if (!status) {
          return null;
        }
        let response: string;
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
          response = await vscode.window.showWarningMessage(
            `Function successfully created Name: ${data.functionName}`,
            'Add to this workspace',
            'Open in new workspace',
            'Cancel',
          );
        } else {
          response = await vscode.window.showWarningMessage(
            `Function successfully created Name: ${data.functionName}. Do you want to open in workspace`,
            'Yes',
            'No',
          );
        }
        const uri = vscode.Uri.file(path.join(data.selectLocation, data.functionName));
        if (response === 'Yes' || response === 'Open in new workspace') {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          vscode.commands.executeCommand('vscode.openFolder', uri);
        } else if (response === 'Add to this workspace') {
          vscode.workspace.updateWorkspaceFolders(0, 0, { uri });
        }
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
  const data: Map<string, string> = new Map<string, string>();
  const wiz: WebviewWizard = new WebviewWizard('create-function', 'create-function', context, def, data);
  return wiz;
}

export function createFunction(context: vscode.ExtensionContext): void {
  const wiz: WebviewWizard = createFunctionForm(context);
  wiz.open();
}
