/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { Uri, window, workspace } from 'vscode';
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { knExecutor } from '../../../src/cli/execute';
import { FuncAPI } from '../../../src/cli/func-api';
import { buildFunction, deployFunction } from '../../../src/functions/function-command/build-and-deploy-function';

const { expect } = chai;
chai.use(sinonChai);

suite('Build-And-Deploy', () => {
  const sandbox = sinon.createSandbox();
  let workspaceFoldersStub: sinon.SinonStub;
  let executeInTerminalStub: sinon.SinonStub;
  let showInputBoxStub: sinon.SinonStub;
  const fixtureFolder = path.join(__dirname, '..', '..', '..', '..', 'test', 'fixtures').normalize();
  const funcUri = Uri.parse(path.join(fixtureFolder, 'func-test'));

  const data = {
    _formatted: null,
    _fsPath: null,
    authority: '',
    fragment: '',
    path: path.join(fixtureFolder, 'func-test'),
    query: '',
    scheme: 'file',
    fsPath: path.join(fixtureFolder, 'func-test'),
  };

  setup(() => {
    workspaceFoldersStub = sandbox.stub(workspace, 'workspaceFolders').value([funcUri]);
    executeInTerminalStub = sandbox.stub(knExecutor, 'executeInTerminal');
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
    await deployFunction();
    expect(executeInTerminalStub).calledOnceWith(FuncAPI.deployFunc(data.fsPath, 'docker.io/test/node-test:latest'));
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
    showInputBoxStub.resolves();
    const result = await deployFunction();
    expect(result).equal(null);
  });

  test('return null if no project open in workspace', async () => {
    workspaceFoldersStub.onFirstCall().value([]);
    const result = await buildFunction();
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
    await buildFunction();
    expect(executeInTerminalStub).calledOnceWith(
      FuncAPI.buildFunc(path.join(fixtureFolder, 'func-test1'), 'docker.io/test/node-test:latest'),
    );
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
    const result = await buildFunction();
    expect(result).equal(null);
  });
});
