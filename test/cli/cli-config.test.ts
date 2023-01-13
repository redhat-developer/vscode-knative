/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as fs from 'fs';
import * as vscode from 'vscode';
import { expect } from 'chai';
import * as chai from 'chai';
import * as fsExtra from 'fs-extra';
import { beforeEach } from 'mocha';
import rewire = require('rewire');
import * as shell from 'shelljs';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { CmdCliConfig, Config } from '../../src/cli/cli-config';
import * as configData from '../../src/cli/cli-config.json';
import { KnAPI } from '../../src/cli/kn-api';
import { KubectlAPI } from '../../src/cli/kubectl-api';
import { Platform } from '../../src/util/platform';

const rewiredCLI = rewire('../../src/cli/cli-config');
// import configData = require('../../src/cli/cli-config.json');

chai.use(sinonChai);

suite('Command CLI Config', () => {
  const sandbox = sinon.createSandbox();
  let revertCLI: () => void;
  let revertFS: () => void;

  const shellMock = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    which: function which(command: string): shell.ShellString {
      if (command === 'kn') {
        const shellString = shell.ShellString('/home/test/.vs-kn/kn');
        return shellString;
      }
      if (command === 'kubectl') {
        const shellString = shell.ShellString('/home/test/.vs-kubectl/kubectl');
        return shellString;
      }
      return undefined;
    },
  };

  const fsMock = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    chmodSync: function chmodSync(path: fs.PathLike, mode: string | number): void {
      // fake the chmod
    },
    existsSync: function existsSync(path: fs.PathLike): boolean {
      if (path === undefined) {
        return false;
      }
      if (path.toString().startsWith('/not/a/valid/location')) {
        return false;
      }
      if (path.toString().startsWith('/throw/error')) {
        const error = new Error('error in existsSync');
        throw error;
      }
      return true;
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    renameSync: function renameSync(oldPath: fs.PathLike, newPath: fs.PathLike): void {
      // rename the file
    },
  };

  beforeEach(() => {
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
    revertCLI = rewiredCLI.__set__('shell', shellMock);
    revertFS = rewiredCLI.__set__('fs', fsMock);
  });

  teardown(() => {
    revertCLI();
    revertFS();
    delete CmdCliConfig.tools.kn;
    delete CmdCliConfig.tools.kubectl;
    delete rewiredCLI.CmdCliConfig.tools.kn;
    delete rewiredCLI.CmdCliConfig.tools.kubectl;
    sandbox.restore();
  });

  suite('load metadata', () => {
    test('should load metadata for Windows', () => {
      const requirements: Config = CmdCliConfig.loadMetadata(configData, 'win32');
      expect(requirements.kn.dlFileName, 'kn-windows-amd64.exe');
    });
    test('should load metadata for Mac', () => {
      const requirements: Config = CmdCliConfig.loadMetadata(configData, 'darwin');
      expect(requirements.kn.dlFileName, 'kn-darwin-amd64');
    });
    test('should load metadata for Linux', () => {
      const requirements: Config = CmdCliConfig.loadMetadata(configData, 'linux');
      expect(requirements.kn.dlFileName, 'kn-linux-amd64');
    });
    test('should return undefined for a non-supported OS name like testOS', () => {
      const requirements: Config = CmdCliConfig.loadMetadata(configData, 'testOS');
      expect(requirements.kn).to.be.undefined;
    });
    test('should not load metadata if the platform object is missing', () => {
      const testData = {
        kn: {
          description: 'Knative CLI tool',
          vendor: 'Red Hat, Inc.',
          name: 'kn',
          version: '0.20.0',
          versionRange: '0.20.0 - 1.0.0',
          versionRangeLabel: 'v0.20.0',
          dlFileName: 'kn',
          cmdFileName: 'kn',
          filePrefix: '',
        },
      };
      const requirements: Config = CmdCliConfig.loadMetadata(testData, 'linux');
      expect(requirements.kn.platform).to.be.undefined;
      expect(requirements.kn.dlFileName, 'kn');
    });
  });

  suite('reset configuration', () => {
    test('should assign the the config data to the tools field', () => {
      const testData = {
        kn: {
          description: 'Knative CLI tool',
          vendor: 'Red Hat, Inc.',
          name: 'kn',
          version: '0.20.0',
          versionRange: '0.20.0 - 1.0.0',
          versionRangeLabel: 'v0.20.0',
          url: 'https://github.com/knative/client/releases/download/v0.20.0/kn-linux-amd64',
          sha256sum: '3bcc486df7849799d6765f3ba41720139545127651630ddc5cc2a81cb74818d5',
          dlFileName: 'kn-linux-amd64',
          cmdFileName: 'kn',
          filePrefix: '',
        },
      };
      sandbox.stub(CmdCliConfig, 'loadMetadata').returns(testData);
      CmdCliConfig.resetConfiguration();
      expect(CmdCliConfig.tools.kn.dlFileName, 'kn-linux-amd64');
    });
  });

  suite('Detect or Download', () => {
    test('should return the location of the tool when using a linux OS and the location was already set', async () => {
      const testData = {
        kn: {
          description: 'Knative CLI tool',
          vendor: 'Red Hat, Inc.',
          name: 'kn',
          version: '0.20.0',
          versionRange: '0.20.0 - 1.0.0',
          versionRangeLabel: 'v0.20.0',
          url: 'https://github.com/knative/client/releases/download/v0.20.0/kn-linux-amd64',
          sha256sum: '3bcc486df7849799d6765f3ba41720139545127651630ddc5cc2a81cb74818d5',
          dlFileName: 'kn-linux-amd64',
          cmdFileName: 'kn',
          filePrefix: '',
          location: '/home/test/.vs-kn/kn',
        },
      };
      CmdCliConfig.tools = testData;
      const result: string = await CmdCliConfig.detectOrDownload('kn');
      expect(result, '/home/test/.vs-kn/kn');
    });
    test('should return the location of the kn tool when using a linux OS and its been installed', async () => {
      const testData = {
        kn: {
          description: 'Knative CLI tool',
          vendor: 'Red Hat, Inc.',
          name: 'kn',
          version: '0.20.0',
          versionRange: '0.20.0 - 1.0.0',
          versionRangeLabel: 'v0.20.0',
          url: 'https://github.com/knative/client/releases/download/v0.20.0/kn-linux-amd64',
          sha256sum: '3bcc486df7849799d6765f3ba41720139545127651630ddc5cc2a81cb74818d5',
          dlFileName: 'kn-linux-amd64',
          cmdFileName: 'kn',
          filePrefix: '',
        },
      };
      rewiredCLI.CmdCliConfig.tools = testData;
      sandbox.stub(Platform, 'OS').returns('linux');
      sandbox.stub(Platform, 'getUserHomePath').returns('/home/test/');
      sandbox.stub(KnAPI, 'getKnVersion').resolves('0.20.0');
      const result: string = await rewiredCLI.CmdCliConfig.detectOrDownload('kn');
      const expected = Platform.OS === 'win32' ? `D:\\home\\test\\.vs-kn\\kn` : `/home/test/.vs-kn/kn`;
      expect(result, expected);
    });
    test('should return the location of the kubectl tool when using a linux OS and its been installed', async () => {
      const testData = {
        kubectl: {
          description: 'Kubernetes CLI tool',
          vendor: 'Google',
          name: 'kubectl',
          version: '1.18.8',
          versionRange: '1.17.0 - 1.20.0',
          versionRangeLabel: 'v1.18.0',
          url: 'https://storage.googleapis.com/kubernetes-release/release/v1.18.8/bin/linux/amd64/kubectl',
          sha256sum: 'a076f5eff0710de94d1eb77bee458ea43b8f4d9572bbb3a3aec1edf0dde0a3e7',
          dlFileName: 'kubectl',
          cmdFileName: 'kubectl',
          filePrefix: '',
        },
      };
      rewiredCLI.CmdCliConfig.tools = testData;
      sandbox.stub(Platform, 'OS').returns('linux');
      sandbox.stub(Platform, 'getUserHomePath').returns('/home/test/');
      sandbox.stub(KubectlAPI, 'getKubectlVersion').resolves('1.18.8');
      const result: string = await rewiredCLI.CmdCliConfig.detectOrDownload('kubectl');
      const expected = Platform.OS === 'win32' ? `D:\\home\\test\\.vs-kubectl\\kubectl` : `/home/test/.vs-kubectl/kubectl`;
      expect(result, expected);
    });
    test('should download the kn tool when using a linux OS and it has NOT been installed and there was an error looking for it', async () => {
      const testData = {
        kn: {
          description: 'Knative CLI tool',
          vendor: 'Red Hat, Inc.',
          name: 'kn',
          version: '0.20.0',
          versionRange: '0.20.0 - 1.0.0',
          versionRangeLabel: 'v0.20.0',
          url: 'https://github.com/knative/client/releases/download/v0.20.0/kn-linux-amd64',
          sha256sum: '3bcc486df7849799d6765f3ba41720139545127651630ddc5cc2a81cb74818d5',
          dlFileName: 'kn-linux-amd64',
          cmdFileName: 'kn',
          filePrefix: '',
        },
      };
      rewiredCLI.CmdCliConfig.tools = testData;
      const stubShowInformationMessage = (sandbox.stub(vscode.window, 'showInformationMessage') as unknown) as sinon.SinonStub<
        [string, vscode.MessageOptions, ...string[]],
        Thenable<string>
      >;
      stubShowInformationMessage.resolves('Download and install v0.20.0');
      sandbox.stub(vscode.window, 'withProgress').resolves();
      sandbox.stub(fsExtra, 'ensureDirSync');
      sandbox.stub(Platform, 'OS').returns('linux');
      sandbox.stub(Platform, 'getUserHomePath').returns('/throw/error');
      // Set a lower version to fail the check for finding the version
      sandbox.stub(KnAPI, 'getKnVersion').resolves('0.19.0');
      const result: string = await rewiredCLI.CmdCliConfig.detectOrDownload('kn');
      expect(result).to.be.undefined;
    });
    test('should download the kn tool when using a linux OS and it has NOT been installed', async () => {
      const testData = {
        kn: {
          description: 'Knative CLI tool',
          vendor: 'Red Hat, Inc.',
          name: 'kn',
          version: '0.20.0',
          versionRange: '0.20.0 - 1.0.0',
          versionRangeLabel: 'v0.20.0',
          url: 'https://github.com/knative/client/releases/download/v0.20.0/kn-linux-amd64',
          sha256sum: '3bcc486df7849799d6765f3ba41720139545127651630ddc5cc2a81cb74818d5',
          dlFileName: 'kn-linux-amd64',
          cmdFileName: 'kn',
          filePrefix: '',
        },
      };
      rewiredCLI.CmdCliConfig.tools = testData;
      const stubShowInformationMessage = (sandbox.stub(vscode.window, 'showInformationMessage') as unknown) as sinon.SinonStub<
        [string, vscode.MessageOptions, ...string[]],
        Thenable<string>
      >;
      stubShowInformationMessage.resolves('Download and install v0.20.0');
      sandbox.stub(vscode.window, 'withProgress').resolves();
      sandbox.stub(fsExtra, 'ensureDirSync');
      sandbox.stub(Platform, 'OS').returns('linux');
      sandbox.stub(Platform, 'getUserHomePath').returns('/not/a/valid/location');
      // Set a lower version to fail the check for finding the version
      sandbox.stub(KnAPI, 'getKnVersion').resolves('0.19.0');
      const result: string = await rewiredCLI.CmdCliConfig.detectOrDownload('kn');
      expect(result).to.be.undefined;
    });
    test('should open the requirements page if Help is selected when downloading the kn tool when using a linux OS and it has NOT been installed', async () => {
      const testData = {
        kn: {
          description: 'Knative CLI tool',
          vendor: 'Red Hat, Inc.',
          name: 'kn',
          version: '0.20.0',
          versionRange: '0.20.0 - 1.0.0',
          versionRangeLabel: 'v0.20.0',
          url: 'https://github.com/knative/client/releases/download/v0.20.0/kn-linux-amd64',
          sha256sum: '3bcc486df7849799d6765f3ba41720139545127651630ddc5cc2a81cb74818d5',
          dlFileName: 'kn-linux-amd64',
          cmdFileName: 'kn',
          filePrefix: '',
        },
      };
      rewiredCLI.CmdCliConfig.tools = testData;
      const stubShowInformationMessage = (sandbox.stub(vscode.window, 'showInformationMessage') as unknown) as sinon.SinonStub<
        [string, vscode.MessageOptions, ...string[]],
        Thenable<string>
      >;
      stubShowInformationMessage.resolves('Help');
      sandbox.stub(vscode.commands, 'executeCommand').resolves();
      sandbox.stub(fsExtra, 'ensureDirSync');
      sandbox.stub(Platform, 'OS').returns('linux');
      sandbox.stub(Platform, 'getUserHomePath').returns('/not/a/valid/location');
      // Set a lower version to fail the check for finding the version
      sandbox.stub(KnAPI, 'getKnVersion').resolves('0.19.0');
      const result: string = await rewiredCLI.CmdCliConfig.detectOrDownload('kn');
      expect(result).to.be.undefined;
    });
    test('should do nothing if Cancel is selected when downloading the kn tool when using a linux OS and it has NOT been installed', async () => {
      const testData = {
        kn: {
          description: 'Knative CLI tool',
          vendor: 'Red Hat, Inc.',
          name: 'kn',
          version: '0.20.0',
          versionRange: '0.20.0 - 1.0.0',
          versionRangeLabel: 'v0.20.0',
          url: 'https://github.com/knative/client/releases/download/v0.20.0/kn-linux-amd64',
          sha256sum: '3bcc486df7849799d6765f3ba41720139545127651630ddc5cc2a81cb74818d5',
          dlFileName: 'kn-linux-amd64',
          cmdFileName: 'kn',
          filePrefix: '',
        },
      };
      rewiredCLI.CmdCliConfig.tools = testData;
      const stubShowInformationMessage = (sandbox.stub(vscode.window, 'showInformationMessage') as unknown) as sinon.SinonStub<
        [string, vscode.MessageOptions, ...string[]],
        Thenable<string>
      >;
      stubShowInformationMessage.resolves('Cancel');
      sandbox.stub(fsExtra, 'ensureDirSync');
      sandbox.stub(Platform, 'OS').returns('linux');
      sandbox.stub(Platform, 'getUserHomePath').returns('/not/a/valid/location');
      // Set a lower version to fail the check for finding the version
      sandbox.stub(KnAPI, 'getKnVersion').resolves('0.19.0');
      const result: string = await rewiredCLI.CmdCliConfig.detectOrDownload('kn');
      expect(result).to.be.undefined;
    });
  });
});
