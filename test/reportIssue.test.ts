/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import * as chai from 'chai';
import { beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as report from '../src/reportIssue';

chai.use(sinonChai);

suite('Report issue', () => {
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('should open a browser with a link to report an issue', async () => {
    const executeCommandStub = sandbox.stub(vscode.commands, 'executeCommand').resolves();
    await report.reportIssue();
    sinon.assert.calledOnce(executeCommandStub);
  });
});
