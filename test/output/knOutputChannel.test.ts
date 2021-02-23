import rewire = require('rewire');
import * as sinon from 'sinon';

const rewiredKnOutputChannel = rewire('../../src/output/knOutputChannel');

suite('Output Channel', () => {
  const sandbox = sinon.createSandbox();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const op = new rewiredKnOutputChannel.KnOutputChannel();

  teardown(() => {
    sandbox.restore();
  });

  test('should print text', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const channelSpy = sandbox.spy(op.channel, 'append');
    const text = `hello\n`;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    op.print(text);
    sandbox.assert.calledOnce(channelSpy);
  });

  test('should add a new line if none exists when it prints text', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const channelSpy = sandbox.spy(op.channel, 'append');
    const text = `hello`;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
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
