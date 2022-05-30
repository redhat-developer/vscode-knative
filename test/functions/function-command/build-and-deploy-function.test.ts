/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { tasks, Uri, window, workspace } from 'vscode';
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { CmdCliConfig } from '../../../src/cli/cli-config';
import { executeCmdCli } from '../../../src/cli/cmdCli';
import { FunctionContextType } from '../../../src/cli/config';
import { knExecutor } from '../../../src/cli/execute';
import { FuncImpl } from '../../../src/functions/func';
import { buildFunction, deployFunction } from '../../../src/functions/function-command/build-and-deploy-function';
import { TestItem } from '../testFunctionitem';

const { expect } = chai;
chai.use(sinonChai);

suite('Build-And-Deploy', () => {
  const sandbox = sinon.createSandbox();
  let workspaceFoldersStub: sinon.SinonStub;
  let executeTaskStub: sinon.SinonStub;
  let showInputBoxStub: sinon.SinonStub;
  let showInformationMessageStub: sinon.SinonStub;
  const fixtureFolder = path.join(__dirname, '..', '..', '..', '..', 'test', 'fixtures').normalize();
  const funcUri = Uri.parse(path.join(fixtureFolder, 'func-test'));
  const contextNode = new TestItem(FuncImpl.ROOT, 'func1', FunctionContextType.FUNCTION, null);

  setup(() => {
    workspaceFoldersStub = sandbox.stub(workspace, 'workspaceFolders').value([funcUri]);
    showInformationMessageStub = sandbox.stub(window, 'showInformationMessage');
    executeTaskStub = sandbox.stub(tasks, 'executeTask');
    sandbox.stub(knExecutor, 'execute').resolves();
    sandbox.stub(CmdCliConfig, 'detectOrDownload').resolves();
    sandbox.stub(executeCmdCli, 'executeExec').resolves({ error: 'error', stdout: undefined });
    showInputBoxStub = sandbox.stub(window, 'showInputBox');
  });

  teardown(() => {
    sandbox.restore();
  });

  test('return null if no project open in workspace', async () => {
    workspaceFoldersStub.onFirstCall().value([]);
    const result = await deployFunction();
    expect(result).equal(null);
  });

  test('execute deploy command', async () => {
    workspaceFoldersStub.onFirstCall().value([
      {
        uri: {
          _formatted: null,
          _fsPath: null,
          authority: '',
          fragment: '',
          path: path.join(fixtureFolder, 'func-test'),
          query: '',
          scheme: 'file',
          fsPath: path.join(fixtureFolder, 'func-test'),
        },
      },
    ]);
    contextNode.contextPath = {
      authority: '',
      fragment: '',
      path: path.join(fixtureFolder, 'func-test'),
      query: '',
      scheme: 'file',
      fsPath: path.join(fixtureFolder, 'func-test'),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      with: (change: { scheme?: string; authority?: string; path?: string; query?: string; fragment?: string }): Uri => {
        throw new Error('Function not implemented.');
      },
      toJSON: () => {
        throw new Error('Function not implemented.');
      },
    };
    showInformationMessageStub.resolves('Ok');
    await deployFunction(contextNode);
    // eslint-disable-next-line no-unused-expressions
    expect(executeTaskStub).calledOnce;
  });

  test('return null if image is not provided', async () => {
    workspaceFoldersStub.onFirstCall().value([
      {
        uri: {
          _formatted: null,
          _fsPath: null,
          authority: '',
          fragment: '',
          path: path.join(fixtureFolder, 'func-test1'),
          query: '',
          scheme: 'file',
          fsPath: path.join(fixtureFolder, 'func-test1'),
        },
      },
    ]);
    contextNode.contextPath = {
      authority: '',
      fragment: '',
      path: path.join(fixtureFolder, 'func-test1'),
      query: '',
      scheme: 'file',
      fsPath: path.join(fixtureFolder, 'func-test1'),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      with: (change: { scheme?: string; authority?: string; path?: string; query?: string; fragment?: string }): Uri => {
        throw new Error('Function not implemented.');
      },
      toJSON: () => {
        throw new Error('Function not implemented.');
      },
    };
    showInputBoxStub.resolves();
    const result = await deployFunction(contextNode);
    expect(result).equal(null);
  });

  test('return null if no project open in workspace', async () => {
    workspaceFoldersStub.onFirstCall().value([]);
    const result = await buildFunction(contextNode);
    expect(result).equal(null);
  });

  test('execute builder command', async () => {
    workspaceFoldersStub.onFirstCall().value([
      {
        uri: {
          _formatted: null,
          _fsPath: null,
          authority: '',
          fragment: '',
          path: path.join(fixtureFolder, 'func-test1'),
          query: '',
          scheme: 'file',
          fsPath: path.join(fixtureFolder, 'func-test1'),
        },
      },
    ]);
    showInputBoxStub.onFirstCall().resolves('docker.io/test/node-test:latest');
    await buildFunction(contextNode);
    // eslint-disable-next-line no-unused-expressions
    expect(executeTaskStub).calledOnce;
  });

  test('return null if build image not provided', async () => {
    workspaceFoldersStub.onFirstCall().value([
      {
        uri: {
          _formatted: null,
          _fsPath: null,
          authority: '',
          fragment: '',
          path: path.join(fixtureFolder, 'func-test1'),
          query: '',
          scheme: 'file',
          fsPath: path.join(fixtureFolder, 'func-test1'),
        },
      },
    ]);
    showInputBoxStub.onFirstCall().resolves('');
    const result = await buildFunction(contextNode);
    expect(result).equal(null);
  });
});
