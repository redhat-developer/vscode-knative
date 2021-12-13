/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { window } from 'vscode';
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { FunctionContextType } from '../../../src/cli/config';
import { knExecutor } from '../../../src/cli/execute';
import { FuncImpl } from '../../../src/functions/func';
import { deleteFunction } from '../../../src/functions/function-command/delete-function';
import { TestItem } from '../testFunctionitem';

const { expect } = chai;
chai.use(sinonChai);

suite('Tekton/Task', () => {
  const sandbox = sinon.createSandbox();
  let executeStub: sinon.SinonStub;
  let showWarningMessageStub: sinon.SinonStub;
  let showErrorMessageStub: sinon.SinonStub;
  const taskRunNode = new TestItem(FuncImpl.ROOT, 'func1', FunctionContextType.FUNCTION, null);

  setup(() => {
    executeStub = sandbox.stub(knExecutor, 'execute');
    showWarningMessageStub = sandbox.stub(window, 'showWarningMessage');
    showErrorMessageStub = sandbox.stub(window, 'showErrorMessage');
  });

  teardown(() => {
    sandbox.restore();
  });

  test('return null if empty context', async () => {
    const result = await deleteFunction(undefined);
    expect(result).equal(null);
  });

  test('return null if use select no', async () => {
    showWarningMessageStub.onFirstCall().resolves('No');
    const result = await deleteFunction(taskRunNode);
    expect(result).equal(null);
  });

  test('delete function from tree view', async () => {
    showWarningMessageStub.onFirstCall().resolves('Yes');
    executeStub.onFirstCall().resolves({ error: null, stdout: 'successful' });
    await deleteFunction(taskRunNode);
    // eslint-disable-next-line no-unused-expressions
    expect(executeStub).calledOnce;
    // eslint-disable-next-line no-unused-expressions
    expect(showWarningMessageStub).calledOnce;
  });

  test('show error if it fails to delete function', async () => {
    showWarningMessageStub.onFirstCall().resolves('Yes');
    executeStub.onFirstCall().resolves({ error: 'error', stdout: null });
    await deleteFunction(taskRunNode);
    // eslint-disable-next-line no-unused-expressions
    expect(showErrorMessageStub).calledOnce;
    // eslint-disable-next-line no-unused-expressions
    expect(showWarningMessageStub).calledOnce;
  });
});
