import { Disposable, FileStat, FileType, Uri, window, workspace, WorkspaceFolder } from 'vscode';
import * as chai from 'chai';
import * as fs from 'fs';
import * as sinonChai from 'sinon-chai';
import * as sinon from 'sinon';
import * as referee from '@sinonjs/referee';
import * as pth from 'path';
import { beforeEach } from 'mocha';
import { CliExitData } from '../../src/cli/cmdCli';
import * as knv from '../../src/cli/virtualfs';

import rewire = require('rewire');

const vfs = rewire('../../src/cli/virtualfs');

const { assert } = referee;
// const { expect } = chai;
chai.use(sinonChai);

suite('VirtualFileSystem', () => {
  const sandbox = sinon.createSandbox();
  let revertFS: Function;
  const knvfs: knv.KnativeResourceVirtualFileSystemProvider = new vfs.KnativeResourceVirtualFileSystemProvider();

  const _uriLocalFile = Uri.file('service-local.yaml');
  const _uriLocalRevisionFile = Uri.file('revision-local.yaml');
  const _uriLocalErrorFile = Uri.file('error-local.yaml');
  const _uriExternalFile = Uri.parse(
    'knmsx://loadknativecore/service-example.yaml?contextValue%3Dservice%26name%3Dexample%26_%3D1594328823824',
  );
  const _uriExternalFileForRevision = Uri.parse(
    'knmsx://loadknativecore/revision-example-75w7v.yaml?contextValue%3Drevision%26name%3Dexample%26_%3D1594328823824',
  );
  const _uriExternalFileForTaggedRevision = Uri.parse(
    'knmsx://loadknativecore/revision-example-75w7v.yaml?contextValue%3Drevision-tagged%26name%3Dexample%26_%3D1594328823824',
  );
  const _uriExternalFileWithNamespace = Uri.parse(
    'knmsx://loadknativecore/service-example.yaml?ns%3DtestNamespace%26contextValue%3Dservice%26name%3Dexample%26_%3D1594328823824',
  );
  const _uriExternalFileNotKnative = Uri.parse(
    'knmsx://loadothercore/service-example.yaml?contextValue%3Dservice%26name%3Dexample%26_%3D1594328823824',
  );
  const _uriWorkspaceRoot = Uri.file(`${pth.sep}workspace${pth.sep}root${pth.sep}test${pth.sep}uri`);
  const testLocalServiceContent = `apiVersion: serving.knative.dev/v1 kind: Service metadata: annotations: serving.knative.dev/creator: system:admin serving.knative.dev/lastModifier: system:admin creationTimestamp: "2020-07-09T02:39:32Z" generation: 1 name: local namespace: a-serverless-example spec: template: metadata: annotations: client.knative.dev/user-image: quay.io/rhdevelopers/knative-tutorial-greeter:quarkus creationTimestamp: null name: local-qycgp-1 spec: containerConcurrency: 0 containers: - image: quay.io/rhdevelopers/knative-tutorial-greeter:quarkus name: user-container readinessProbe: successThreshold: 1 tcpSocket: port: 0 resources: {} timeoutSeconds: 300 traffic: - latestRevision: true percent: 100 `;
  const testLocalRevisionContent = `apiVersion: serving.knative.dev/v1 kind: Revision metadata: annotations: serving.knative.dev/creator: system:admin serving.knative.dev/lastPinned: "1595546588" creationTimestamp: "2020-07-23T23:23:04Z" generateName: example- generation: 1 labels: serving.knative.dev/configuration: example serving.knative.dev/configurationGeneration: "3" serving.knative.dev/route: example serving.knative.dev/service: example managedFields: - apiVersion: serving.knative.dev/v1 fieldsType: FieldsV1 fieldsV1: f:metadata: f:annotations: .: {} f:serving.knative.dev/creator: {} f:serving.knative.dev/lastPinned: {} f:generateName: {} f:labels: .: {} f:serving.knative.dev/configuration: {} f:serving.knative.dev/configurationGeneration: {} f:serving.knative.dev/route: {} f:serving.knative.dev/service: {} f:ownerReferences: .: {} k:{"uid":"44de9281-8fff-4aeb-8a69-7bea9947f43d"}: .: {} f:apiVersion: {} f:blockOwnerDeletion: {} f:controller: {} f:kind: {} f:name: {} f:uid: {} f:spec: .: {} f:containerConcurrency: {} f:containers: {} f:timeoutSeconds: {} f:status: .: {} f:conditions: {} f:imageDigest: {} f:logUrl: {} f:observedGeneration: {} f:serviceName: {} manager: controller operation: Update time: "2020-07-23T23:24:08Z" name: example-75w7v namespace: a-serverless-example ownerReferences: - apiVersion: serving.knative.dev/v1 blockOwnerDeletion: true controller: true kind: Configuration name: example uid: 44de9281-8fff-4aeb-8a69-7bea9947f43d resourceVersion: "81531" selfLink: /apis/serving.knative.dev/v1/namespaces/a-serverless-example/revisions/example-75w7v uid: e0fe4445-ed60-44f7-b4b1-7126fb252810 spec: containerConcurrency: 0 containers: - image: quay.io/rhdevelopers/knative-tutorial-greeter:quarkus name: user-container readinessProbe: successThreshold: 1 tcpSocket: port: 0 resources: {} timeoutSeconds: 300 status: conditions: - lastTransitionTime: "2020-07-23T23:24:08Z" message: The target is not receiving traffic. reason: NoTraffic severity: Info status: "False" type: Active - lastTransitionTime: "2020-07-23T23:23:08Z" status: "True" type: ContainerHealthy - lastTransitionTime: "2020-07-23T23:23:08Z" status: "True" type: Ready - lastTransitionTime: "2020-07-23T23:23:08Z" status: "True" type: ResourcesAvailable imageDigest: quay.io/rhdevelopers/knative-tutorial-greeter@sha256:767e2f4b37d29de3949c8c695d3285739829c348df1dd703479bbae6dc86aa5a logUrl: http://localhost:8001/api/v1/namespaces/knative-monitoring/services/kibana-logging/proxy/app/kibana#/discover?_a=(query:(match:(kubernetes.labels.knative-dev%2FrevisionUID:(query:'e0fe4445-ed60-44f7-b4b1-7126fb252810',type:phrase)))) observedGeneration: 1 serviceName: example-75w7v`;
  const wsFolder1: WorkspaceFolder = { uri: _uriWorkspaceRoot, name: 'test1', index: 1 };
  const wsFolder2: WorkspaceFolder = { uri: _uriWorkspaceRoot, name: 'test2', index: 2 };
  const wsFolder3: WorkspaceFolder = { uri: _uriWorkspaceRoot, name: 'test3', index: 3 };
  const oneWSFolders: WorkspaceFolder[] = [wsFolder1];
  const multipleWSFolders: WorkspaceFolder[] = [wsFolder1, wsFolder2, wsFolder3];
  const emptyWSFolders: WorkspaceFolder[] = undefined;
  // HTTP URI
  const _uriRootNotFile = Uri.parse('http://testHttp/some/uri');
  const wsFolderNotFile: WorkspaceFolder = { uri: _uriRootNotFile, name: 'test3', index: 3 };
  const notFileWSFolders: WorkspaceFolder[] = [wsFolderNotFile];

  const fsMock = {
    existsSync: function existsSync(path: fs.PathLike): boolean {
      const externalUri = `${_uriWorkspaceRoot.fsPath}${pth.sep}.knative${_uriExternalFile.fsPath}`;
      const externalRevisionUri = `${_uriWorkspaceRoot.fsPath}${pth.sep}.knative${_uriExternalFileForRevision.fsPath}`;
      const externalTaggedRevisionUri = `${_uriWorkspaceRoot.fsPath}${pth.sep}.knative${_uriExternalFileForTaggedRevision.fsPath}`;
      if (path === undefined) {
        return false;
      }
      if (path === externalUri || path === _uriExternalFile.fsPath) {
        return false;
      }
      if (path === externalRevisionUri || path === _uriExternalFileForRevision.fsPath) {
        return false;
      }
      if (path === externalTaggedRevisionUri || path === _uriExternalFileForTaggedRevision.fsPath) {
        return false;
      }
      return true;
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mkdirSync: function mkdirSync(path: fs.PathLike, options?: number | string | fs.MakeDirectoryOptions | null): void {
      if (!path) {
        const err = `test mock of mkdirSync can not parse "${path}"`;
        throw err;
      }
    },
    readdirSync: function readdirSync(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      path: fs.PathLike,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      options?: { encoding: BufferEncoding | null; withFileTypes?: false } | BufferEncoding | null,
    ): string[] {
      return [`${pth.sep}test1.yaml`, `${pth.sep}test2.yaml`];
    },
    readFileSync: function readFileSync(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      path: fs.PathLike | number,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      options: { encoding: string; flag?: string } | string,
    ): string {
      // const p: string = path as string;
      // if (p.endsWith('/revision-example-75w7v.yaml')) {
      //   return testLocalRevisionContent;
      // }
      return testLocalServiceContent;
    },
    rename: function rename(oldPath: fs.PathLike, newPath: fs.PathLike, callback: fs.NoParamCallback): void {
      let error: NodeJS.ErrnoException | null = null;
      if (
        oldPath === `${pth.sep}workspace${pth.sep}root${pth.sep}test${pth.sep}uri${pth.sep}.knative${pth.sep}error-local.yaml` ||
        oldPath === undefined ||
        newPath === undefined
      ) {
        error = { name: 'test error', message: 'could not find the file' };
      }
      callback(error);
    },
    stat: function stat(path: fs.PathLike, callback: (err: NodeJS.ErrnoException, stats: fs.Stats) => void): void {
      let error: NodeJS.ErrnoException | null = null;
      if (path === undefined) {
        error = { name: 'test error', message: 'could not find the file' };
      }
      const stats: fs.Stats = {
        ctimeMs: 1,
        mtimeMs: 2,
        size: 3,
      } as fs.Stats;
      callback(error, stats);
    },
    unlink: function unlink(path: fs.PathLike, callback: fs.NoParamCallback): void {
      let error: NodeJS.ErrnoException | null = null;
      if (path === `${pth.sep}error-local.yaml` || path === undefined) {
        error = { name: 'test error', message: 'could not find the file' };
      }
      callback(error);
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    writeFileSync: function writeFileSync(path: fs.PathLike | number, data: any, options?: fs.WriteFileOptions): void {
      // do nothing
    },
  };

  beforeEach(() => {
    revertFS = vfs.__set__('fs', fsMock);
  });

  teardown(() => {
    revertFS();
    sandbox.restore();
  });

  suite('VFS URI convertion', () => {
    test('should return unique URI', () => {
      const builtURI: Uri = vfs.vfsUri('knmsx', 'service', 'example', 'yaml');
      assert.equals(builtURI.authority, _uriExternalFile.authority);
      assert.equals(builtURI.fsPath, _uriExternalFile.fsPath);
      assert.equals(builtURI.scheme, _uriExternalFile.scheme);
    });
    test('should return unique URI with optional Namespace', () => {
      const builtURI: Uri = vfs.vfsUri('knmsx', 'service', 'example', 'yaml', 'testNamespace');
      assert.equals(builtURI.authority, _uriExternalFileWithNamespace.authority);
      assert.equals(builtURI.fsPath, _uriExternalFileWithNamespace.fsPath);
      assert.equals(builtURI.scheme, _uriExternalFileWithNamespace.scheme);
      assert.equals(builtURI.query.includes('testNamespace'), _uriExternalFileWithNamespace.query.includes('testNamespace'));
    });
  });
  // TODO: figure out how to test an event that is fired.
  suite('Watch', () => {
    test('should return a Disposable object', () => {
      const watcher = knvfs.watch(_uriLocalFile, null);
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      assert.equals(watcher, new Disposable(() => {}));
    });
  });

  suite('Stat', () => {
    const fstat: FileStat = {
      type: FileType.File,
      ctime: 1,
      mtime: 2,
      size: 3,
    };
    test('should return the file stat information for a file passed in to it.', async () => {
      sandbox.stub(workspace, 'workspaceFolders').value(oneWSFolders);
      const fileStat: FileStat = await knvfs.stat(_uriLocalFile);
      assert.equals(fileStat, fstat);
      sandbox.restore();
    });
    test('should throw an error if it can not find the workspace file.', async () => {
      sandbox.stub(workspace, 'workspaceFolders').value(emptyWSFolders);
      let error: NodeJS.ErrnoException;
      try {
        await knvfs.stat(_uriLocalFile);
      } catch (err) {
        error = err;
      }
      assert(error);
      sandbox.restore();
    });
    test('should throw an error if the uri is not of type File.', async () => {
      sandbox.stub(workspace, 'workspaceFolders').value(notFileWSFolders);
      let error: NodeJS.ErrnoException;
      try {
        await knvfs.stat(_uriLocalFile);
      } catch (err) {
        error = err;
      }
      assert(error);
      sandbox.restore();
    });
    test('should return the file stat information for a file if multiple files are passed in to it.', async () => {
      sandbox.stub(workspace, 'workspaceFolders').value(multipleWSFolders);
      sandbox.stub(window, 'showWorkspaceFolderPick').resolves(multipleWSFolders[0]);
      const fileStat: FileStat = await knvfs.stat(_uriLocalFile);
      assert.equals(fileStat, fstat);
      sandbox.restore();
    });
  });

  suite('Read Directory', () => {
    const files: [string, FileType][] = [
      [`${pth.sep}workspace${pth.sep}root${pth.sep}test${pth.sep}uri${pth.sep}.knative${pth.sep}test1.yaml`, 1],
      [`${pth.sep}workspace${pth.sep}root${pth.sep}test${pth.sep}uri${pth.sep}.knative${pth.sep}test2.yaml`, 1],
    ];
    test('should return a list of files from one folder.', async () => {
      sandbox.stub(workspace, 'workspaceFolders').value(oneWSFolders);
      const foundFiles: [string, FileType][] = await knvfs.readDirectory(null);
      assert.equals(foundFiles, files);
      sandbox.restore();
    });
    test('should return a list of files when no sub-folder is provided.', async () => {
      sandbox.stub(workspace, 'workspaceFolders').value(oneWSFolders);
      const foundPath = await vfs.getFilePathAsync();
      assert.equals(foundPath, _uriWorkspaceRoot.fsPath);
      sandbox.restore();
    });
    test('should throw an error if it can not find the workspace folder.', async () => {
      sandbox.stub(workspace, 'workspaceFolders').value(emptyWSFolders);
      let error;
      try {
        await knvfs.readDirectory(_uriLocalFile);
      } catch (err) {
        error = err;
      }
      assert(error);
      sandbox.restore();
    });
    test('should throw an error if the uri is not of type File.', async () => {
      sandbox.stub(workspace, 'workspaceFolders').value(notFileWSFolders);
      let error;
      try {
        await knvfs.readDirectory(_uriLocalFile);
      } catch (err) {
        error = err;
      }
      assert(error);
      sandbox.restore();
    });
    test('should return a list of files if multiple folders are found.', async () => {
      sandbox.stub(workspace, 'workspaceFolders').value(multipleWSFolders);
      sandbox.stub(window, 'showWorkspaceFolderPick').resolves(multipleWSFolders[0]);
      const foundFiles: [string, FileType][] = await knvfs.readDirectory(_uriLocalFile);
      assert.equals(foundFiles, files);
      sandbox.restore();
    });
  });
  suite('Create Directory', () => {
    test('should NOT create a directory if the directory already exists.', async () => {
      const spyExists = sandbox.spy(fsMock, 'existsSync');
      const spyMkDir = sandbox.spy(fsMock, 'mkdirSync');
      sandbox.stub(workspace, 'workspaceFolders').value(oneWSFolders);
      await knvfs.createDirectory(null);
      sinon.assert.calledOnce(spyExists);
      sinon.assert.notCalled(spyMkDir);
      sandbox.restore();
    });
    test('should NOT create a directory if is no workspace.', async () => {
      const spyExists = sandbox.spy(fsMock, 'existsSync');
      const spyMkDir = sandbox.spy(fsMock, 'mkdirSync');
      sandbox.stub(workspace, 'workspaceFolders').value(emptyWSFolders);
      let error;
      try {
        await knvfs.createDirectory(null);
      } catch (err) {
        error = err;
      }
      sinon.assert.calledOnce(spyExists);
      sinon.assert.calledOnce(spyMkDir);
      assert(error);
      sandbox.restore();
    });
  });
  suite('Read File', () => {
    let revertKnvfsMock: Function;
    const knvfsMock = {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      createDirectory: function createDirectory(uri: Uri): void | Thenable<void> {
        // do nothing
      },
    };

    const externalYamlFileContentOld = `apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"serving.knative.dev/v1","kind":"Service","metadata":{"annotations":{"serving.knative.dev/creator":"system:admin","serving.knative.dev/lastModifier":"system:admin"},"name":"example","namespace":"a-serverless-example"},"spec":{"template":{"spec":{"containerConcurrency":0,"containers":[{"image":"quay.io/rhdevelopers/knative-tutorial-greeter:quarkus","name":"user-container","readinessProbe":{"successThreshold":1,"tcpSocket":{"port":0}},"resources":{}}],"timeoutSeconds":300}},"traffic":[{"latestRevision":true,"percent":100}]}}
    serving.knative.dev/creator: system:admin
    serving.knative.dev/lastModifier: system:admin
  creationTimestamp: "2020-07-23T22:53:04Z"
  generation: 5
  managedFields:
  - apiVersion: serving.knative.dev/v1
    fieldsType: FieldsV1
    fieldsV1:
      f:metadata:
        f:annotations:
          .: {}
          f:kubectl.kubernetes.io/last-applied-configuration: {}
      f:spec:
        .: {}
        f:template:
          .: {}
          f:spec:
            .: {}
            f:containers: {}
            f:timeoutSeconds: {}
    manager: kubectl
    operation: Update
    time: "2020-07-23T23:23:04Z"
  - apiVersion: serving.knative.dev/v1
    fieldsType: FieldsV1
    fieldsV1:
      f:status:
        f:address:
          .: {}
          f:url: {}
        f:conditions: {}
        f:latestCreatedRevisionName: {}
        f:latestReadyRevisionName: {}
        f:observedGeneration: {}
        f:traffic: {}
        f:url: {}
    manager: controller
    operation: Update
    time: "2020-07-23T23:23:59Z"
  - apiVersion: serving.knative.dev/v1
    fieldsType: FieldsV1
    fieldsV1:
      f:spec:
        f:traffic: {}
    manager: kn
    operation: Update
    time: "2020-07-23T23:23:59Z"
  name: example
  namespace: a-serverless-example
  resourceVersion: "81373"
  selfLink: /apis/serving.knative.dev/v1/namespaces/a-serverless-example/services/example
  uid: b643305a-c4b1-4c45-8efb-f8edb1c86623
spec:
  template:
    metadata:
      creationTimestamp: null
    spec:
      containerConcurrency: 0
      containers:
      - image: quay.io/rhdevelopers/knative-tutorial-greeter:quarkus
        name: user-container
        readinessProbe:
          successThreshold: 1
          tcpSocket:
            port: 0
        resources: {}
      timeoutSeconds: 300
  traffic:
  - latestRevision: true
    percent: 100
  - latestRevision: false
    percent: 0
    revisionName: example-2fvz4
    tag: old
  - latestRevision: false
    percent: 0
    revisionName: example-75w7v
    tag: current
status:
  address:
    url: http://example.a-serverless-example.svc.cluster.local
  conditions:
  - lastTransitionTime: "2020-07-23T23:23:08Z"
    status: "True"
    type: ConfigurationsReady
  - lastTransitionTime: "2020-07-23T23:23:59Z"
    status: "True"
    type: Ready
  - lastTransitionTime: "2020-07-23T23:23:59Z"
    status: "True"
    type: RoutesReady
  latestCreatedRevisionName: example-75w7v
  latestReadyRevisionName: example-75w7v
  observedGeneration: 5
  traffic:
  - latestRevision: true
    percent: 100
    revisionName: example-75w7v
  - latestRevision: false
    percent: 0
    revisionName: example-2fvz4
    tag: old
    url: http://old-example-a-serverless-example.apps.devcluster.openshift.com
  - latestRevision: false
    percent: 0
    revisionName: example-75w7v
    tag: current
    url: http://current-example-a-serverless-example.apps.devcluster.openshift.com
  url: http://example-a-serverless-example.apps.devcluster.openshift.com
`;
    const externalYamlFileContent = `apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: >
      {"apiVersion":"serving.knative.dev/v1","kind":"Service","metadata":{"annotations":{"serving.knative.dev/creator":"system:admin","serving.knative.dev/lastModifier":"system:admin"},"name":"example","namespace":"a-serverless-example"},"spec":{"template":{"spec":{"containerConcurrency":0,"containers":[{"image":"quay.io/rhdevelopers/knative-tutorial-greeter:quarkus","name":"user-container","readinessProbe":{"successThreshold":1,"tcpSocket":{"port":0}},"resources":{}}],"timeoutSeconds":300}},"traffic":[{"latestRevision":true,"percent":100}]}}
    serving.knative.dev/creator: system:admin
    serving.knative.dev/lastModifier: system:admin
  name: example
  namespace: a-serverless-example
spec:
  template:
    spec:
      containerConcurrency: 0
      containers:
        - image: quay.io/rhdevelopers/knative-tutorial-greeter:quarkus
          name: user-container
          readinessProbe:
            successThreshold: 1
            tcpSocket:
              port: 0
          resources: {}
      timeoutSeconds: 300
  traffic:
    - latestRevision: true
      percent: 100
    - latestRevision: false
      percent: 0
      revisionName: example-2fvz4
      tag: old
    - latestRevision: false
      percent: 0
      revisionName: example-75w7v
      tag: current
`;
    const example75w7vYaml = `apiVersion: serving.knative.dev/v1
kind: Revision
metadata:
  annotations:
    serving.knative.dev/creator: system:admin
    serving.knative.dev/lastPinned: "1595546588"
  creationTimestamp: "2020-07-23T23:23:04Z"
  generateName: example-
  generation: 1
  labels:
    serving.knative.dev/configuration: example
    serving.knative.dev/configurationGeneration: "3"
    serving.knative.dev/route: example
    serving.knative.dev/service: example
  managedFields:
  - apiVersion: serving.knative.dev/v1
    fieldsType: FieldsV1
    fieldsV1:
      f:metadata:
        f:annotations:
          .: {}
          f:serving.knative.dev/creator: {}
          f:serving.knative.dev/lastPinned: {}
        f:generateName: {}
        f:labels:
          .: {}
          f:serving.knative.dev/configuration: {}
          f:serving.knative.dev/configurationGeneration: {}
          f:serving.knative.dev/route: {}
          f:serving.knative.dev/service: {}
        f:ownerReferences:
          .: {}
          k:{"uid":"44de9281-8fff-4aeb-8a69-7bea9947f43d"}:
            .: {}
            f:apiVersion: {}
            f:blockOwnerDeletion: {}
            f:controller: {}
            f:kind: {}
            f:name: {}
            f:uid: {}
      f:spec:
        .: {}
        f:containerConcurrency: {}
        f:containers: {}
        f:timeoutSeconds: {}
      f:status:
        .: {}
        f:conditions: {}
        f:imageDigest: {}
        f:logUrl: {}
        f:observedGeneration: {}
        f:serviceName: {}
    manager: controller
    operation: Update
    time: "2020-07-23T23:24:08Z"
  name: example-75w7v
  namespace: a-serverless-example
  ownerReferences:
  - apiVersion: serving.knative.dev/v1
    blockOwnerDeletion: true
    controller: true
    kind: Configuration
    name: example
    uid: 44de9281-8fff-4aeb-8a69-7bea9947f43d
  resourceVersion: "81531"
  selfLink: /apis/serving.knative.dev/v1/namespaces/a-serverless-example/revisions/example-75w7v
  uid: e0fe4445-ed60-44f7-b4b1-7126fb252810
spec:
  containerConcurrency: 0
  containers:
  - image: quay.io/rhdevelopers/knative-tutorial-greeter:quarkus
    name: user-container
    readinessProbe:
      successThreshold: 1
      tcpSocket:
        port: 0
    resources: {}
  timeoutSeconds: 300
status:
  conditions:
  - lastTransitionTime: "2020-07-23T23:24:08Z"
    message: The target is not receiving traffic.
    reason: NoTraffic
    severity: Info
    status: "False"
    type: Active
  - lastTransitionTime: "2020-07-23T23:23:08Z"
    status: "True"
    type: ContainerHealthy
  - lastTransitionTime: "2020-07-23T23:23:08Z"
    status: "True"
    type: Ready
  - lastTransitionTime: "2020-07-23T23:23:08Z"
    status: "True"
    type: ResourcesAvailable
  imageDigest: quay.io/rhdevelopers/knative-tutorial-greeter@sha256:767e2f4b37d29de3949c8c695d3285739829c348df1dd703479bbae6dc86aa5a
  logUrl: http://localhost:8001/api/v1/namespaces/knative-monitoring/services/kibana-logging/proxy/app/kibana#/discover?_a=(query:(match:(kubernetes.labels.knative-dev%2FrevisionUID:(query:'e0fe4445-ed60-44f7-b4b1-7126fb252810',type:phrase))))
  observedGeneration: 1
  serviceName: example-75w7v
  `;

    const ced: CliExitData = {
      error: undefined,
      stdout: externalYamlFileContentOld,
    };

    const cedRevision: CliExitData = {
      error: undefined,
      stdout: example75w7vYaml,
    };

    const cedError: CliExitData = {
      error: 'something went wrong in fetching the yaml',
      stdout: undefined,
    };

    beforeEach(() => {
      revertKnvfsMock = vfs.__set__('KnativeResourceVirtualFileSystemProvider', knvfsMock);
      sandbox.stub(knvfs.knExecutor, 'execute').resolves(ced);
    });

    teardown(() => {
      revertKnvfsMock();
      sandbox.restore();
    });

    // Local file
    test('should return the content of a local yaml file from a single folder.', async () => {
      sandbox.stub(workspace, 'workspaceFolders').value(oneWSFolders);
      const testContent: Uint8Array | Thenable<Uint8Array> = Buffer.from(testLocalServiceContent, 'utf8');
      const foundLocalContent: Uint8Array | Thenable<Uint8Array> = await knvfs.readFile(_uriLocalFile);
      assert.equals(foundLocalContent, testContent);
    });
    test('should throw an error if it can not find the workspace folder while attempting to read local yaml.', async () => {
      sandbox.stub(workspace, 'workspaceFolders').value(emptyWSFolders);
      let error;
      try {
        await knvfs.readFile(_uriLocalFile);
      } catch (err) {
        error = err;
      }
      assert(error);
    });
    test('should throw an error if the uri is not of type File while attempting to read local yaml.', async () => {
      sandbox.stub(workspace, 'workspaceFolders').value(notFileWSFolders);
      let error;
      try {
        await knvfs.readFile(_uriLocalFile);
      } catch (err) {
        error = err;
      }
      assert(error);
    });
    test('should return the content of a local yaml file if multiple folders are found.', async () => {
      sandbox.stub(workspace, 'workspaceFolders').value(multipleWSFolders);
      sandbox.stub(window, 'showWorkspaceFolderPick').resolves(multipleWSFolders[0]);
      const testContent: Uint8Array | Thenable<Uint8Array> = Buffer.from(testLocalServiceContent, 'utf8');
      const foundLocalContent: Uint8Array | Thenable<Uint8Array> = await knvfs.readFile(_uriLocalFile);
      assert.equals(foundLocalContent, testContent);
    });

    // External file
    test('should return the content of a external yaml file from a single folder.', async () => {
      sandbox.stub(workspace, 'workspaceFolders').value(oneWSFolders);
      const testContent: Uint8Array | Thenable<Uint8Array> = Buffer.from(externalYamlFileContent, 'utf8');
      const foundExteranlContent: Uint8Array | Thenable<Uint8Array> = await knvfs.readFile(_uriExternalFile);
      assert.equals(foundExteranlContent, testContent);
    });
    test('should return the content of a external yaml file from a single folder for a Revision.', async () => {
      sandbox.restore();
      sandbox.stub(workspace, 'workspaceFolders').value(oneWSFolders);
      sandbox.stub(knvfs.knExecutor, 'execute').resolves(cedRevision);
      const testContent: Uint8Array | Thenable<Uint8Array> = Buffer.from(example75w7vYaml, 'utf8');
      const foundExteranlContent: Uint8Array | Thenable<Uint8Array> = await knvfs.readFile(_uriExternalFileForRevision);
      assert.equals(foundExteranlContent, testContent);
    });
    test('should return the content of a external yaml file from a single folder for a Tagged Revision.', async () => {
      sandbox.restore();
      sandbox.stub(workspace, 'workspaceFolders').value(oneWSFolders);
      sandbox.stub(knvfs.knExecutor, 'execute').resolves(cedRevision);
      const testContent: Uint8Array | Thenable<Uint8Array> = Buffer.from(example75w7vYaml, 'utf8');
      const foundExteranlContent: Uint8Array | Thenable<Uint8Array> = await knvfs.readFile(_uriExternalFileForTaggedRevision);
      assert.equals(foundExteranlContent, testContent);
    });
    test('should return the content of a external yaml file even if it can not find the workspace folder.', async () => {
      sandbox.stub(workspace, 'workspaceFolders').value(emptyWSFolders);
      let error;
      try {
        await knvfs.readFile(_uriExternalFile);
      } catch (err) {
        error = err;
      }
      assert(error);
    });
    test('should return the content of a external yaml file even if the uri is not of type File while getting the workspace folder.', async () => {
      sandbox.stub(workspace, 'workspaceFolders').value(notFileWSFolders);
      let error;
      try {
        await knvfs.readFile(_uriExternalFile);
      } catch (err) {
        error = err;
      }
      assert(error);
    });
    test('should throw an error if fetching the yaml has an error.', async () => {
      sandbox.restore();
      sandbox.stub(workspace, 'workspaceFolders').value(oneWSFolders);
      sandbox.stub(knvfs.knExecutor, 'execute').resolves(cedError);
      let error;
      try {
        await knvfs.readFile(_uriExternalFile);
      } catch (err) {
        error = err;
      }
      assert(error);
    });
    test('should throw an error if the resouce is not Knative.', async () => {
      sandbox.stub(workspace, 'workspaceFolders').value(oneWSFolders);
      let error;
      try {
        await knvfs.readFile(_uriExternalFileNotKnative);
      } catch (err) {
        error = err;
      }
      assert(error);
    });
    test('should return the content of a external yaml file if multiple folders are found.', async () => {
      sandbox.stub(workspace, 'workspaceFolders').value(multipleWSFolders);
      sandbox.stub(window, 'showWorkspaceFolderPick').resolves(multipleWSFolders[0]);
      const testContent: Uint8Array | Thenable<Uint8Array> = Buffer.from(externalYamlFileContent, 'utf8');
      const foundExteranlContent: Uint8Array | Thenable<Uint8Array> = await knvfs.readFile(_uriExternalFile);
      assert.equals(foundExteranlContent, testContent);
    });
  });
  suite('Write File', () => {
    test('should write a yaml file to folder in a workspace.', async () => {
      const spyWrite = sandbox.spy(fsMock, 'writeFileSync');
      sandbox.stub(workspace, 'workspaceFolders').value(oneWSFolders);
      await knvfs.writeFile(_uriLocalFile, Buffer.from(testLocalServiceContent), { create: true, overwrite: true });
      sinon.assert.calledOnce(spyWrite);
      sandbox.restore();
    });
    test('should write a yaml file to folder in a workspace when no sub-folder is provided.', async () => {
      const spyWrite = sandbox.spy(fsMock, 'writeFileSync');
      sandbox.stub(workspace, 'workspaceFolders').value(oneWSFolders);
      await vfs.saveAsync(_uriLocalFile, 'utf8');
      sinon.assert.calledOnce(spyWrite);
      sandbox.restore();
    });
    test('should NOT write a yaml file to folder if it can not find the workspace file.', async () => {
      const spyWrite = sandbox.spy(fsMock, 'writeFileSync');
      sandbox.stub(workspace, 'workspaceFolders').value(emptyWSFolders);
      await knvfs.writeFile(_uriLocalFile, Buffer.from(testLocalServiceContent), { create: true, overwrite: true });
      sinon.assert.notCalled(spyWrite);
      sandbox.restore();
    });
    test('should NOT write a yaml file to folder if the uri is not of type File.', async () => {
      const spyWrite = sandbox.spy(fsMock, 'writeFileSync');
      sandbox.stub(workspace, 'workspaceFolders').value(notFileWSFolders);
      await knvfs.writeFile(_uriLocalFile, Buffer.from(testLocalServiceContent), { create: true, overwrite: true });
      sinon.assert.notCalled(spyWrite);
      sandbox.restore();
    });
    test('should NOT write a yaml file to folder if it is a Revision.', async () => {
      const spyWrite = sandbox.spy(fsMock, 'writeFileSync');
      sandbox.stub(workspace, 'workspaceFolders').value(oneWSFolders);
      await knvfs.writeFile(_uriLocalRevisionFile, Buffer.from(testLocalRevisionContent), { create: true, overwrite: true });
      sinon.assert.notCalled(spyWrite);
      sandbox.restore();
    });
    test('should write a yaml file to folder in a workspace, if given mulitple workspaces.', async () => {
      const spyWrite = sandbox.spy(fsMock, 'writeFileSync');
      sandbox.stub(workspace, 'workspaceFolders').value(multipleWSFolders);
      sandbox.stub(window, 'showWorkspaceFolderPick').resolves(multipleWSFolders[0]);
      await knvfs.writeFile(_uriLocalFile, Buffer.from(testLocalServiceContent), { create: true, overwrite: true });
      sinon.assert.calledOnce(spyWrite);
      sandbox.restore();
    });
  });
  suite('Delete File', () => {
    test('should delete a yaml file to folder in a workspace.', async () => {
      const spyExists = sandbox.spy(fsMock, 'existsSync');
      const spyUnlink = sandbox.spy(fsMock, 'unlink');
      sandbox.stub(workspace, 'workspaceFolders').value(oneWSFolders);
      await knvfs.delete(_uriLocalFile, { recursive: false });
      sinon.assert.calledOnce(spyExists);
      sinon.assert.calledOnce(spyUnlink);
      sandbox.restore();
    });
    test('should throw an error if it can not find the workspace folder while trying delete a yaml file to folder in a workspace.', async () => {
      sandbox.stub(workspace, 'workspaceFolders').value(oneWSFolders);
      let error;
      try {
        await knvfs.delete(_uriLocalErrorFile, { recursive: false });
      } catch (err) {
        error = err;
      }
      assert(error);
      sandbox.restore();
    });
    test('should not delete a yaml file to folder in a workspace if it cant find it.', async () => {
      const spyExists = sandbox.spy(fsMock, 'existsSync');
      const spyUnlink = sandbox.spy(fsMock, 'unlink');
      sandbox.stub(workspace, 'workspaceFolders').value(oneWSFolders);
      await knvfs.delete(_uriExternalFile, { recursive: false });
      sinon.assert.calledOnce(spyExists);
      sinon.assert.notCalled(spyUnlink);
      sandbox.restore();
    });
  });
  suite('Rename File', () => {
    test('should rename a yaml file to folder in a workspace.', async () => {
      const spyExists = sandbox.spy(fsMock, 'existsSync');
      const spyRename = sandbox.spy(fsMock, 'rename');
      sandbox.stub(workspace, 'workspaceFolders').value(oneWSFolders);
      await knvfs.rename(_uriLocalFile, _uriLocalFile, { overwrite: false });
      sinon.assert.calledOnce(spyExists);
      sinon.assert.calledOnce(spyRename);
      sandbox.restore();
    });
    test('should throw an error if it can not find the workspace folder while trying to rename a yaml file to folder in a workspace.', async () => {
      sandbox.stub(workspace, 'workspaceFolders').value(oneWSFolders);
      let error;
      try {
        await knvfs.rename(_uriLocalErrorFile, _uriLocalErrorFile, { overwrite: false });
      } catch (err) {
        error = err;
      }
      assert(error);
      sandbox.restore();
    });
    test('should not rename a yaml file in folder in a workspace if it cant find it.', async () => {
      const spyExists = sandbox.spy(fsMock, 'existsSync');
      const spyRename = sandbox.spy(fsMock, 'rename');
      sandbox.stub(workspace, 'workspaceFolders').value(oneWSFolders);
      await knvfs.rename(_uriExternalFile, _uriExternalFile, { overwrite: false });
      sinon.assert.calledOnce(spyExists);
      sinon.assert.notCalled(spyRename);
      sandbox.restore();
    });
  });
});
