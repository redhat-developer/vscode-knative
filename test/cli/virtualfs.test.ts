/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import * as os from 'os';
import * as pth from 'path';
import { Disposable, FileStat, FileType, Uri, window } from 'vscode';
import { expect } from 'chai';
import * as chai from 'chai';
import * as fsx from 'fs-extra';
import { beforeEach } from 'mocha';
import rewire = require('rewire');
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { CliExitData } from '../../src/cli/cmdCli';
import * as knv from '../../src/cli/virtualfs';

const rewiredVFS = rewire('../../src/cli/virtualfs');

chai.use(sinonChai);

suite('VirtualFileSystem', () => {
  const sandbox = sinon.createSandbox();
  // let revertFS: () => void;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const knvfs: knv.KnativeResourceVirtualFileSystemProvider = new rewiredVFS.KnativeResourceVirtualFileSystemProvider();

  const _uriLocalFile = Uri.file('service-local.yaml');
  const _uriExternalFile = Uri.parse(
    'knmsx://loadknativecore/service-example.yaml?contextValue%3Dservice%26name%3Dexample%26_%3D1594328823824',
  );
  const _uriExternalFileReadonly = Uri.parse(
    'knreadonly://loadknativecore/service-example.yaml?contextValue%3Dservice%26name%3Dexample%26_%3D1594328823824',
  );
  const _uriExternalFileForRevision = Uri.parse(
    'knreadonly://loadknativecore/revision-example-75w7v.yaml?contextValue%3Drevision%26name%3Dexample%26_%3D1594328823824',
  );
  const _uriExternalFileForTaggedRevision = Uri.parse(
    'knreadonly://loadknativecore/revision-example-75w7v.yaml?contextValue%3Drevision_tagged%26name%3Dexample%26_%3D1594328823824',
  );
  const _uriExternalFileWithNamespace = Uri.parse(
    'knreadonly://loadknativecore/service-example.yaml?ns%3DtestNamespace%26contextValue%3Dservice%26name%3Dexample%26_%3D1594328823824',
  );
  const _uriExternalFileNotKnative = Uri.parse(
    'knreadonly://loadothercore/service-example.yaml?contextValue%3Dservice%26name%3Dexample%26_%3D1594328823824',
  );
  const testLocalServiceContent = `apiVersion: serving.knative.dev/v1 kind: Service metadata: annotations: serving.knative.dev/creator: system:admin serving.knative.dev/lastModifier: system:admin creationTimestamp: "2020-07-09T02:39:32Z" generation: 1 name: local namespace: a-serverless-example spec: template: metadata: annotations: client.knative.dev/user-image: quay.io/rhdevelopers/knative-tutorial-greeter:quarkus creationTimestamp: null name: local-qycgp-1 spec: containerConcurrency: 0 containers: - image: quay.io/rhdevelopers/knative-tutorial-greeter:quarkus name: user-container readinessProbe: successThreshold: 1 tcpSocket: port: 0 resources: {} timeoutSeconds: 300 traffic: - latestRevision: true percent: 100 `;
  // HTTP URI

  let tmpdirStub: sinon.SinonStub;
  let writeFileStub: sinon.SinonStub;
  let pathExistsStub: sinon.SinonStub;
  let ensureFileStub: sinon.SinonStub;
  let statStub: sinon.SinonStub;
  let execCmdCliStub: sinon.SinonStub;

  beforeEach(() => {
    sandbox.stub(window, 'showErrorMessage').resolves();
    tmpdirStub = sandbox.stub(os, 'tmpdir');
    sandbox.stub(fsx, 'unlink');
    writeFileStub = sandbox.stub(fsx, 'writeFile');
    pathExistsStub = sandbox.stub(fsx, 'pathExists');
    ensureFileStub = sandbox.stub(fsx, 'ensureFile');
    statStub = sandbox.stub(fsx, 'stat');
    execCmdCliStub = sandbox.stub(knvfs.knExecutor, 'execute');
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('VFS URI conversion', () => {
    test('should return unique URI', () => {
      const builtURI: Uri = rewiredVFS.vfsUri('knmsx', 'service', 'example', 'yaml');
      expect(builtURI.authority).to.equal(_uriExternalFile.authority);
      expect(builtURI.fsPath).to.equal(_uriExternalFile.fsPath);
      expect(builtURI.scheme).to.equal(_uriExternalFile.scheme);
    });
    test('should return unique URI with optional Namespace', () => {
      const builtURI: Uri = rewiredVFS.vfsUri('knreadonly', 'service', 'example', 'yaml', 'testNamespace');
      expect(builtURI.authority).to.equal(_uriExternalFileWithNamespace.authority);
      expect(builtURI.fsPath).to.equal(_uriExternalFileWithNamespace.fsPath);
      expect(builtURI.scheme).to.equal(_uriExternalFileWithNamespace.scheme);
      expect(builtURI.query.includes('testNamespace')).to.equal(_uriExternalFileWithNamespace.query.includes('testNamespace'));
    });
  });
  // TODO: figure out how to test an event that is fired.
  suite('Watch', () => {
    test('should return a Disposable object', () => {
      const watcher = knvfs.watch();
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      expect(watcher).to.deep.equal(new Disposable(() => {}));
    });
  });

  suite('Stat', () => {
    test('should return the file stat information for a file passed in to it.', async () => {
      const fileStat: FileStat = await knvfs.stat(_uriLocalFile);
      // eslint-disable-next-line no-unused-expressions
      expect(fileStat).is.not.undefined;
      expect(fileStat.type).equal(FileType.File);
      // eslint-disable-next-line no-unused-expressions
      expect(fileStat.mtime >= 0).true;
    });
    test('should throw an error if it can not find the workspace file.', async () => {
      let error: NodeJS.ErrnoException;
      try {
        await knvfs.stat(_uriLocalFile);
      } catch (err) {
        error = err;
      }
      expect(error);
    });
    test('should throw an error if the uri is not of type File.', async () => {
      let error: NodeJS.ErrnoException;
      try {
        await knvfs.stat(_uriLocalFile);
      } catch (err) {
        error = err;
      }
      expect(error);
    });
  });

  suite('Read Directory', () => {
    test('should return a list of files', async () => {
      const foundFiles: [string, FileType][] = await knvfs.readDirectory(null);
      expect(foundFiles).to.deep.equal([]);
    });
  });

  suite('Read File', () => {
    let revertKnvfsMock: () => void;
    const knvfsMock = {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      createDirectory: function createDirectory(uri: Uri): void | Thenable<void> {
        // do nothing
      },
    };

    const externalYamlFileContentFull = `apiVersion: serving.knative.dev/v1
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
      stdout: externalYamlFileContentFull,
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
      revertKnvfsMock = rewiredVFS.__set__('KnativeResourceVirtualFileSystemProvider', knvfsMock);
      execCmdCliStub.resolves(ced);
    });

    teardown(() => {
      revertKnvfsMock();
      sandbox.restore();
    });

    // Local file
    test('should return the content of a local yaml file from a single folder.', async () => {
      const testContent: Uint8Array | Thenable<Uint8Array> = Buffer.from(externalYamlFileContent, 'utf8');
      const foundLocalContent: Uint8Array | Thenable<Uint8Array> = await knvfs.readFile(_uriExternalFile);
      expect(foundLocalContent).to.deep.equal(testContent);
    });
    test('should throw an error if it can not find the workspace folder while attempting to read local yaml.', async () => {
      let error: NodeJS.ErrnoException | null = null;
      try {
        await knvfs.readFile(_uriLocalFile);
      } catch (err) {
        error = err;
      }
      expect(error);
    });
    test('should throw an error if the uri is not of type File while attempting to read local yaml.', async () => {
      let error: NodeJS.ErrnoException | null = null;
      try {
        await knvfs.readFile(_uriLocalFile);
      } catch (err) {
        error = err;
      }
      expect(error);
    });

    // External file
    test('should return the content of a external yaml file from a single workspace that is editable.', async () => {
      const testContent: Uint8Array | Thenable<Uint8Array> = Buffer.from(externalYamlFileContent, 'utf8');
      const foundExternalContent: Uint8Array | Thenable<Uint8Array> = await knvfs.readFile(_uriExternalFile);
      expect(foundExternalContent).to.deep.equal(testContent);
    });
    test('should return the content of a external yaml file from a single workspace that is readonly.', async () => {
      const testContent: Uint8Array | Thenable<Uint8Array> = Buffer.from(externalYamlFileContentFull, 'utf8');
      const foundExternalContent: Uint8Array | Thenable<Uint8Array> = await knvfs.readFile(_uriExternalFileReadonly);
      expect(foundExternalContent).to.deep.equal(testContent);
    });
    test('should return the content of a external yaml file from a single folder for a Revision.', async () => {
      execCmdCliStub.onFirstCall().resolves(cedRevision);
      const testContent: Uint8Array | Thenable<Uint8Array> = Buffer.from(example75w7vYaml, 'utf8');
      const foundExternalContent: Uint8Array | Thenable<Uint8Array> = await knvfs.readFile(_uriExternalFileForRevision);
      expect(foundExternalContent).to.deep.equal(testContent);
    });
    test('should return the content of a external yaml file from a single folder for a Tagged Revision.', async () => {
      execCmdCliStub.onFirstCall().resolves(cedRevision);
      const testContent: Uint8Array | Thenable<Uint8Array> = Buffer.from(example75w7vYaml, 'utf8');
      const foundExternalContent: Uint8Array | Thenable<Uint8Array> = await knvfs.readFile(_uriExternalFileForTaggedRevision);
      expect(foundExternalContent).to.deep.equal(testContent);
    });
    test('should return the content of a external yaml file even if it can not find the workspace folder.', async () => {
      let error: NodeJS.ErrnoException | null = null;
      try {
        await knvfs.readFile(_uriExternalFile);
      } catch (err) {
        error = err;
      }
      expect(error);
    });
    test('should return the content of a external yaml file even if the uri is not of type File while getting the workspace folder.', async () => {
      let error: NodeJS.ErrnoException | null = null;
      try {
        await knvfs.readFile(_uriExternalFile);
      } catch (err) {
        error = err;
      }
      expect(error);
    });
    test('should throw an error if fetching the yaml has an error.', async () => {
      sandbox.restore();
      sandbox.stub(window, 'showErrorMessage').resolves();
      sandbox.stub(knvfs.knExecutor, 'execute').onFirstCall().resolves(cedError);
      let error: NodeJS.ErrnoException | null = null;
      try {
        await knvfs.readFile(_uriExternalFile);
      } catch (err) {
        error = err;
      }
      expect(error);
    });

    test('should throw an error if the resource is not Knative.', async () => {
      let error: NodeJS.ErrnoException | null = null;
      try {
        await knvfs.readFile(_uriExternalFileNotKnative);
      } catch (err) {
        error = err;
      }
      expect(error);
    });
    test('should return the content of a external yaml file if multiple folders are found.', async () => {
      const testContent: Uint8Array | Thenable<Uint8Array> = Buffer.from(externalYamlFileContent, 'utf8');
      const foundExternalContent: Uint8Array | Thenable<Uint8Array> = await knvfs.readFile(_uriExternalFile);
      expect(foundExternalContent).to.deep.equal(testContent);
    });
  });
  suite('Write File', () => {
    test('should apply yaml file to cluster', async () => {
      tmpdirStub.returns(pth.join('tmp', 'bar'));
      ensureFileStub.resolves();
      writeFileStub.resolves();
      pathExistsStub.resolves();
      execCmdCliStub.onFirstCall().resolves({ stdout: 'pass', error: null });
      statStub.resolves({ size: 1 });
      await knvfs.writeFile(_uriLocalFile, Buffer.from(testLocalServiceContent));
      // eslint-disable-next-line no-unused-expressions
      expect(tmpdirStub).calledOnce;
      // eslint-disable-next-line no-unused-expressions
      expect(ensureFileStub).calledOnce;
      // eslint-disable-next-line no-unused-expressions
      expect(writeFileStub).calledOnce;
      // eslint-disable-next-line no-unused-expressions
      expect(execCmdCliStub).calledOnce;
    });
  });
});
