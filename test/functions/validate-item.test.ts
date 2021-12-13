/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

// import * as vscode from 'vscode';
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
// import { TestItem } from './testFunctionitem';
// import { FunctionContextType } from '../../src/cli/config';

// const { expect } = chai;
chai.use(sinonChai);

suite('Tekton/Task', () => {
  const sandbox = sinon.createSandbox();
  // const taskNode = new TestItem(TknImpl.ROOT, 'test-task', FunctionContextType.TASKNODE, null);
  // const taskItem = new TestItem(taskNode, 'task', ContextType.TASK, null);

  setup(() => {
    // sandbox.stub(TknImpl.prototype, 'execute').resolves({ error: null, stdout: '', stderr: '' });
    // sandbox.stub(TknImpl.prototype, 'getTasks').resolves([taskItem]);
    // sandbox.stub(TektonItem, 'getTaskNames').resolves([taskItem]);
    // sandbox.stub(vscode.window, 'showInputBox').resolves();
  });

  teardown(() => {
    sandbox.restore();
  });
});
