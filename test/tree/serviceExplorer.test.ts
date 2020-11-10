import * as vscode from 'vscode';
import * as chai from 'chai';
import { beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as referee from '@sinonjs/referee';
import * as yaml from 'yaml';
import { URL } from 'url';
import { ContextType } from '../../src/cli/config';
import { Revision } from '../../src/knative/revision';
import { Service } from '../../src/knative/service';
import { ServingTreeItem } from '../../src/servingTree/servingTreeItem';
import { ServingExplorer } from '../../src/servingTree/servingExplorer';

const { assert } = referee;
chai.use(sinonChai);

let servingExplorer: ServingExplorer;

suite('ServingExplorer', () => {
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
  });

  teardown(() => {
    sandbox.restore();
  });

  const yamlServiceContentUnfiltered = `apiVersion: serving.knative.dev/v1
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
  const jsonServiceContentUnfiltered = yaml.parse(yamlServiceContentUnfiltered);
  const testService: Service = new Service(
    'example',
    'http://example-a-serverless-example.apps.devcluster.openshift.com',
    jsonServiceContentUnfiltered,
  );
  testService.modified = false;
  const testServiceTreeItem: ServingTreeItem = new ServingTreeItem(
    null,
    testService,
    'example',
    ContextType.SERVICE,
    vscode.TreeItemCollapsibleState.Expanded,
    null,
    null,
  );
  const testServiceModified: Service = new Service(
    'example',
    'http://example-a-serverless-example.apps.devcluster.openshift.com',
    jsonServiceContentUnfiltered,
  );
  testServiceModified.modified = true;
  const testServiceTreeItemModified: ServingTreeItem = new ServingTreeItem(
    null,
    testServiceModified,
    'example',
    ContextType.SERVICE_MODIFIED,
    vscode.TreeItemCollapsibleState.Expanded,
    null,
    null,
  );

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
  const example75w7vJson = yaml.parse(example75w7vYaml);
  const example75w7vRevision: Revision = new Revision('example-75w7v', 'example', example75w7vJson, [
    {
      tag: null,
      revisionName: 'example-75w7v',
      configurationName: null,
      latestRevision: true,
      percent: 100,
      url: null,
    },
    {
      tag: 'current',
      revisionName: 'example-75w7v',
      configurationName: null,
      latestRevision: false,
      percent: 0,
      url: new URL('http://current-example-a-serverless-example.apps.devcluster.openshift.com'),
    },
  ]);
  const example75w7vTreeItem: ServingTreeItem = new ServingTreeItem(
    testServiceTreeItem,
    example75w7vRevision,
    'example-75w7v',
    ContextType.REVISION_TAGGED,
    vscode.TreeItemCollapsibleState.None,
    null,
    null,
  );

  test('should add registered commands to', () => {
    // This test allows us to create a new ServingExplorer after the one in Extension is called
    // giving the extension test enough time to dispose of it. Otherwise we would have 2 registered
    // commands for each one in ServingExplorer.
    servingExplorer = new ServingExplorer();
    assert.equals(servingExplorer.registeredCommands.length, 8);
  });

  test('should connect the output command to showing the knative output channel', async () => {
    const stub = sandbox.stub(servingExplorer.treeDataProvider, 'showOutputChannel').returns(null);
    await vscode.commands.executeCommand('service.output');
    sinon.assert.calledOnce(stub);
  });

  test('should connect the output command to adding a Service', async () => {
    const stub = sandbox.stub(servingExplorer.treeDataProvider, 'addService').returns(null);
    await vscode.commands.executeCommand('service.explorer.create');
    sinon.assert.calledOnce(stub);
  });

  test('should connect the output command to deleting a Service', async () => {
    const stub = sandbox.stub(servingExplorer.treeDataProvider, 'deleteFeature').resolves();
    await vscode.commands.executeCommand('service.explorer.delete', testServiceTreeItem);
    sinon.assert.calledOnce(stub);
  });

  test('should connect the output command to adding a tag to a Revision', async () => {
    const stub = sandbox.stub(servingExplorer.treeDataProvider, 'addTag').resolves();
    await vscode.commands.executeCommand('service.explorer.tag', example75w7vTreeItem);
    sinon.assert.calledOnce(stub);
  });

  test('should connect the output command to updating a service from yaml', async () => {
    const stub = sandbox.stub(servingExplorer.treeDataProvider, 'updateServiceFromYaml').resolves();
    await vscode.commands.executeCommand('service.explorer.apply', testServiceTreeItemModified);
    sinon.assert.calledOnce(stub);
  });

  test('should connect the output command to deleting a local Service yaml', async () => {
    const stub = sandbox.stub(servingExplorer.treeDataProvider, 'deleteLocalYaml').resolves();
    await vscode.commands.executeCommand('service.explorer.deleteLocal', testServiceTreeItemModified);
    sinon.assert.calledOnce(stub);
  });

  test('should connect the output command to refreshing the tree', async () => {
    const stub = sandbox.stub(servingExplorer.treeDataProvider, 'refresh').returns(null);
    await vscode.commands.executeCommand('service.explorer.refresh');
    sinon.assert.calledOnce(stub);
  });

  test('should connect the output command to reporting an issue', async () => {
    const stub = sandbox.stub(servingExplorer, 'reportIssue').resolves();
    await vscode.commands.executeCommand('service.explorer.reportIssue');
    sinon.assert.calledOnce(stub);
  });

  test('should open a browser with a link to report an issue', async () => {
    const executeCommandStub = sandbox.stub(vscode.commands, 'executeCommand').resolves();
    await servingExplorer.reportIssue();
    sinon.assert.calledOnce(executeCommandStub);
  });

  test('should reveal the tree view', async () => {
    const stub = sandbox.stub(servingExplorer.treeView, 'reveal').resolves();
    await servingExplorer.reveal(testServiceTreeItem);
    sinon.assert.calledOnce(stub);
  });
});
