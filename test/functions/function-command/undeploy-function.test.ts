/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Uri, window } from 'vscode';
import * as chai from 'chai';
import * as fsExtra from 'fs-extra';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { FunctionContextType, FunctionStatus } from '../../../src/cli/config';
import { knExecutor } from '../../../src/cli/execute';
import { FuncImpl } from '../../../src/functions/func';
import { undeployFunction } from '../../../src/functions/function-command/undeploy-function';
import { TestItem } from '../testFunctionitem';

const { expect } = chai;
chai.use(sinonChai);

suite('Function/undeploy', () => {
  const sandbox = sinon.createSandbox();
  let executeStub: sinon.SinonStub;
  let showWarningMessageStub: sinon.SinonStub;
  let showErrorMessageStub: sinon.SinonStub;
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
  const taskRunNode = new TestItem(
    FuncImpl.ROOT,
    'func1',
    FunctionContextType.FUNCTION,
    null,
    data,
    null,
    FunctionStatus.CLUSTERLOCALBOTH,
  );

  setup(() => {
    executeStub = sandbox.stub(knExecutor, 'execute');
    sandbox.stub(fsExtra, 'remove').resolves();
    showWarningMessageStub = sandbox.stub(window, 'showWarningMessage');
    showErrorMessageStub = sandbox.stub(window, 'showErrorMessage');
  });

  teardown(() => {
    sandbox.restore();
  });

  test('return null if empty context', async () => {
    const result = await undeployFunction(undefined);
    expect(result).equal(null);
  });

  test('return null if use select no', async () => {
    showWarningMessageStub.onFirstCall().resolves('No');
    const result = await undeployFunction(taskRunNode);
    expect(result).equal(null);
  });

  test('undeploy function from tree view', async () => {
    showWarningMessageStub.onFirstCall().resolves('Yes');
    executeStub.onFirstCall().resolves({ error: null, stdout: 'successful' });
    await undeployFunction(taskRunNode);
    // eslint-disable-next-line no-unused-expressions
    expect(executeStub).calledOnce;
    // eslint-disable-next-line no-unused-expressions
    expect(showWarningMessageStub).calledOnce;
  });

  test('show error if it fails to undeploy function', async () => {
    showWarningMessageStub.onFirstCall().resolves('Yes');
    executeStub.onFirstCall().resolves({ error: 'error', stdout: null });
    await undeployFunction(taskRunNode);
    // eslint-disable-next-line no-unused-expressions
    expect(showErrorMessageStub).calledOnce;
    // eslint-disable-next-line no-unused-expressions
    expect(showWarningMessageStub).calledOnce;
  });
});
