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
  WizardPageFieldDefinition,
} from '@redhat-developer/vscode-wizard';
import * as fs from 'fs-extra';
import { CliExitData } from '../../cli/cmdCli';
import { knExecutor } from '../../cli/execute';
import { FuncAPI } from '../../cli/func-api';
// eslint-disable-next-line import/no-cycle
import { contextGlobalState } from '../../extension';
import { telemetryLog, telemetryLogError } from '../../telemetry';
import { getStderrString } from '../../util/stderrstring';
import { createValidationItem, inputFieldValidation, pathValidation, selectLocationValidation } from '../validate-item';
import { createFunctionID } from '../webview-id';

export const folderStatus = new Map<string, boolean>();

export interface Select {
  key: string;
  label: string;
}

export interface ParametersType {
  functionName: string;
  selectLanguage: string;
  selectLocation: string;
  selectTemplate: string;
}

export interface ValidatorResponseItem {
  template: Template;
  severity: SEVERITY;
}

const provideLanguage = { key: 'Provide language', label: 'Provide Language' };

export const languageSelect: Array<Select> = [
  provideLanguage,
  { key: 'node', label: 'node' },
  { key: 'go', label: 'go' },
  { key: 'python', label: 'python' },
  { key: 'quarkus', label: 'quarkus' },
  { key: 'rust', label: 'rust' },
  { key: 'springboot', label: 'springboot' },
  { key: 'typescript', label: 'typescript' },
];

const provideTemplate = { key: 'Provide template and repository', label: 'Provide template and repository' };

export const templateSelect: Array<Select> = [
  provideTemplate,
  { key: 'http', label: 'http' },
  { key: 'cloudevents', label: 'cloudevents' },
];

export function validateInputField(
  pathValue: string,
  message: string,
  id: string,
  items: ValidatorResponseItem[],
): ValidatorResponse {
  if (fs.existsSync(pathValue)) {
    items.push(createValidationItem(SEVERITY.ERROR, id, message));
    folderStatus.set('folder_present', true);
    return { items };
  }
  folderStatus.set('folder_present', false);
}

export const def: WizardDefinition = {
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
            getItems(): Array<Select> {
              return languageSelect;
            },

            getValueItem(language: Select): string {
              return language.key;
            },

            getLabelItem(language: Select): string {
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
            getItems(): Array<Select> {
              return templateSelect;
            },

            getValueItem(template: Select): string {
              return template.key;
            },

            getLabelItem(template: Select): string {
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
      // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
      validator: (parameters: ParametersType) => {
        const items: ValidatorResponseItem[] = [];
        if (parameters.functionName !== undefined && !Number.isNaN(parameters.functionName) && !parameters.functionName?.trim()) {
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
            'A folder with this name already exists. Please use a different name.',
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
      if (
        data.selectTemplate === provideTemplate.key &&
        data.selectLanguage === provideLanguage.key &&
        (!wizard
          .getCurrentPage()
          .getPageDefinition()
          .fields.find((element) => element.id === createFunctionID.template_inputText) ||
          !wizard
            .getCurrentPage()
            .getPageDefinition()
            .fields.find((element) => element.id === createFunctionID.language_name))
      ) {
        selectLanguage.initialValue = provideLanguage.key;
        selectTemplate.initialValue = provideTemplate.key;
        const newDef = def;
        newDef.pages[0].fields = languageTemplateField;
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        createFunction(contextGlobalState);
      } else if (
        data.selectTemplate === provideTemplate.key &&
        !wizard
          .getCurrentPage()
          .getPageDefinition()
          .fields.find((element) => element.id === createFunctionID.template_inputText)
      ) {
        selectTemplate.initialValue = provideTemplate.key;
        const newDef = def;
        newDef.pages[0].fields = templateField;
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        createFunction(contextGlobalState);
      } else if (
        data.selectLanguage === provideLanguage.key &&
        !wizard
          .getCurrentPage()
          .getPageDefinition()
          // eslint-disable-next-line arrow-body-style
          .fields.find((element) => {
            return element.id === createFunctionID.language_name;
          })
      ) {
        selectLanguage.initialValue = provideLanguage.key;
        const newDef = def;
        newDef.pages[0].fields = languageField;
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        createFunction(contextGlobalState);
      }
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
            process.cwd(),
            false,
          );
          if (result.error) {
            telemetryLogError('Fail_to_create_function', result.error);
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
        response = await vscode.window.showInformationMessage(
          `Function ${data.functionName} successfully created.`,
          'Add to this workspace',
          'Open in new workspace',
          'Cancel',
        );
      } else {
        response = await vscode.window.showInformationMessage(
          `Function ${data.functionName} successfully created. Do you want to open the folder in the workspace?`,
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
      telemetryLog('Function_successfully_created', data.functionName);
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

function createFunctionForm(context: vscode.ExtensionContext): WebviewWizard {
  const data: Map<string, string> = new Map<string, string>();
  const wiz: WebviewWizard = new WebviewWizard('create-function', 'create-function', context, def, data);
  return wiz;
}

function createFunction(context: vscode.ExtensionContext): void {
  const wiz: WebviewWizard = createFunctionForm(context);
  wiz.open();
}

export function createFunctionPage(context: vscode.ExtensionContext): void {
  selectLanguage.initialValue = languageSelect[1].key;
  selectTemplate.initialValue = templateSelect[1].key;
  def.pages[0].fields = defaultField;
  createFunction(context);
}
