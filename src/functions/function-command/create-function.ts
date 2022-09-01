/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-use-before-define */
/* eslint-disable import/no-cycle */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as path from 'path';
import * as vscode from 'vscode';
import {
  BUTTONS,
  FieldDefinitionState,
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
import { CliExitData, executeCmdCli } from '../../cli/cmdCli';
import { knExecutor } from '../../cli/execute';
import { FuncAPI } from '../../cli/func-api';
import { telemetryLog, telemetryLogError } from '../../telemetry';
import { getStderrString } from '../../util/stderrstring';
import { createValidationItem, inputFieldValidation, pathValidation, selectLocationValidation } from '../validate-item';
import { createFunctionID } from '../webview-id';

interface FuncTemplate {
  [key: string]: string[];
}

export const folderStatus = new Map<string, boolean>();
export const languageChangeCheck = new Map<string, string>();
export const storeLanguageInput = new Map<string, string>();
export const gitRegexStatus = new Map<string, boolean>();
export const storeLanguage = new Map<string, string[]>();
export const storeTemplate = new Map<string, FuncTemplate>();
export const storeRepositoryList = new Map<string, { [key: string]: string }>();

export interface Select {
  key: string;
  label: string;
}

export const gitRegex = RegExp('((git@|https://)([\\w\\.@]+)(/|:))([\\w,\\-,\\_]+)/([\\w,\\-,\\_]+)(.git){0,1}((/){0,1})');

export interface ParametersType {
  functionName: string;
  repositoryInputText?: string;
  selectLanguage: string;
  selectLocation: string;
  selectTemplate: string;
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
    folderStatus.set('folder_present', true);
    return { items };
  }
  folderStatus.set('folder_present', false);
}

const functionName: WizardPageFieldDefinition = {
  id: createFunctionID.function_name,
  label: 'Name',
  type: 'textbox',
  placeholder: 'Provide function name',
};

export const selectLanguage: WizardPageFieldDefinition = {
  id: createFunctionID.select_language,
  label: 'Language',
  placeholder: 'Language Runtime.',
  type: 'combo',
  optionProvider: () => {
    const ret: string[] = storeLanguage.get('language');
    return ret;
  },
};

export const selectTemplate: WizardPageFieldDefinition = {
  id: createFunctionID.select_template,
  label: 'Template',
  placeholder: 'Provide template.',
  type: 'combo',
  optionProvider: (parameters: ParametersType) => {
    const template = storeTemplate.get('template');
    const ret: string[] = template[parameters?.selectLanguage];
    if (ret) {
      return ret;
    }
    return [];
  },
};

export const repositoryField: WizardPageFieldDefinition = {
  id: createFunctionID.repository_inputText,
  label: 'Repository',
  placeholder: 'Provide repository.',
  type: 'combo',
  optionProvider: () => [],
};

const selectLocation: WizardPageFieldDefinition = {
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

const defaultField = [functionName, selectLanguage, selectTemplate, repositoryField, selectLocation];

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
        if (parameters.selectLanguage !== languageChangeCheck?.get('checkLanguageChange')) {
          languageChangeCheck.set('checkLanguageChange', parameters.selectLanguage);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const m: Map<string, FieldDefinitionState> = new Map();
          m.set(createFunctionID.select_template, { forceRefresh: true });
          return { items: [], fieldRefresh: m };
        }
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
      selectLanguage.initialValue = data.selectLanguage;
      selectTemplate.initialValue = data.selectTemplate;
      functionName.initialValue = data.functionName;
      selectLocation.initialValue = data.selectLocation;
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

export async function createFunctionPage(context: vscode.ExtensionContext): Promise<void> {
  const language = await executeCmdCli.executeExec(FuncAPI.listLanguages());
  const template = await executeCmdCli.executeExec(FuncAPI.listTemplate());
  const repository = await executeCmdCli.executeExec(FuncAPI.listRepository());
  storeTemplate.set('template', JSON.parse(template.stdout));
  storeLanguage.set('language', JSON.parse(language.stdout));
  const repositoryListTemplate: { [key: string]: string } = {};
  repository.stdout.split(/\n/).map((item: string) => {
    const repositoryList: string[] = item.split(/\t/);
    if (repositoryList[0].trim() && repositoryList[1].trim()) {
      // eslint-disable-next-line prefer-destructuring
      repositoryListTemplate[repositoryList[0]] = repositoryList[1];
    }
    // eslint-disable-next-line no-useless-return
    return;
  });
  storeRepositoryList.set('repositoryList', repositoryListTemplate);
  delete functionName.initialValue;
  delete selectLocation.initialValue;
  def.pages[0].fields = defaultField;
  createFunction(context);
}
