// import * as vscode from 'vscode';
import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as sinon from 'sinon';

import rewire = require('rewire');
const rewiredKnOutputChannel = rewire('../../src/output/knOutputChannel');

chai.use(sinonChai);

suite('Output Channel', () => {
  const sandbox = sinon.createSandbox();
  const op = new rewiredKnOutputChannel.KnOutputChannel();

  teardown(() => {
    sandbox.restore();
  });

  test('should print text', () => {
    const channelSpy = sandbox.spy(op.channel, 'append');
    const text = `hello\n`;
    op.print(text);
    sandbox.assert.calledOnce(channelSpy);
  });

  test('should add a new line if none exists when it prints text', () => {
    const channelSpy = sandbox.spy(op.channel, 'append');
    const text = `hello`;
    op.print(text);
    sandbox.assert.calledTwice(channelSpy);
  });

  // test('should call show if config is set to show', () => {
  //   sandbox.stub(vscode.workspace.getConfiguration('knative')).returns(false);
  //   const channelSpy = sandbox.spy(op.channel, 'show');
  //   const text = `hello`;
  //   op.print(text);
  //   sandbox.assert.calledOnce(channelSpy);
  // });

  // test('should NOT call show if config is set to NOT show', () => {
  //   sandbox.stub(vscode.workspace.getConfiguration('knative')).returns(false);
  //   const channelSpy = sandbox.spy(op.channel, 'show');
  //   const text = `hello`;
  //   op.print(text);
  //   sandbox.assert.notCalled(channelSpy);
  // });
});
