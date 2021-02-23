/* eslint-disable @typescript-eslint/no-empty-function */
import * as childProcess from 'child_process';
import { Readable } from 'stream';
import * as vscode from 'vscode';
import { expect } from 'chai';
import * as chai from 'chai';
import { beforeEach } from 'mocha';
import rewire = require('rewire');
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { CmdCli, cliCommandToString, createCliCommand, CliCommand, CliExitData } from '../../src/cli/cmdCli';

const rewiredCLI = rewire('../../src/cli/cmdCli');

chai.use(sinonChai);

suite('Create CLI Command', () => {
  test('should return the CliCommand', () => {
    const args = ['service', 'list', '-o', 'json'];
    const result: CliCommand = createCliCommand('kn', ...args);
    expect(result).to.deep.equal({ cliCommand: 'kn', cliArguments: args });
  });
});
suite('Convert CLI Command to a String', () => {
  test('should return the CliCommand', () => {
    const args = ['service', 'list', '-o', 'json'];
    const command = { cliCommand: 'kn', cliArguments: args };
    const result: string = cliCommandToString(command);
    expect(result).to.equal('kn service list -o json');
  });
});
suite('Command CLI', () => {
  const sandbox = sinon.createSandbox();
  const cmdCli = CmdCli.getInstance();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  const rewiredCmdCli = rewiredCLI.CmdCli.getInstance();
  beforeEach(() => {
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('should create a singleton of the CmdCli', () => {
    const cmdCliInstance = CmdCli.getInstance();
    expect(cmdCliInstance).to.deep.equal(cmdCli);
  });
  test('should show the output channel when showOutputChannel is called', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const spy = sandbox.spy(rewiredCmdCli.knOutputChannel, 'show');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    // eslint-disable-next-line
    rewiredCmdCli.showOutputChannel();
    sinon.assert.calledOnce(spy);
  });

  // No idea how to provide a ChildProcess for this test to work.
  test('should execute the command and return data from running it', () => {
    const readable: Readable = Readable.from(['test data']);
    // const writable: Writable = new Writable();
    const child: childProcess.ChildProcess = {
      stdin: null,
      stdout: readable,
      stderr: readable,
      stdio: [
        null, // stdin
        readable, // stdout
        readable, // stderr
        readable, // extra
        readable, // extra
      ],
      killed: false,
      pid: 1234,
      connected: false,
      exitCode: null,
      signalCode: null,
      spawnargs: null,
      spawnfile: null,
      kill(): boolean {
        return false;
      },
      send(): boolean {
        return false;
      },
      disconnect(): void {},
      unref(): void {},
      ref(): void {},
      addListener(): childProcess.ChildProcess {
        return child;
      },
      emit(): boolean {
        return false;
      },
      on(): childProcess.ChildProcess {
        return child;
      },
      once(): childProcess.ChildProcess {
        return child;
      },
      prependListener(): childProcess.ChildProcess {
        return child;
      },
      prependOnceListener(): childProcess.ChildProcess {
        return child;
      },
      removeListener(): childProcess.ChildProcess {
        return child;
      },
      off(): childProcess.ChildProcess {
        return child;
      },
      removeAllListeners(): childProcess.ChildProcess {
        return child;
      },
      setMaxListeners(): childProcess.ChildProcess {
        return child;
      },
      getMaxListeners(): number {
        return 123;
      },
      // eslint-disable-next-line @typescript-eslint/ban-types
      listeners(): Function[] {
        return null;
      },
      // eslint-disable-next-line @typescript-eslint/ban-types
      rawListeners(): Function[] {
        return null;
      },
      listenerCount(): number {
        return 456;
      },
      eventNames(): Array<string | symbol> {
        return ['test1'];
      },
    };
    const stubSpawn = sandbox.stub(childProcess, 'spawn').returns(child);
    let result: CliExitData;
    cmdCli
      .execute(createCliCommand('kn', 'version'))
      .then((value) => {
        result = value;
      })
      .catch((err: NodeJS.ErrnoException) => {
        // eslint-disable-next-line no-console
        console.log(`cmdCli test execute error - ${err.message}`);
      });
    // const result = await cmdCli.execute(createCliCommand('kn', 'version'));
    // eslint-disable-next-line no-unused-expressions
    expect(result).to.be.undefined;
    sinon.assert.calledOnce(stubSpawn);
  });
});
