/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { URL } from 'url';
import * as vscode from 'vscode';
import { expect } from 'chai';
import { beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as k8s from 'vscode-kubernetes-tools-api';
import * as yaml from 'yaml';
import * as brokerData from './eventingTree/broker.json';
import { CmdCliConfig } from '../src/cli/cli-config';
import { executeCmdCli } from '../src/cli/cmdCli';
import { EventingContextType, ServingContextType } from '../src/cli/config';
import { knExecutor } from '../src/cli/execute';
import * as otd from '../src/editor/knativeOpenTextDocument';
import { EventingDataProvider } from '../src/eventingTree/eventingDataProvider';
import { EventingTreeItem } from '../src/eventingTree/eventingTreeItem';
import { deactivate } from '../src/extension';
import { functionExplorer } from '../src/functions/functionsExplorer';
import { Broker } from '../src/knative/broker';
import * as revision from '../src/knative/revision';
import { Revision } from '../src/knative/revision';
import * as service from '../src/knative/service';
import { Service } from '../src/knative/service';
import { ServingTreeItem } from '../src/servingTree/servingTreeItem';
import * as telemetry from '../src/telemetry';

suite('Knative extension', () => {
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    const configurationApi = k8s.extension.configuration;
    sandbox.stub(configurationApi, 'v1_1').value({
      available: false,
    });
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
    sandbox.stub(CmdCliConfig, 'detectOrDownload').resolves();
    sandbox.stub(knExecutor, 'execute').resolves();
    sandbox.stub(executeCmdCli, 'execute').resolves();
    sandbox.stub(functionExplorer, 'refresh').resolves();
    sandbox.stub(telemetry, 'telemetryLog').resolves();
    sandbox.stub(telemetry, 'telemetryLogError').resolves();
  });

  teardown(() => {
    sandbox.restore();
  });

  const eventingDataProvider: EventingDataProvider = new EventingDataProvider();
  const eventingFolderNodes: EventingTreeItem[] = eventingDataProvider.getEventingFolders();
  const testBroker0: Broker = new Broker('example-broker0', 'Brokers', JSON.parse(JSON.stringify(brokerData.items[0])));
  const testBroker0TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[0],
    testBroker0,
    { label: 'example-broker0' },
    EventingContextType.BROKER,
    vscode.TreeItemCollapsibleState.None,
  );

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
  const jsonServiceContentUnfiltered = yaml.parse(yamlServiceContentUnfiltered) as service.Items;
  const testService: Service = new Service(
    'example',
    'http://example-a-serverless-example.apps.devcluster.openshift.com',
    jsonServiceContentUnfiltered,
  );
  testService.modified = false;
  const testServiceTreeItem: ServingTreeItem = new ServingTreeItem(
    null,
    testService,
    { label: 'example' },
    ServingContextType.SERVICE,
    vscode.TreeItemCollapsibleState.Expanded,
    null,
    null,
  );
  testService.modified = true;
  const testServiceTreeItemModified: ServingTreeItem = new ServingTreeItem(
    null,
    testService,
    { label: 'example' },
    ServingContextType.SERVICE_MODIFIED,
    vscode.TreeItemCollapsibleState.Expanded,
    null,
    null,
  );
  const revisionYaml = `apiVersion: serving.knative.dev/v1
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
  const revisionJson = yaml.parse(revisionYaml) as revision.Items;
  const revisionData: Revision = new Revision('example-75w7v', 'example', revisionJson, [
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
    revisionData,
    { label: 'example-75w7v' },
    ServingContextType.REVISION_TAGGED,
    vscode.TreeItemCollapsibleState.None,
    null,
    null,
  );

  const revisionExampleYaml = `apiVersion: serving.knative.dev/v1
kind: Revision
metadata:
  annotations:
    serving.knative.dev/creator: system:admin
    serving.knative.dev/lastPinned: "1595546562"
  creationTimestamp: "2020-07-23T23:22:38Z"
  generateName: example-
  generation: 1
  labels:
    serving.knative.dev/configuration: example
    serving.knative.dev/configurationGeneration: "2"
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
    time: "2020-07-23T23:23:42Z"
  name: example-g4hm8
  namespace: a-serverless-example
  ownerReferences:
  - apiVersion: serving.knative.dev/v1
    blockOwnerDeletion: true
    controller: true
    kind: Configuration
    name: example
    uid: 44de9281-8fff-4aeb-8a69-7bea9947f43d
  resourceVersion: "80702"
  selfLink: /apis/serving.knative.dev/v1/namespaces/a-serverless-example/revisions/example-g4hm8
  uid: 139f3e34-2ca0-498e-b98d-636c5186f1f5
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
  timeoutSeconds: 200
