import * as vscode from 'vscode';
import * as chai from 'chai';
import { beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as referee from '@sinonjs/referee';
import * as yaml from 'yaml';
import { URL } from 'url';
import * as singleServiceData from './singleServiceServiceList.json';
import * as singleServiceRevisionData from './singleServiceRevisionList.json';
import { ContextType } from '../../src/cli/config';
import { KnativeItem } from '../../src/knative/knativeItem';
import { Revision } from '../../src/knative/revision';
import { Service } from '../../src/knative/service';
import { KnativeTreeItem } from '../../src/tree/knativeTreeItem';
import { ServiceDataProvider } from '../../src/tree/serviceDataProvider';

import rewire = require('rewire');

const svcdp = rewire('../../src/tree/serviceDataProvider');

const { assert } = referee;
const { expect } = chai;
chai.use(sinonChai);

suite('ServiceDataProvider', () => {
  const sandbox = sinon.createSandbox();
  const sdp = new svcdp.ServiceDataProvider();
  const serviceDataProvider: ServiceDataProvider = new ServiceDataProvider();
  let serviceTreeItems: KnativeTreeItem[];
  // let revisionTreeItems: KnativeTreeItem[];
  // let service: Service;
  // let revision: Revision;

  //   const yamlServiceContent = `apiVersion: serving.knative.dev/v1
  // kind: Service
  // metadata:
  //   annotations:
  //     image.openshift.io/triggers: '[{"from":{"kind":"ImageStreamTag","name":"example:quarkus","namespace":"a-serverless-example"},"fieldPath":"spec.template.spec.containers[?(@.name==\\"example\\")].image","pause":"false"}]'
  //     kubectl.kubernetes.io/last-applied-configuration: >
  //       {"apiVersion":"serving.knative.dev/v1","kind":"Service","metadata":{"annotations":{"image.openshift.io/triggers":"[{\\"from\\":{\\"kind\\":\\"ImageStreamTag\\",\\"name\\":\\"example:quarkus\\",\\"namespace\\":\\"a-serverless-example\\"},\\"fieldPath\\":\\"spec.template.spec.containers[?(@.name==\\\\"example\\\\")].image\\",\\"pause\\":\\"false\\"}]","serving.knative.dev/creator":"kube:admin","serving.knative.dev/lastModifier":"system:admin"},"labels":{"app.kubernetes.io/component":"example","app.kubernetes.io/instance":"example","app.kubernetes.io/name":"example","app.kubernetes.io/part-of":"knative-tutorial-greeter-app","app.openshift.io/runtime":"example","app.openshift.io/runtime-namespace":"a-serverless-example","app.openshift.io/runtime-version":"quarkus"},"name":"example","namespace":"a-serverless-example"},"spec":{"template":{"spec":{"containerConcurrency":0,"containers":[{"image":"quay.io/rhdevelopers/knative-tutorial-greeter:quarkus","imagePullPolicy":"Always","name":"user-container","ports":[{"containerPort":8080}],"readinessProbe":{"successThreshold":1,"tcpSocket":{"port":0}},"resources":{}}],"timeoutSeconds":300}},"traffic":[{"latestRevision":true,"percent":100},{"latestRevision":false,"percent":0,"revisionName":"example-2fvz4","tag":"old"}]}}
  //     serving.knative.dev/creator: kube:admin
  //     serving.knative.dev/lastModifier: system:admin
  //   labels:
  //     app.kubernetes.io/component: example
  //     app.kubernetes.io/instance: example
  //     app.kubernetes.io/name: example
  //     app.kubernetes.io/part-of: knative-tutorial-greeter-app
  //     app.openshift.io/runtime: example
  //     app.openshift.io/runtime-namespace: a-serverless-example
  //     app.openshift.io/runtime-version: quarkus
  //   name: example
  //   namespace: a-serverless-example
  // spec:
  //   template:
  //     spec:
  //       containerConcurrency: 0
  //       containers:
  //         - image: quay.io/rhdevelopers/knative-tutorial-greeter:quarkus
  //           imagePullPolicy: Always
  //           name: user-container
  //           ports:
  //             - containerPort: 8080
  //           readinessProbe:
  //             successThreshold: 1
  //             tcpSocket:
  //               port: 0
  //           resources: {}
  //       timeoutSeconds: 300
  //   traffic:
  //     - latestRevision: true
  //       percent: 100
  //     - latestRevision: false
  //       percent: 0
  //       revisionName: example-2fvz4
  //       tag: old
  //     - latestRevision: false
  //       percent: 0
  //       revisionName: example-75w7v
  //       tag: current
  //   `;
  //   const jsonServiceContent = yaml.parse(yamlServiceContent);

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
  const testServiceTreeItem: KnativeTreeItem = new KnativeTreeItem(
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
  const testServiceTreeItemModified: KnativeTreeItem = new KnativeTreeItem(
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
  const example75w7vTreeItem: KnativeTreeItem = new KnativeTreeItem(
    testServiceTreeItem,
    example75w7vRevision,
    'example-75w7v',
    ContextType.REVISION_TAGGED,
    vscode.TreeItemCollapsibleState.None,
    null,
    null,
  );

  const exampleG4hm8Yaml = `apiVersion: serving.knative.dev/v1
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
  const exampleG4hm8Json = yaml.parse(exampleG4hm8Yaml);
  const exampleG4hm8Revision: Revision = new Revision('example-g4hm8', 'example', exampleG4hm8Json);
  const exampleG4hm8TreeItem: KnativeTreeItem = new KnativeTreeItem(
    testServiceTreeItem,
    exampleG4hm8Revision,
    'example-g4hm8',
    ContextType.REVISION,
    vscode.TreeItemCollapsibleState.None,
    null,
    null,
  );

  const example2fvz4Yaml = `apiVersion: serving.knative.dev/v1
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
  const example2fvz4Json = yaml.parse(example2fvz4Yaml);
  const example2fvz4Revision: Revision = new Revision('example-2fvz4', 'example', example2fvz4Json, [
    {
      tag: 'old',
      revisionName: 'example-2fvz4',
      configurationName: null,
      latestRevision: false,
      percent: 0,
      url: new URL('http://old-example-a-serverless-example.apps.devcluster.openshift.com'),
    },
  ]);
  const example2fvz4TreeItem: KnativeTreeItem = new KnativeTreeItem(
    testServiceTreeItem,
    example2fvz4Revision,
    'example-2fvz4',
    ContextType.REVISION_TAGGED,
    vscode.TreeItemCollapsibleState.None,
    null,
    null,
  );

  const exampleRevisionTreeItems = [example75w7vTreeItem, exampleG4hm8TreeItem, example2fvz4TreeItem];

  beforeEach(async () => {
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
    sandbox
      .stub(serviceDataProvider.knExecutor, 'execute')
      .resolves({ error: undefined, stdout: JSON.stringify(singleServiceData) });
    serviceTreeItems = await serviceDataProvider.getServices();
    // service = serviceTreeItems[0].getKnativeItem() as Service;
    sandbox.restore();
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
    sandbox
      .stub(serviceDataProvider.knExecutor, 'execute')
      .resolves({ error: undefined, stdout: JSON.stringify(singleServiceRevisionData) });
    // revisionTreeItems = await serviceDataProvider.getRevisions(serviceTreeItems[0]);
    // revision = revisionTreeItems[0].getKnativeItem() as Revision;
  });
  teardown(() => {
    sandbox.restore();
  });

  suite('Refresh', () => {
    // TODO: figure out how to test an event that is fired.
    test('should fire the tree data change event', () => {
      const spy = sandbox.spy(sdp.onDidChangeTreeDataEmitter, 'fire');
      sdp.refresh();
      sandbox.assert.calledOnce(spy);
    });
  });

  suite('Poll Refresh', () => {
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    // const sleep = (ms: number) => {
    //   return new Promise((resolve) => setTimeout(resolve, ms));
    // };
    test('should fire the refresh every minute', () => {
      // const spy = sandbox.spy(sdp.onDidChangeTreeDataEmitter, 'fire');
      sdp.pollRefresh();
      // eslint-disable-next-line no-console
      // console.log(`ServiceDataProvidertest.Poll Refresh before timeout ${Math.round(new Date().getTime() / 1000)}`);
      // give the poll enough time to call
      // eslint-disable-next-line @typescript-eslint/await-thenable

      // await sleep(60001);
      // eslint-disable-next-line no-console
      // console.log(`ServiceDataProvidertest.Poll Refresh after timeout ${Math.round(new Date().getTime() / 1000)}`);

      // turn it off so that it doesn't keep polling
      // sdp.stopPollRefresh();
      // sandbox.assert.calledOnce(spy);
    });
  });

  suite('Output Channel', () => {
    test('should show the output channel', () => {
      const spy = sandbox.spy(sdp.knOutputChannel, 'show');
      sdp.showOutputChannel();
      sinon.assert.calledOnce(spy);
    });
  });

  suite('Getting a Tree Item', () => {
    test('should return the specific tree element requested', async () => {
      const parentKnativeItem: KnativeItem = new Service('example', 'quay.io/rhdevelopers/knative-tutorial-greeter:quarkus');
      const parent: KnativeTreeItem = new KnativeTreeItem(
        null,
        parentKnativeItem,
        'example',
        ContextType.SERVICE,
        vscode.TreeItemCollapsibleState.None,
        null,
        null,
      );
      const item: vscode.TreeItem = await serviceDataProvider.getTreeItem(parent);
      assert.equals(item, parent);
    });
  });

  suite('Getting Tree Children', () => {
    test('should return the No Services node when KN execute returns "No Services found"', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox.stub(serviceDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: 'No services found.' });
      const result = await serviceDataProvider.getChildren();
      expect(result).to.have.lengthOf(1);
      expect(result[0].description).equals('');
      expect(result[0].label).equals('No Service Found');
      expect(result[0].getName()).equals('No Service Found');
    });
    test('should return a single Service tree node when called from root with one Service', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox
        .stub(serviceDataProvider.knExecutor, 'execute')
        .resolves({ error: undefined, stdout: JSON.stringify(singleServiceData) });
      const result = await serviceDataProvider.getChildren();
      expect(result).to.have.lengthOf(1);
      expect(result[0].description).equals('');
      expect(result[0].label).equals('example');
      expect(result[0].getName()).equals('example');
      expect(result[0].tooltip).equals('Service: example');
    });
    test('should return a single Revision tree node', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox.stub(serviceDataProvider, `getRevisions`).resolves(exampleRevisionTreeItems);
      const result = await serviceDataProvider.getChildren(testServiceTreeItem);
      expect(result).to.have.lengthOf(3);
      expect(result[0].description).equals('latest current ');
      expect(result[0].label).equals('example-75w7v (100%)');
      expect(result[0].getName()).equals('example-75w7v');
      expect(result[0].tooltip).equals('Revision: example-75w7v');
    });
    test('should return a single Revision tree node when', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox.stub(serviceDataProvider, `getRevisions`).resolves(exampleRevisionTreeItems);
      const result = await serviceDataProvider.getChildren(testServiceTreeItemModified);
      expect(result).to.have.lengthOf(3);
      expect(result[0].description).equals('latest current ');
      expect(result[0].label).equals('example-75w7v (100%)');
      expect(result[0].getName()).equals('example-75w7v');
      expect(result[0].tooltip).equals('Revision: example-75w7v');
    });
  });

  suite('Getting a Parent Item', () => {
    test('should return null for a Service', () => {
      const parentKnativeItem: Service = new Service('example', 'quay.io/rhdevelopers/knative-tutorial-greeter:quarkus');
      const parent: KnativeTreeItem = new KnativeTreeItem(
        null,
        parentKnativeItem,
        'example',
        ContextType.SERVICE,
        vscode.TreeItemCollapsibleState.None,
        null,
        null,
      );
      const item: KnativeTreeItem = serviceDataProvider.getParent(parent);
      assert.equals(item, null);
    });
    test('should return the Service of the Revision', async () => {
      const result = await serviceDataProvider.getRevisions(serviceTreeItems[0]);
      const item: KnativeTreeItem = serviceDataProvider.getParent(result[0]);
      assert.equals(item, serviceTreeItems[0]);
    });
  });

  suite('Getting Revision', () => {
    test('should NOT run getRevisionData a second time if the CliExitData has an Error', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox.stub(sdp.knExecutor, 'execute').resolves({ error: 'Sending an error for this test.', stdout: '' });
      const spy = sandbox.spy(sdp, 'getRevisionData');
      await sdp.getRevisions(serviceTreeItems[0]);
      sinon.assert.calledOnce(spy);
    });
    test('should run getRevisionData a second time if the CliExitData has no data and no error', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      const stub = sandbox.stub(sdp.knExecutor, 'execute');
      stub.onCall(0).resolves({ error: undefined, stdout: '' });
      stub.resolves({ error: undefined, stdout: JSON.stringify(singleServiceRevisionData) });
      const spy = sandbox.spy(sdp, 'getRevisionData');
      await sdp.getRevisions(testServiceTreeItem);
      sinon.assert.calledTwice(spy);
    });
    test('should throw an error when the promise rejects when trying to get Revision data', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      const spy = sandbox.spy(sdp, 'getRevisionData');
      const stub = sandbox.stub(sdp.knExecutor, 'execute');
      stub.rejects('In a test, rejecting a promise to get Revisions');
      const result = await sdp.getRevisions(testServiceTreeItem);
      sinon.assert.calledOnce(spy);
      assert.equals(result, null);
      // sinon.assert.threw(spy);
      // assert(spy.threw());
    });
  });
  suite('Getting Services', () => {
    test('should return a list of Services', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      const spy = sandbox.spy(sdp, 'getServicesList');
      sandbox.stub(sdp.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(singleServiceData) });
      sandbox.stub(sdp, 'isNodeModifiedLocally').resolves(false);
      const result: KnativeTreeItem = await sdp.getServices();
      sinon.assert.calledOnce(spy);
      assert.equals(result[0], testServiceTreeItem);
    });

    test('should return a list of Services, even if they are modified', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      const spy = sandbox.spy(sdp, 'getServicesList');
      sandbox.stub(sdp.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(singleServiceData) });
      sandbox.stub(sdp, 'isNodeModifiedLocally').resolves(true);
      const result: KnativeTreeItem = await sdp.getServices();
      sinon.assert.calledOnce(spy);
      assert.equals(result[0], testServiceTreeItemModified);
    });

    test(`should rerun the List command if it does not get complete data, when is no Conditions, then return a list of Services`, async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      const spy = sandbox.spy(sdp, 'getServicesList');
      sandbox.stub(sdp, 'isNodeModifiedLocally').resolves(false);
      const stub = sandbox.stub(sdp.knExecutor, 'execute');
      const incompleteData = JSON.parse(JSON.stringify(singleServiceData));
      delete incompleteData.items[0].status.conditions;
      stub.onCall(0).resolves({ error: undefined, stdout: JSON.stringify(incompleteData) });
      stub.resolves({ error: undefined, stdout: JSON.stringify(singleServiceData) });
      const result: KnativeTreeItem = await sdp.getServices();
      sinon.assert.calledTwice(spy);
      assert.equals(result[0], testServiceTreeItem);
    });
  });
  suite('Delete Feature', () => {
    test('should not delete anything if deletion modal is not confirmed', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox.stub(vscode.window, 'showInformationMessage').resolves(undefined);
      const stubExecute = sandbox.stub(sdp.knExecutor, 'execute').resolves();
      const stubRemoveService = sandbox.stub(sdp.ksvc, 'removeService');
      const stubRemoveRevision = sandbox.stub(sdp.ksvc, 'removeRevision');
      await sdp.deleteFeature(testServiceTreeItem);
      sinon.assert.notCalled(stubExecute);
      sinon.assert.notCalled(stubRemoveService);
      sinon.assert.notCalled(stubRemoveRevision);
    });
    test('should delete a Service if deletion modal is confirmed on Service node', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      const stubShowInformationMessage = (sandbox.stub(vscode.window, 'showInformationMessage') as unknown) as sinon.SinonStub<
        [string, vscode.MessageOptions, ...string[]],
        Thenable<string>
      >;
      stubShowInformationMessage.resolves('Delete');
      const stubExecute = sandbox.stub(sdp.knExecutor, 'execute').resolves();
      const stubRemoveService = sandbox.stub(sdp.ksvc, 'removeService');
      const stubRemoveRevision = sandbox.stub(sdp.ksvc, 'removeRevision');
      await sdp.deleteFeature(testServiceTreeItem);
      sinon.assert.calledOnce(stubExecute);
      sinon.assert.calledOnce(stubRemoveService);
      sinon.assert.notCalled(stubRemoveRevision);
    });
    test('should delete a Revision if deletion modal is confirmed on Revision node', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      const stubShowInformationMessage = (sandbox.stub(vscode.window, 'showInformationMessage') as unknown) as sinon.SinonStub<
        [string, vscode.MessageOptions, ...string[]],
        Thenable<string>
      >;
      stubShowInformationMessage.resolves('Delete');
      const stubExecute = sandbox.stub(sdp.knExecutor, 'execute').resolves();
      const stubRemoveService = sandbox.stub(sdp.ksvc, 'removeService');
      const stubRemoveRevision = sandbox.stub(sdp.ksvc, 'removeRevision');
      await sdp.deleteFeature(exampleG4hm8TreeItem);
      sinon.assert.calledOnce(stubExecute);
      sinon.assert.notCalled(stubRemoveService);
      sinon.assert.calledOnce(stubRemoveRevision);
    });
    test('should delete a Revision if deletion modal is confirmed on a Tagged Revision node', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      const stubShowInformationMessage = (sandbox.stub(vscode.window, 'showInformationMessage') as unknown) as sinon.SinonStub<
        [string, vscode.MessageOptions, ...string[]],
        Thenable<string>
      >;
      stubShowInformationMessage.resolves('Delete');
      const stubExecute = sandbox.stub(sdp.knExecutor, 'execute').resolves();
      const stubRemoveService = sandbox.stub(sdp.ksvc, 'removeService');
      const stubRemoveRevision = sandbox.stub(sdp.ksvc, 'removeRevision');
      await sdp.deleteFeature(example75w7vTreeItem);
      sinon.assert.calledOnce(stubExecute);
      sinon.assert.notCalled(stubRemoveService);
      sinon.assert.calledOnce(stubRemoveRevision);
    });
  });
  suite('Get URL', () => {
    test('should return a URL string from the user', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showInputBox').resolves('some/url');
      const result: string = await sdp.getUrl();
      assert.equals('some/url', result);
    });
  });
});
