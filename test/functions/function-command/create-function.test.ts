/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { commands, window, workspace } from 'vscode';
import * as chai from 'chai';
import * as fs from 'fs-extra';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { executeCmdCli } from '../../../src/cli/cmdCli';
import {
  def,
  folderStatus,
  languageChangeCheck,
  validateInputField,
} from '../../../src/functions/function-command/create-function';
import { pathValidation } from '../../../src/functions/validate-item';
import { Platform } from '../../../src/util/platform';

const { expect } = chai;
chai.use(sinonChai);

suite('Function/Create', () => {
  const sandbox = sinon.createSandbox();
  let executeStub: sinon.SinonStub;
  let showInformationMessageStub: sinon.SinonStub;
  let showErrorMessageStub: sinon.SinonStub;

  setup(() => {
    executeStub = sandbox.stub(executeCmdCli, 'executeExec');
    sandbox.stub(fs, 'existsSync').returns(true);
    showInformationMessageStub = sandbox.stub(window, 'showInformationMessage');
    showErrorMessageStub = sandbox.stub(window, 'showErrorMessage');
  });

  teardown(() => {
    sandbox.restore();
  });

  test('return null if empty context', () => {
    const result = validateInputField(
      'test',
      'A folder with this name already exists. Please use a different name.',
      'functionName',
      [],
    );
    expect(result).deep.equal({
      items: [
        {
          severity: 4,
          template: { content: 'A folder with this name already exists. Please use a different name.', id: 'functionName' },
        },
      ],
    });
  });

  test('validator path and function name', () => {
    sandbox.stub(languageChangeCheck, 'get').returns('node');
    const result = def.pages[0].validator({
      functionName: '',
      selectLanguage: 'node',
      selectLocation: 'apple',
      selectTemplate: 'http',
    });
    if (Platform.OS === 'win32') {
      expect(result).deep.equal({
        items: [
          { severity: 4, template: { content: 'Provide name for function', id: 'functionName' } },
          { severity: 4, template: { content: 'Selected path has invalid format.', id: 'selectLocation' } },
          { severity: 4, template: { content: 'The selection is not a valid absolute path.', id: 'selectLocation' } },
        ],
      });
    } else {
      expect(result).deep.equal({
        items: [
          { severity: 4, template: { content: 'Provide name for function', id: 'functionName' } },
          { severity: 4, template: { content: 'The selection is not a valid absolute path.', id: 'selectLocation' } },
        ],
      });
    }
  });

  test('validator for function name if there is any duplicate', () => {
    sandbox.stub(languageChangeCheck, 'get').returns('node');
    const result = def.pages[0].validator({
      functionName: 'test',
      selectLanguage: 'node',
      selectLocation: '',
      selectTemplate: 'http',
    });
    expect(result).deep.equal({
      items: [
        { severity: 4, template: { content: 'Provide path to create function.', id: 'selectLocation' } },
        {
          severity: 4,
          template: { content: 'A folder with this name already exists. Please use a different name.', id: 'functionName' },
        },
      ],
    });
  });

  test('disable finish command if there is any error', () => {
    const result = def.workflowManager.canFinish(null, { selectLanguage: 'node', selectTemplate: 'http' });
    expect(result).equal(false);
  });

  test('enable canFinish button if every field is provided', () => {
    pathValidation.set('path_validation', true);
    folderStatus.set('folder_present', false);
    const result = def.workflowManager.canFinish(null, {
      functionName: 'l',
      selectLanguage: 'node',
      selectLocation: 'test',
      selectTemplate: 'http',
    });
    expect(result).deep.equal(true);
  });

  test('show error in showErrorMessage if there is any failure', async () => {
    executeStub.resolves({ error: 'test', stderr: null });
    const result = await def.workflowManager.performFinish(null, {
      functionName: 'l',
      selectLanguage: 'node',
      selectLocation: 'test',
      selectTemplate: 'http',
    });
    // eslint-disable-next-line no-unused-expressions
    showErrorMessageStub.calledOnce;
    expect(result).equal(null);
  });

  test('open folder in vscode workspace', async () => {
    executeStub.resolves({ error: null, stderr: 'pass' });
    showInformationMessageStub.resolves('Yes');
    sandbox.stub(commands, 'executeCommand').resolves();
    const result = await def.workflowManager.performFinish(null, {
      functionName: 'l',
      selectLanguage: 'node',
      selectLocation: 'test',
      selectTemplate: 'http',
    });
    expect(result).equal(null);
    // eslint-disable-next-line no-unused-expressions
    expect(executeStub).calledOnce;
    // eslint-disable-next-line no-unused-expressions
    expect(showInformationMessageStub).calledOnce;
  });

  test('show user how they want to open project in vscode', async () => {
    executeStub.resolves({ error: null, stderr: 'pass' });
    sandbox.stub(workspace, 'workspaceFolders').value([
      {
        index: 0,
        name: 'node-1',
        uri: {
          _formatted: 'test',
          _fsPath: 'test',
          authority: '',
          fragment: '',
          path: 'test',
          query: '',
          scheme: 'file',
        },
      },
    ]);
    showInformationMessageStub.resolves('Add to this workspace');
    sandbox.stub(commands, 'executeCommand').resolves();
    sandbox.stub(workspace, 'updateWorkspaceFolders').resolves();
    const result = await def.workflowManager.performFinish(null, {
      functionName: 'l',
      selectLanguage: 'node',
      selectLocation: 'test',
      selectTemplate: 'http',
    });
    expect(result).equal(null);
    // eslint-disable-next-line no-unused-expressions
    expect(executeStub).calledOnce;
    // eslint-disable-next-line no-unused-expressions
    expect(showInformationMessageStub).calledOnce;
  });

  test('return null if there is no next page', () => {
    const result = def.workflowManager.getNextPage(null, null);
    expect(result).equal(null);
  });

  test('return null if there is no previous page ', () => {
    const result = def.workflowManager.getPreviousPage(null, null);
    expect(result).equal(null);
  });
});