status:
  conditions:
  - lastTransitionTime: "2020-07-23T23:23:42Z"
    message: The target is not receiving traffic.
    reason: NoTraffic
    severity: Info
    status: "False"
    type: Active
  - lastTransitionTime: "2020-07-23T23:22:42Z"
    status: "True"
    type: ContainerHealthy
  - lastTransitionTime: "2020-07-23T23:22:42Z"
    status: "True"
    type: Ready
  - lastTransitionTime: "2020-07-23T23:22:39Z"
    status: "True"
    type: ResourcesAvailable
  imageDigest: quay.io/rhdevelopers/knative-tutorial-greeter@sha256:767e2f4b37d29de3949c8c695d3285739829c348df1dd703479bbae6dc86aa5a
  logUrl: http://localhost:8001/api/v1/namespaces/knative-monitoring/services/kibana-logging/proxy/app/kibana#/discover?_a=(query:(match:(kubernetes.labels.knative-dev%2FrevisionUID:(query:'139f3e34-2ca0-498e-b98d-636c5186f1f5',type:phrase))))
  observedGeneration: 1
  serviceName: example-g4hm8
    `;
  const revisionsJson = yaml.parse(revisionExampleYaml) as revision.Items;
  const revisionExample: Revision = new Revision('example-g4hm8', 'example', revisionsJson);
  const serviceTreeItem: ServingTreeItem = new ServingTreeItem(
    testServiceTreeItem,
    revisionExample,
    { label: 'example-g4hm8' },
    ServingContextType.REVISION,
    vscode.TreeItemCollapsibleState.None,
    null,
    null,
  );

  const tagNotFound = `apiVersion: serving.knative.dev/v1
