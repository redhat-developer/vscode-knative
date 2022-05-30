/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Uri } from 'vscode';
import * as vscode from 'vscode';
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { CmdCliConfig } from '../../../src/cli/cli-config';
import { FunctionContextType } from '../../../src/cli/config';
import { FuncImpl } from '../../../src/functions/func';
import * as buildDeploy from '../../../src/functions/function-command/build-and-deploy-function';
import {
  ConfigAction,
  configureEnvs,
  configureFunction,
  configureVolumes,
  ENV_VARIABLES,
  VOLUMES,
} from '../../../src/functions/function-command/configure-function';
import { FolderPick } from '../../../src/functions/function-type';
import { TestItem } from '../testFunctionitem';

const { expect } = chai;
chai.use(sinonChai);

suite('Function/Configure Function', () => {
  const sandbox = sinon.createSandbox();
  let executeTaskStub: sinon.SinonStub;
  const data: Uri = {
    authority: '',
    fragment: '',
    path: 'test',
    query: '',
    scheme: 'file',
    fsPath: 'test',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    with: (change: { scheme?: string; authority?: string; path?: string; query?: string; fragment?: string }): Uri => {
      throw new Error('Function not implemented.');
    },
    toJSON: () => {
      throw new Error('Function not implemented.');
    },
  };
  const funcNode = new TestItem(FuncImpl.ROOT, 'func1', FunctionContextType.FUNCTION, null, data);
  const funcNodeWithoutContextPath = new TestItem(FuncImpl.ROOT, 'func1', FunctionContextType.FUNCTION, null, null);

  setup(() => {
    sandbox.stub(CmdCliConfig, 'detectOrDownload').resolves();
    executeTaskStub = sandbox.stub(vscode.tasks, 'executeTask');
  });

  teardown(() => {
    sandbox.restore();
  });

  test('return null if add action and no workspace is selected', async () => {
    sandbox.stub(buildDeploy, 'selectFunctionFolder').resolves(undefined);
    const result = await configureFunction(ConfigAction.Add);
    expect(result).equal(null);
  });

  test('return null if remove action and no workspace is selected', async () => {
    sandbox.stub(buildDeploy, 'selectFunctionFolder').resolves(undefined);
    const result = await configureFunction(ConfigAction.Remove);
    expect(result).equal(null);
  });

  test('return null if add action and context has empty context path and no workspace is selected', async () => {
    sandbox.stub(buildDeploy, 'selectFunctionFolder').resolves(undefined);
    const result = await configureFunction(ConfigAction.Add, undefined, funcNodeWithoutContextPath);
    expect(result).equal(null);
  });

  test('return null if remove action and context has empty context path and no workspace is selected', async () => {
    sandbox.stub(buildDeploy, 'selectFunctionFolder').resolves(undefined);
    const result = await configureFunction(ConfigAction.Remove, undefined, funcNodeWithoutContextPath);
    expect(result).equal(null);
  });

  function getTestFolderPick(): FolderPick {
    const workspace: vscode.WorkspaceFolder = {
      index: 0,
      name: 'test',
      uri: {
        authority: 'auth',
        fragment: 'frag',
        fsPath: 'path',
        path: 'path',
        query: 'query',
        scheme: 'scheme',
        toJSON: () => '',
        toString: () => '',
        with: undefined,
      },
    };
    return {
      label: 'test',
      workspaceFolder: workspace,
    };
  }

  test('return null if add action and no section is picked up', async () => {
    const folder = getTestFolderPick();
    sandbox.stub(buildDeploy, 'selectFunctionFolder').resolves(folder);
    sandbox.stub(vscode.window, 'showQuickPick').resolves(undefined);
    const result = await configureFunction(ConfigAction.Add);
    expect(result).equal(null);
  });

  test('return null if remove action and no section is picked up', async () => {
    const folder = getTestFolderPick();
    sandbox.stub(buildDeploy, 'selectFunctionFolder').resolves(folder);
    sandbox.stub(vscode.window, 'showQuickPick').resolves(undefined);
    const result = await configureFunction(ConfigAction.Remove);
    expect(result).equal(null);
  });

  test('add environment variable with no initial context', async () => {
    const folder = getTestFolderPick();
    sandbox.stub(buildDeploy, 'selectFunctionFolder').resolves(folder);
    ((sandbox.stub(vscode.window, 'showQuickPick') as unknown) as sinon.SinonStub).resolves(ENV_VARIABLES);
    await configureFunction(ConfigAction.Add, ENV_VARIABLES, funcNode);
    // eslint-disable-next-line no-unused-expressions
    expect(executeTaskStub).calledOnce;
  });

  test('add environment variable', async () => {
    await configureEnvs(ConfigAction.Add, funcNode);
    // eslint-disable-next-line no-unused-expressions
    expect(executeTaskStub).calledOnce;
  });

  test('remove environment variable with no initial context', async () => {
    const folder = getTestFolderPick();
    sandbox.stub(buildDeploy, 'selectFunctionFolder').resolves(folder);
    ((sandbox.stub(vscode.window, 'showQuickPick') as unknown) as sinon.SinonStub).resolves(ENV_VARIABLES);
    await configureFunction(ConfigAction.Remove, ENV_VARIABLES, funcNode);
    // eslint-disable-next-line no-unused-expressions
    expect(executeTaskStub).calledOnce;
  });

  test('remove environment variable', async () => {
    await configureEnvs(ConfigAction.Remove, funcNode);
    // eslint-disable-next-line no-unused-expressions
    expect(executeTaskStub).calledOnce;
  });

  test('add volumes with no initial context', async () => {
    const folder = getTestFolderPick();
    sandbox.stub(buildDeploy, 'selectFunctionFolder').resolves(folder);
    ((sandbox.stub(vscode.window, 'showQuickPick') as unknown) as sinon.SinonStub).resolves(VOLUMES);
    await configureFunction(ConfigAction.Add, VOLUMES, funcNode);
    // eslint-disable-next-line no-unused-expressions
    expect(executeTaskStub).calledOnce;
  });

  test('add volume', async () => {
    await configureVolumes(ConfigAction.Add, funcNode);
    // eslint-disable-next-line no-unused-expressions
    expect(executeTaskStub).calledOnce;
  });

  test('remove volume with no initial context', async () => {
    const folder = getTestFolderPick();
    sandbox.stub(buildDeploy, 'selectFunctionFolder').resolves(folder);
    ((sandbox.stub(vscode.window, 'showQuickPick') as unknown) as sinon.SinonStub).resolves(VOLUMES);
    await configureFunction(ConfigAction.Remove, VOLUMES, funcNode);
    // eslint-disable-next-line no-unused-expressions
    expect(executeTaskStub).calledOnce;
  });

  test('remove volume', async () => {
    await configureVolumes(ConfigAction.Remove, funcNode);
    // eslint-disable-next-line no-unused-expressions
    expect(executeTaskStub).calledOnce;
  });
});
