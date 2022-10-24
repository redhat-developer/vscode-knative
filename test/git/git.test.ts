/* eslint-disable @typescript-eslint/no-floating-promises */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Extension, extensions, window } from 'vscode';
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { getGitAPI, getGitRepoInteractively, getGitStateByPath, GitState } from '../../src/git/git';
import { API, Branch, Ref, Remote, Repository } from '../../src/git/git.d';

const { expect } = chai;
chai.use(sinonChai);

suite('Git', () => {
  const sandbox = sinon.createSandbox();
  const branch = <Branch>{
    name: 'branch',
  };
  const repository = <Repository>{
    rootUri: {
      fsPath: 'path',
    },
    state: {
      remotes: [],
      refs: [],
      HEAD: branch,
    },
  };

  const remote = <Remote>{
    name: 'remote',
  };
  const ref = <Ref>{
    remote: 'remote',
    name: 'branch',
    commit: '1111',
  };
  const branchWCommit = <Branch>{
    commit: '1111',
    name: 'branch',
  };
  const repositorySecond = <Repository>{
    rootUri: {
      fsPath: 'path',
    },
    state: {
      remotes: [remote],
      refs: [ref],
      HEAD: branchWCommit,
    },
  };

  teardown(() => {
    sandbox.restore();
  });

  test('return null if extension not found', () => {
    sandbox.stub(extensions, 'getExtension').returns(null);
    const result = getGitAPI();
    expect(result).equals(null);
  });

  test('return null if extension has no exports', () => {
    const fakeExtension: Extension<any> = {
      activate: undefined,
      exports: undefined,
      extensionPath: undefined,
      id: 'fakeId',
      isActive: true,
      packageJSON: undefined,
      extensionKind: undefined,
      extensionUri: undefined,
    };
    sandbox.stub(extensions, 'getExtension').returns(fakeExtension);
    const result = getGitAPI();
    expect(result).equals(null);
  });

  test('return API if extension has exports', () => {
    const api: API = <API>{};
    const fakeExtension: Extension<any> = {
      activate: undefined,
      exports: {
        getAPI: () => api,
      },
      extensionPath: undefined,
      id: 'fakeId',
      isActive: true,
      packageJSON: undefined,
      extensionKind: undefined,
      extensionUri: undefined,
    };
    sandbox.stub(extensions, 'getExtension').returns(fakeExtension);
    const result = getGitAPI();
    expect(result).equals(api);
  });

  test('return empty GitState if folder has not git initialized', () => {
    const api: API = <API>{
      repositories: [],
    };
    const fakeExtension: Extension<any> = {
      activate: undefined,
      exports: {
        getAPI: () => api,
      },
      extensionPath: undefined,
      id: 'fakeId',
      isActive: true,
      packageJSON: undefined,
      extensionKind: undefined,
      extensionUri: undefined,
    };
    sandbox.stub(extensions, 'getExtension').returns(fakeExtension);
    const result = getGitStateByPath('path');
    expect(result.remotes.length).equals(0);
    expect(result.refs.length).equals(0);
    expect(result.remote).equals(undefined);
    expect(result.isGit).equals(false);
    expect(result.branch).equals(undefined);
  });

  test('return valid GitState without remote if branch is only local', () => {
    const api: API = <API>{
      repositories: [repository],
    };
    const fakeExtension: Extension<any> = {
      activate: undefined,
      exports: {
        getAPI: () => api,
      },
      extensionPath: undefined,
      id: 'fakeId',
      isActive: true,
      packageJSON: undefined,
      extensionKind: undefined,
      extensionUri: undefined,
    };
    sandbox.stub(extensions, 'getExtension').returns(fakeExtension);
    const result = getGitStateByPath('path');
    expect(result.remotes.length).equals(0);
    expect(result.refs.length).equals(0);
    expect(result.remote).equals(undefined);
    expect(result.isGit).equals(true);
    expect(result.branch.name).equals('branch');
  });

  test('return valid GitState with remote', () => {
    const api: API = <API>{
      repositories: [repositorySecond],
    };
    const fakeExtension: Extension<any> = {
      activate: undefined,
      exports: {
        getAPI: () => api,
      },
      extensionPath: undefined,
      id: 'fakeId',
      isActive: true,
      packageJSON: undefined,
      extensionKind: undefined,
      extensionUri: undefined,
    };
    sandbox.stub(extensions, 'getExtension').returns(fakeExtension);
    const result = getGitStateByPath('path');
    expect(result.remotes.length).equals(1);
    expect(result.refs.length).equals(1);
    expect(result.remote).equals(remote);
    expect(result.isGit).equals(true);
    expect(result.branch.name).equals('branch');
  });

  test('check if warning message is displayed with project not initiliazed on git', () => {
    const gitState: GitState = {
      remotes: [],
      refs: [],
      remote: undefined,
      branch: undefined,
      isGit: false,
    };
    const warningStub = sandbox.stub(window, 'showWarningMessage');
    getGitRepoInteractively(gitState);
    expect(warningStub).to.be.calledOnceWith(
      'This project is not a git repository. Please git initialise it and then proceed to build it on the cluster.',
    );
  });

  test('check if warning message is displayed when working with local branch', () => {
    const gitState: GitState = {
      remotes: [],
      refs: [],
      remote: undefined,
      branch,
      isGit: true,
    };
    const warningLocalStub = sandbox.stub(window, 'showWarningMessage');
    getGitRepoInteractively(gitState);
    expect(warningLocalStub).to.be.calledOnceWith(
      'The local branch is not present remotely. Push it to remote and then proceed to build it on cluster.',
    );
  });

  test('check if warning message is never called with valid remote/branch', () => {
    const gitState: GitState = {
      remotes: [],
      refs: [],
      remote,
      branch,
      isGit: true,
    };
    const warningStub = sandbox.stub(window, 'showWarningMessage');
    getGitRepoInteractively(gitState);
    // eslint-disable-next-line no-unused-expressions
    expect(warningStub).not.called;
  });
});
