/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { workspace } from 'vscode';
import * as chai from 'chai';
import * as fs from 'fs-extra';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { TestItem } from './testFunctionitem';
import { FunctionContextType } from '../../src/cli/config';
import { knExecutor } from '../../src/cli/execute';
import { func, FuncImpl } from '../../src/functions/func';

const { expect } = chai;
chai.use(sinonChai);

suite('Function/Func', () => {
  const sandbox = sinon.createSandbox();
  let workspaceFoldersStub: sinon.SinonStub;
  let executeStub: sinon.SinonStub;
  const element = new TestItem(FuncImpl.ROOT, 'default', FunctionContextType.NAMESPACENODE);
  const fixtureFolder = path.join(__dirname, '..', '..', '..', 'test', 'fixtures').normalize();

  setup(() => {
    executeStub = sandbox.stub(knExecutor, 'execute');
    sandbox.stub(fs, 'watch').resolves();
    workspaceFoldersStub = sandbox.stub(workspace, 'workspaceFolders');
  });

  teardown(() => {
    sandbox.restore();
  });

  test('return function node tree view for namespace', async () => {
    executeStub.onFirstCall().resolves({
      stdout: JSON.stringify({
        contexts: [
          {
            context: {
              namespace: 'default',
            },
          },
        ],
      }),
      error: null,
    });
    const result = await func.getFunctionNodes();
    expect(result.length).equal(1);
  });

  test('display list of function in tree view', async () => {
    executeStub.onFirstCall().resolves({
      stdout: JSON.stringify([
        {
          name: 'node-test',
          namespace: 'default',
          runtime: 'go',
          url: 'http://node-test.default.172.',
          ready: 'True',
        },
      ]),
      error: null,
    });
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
    executeStub.onSecondCall().resolves({
      stdout: JSON.stringify({
        contexts: [
          {
            context: {
              namespace: 'default',
            },
          },
        ],
      }),
      error: null,
    });
    executeStub.onThirdCall().resolves({
      stdout: JSON.stringify({
        name: 'func-test',
        image: 'docker.io',
        namespace: 'default',
        routes: ['http://node-1.default.172.39.nip.io'],
        subscriptions: [],
      }),
      error: null,
    });
    const result = await func.getDeployedFunction(element);
    expect(result.length).equal(1);
  });

  test('display list of function in tree view if fail to get function info', async () => {
    executeStub.onFirstCall().resolves({
      stdout: JSON.stringify([
        {
          name: 'node-test',
          namespace: 'default',
          runtime: 'go',
          url: 'http://node-test.default.172.',
          ready: 'True',
        },
      ]),
      error: null,
    });
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
    executeStub.onSecondCall().resolves({
      stdout: JSON.stringify({
        contexts: [
          {
            context: {
              namespace: 'default',
            },
          },
        ],
      }),
      error: null,
    });
    executeStub.onThirdCall().resolves({
      stdout: '',
      error: null,
    });
    const result = await func.getDeployedFunction(element);
    expect(result.length).equal(1);
  });

  test('show no function found if there is no function available', async () => {
    executeStub.onFirstCall().resolves({
      stdout: JSON.stringify([]),
      error: null,
    });
    workspaceFoldersStub.onFirstCall().value([]);
    executeStub.onSecondCall().resolves({
      stdout: JSON.stringify({
        contexts: [
          {
            context: {
              namespace: 'default',
            },
          },
        ],
      }),
      error: null,
    });
    executeStub.onThirdCall().resolves({
      stdout: '',
      error: null,
    });
    const result = await func.getDeployedFunction(element);
    expect(result.length).equal(1);
  });
});
