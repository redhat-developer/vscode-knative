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
export const gitRegexStatus = new Map<string, boolean>();

export interface Select {
  key: string;
  label: string;
}

export const gitRegex = RegExp('((git@|https://)([\\w\\.@]+)(/|:))([\\w,\\-,\\_]+)/([\\w,\\-,\\_]+)(.git){0,1}((/){0,1})');

export interface ParametersType {
  functionName: string;
  languageName?: string;
  templateInputText?: string;
  repositoryInputText?: string;
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

const functionName = {
  id: createFunctionID.function_name,
  label: 'Name',
  type: 'textbox',
  placeholder: 'Provide function name',
};

const selectLanguage: WizardPageFieldDefinition = {
  id: createFunctionID.select_language,
  label: 'Select Language',
  type: 'select',
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
};

const languageName: WizardPageFieldDefinition = {
  id: createFunctionID.language_name,
  label: 'Language',
  type: 'textbox',
  placeholder: 'Provide language name',
};

const selectTemplate: WizardPageFieldDefinition = {
  id: createFunctionID.select_template,
  label: 'Select Template',
  type: 'select',
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
};

const templateInputText = {
  id: createFunctionID.template_inputText,
  label: 'Template',
  type: 'textbox',
  placeholder: 'Provide template',
};

const repositoryInputText = {
  id: createFunctionID.repository_inputText,
  label: 'Repository',
  type: 'textbox',
  placeholder: 'Provide repository',
};

const selectLocation = {
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
};

const defaultField = [functionName, selectLanguage, selectTemplate, selectLocation];

const languageTemplateField = [
  functionName,
  selectLanguage,
  languageName,
  selectTemplate,
  templateInputText,
  repositoryInputText,
  selectLocation,
];

const languageField = [functionName, selectLanguage, languageName, selectTemplate, selectLocation];

const templateField = [functionName, selectLanguage, selectTemplate, templateInputText, repositoryInputText, selectLocation];

export const def: WizardDefinition = {
  title: `Create Function`,
  description: 'This will create new project including func.yaml in it.',
  showDirtyState: true,
  pages: [
    {
      id: 'create-function-page',
      hideWizardPageHeader: true,
      fields: defaultField,
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
        if (parameters.languageName !== undefined && !Number.isNaN(parameters.languageName) && !parameters.languageName?.trim()) {
          inputFieldValidation(
            {
              value: parameters.languageName,
              id: createFunctionID.language_name,
              message: 'Provide language name',
            },
            items,
          );
        }
        if (
          parameters.templateInputText !== undefined &&
          !Number.isNaN(parameters.templateInputText) &&
          !parameters.templateInputText?.trim()
        ) {
          inputFieldValidation(
            {
              value: parameters.templateInputText,
              id: createFunctionID.template_inputText,
              message: 'Provide template',
            },
            items,
          );
        }
        if (
          parameters.repositoryInputText !== undefined &&
          !Number.isNaN(parameters.repositoryInputText) &&
          !parameters.repositoryInputText?.trim()
        ) {
          inputFieldValidation(
            {
              value: parameters.repositoryInputText,
              id: createFunctionID.repository_inputText,
              message: 'Empty Git repository URL',
            },
            items,
          );
        }
        if (
          parameters.repositoryInputText !== undefined &&
          parameters.repositoryInputText?.trim() &&
          !gitRegex.test(parameters.repositoryInputText)
        ) {
          gitRegexStatus.set('invalid_git_url', false);
          inputFieldValidation(
            {
              value: parameters.repositoryInputText,
              id: createFunctionID.repository_inputText,
              message: 'Invalid URL provided',
            },
            items,
          );
        }
        if (
          parameters.repositoryInputText !== undefined &&
          parameters.repositoryInputText?.trim() &&
          gitRegex.test(parameters.repositoryInputText)
        ) {
          gitRegexStatus.set('invalid_git_url', true);
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
      selectLanguage.initialValue = data.selectLanguage;
      selectTemplate.initialValue = data.selectTemplate;
      functionName.initialValue = data.functionName;
      languageName.initialValue = data.languageName;
      selectLocation.initialValue = data.selectLocation;
      const findTemplateInputText = wizard
        ?.getCurrentPage()
        .getPageDefinition()
        .fields.find((element) => element.id === createFunctionID.template_inputText);
      const findRepositoryInputText = wizard
        ?.getCurrentPage()
        .getPageDefinition()
        .fields.find((element) => element.id === createFunctionID.repository_inputText);
      const findLanguageNameField = wizard
        ?.getCurrentPage()
        .getPageDefinition()
        .fields.find((element) => element.id === createFunctionID.language_name);
      if (
        data.selectTemplate === provideTemplate.key &&
        data.selectLanguage === provideLanguage.key &&
        (!findTemplateInputText || !findLanguageNameField)
      ) {
        setValue(data);
        const newDef = def;
        newDef.pages[0].fields = languageTemplateField;
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        createFunction(contextGlobalState);
      } else if (data.selectTemplate === provideTemplate.key && !findTemplateInputText) {
        setValue(data);
        const newDef = def;
        newDef.pages[0].fields = templateField;
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        createFunction(contextGlobalState);
      } else if (data.selectLanguage === provideLanguage.key && !findLanguageNameField) {
        setValue(data);
        const newDef = def;
        newDef.pages[0].fields = languageField;
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        createFunction(contextGlobalState);
      }
      if (
        data.selectTemplate !== provideTemplate.key &&
        data.selectLanguage !== provideLanguage.key &&
        (findTemplateInputText || findLanguageNameField)
      ) {
        selectLanguage.initialValue = data.selectLanguage;
        selectTemplate.initialValue = data.selectTemplate;
        const newDef = def;
        newDef.pages[0].fields = defaultField;
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        createFunction(contextGlobalState);
      } else if (data.selectTemplate !== provideTemplate.key && findTemplateInputText) {
        selectTemplate.initialValue = data.selectTemplate;
        const newDef = def;
        newDef.pages[0].fields = languageField;
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        createFunction(contextGlobalState);
      } else if (data.selectLanguage !== provideLanguage.key && findLanguageNameField) {
        selectLanguage.initialValue = data.selectLanguage;
        const newDef = def;
        newDef.pages[0].fields = templateField;
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        createFunction(contextGlobalState);
      }
      const validatePath = pathValidation?.get('path_validation');
      const getFolderStatus = folderStatus?.get('folder_present');
      const getGitRegexStatus = gitRegexStatus?.get('invalid_git_url');
      return (
        data.functionName !== undefined &&
        data.selectLocation !== undefined &&
        data.functionName?.trim() &&
        data.selectLocation?.trim() &&
        validatePath &&
        !getFolderStatus &&
        (findLanguageNameField?.id ? Boolean(data.languageName?.trim()) : true) &&
        (findTemplateInputText?.id ? Boolean(data.templateInputText?.trim()) : true) &&
        (findRepositoryInputText?.id ? Boolean(data.repositoryInputText?.trim()) : true) &&
        getGitRegexStatus
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
          let result: CliExitData;
          if (data.templateInputText) {
            result = await knExecutor.execute(
              FuncAPI.createFuncWithRepository(
                data.functionName,
                data.languageName ?? data.selectLanguage,
                data.templateInputText,
                data.selectLocation,
                data.repositoryInputText,
              ),
              process.cwd(),
              false,
            );
          } else {
            result = await knExecutor.execute(
              FuncAPI.createFunc(data.functionName, data.selectLanguage, data.selectTemplate, data.selectLocation),
              process.cwd(),
              false,
            );
          }
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
  delete functionName.initialValue;
  delete selectLocation.initialValue;
  def.pages[0].fields = defaultField;
  createFunction(context);
}
