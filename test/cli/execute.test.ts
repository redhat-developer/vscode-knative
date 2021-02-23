import * as vscode from 'vscode';
import { expect } from 'chai';
import * as chai from 'chai';
import { beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { CmdCliConfig } from '../../src/cli/cli-config';
import * as cmdCli from '../../src/cli/cmdCli';
import { Execute, loadItems } from '../../src/cli/execute';
import { WindowUtil } from '../../src/util/windowUtils';

chai.use(sinonChai);

suite('Create CLI Command', () => {
  const sandbox = sinon.createSandbox();
  const cmdCliInstance = cmdCli.CmdCli.getInstance();
  const execute = new Execute();

  beforeEach(() => {
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('should execute a command in the Terminal', async () => {
    const spyWindowUtl = sandbox.spy(WindowUtil, 'createTerminal');
    sandbox.stub(CmdCliConfig, 'detectOrDownload').resolves('/test/tool/location');
    const stubCliCommandToString = sandbox.stub(cmdCli, 'cliCommandToString').returns(' ');
    const args = ['service', 'list', '-o', 'json'];
    const cliCmd: cmdCli.CliCommand = cmdCli.createCliCommand('kn', ...args);
    await execute.executeInTerminal(cliCmd);
    sinon.assert.calledOnce(spyWindowUtl);
    sinon.assert.calledOnce(stubCliCommandToString);
  });
  test('should execute a command in the Terminal when it can not find the tool location', async () => {
    const spyWindowUtl = sandbox.spy(WindowUtil, 'createTerminal');
    sandbox.stub(CmdCliConfig, 'detectOrDownload').resolves(undefined);
    const stubCliCommandToString = sandbox.stub(cmdCli, 'cliCommandToString').returns(' ');
    const args = ['service', 'list', '-o', 'json'];
    const cliCmd: cmdCli.CliCommand = cmdCli.createCliCommand('kn', ...args);
    await execute.executeInTerminal(cliCmd);
    sinon.assert.calledOnce(spyWindowUtl);
    sinon.assert.calledOnce(stubCliCommandToString);
  });
  test('should execute a command', async () => {
    sandbox.stub(CmdCliConfig, 'detectOrDownload').resolves('/test/tool/location');
    const stubCliExecute = sandbox.stub(cmdCliInstance, 'execute').resolves({ error: undefined, stdout: 'test data' });
    const args = ['service', 'list', '-o', 'json'];
    const cliCmd: cmdCli.CliCommand = cmdCli.createCliCommand('kn', ...args);
    await execute.execute(cliCmd);
    sinon.assert.calledOnce(stubCliExecute);
  });
  test('should execute a command with CWD', async () => {
    sandbox.stub(CmdCliConfig, 'detectOrDownload').resolves('/test/tool/location');
    const stubCliExecute = sandbox.stub(cmdCliInstance, 'execute').resolves({ error: undefined, stdout: 'test data' });
    const args = ['service', 'list', '-o', 'json'];
    const cliCmd: cmdCli.CliCommand = cmdCli.createCliCommand('kn', ...args);
    await execute.execute(cliCmd, '/home/test/');
    sinon.assert.calledOnce(stubCliExecute);
  });
  test('should execute a command when tool location is not returned', async () => {
    sandbox.stub(CmdCliConfig, 'detectOrDownload').resolves(undefined);
    const stubCliExecute = sandbox.stub(cmdCliInstance, 'execute').resolves({ error: undefined, stdout: 'test data' });
    const args = ['service', 'list', '-o', 'json'];
    const cliCmd: cmdCli.CliCommand = cmdCli.createCliCommand('kn', ...args);
    await execute.execute(cliCmd);
    sinon.assert.calledOnce(stubCliExecute);
  });
  test('should execute a command and return an error', async () => {
    sandbox.stub(CmdCliConfig, 'detectOrDownload').resolves('/test/tool/location');
    const stubCliExecute = sandbox.stub(cmdCliInstance, 'execute').resolves({ error: 'test error', stdout: undefined });
    const args = ['service', 'list', '-o', 'json'];
    const cliCmd: cmdCli.CliCommand = cmdCli.createCliCommand('kn', ...args);
    try {
      await execute.execute(cliCmd);
    } catch (err) {
      // Do not throw since this is test
    }
    sinon.assert.calledOnce(stubCliExecute);
  });
  test('should execute a command and return an error when fail is false', async () => {
    sandbox.stub(CmdCliConfig, 'detectOrDownload').resolves('/test/tool/location');
    const stubCliExecute = sandbox.stub(cmdCliInstance, 'execute').rejects({ error: 'test error', stdout: undefined });
    const args = ['service', 'list', '-o', 'json'];
    const cliCmd: cmdCli.CliCommand = cmdCli.createCliCommand('kn', ...args);
    try {
      await execute.execute(cliCmd, null, false);
    } catch (err) {
      // Do not throw since this is test
    }
    sinon.assert.calledOnce(stubCliExecute);
  });
});

suite('Load Items', () => {
  test('should return JSON from results', () => {
    const result = loadItems({ error: undefined, stdout: '{"items": {"test": "data"}}' });
    expect(result).to.deep.equal({ test: 'data' });
  });
  test('should return empty JSON from results with "items"', () => {
    const result = loadItems({ error: undefined, stdout: '{"test": "data"}' });
    expect(result).to.deep.equal([]);
  });
});
