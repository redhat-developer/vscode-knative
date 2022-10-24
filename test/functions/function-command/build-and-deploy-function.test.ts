/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { Uri, window, workspace } from 'vscode';
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { executeCmdCli } from '../../../src/cli/cmdCli';
import { FunctionContextType } from '../../../src/cli/config';
import { knExecutor } from '../../../src/cli/execute';
import { contextGlobalState } from '../../../src/extension';
import { FuncImpl } from '../../../src/functions/func';
import * as buildAndDeploy from '../../../src/functions/function-command/build-and-deploy-function';
import * as git from '../../../src/git/git';
import { Remote } from '../../../src/git/git.d';
import { STILL_EXECUTING_COMMAND } from '../../../src/util/output_channels';
import { TestItem } from '../testFunctionitem';

const { expect } = chai;
chai.use(sinonChai);

suite('Build-And-Deploy', () => {
  const sandbox = sinon.createSandbox();
  let workspaceFoldersStub: sinon.SinonStub;
  let stillExecutingCommandStub: sinon.SinonStub<[key: string], boolean>;
  let showInputBoxStub: sinon.SinonStub;
  let showInformationMessageStub: sinon.SinonStub;
  let showWarningMessageStub: sinon.SinonStub;
  const fixtureFolder = path.join(__dirname, '..', '..', '..', '..', 'test', 'fixtures').normalize();
  const funcUri = Uri.parse(path.join(fixtureFolder, 'func-test'));
  const contextNode = new TestItem(FuncImpl.ROOT, 'func1', FunctionContextType.FUNCTION, null);

  setup(() => {
    workspaceFoldersStub = sandbox.stub(workspace, 'workspaceFolders').value([funcUri]);
    showInformationMessageStub = sandbox.stub(window, 'showInformationMessage').resolves();
    stillExecutingCommandStub = sandbox.stub(STILL_EXECUTING_COMMAND, 'get').returns(true);
    showWarningMessageStub = sandbox.stub(window, 'showWarningMessage').resolves();
    sandbox.stub(knExecutor, 'executeInTerminal');
    sandbox.stub(knExecutor, 'execute').resolves();
    sandbox.stub(executeCmdCli, 'executeExec').resolves({ error: 'error', stdout: undefined });
    showInputBoxStub = sandbox.stub(window, 'showInputBox');
  });
  teardown(() => {
    sandbox.restore();
  });

  test('return null if no project open in workspace', async () => {
    workspaceFoldersStub.onFirstCall().value([]);
    const result = await buildAndDeploy.deployFunction();
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
    await buildAndDeploy.deployFunction(contextNode);
    // eslint-disable-next-line no-unused-expressions
    expect(showWarningMessageStub).calledOnce;
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
    const result = await buildAndDeploy.deployFunction(contextNode);
    expect(result).equal(null);
  });

  test('return null if no project open in workspace', async () => {
    workspaceFoldersStub.onFirstCall().value([]);
    const result = await buildAndDeploy.buildFunction();
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
    await buildAndDeploy.buildFunction(contextNode);
    // eslint-disable-next-line no-unused-expressions
    expect(stillExecutingCommandStub).calledOnce;
    // eslint-disable-next-line no-unused-expressions
    expect(showWarningMessageStub).calledOnce;
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
    const result = await buildAndDeploy.buildFunction();
    expect(result).equal(null);
  });

  suite('on-cluster build', () => {
    test('return null if no context is provided', async () => {
      const result = await buildAndDeploy.onClusterBuildFunction();
      expect(result).equal(null);
    });

    test('return null and show warning if tekton is not installed on cluster', async () => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      contextGlobalState.globalState.update('hasTekton', false);
      const result = await buildAndDeploy.onClusterBuildFunction(contextNode);
      expect(result).equal(null);
    });

    test('return null if user does not add valid git remote infos', async () => {
      const gitState = <git.GitState>{};
      sandbox.stub(git, 'getGitStateByPath').returns(gitState);
      sandbox.stub(git, 'getGitRepoInteractively').resolves(null);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      contextGlobalState.globalState.update('hasTekton', true);
      const result = await buildAndDeploy.onClusterBuildFunction(contextNode);
      expect(result).equal(null);
    });

    test('return null if user does not add valid git branch infos', async () => {
      const gitState = <git.GitState>{};
      sandbox.stub(git, 'getGitStateByPath').returns(gitState);
      sandbox.stub(git, 'getGitRepoInteractively').resolves('remote');
      sandbox.stub(git, 'getGitBranchInteractively').resolves(null);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      contextGlobalState.globalState.update('hasTekton', true);
      const result = await buildAndDeploy.onClusterBuildFunction(contextNode);
      expect(result).equal(null);
    });

    test('return null if user does not select a valid image strategy', async () => {
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
      const remote = <Remote>{
        name: 'remote',
        fetchUrl: 'url',
      };
      const gitState = <git.GitState>{
        remotes: [remote],
      };
      sandbox.stub(git, 'getGitStateByPath').returns(gitState);
      sandbox.stub(git, 'getGitRepoInteractively').resolves('remote');
      sandbox.stub(git, 'getGitBranchInteractively').resolves('branch');
      sandbox.stub(window, 'showQuickPick' as any).resolves(null);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      contextGlobalState.globalState.update('hasTekton', true);
      const result = await buildAndDeploy.onClusterBuildFunction(contextNode);
      expect(result).equal(null);
    });
  });
});
