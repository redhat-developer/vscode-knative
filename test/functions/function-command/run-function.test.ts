/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Uri } from 'vscode';
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { FunctionContextType } from '../../../src/cli/config';
import { knExecutor } from '../../../src/cli/execute';
import { FuncAPI } from '../../../src/cli/func-api';
import { FuncImpl } from '../../../src/functions/func';
import { runFunction } from '../../../src/functions/function-command/run-function';
import { TestItem } from '../testFunctionitem';

const { expect } = chai;
chai.use(sinonChai);

suite('Function/Run', () => {
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
  const taskRunNode = new TestItem(FuncImpl.ROOT, 'func1', FunctionContextType.FUNCTION, null, data);

  setup(() => {
    executeInTerminalStub = sandbox.stub(knExecutor, 'executeInTerminal');
  });

  teardown(() => {
    sandbox.restore();
  });

  test('return null if empty context', async () => {
    const result = await runFunction(undefined);
    expect(result).equal(null);
  });

  test('delete function from tree view', async () => {
    await runFunction(taskRunNode);
    expect(executeInTerminalStub).calledOnceWith(FuncAPI.runFunc(taskRunNode.contextPath.fsPath));
  });
});
