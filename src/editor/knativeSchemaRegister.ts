/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { extensions, Uri } from 'vscode';
import * as serviceSchema from '../../schemas/knservice.json';

const SCHEME = 'knmsx';
const schemaJSON = JSON.stringify(serviceSchema);

function onRequestSchemaURI(resource: string): string | undefined {
  if (resource.search('.yaml') && !resource.startsWith('knreadonly')) {
    return `${SCHEME}://schema/knative`;
  }
  return undefined;
}

function onRequestSchemaContent(schemaUri: string): string | undefined {
  const parsedUri = Uri.parse(schemaUri);

  if (parsedUri.scheme !== SCHEME) {
    return undefined;
  }

  return schemaJSON;
}

export async function registerSchema(): Promise<void> {
  const yamlExtensionAPI = await extensions.getExtension('redhat.vscode-yaml').activate();
  yamlExtensionAPI.registerContributor(SCHEME, onRequestSchemaURI, onRequestSchemaContent, `apiVersion: serving.knative.dev/v1`);
}