kind: Revision
metadata:
  annotations:
    serving.knative.dev/creator: system:admin
    serving.knative.dev/lastPinned: "1595544804"
  creationTimestamp: "2020-07-23T22:53:04Z"
  generateName: example-
  generation: 1
  labels:
    serving.knative.dev/configuration: example
    serving.knative.dev/configurationGeneration: "1"
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
    time: "2020-07-23T23:23:52Z"
  name: example-2fvz4
  namespace: a-serverless-example
  ownerReferences:
  - apiVersion: serving.knative.dev/v1
    blockOwnerDeletion: true
    controller: true
    kind: Configuration
    name: example
    uid: 44de9281-8fff-4aeb-8a69-7bea9947f43d
  resourceVersion: "81118"
  selfLink: /apis/serving.knative.dev/v1/namespaces/a-serverless-example/revisions/example-2fvz4
  uid: 38d9e4ce-a187-40f2-bc51-d50be5596e01
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
  - lastTransitionTime: "2020-07-23T22:54:24Z"
    message: The target is not receiving traffic.
    reason: NoTraffic
    severity: Info
    status: "False"
    type: Active
  - lastTransitionTime: "2020-07-23T22:53:24Z"
    status: "True"
    type: ContainerHealthy
  - lastTransitionTime: "2020-07-23T22:53:24Z"
    status: "True"
    type: Ready
  - lastTransitionTime: "2020-07-23T22:53:24Z"
    status: "True"
    type: ResourcesAvailable
  imageDigest: quay.io/rhdevelopers/knative-tutorial-greeter@sha256:767e2f4b37d29de3949c8c695d3285739829c348df1dd703479bbae6dc86aa5a
  logUrl: http://localhost:8001/api/v1/namespaces/knative-monitoring/services/kibana-logging/proxy/app/kibana#/discover?_a=(query:(match:(kubernetes.labels.knative-dev%2FrevisionUID:(query:'38d9e4ce-a187-40f2-bc51-d50be5596e01',type:phrase))))
  observedGeneration: 1
  serviceName: example-2fvz4
    `;
  const tagRevisionJson = yaml.parse(tagNotFound) as revision.Items;
  const tagNotFoundRevision: Revision = new Revision('example-2fvz4', 'example', tagRevisionJson, [
    {
      tag: null,
      revisionName: 'example-2fvz4',
      configurationName: null,
      latestRevision: false,
      percent: 0,
      url: new URL('http://old-example-a-serverless-example.apps.devcluster.openshift.com'),
    },
  ]);
  const serviceTreeViewItem: ServingTreeItem = new ServingTreeItem(
    testServiceTreeItem,
    tagNotFoundRevision,
    { label: 'example-2fvz4' },
    ServingContextType.REVISION_TAGGED,
    vscode.TreeItemCollapsibleState.None,
    null,
    null,
  );

  const image = vscode.Uri.parse('http://example-a-serverless-example.apps.devcluster.openshift.com');
  const imageTagged = vscode.Uri.parse('http://current-example-a-serverless-example.apps.devcluster.openshift.com');
  test('should be present', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    expect(vscode.extensions.getExtension('redhat.vscode-knative'));
  });

  test('should activate', async function context() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    this.timeout(80000);
    await vscode.extensions.getExtension('redhat.vscode-knative').activate();
  });

  test('should call the command to open a Service when a Service is the treeItem', async () => {
    const executeCommandStub = sandbox.stub(vscode.commands, 'executeCommand');
    executeCommandStub.withArgs('vscode.open', image).resolves();
    executeCommandStub.callThrough();
    await vscode.commands.executeCommand('knative.service.open-in-browser', testServiceTreeItem);
    sinon.assert.calledTwice(executeCommandStub);
  });

  test('should call the command to open a Service when a modified Service is the treeItem', async () => {
    const executeCommandStub = sandbox.stub(vscode.commands, 'executeCommand');
    executeCommandStub.withArgs('vscode.open', image).resolves();
    executeCommandStub.callThrough();
    await vscode.commands.executeCommand('knative.service.open-in-browser', testServiceTreeItemModified);
    sinon.assert.calledTwice(executeCommandStub);
  });

  test('should call the command to open a Revision when a Revision is the treeItem', async () => {
    const executeCommandStub = sandbox.stub(vscode.commands, 'executeCommand');
    executeCommandStub.withArgs('vscode.open', imageTagged).resolves();
    executeCommandStub.callThrough();
    await vscode.commands.executeCommand('knative.service.open-in-browser', example75w7vTreeItem);
    sinon.assert.calledTwice(executeCommandStub);
  });

  test('should NOT call the command to open a Revision when a Revision is the treeItem but does not have Traffic', async () => {
    const executeCommandStub = sandbox.stub(vscode.commands, 'executeCommand').resolves();
    executeCommandStub.callThrough();
    await vscode.commands.executeCommand('knative.service.open-in-browser', serviceTreeItem);
    sinon.assert.calledOnce(executeCommandStub);
  });

  test('should NOT call the command to open a Revision when a Revision is the treeItem but does not have a Tag', async () => {
    const executeCommandStub = sandbox.stub(vscode.commands, 'executeCommand').resolves();
    executeCommandStub.callThrough();
    await vscode.commands.executeCommand('knative.service.open-in-browser', serviceTreeViewItem);
    sinon.assert.calledOnce(executeCommandStub);
  });

  test('should open an Event in the editor', async () => {
    const openTreeItemInEditorStub = sandbox.stub(otd, 'openTreeItemInEditor').resolves();
    await vscode.commands.executeCommand('eventing.explorer.openFile', testBroker0TreeItem);
    sinon.assert.calledOnce(openTreeItemInEditorStub);
  });

  test('should open a Service in the editor', async () => {
    const openTreeItemInEditorStub = sandbox.stub(otd, 'openTreeItemInEditor').resolves();
    await vscode.commands.executeCommand('service.explorer.openFile', testServiceTreeItem);
    sinon.assert.calledOnce(openTreeItemInEditorStub);
  });

  test('should open a Service in the editor as editable', async () => {
    const openTreeItemInEditorStub = sandbox.stub(otd, 'openTreeItemInEditor').resolves();
    await vscode.commands.executeCommand('service.explorer.edit', testServiceTreeItem);
    sinon.assert.calledOnce(openTreeItemInEditorStub);
  });

  test('should be able to call deactivate', () => {
    deactivate();
  });
});
