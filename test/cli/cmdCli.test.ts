/* eslint-disable @typescript-eslint/no-empty-function */
import * as vscode from 'vscode';
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as referee from '@sinonjs/referee';
import { beforeEach } from 'mocha';
import * as childProcess from 'child_process';
import { Readable } from 'stream';
import { CmdCli, cliCommandToString, createCliCommand, CliCommand, CliExitData } from '../../src/cli/cmdCli';

import rewire = require('rewire');

const rewiredCLI = rewire('../../src/cli/cmdCli');

const { assert } = referee;
chai.use(sinonChai);

suite('Create CLI Command', () => {
  test('should return the CliCommand', () => {
    const args = ['service', 'list', '-o', 'json'];
    const result: CliCommand = createCliCommand('kn', ...args);
    assert.equals(result, { cliCommand: 'kn', cliArguments: args });
  });
});
suite('Convert CLI Command to a String', () => {
  test('should return the CliCommand', () => {
    const args = ['service', 'list', '-o', 'json'];
    const command = { cliCommand: 'kn', cliArguments: args };
    const result: string = cliCommandToString(command);
    assert.equals(result, 'kn service list -o json');
  });
});
suite('Command CLI', () => {
  const sandbox = sinon.createSandbox();
  const cmdCli = CmdCli.getInstance();
  const rewiredCmdCli = rewiredCLI.CmdCli.getInstance();
  beforeEach(() => {
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('should create a singleton of the CmdCli', () => {
    const cmdCliInstance = CmdCli.getInstance();
    assert.equals(cmdCliInstance, cmdCli);
  });
  test('should show the output channel when showOutputChannel is called', () => {
    const spy = sandbox.spy(rewiredCmdCli.knOutputChannel, 'show');
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
      listeners(): Function[] {
        return null;
      },
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
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.log(`cmdCli test execute error - ${err}`);
      });
    // const result = await cmdCli.execute(createCliCommand('kn', 'version'));
    assert.isUndefined(result);
    sinon.assert.calledOnce(stubSpawn);
  });
});
