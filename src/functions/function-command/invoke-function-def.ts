/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { WizardPageFieldDefinition, WizardPageSectionDefinition } from '@redhat-developer/vscode-wizard';
import { invokeFunctionID } from '../webview-id';

interface Select {
  key: string;
  label: string;
}

const templateSelect: Array<Select> = [
  { key: 'http', label: 'http' },
  { key: 'cloudevents', label: 'cloudevents' },
];

export const invokeInstance: WizardPageFieldDefinition = {
  id: invokeFunctionID.invoke_Instance,
  label: 'Invoke Instance',
  type: 'radio',
  initialValue: 'Local',
  properties: {
    options: ['Local', 'Remote'],
  },
};

export const invokeNamespace: WizardPageFieldDefinition = {
  id: invokeFunctionID.invoke_namespace,
  label: 'Namespace',
  placeholder: 'Provide namespace',
  type: 'textbox',
};

export const invokeID: WizardPageFieldDefinition = {
  id: invokeFunctionID.invoke_ID,
  label: 'ID',
  placeholder: 'Automatically generated. (optional)',
  type: 'textbox',
};

export const invokeUrl: WizardPageFieldDefinition = {
  id: invokeFunctionID.invoke_Url,
  label: 'URL',
  placeholder: 'Target custom URL when invoking the function. (optional)',
  type: 'textbox',
};

export const invokePath: WizardPageFieldDefinition = {
  id: invokeFunctionID.invoke_path,
  label: 'Path',
  placeholder: 'Path which has the instance invoked.',
  type: 'textbox',
  initialState: {
    enabled: false,
  },
};

export const invokeContextType: WizardPageFieldDefinition = {
  id: invokeFunctionID.invoke_context_type,
  label: 'Content-Type',
  placeholder: 'Content Type of the data.',
  initialValue: 'text/plain',
  type: 'combo',
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  optionProvider: () => {
    const ret: string[] = [
      'udio/aac',
      'application/x-abiword',
      'application/x-freearc',
      'image/avif',
      'video/x-msvideo',
      'application/vnd.amazon.ebook',
      'application/octet-stream',
      'image/bmp',
      'application/x-bzip',
      'application/x-bzip2',
      'application/x-cdf',
      'application/x-csh',
      'text/css',
      'text/csv',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-fontobject',
      'application/epub+zip',
      'application/gzip',
      'image/gif',
      'text/html',
      'text/html',
      'image/vnd.microsoft.icon',
      'text/calendar',
      'image/jpg',
      'image/jpeg',
      'text/javascript',
      'application/json',
      'application/ld+json',
      'audio/midi',
      'audio/mpeg',
      'video/mp4',
      'video/mpeg',
      'application/vnd.oasis.opendocument.presentation',
      'application/vnd.oasis.opendocument.spreadsheet',
      'application/vnd.oasis.opendocument.text',
      'audio/ogg',
      'video/ogg',
      'application/ogg',
      'audio/opus',
      'image/png',
      'application/pdf',
      'application/x-httpd-php',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.rar',
      'application/rtf',
      'application/x-sh',
      'image/svg+xml',
      'application/x-tar',
      'image/tiff',
      'text/plain',
      'audio/wav',
      'audio/webm',
      'video/webm',
      'image/webp',
      'application/xhtml+xml',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/xml',
      'application/zip',
      'video/3gpp',
      'video/3gpp2',
      'application/x-7z-compressed',
    ];
    return ret;
  },
};

export const invokeFormat: WizardPageFieldDefinition = {
  id: invokeFunctionID.invoke_format,
  label: 'Format',
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
};

export const invokeSource: WizardPageFieldDefinition = {
  id: invokeFunctionID.invoke_source,
  label: 'Source',
  initialValue: '/boson/fn',
  placeholder: 'Source value for the request data.',
  type: 'textbox',
};

export const invokeType = {
  id: invokeFunctionID.invoke_type,
  label: 'Type',
  initialValue: 'boson.fn',
  placeholder: 'Source value for the request data.',
  type: 'textbox',
};

export const invokeDataText: WizardPageSectionDefinition = {
  id: invokeFunctionID.invoke_data_desc,
  label: 'Data to send in the request. (Env: $FUNC_DATA) (default "Hello World")',
  childFields: [
    {
      id: invokeFunctionID.invoke_data_mode,
      label: 'Mode',
      type: 'radio',
      initialValue: 'Text',
      properties: {
        options: ['Text', 'File'],
      },
    },
    {
      id: invokeFunctionID.invoke_data_text,
      label: 'Data',
      initialValue: 'Hello World',
      placeholder: 'Data to send in the request.',
      type: 'textbox',
    },
  ],
};

export const invokeDataFile: WizardPageSectionDefinition = {
  id: invokeFunctionID.invoke_data_desc,
  label: 'Data to send in the request. (Env: $FUNC_DATA) (default "Hello World")',
  childFields: [
    {
      id: invokeFunctionID.invoke_data_mode,
      label: 'Mode',
      type: 'radio',
      initialValue: 'File',
      properties: {
        options: ['Text', 'File'],
      },
    },
    {
      id: invokeFunctionID.invoke_data_file,
      label: 'data',
      type: 'file-picker',
      placeholder: 'Path to a file to use as data.',
      dialogOptions: {
        canSelectMany: false,
        canSelectFiles: true,
        canSelectFolders: false,
        openLabel: 'Select file',
      },
    },
  ],
};
