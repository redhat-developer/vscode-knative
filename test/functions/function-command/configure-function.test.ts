/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Uri } from 'vscode';
import * as vscode from 'vscode';
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { FunctionContextType } from '../../../src/cli/config';
import { knExecutor } from '../../../src/cli/execute';
import { FuncAPI } from '../../../src/cli/func-api';
import { FuncImpl } from '../../../src/functions/func';
import {
  ConfigAction,
  configureFunction,
  ENV_VARIABLES,
  VOLUMES,
} from '../../../src/functions/function-command/configure-function';
import { TestItem } from '../testFunctionitem';

const { expect } = chai;
chai.use(sinonChai);

suite('Function/Configure Function', () => {
  const sandbox = sinon.createSandbox();
  let executeInTerminalStub: sinon.SinonStub;
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
    executeInTerminalStub = sandbox.stub(knExecutor, 'executeInTerminal');
  });

  teardown(() => {
    sandbox.restore();
  });

  test('return null if add action and empty context', async () => {
    const result = await configureFunction(ConfigAction.Add, undefined);
    expect(result).equal(null);
  });

  test('return null if remove action and empty context', async () => {
    const result = await configureFunction(ConfigAction.Remove, undefined);
    expect(result).equal(null);
  });

  test('return null if add action and context has empty context path', async () => {
    const result = await configureFunction(ConfigAction.Add, funcNodeWithoutContextPath);
    expect(result).equal(null);
  });

  test('return null if remove action and context has empty context path', async () => {
    const result = await configureFunction(ConfigAction.Remove, funcNodeWithoutContextPath);
    expect(result).equal(null);
  });

  test('return null if add action and no section is picked up', async () => {
    sandbox.stub(vscode.window, 'showQuickPick').resolves(undefined);
    const result = await configureFunction(ConfigAction.Add, funcNode);
    expect(result).equal(null);
  });

  test('return null if remove action and no section is picked up', async () => {
    sandbox.stub(vscode.window, 'showQuickPick').resolves(undefined);
    const result = await configureFunction(ConfigAction.Remove, funcNode);
    expect(result).equal(null);
  });

  test('add environment variable', async () => {
    ((sandbox.stub(vscode.window, 'showQuickPick') as unknown) as sinon.SinonStub).resolves(ENV_VARIABLES);
    await configureFunction(ConfigAction.Add, funcNode);
    expect(executeInTerminalStub).calledOnceWith(FuncAPI.addEnvironmentVariable(funcNode.contextPath.fsPath));
  });

  test('remove environment variable', async () => {
    ((sandbox.stub(vscode.window, 'showQuickPick') as unknown) as sinon.SinonStub).resolves(ENV_VARIABLES);
    await configureFunction(ConfigAction.Remove, funcNode);
    expect(executeInTerminalStub).calledOnceWith(FuncAPI.removeEnvironmentVariable(funcNode.contextPath.fsPath));
  });

  test('add volume', async () => {
    ((sandbox.stub(vscode.window, 'showQuickPick') as unknown) as sinon.SinonStub).resolves(VOLUMES);
    await configureFunction(ConfigAction.Add, funcNode);
    expect(executeInTerminalStub).calledOnceWith(FuncAPI.addVolumes(funcNode.contextPath.fsPath));
  });

  test('add volume', async () => {
    ((sandbox.stub(vscode.window, 'showQuickPick') as unknown) as sinon.SinonStub).resolves(VOLUMES);
    await configureFunction(ConfigAction.Remove, funcNode);
    expect(executeInTerminalStub).calledOnceWith(FuncAPI.removeVolumes(funcNode.contextPath.fsPath));
  });
});
