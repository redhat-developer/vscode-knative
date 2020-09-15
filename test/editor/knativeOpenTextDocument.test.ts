import * as vscode from 'vscode';
import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as sinon from 'sinon';
import * as yaml from 'yaml';
import { ContextType } from '../../src/cli/config';
import { openTreeItemInEditor } from '../../src/editor/knativeOpenTextDocument';
import { KnativeTreeItem } from '../../src/tree/knativeTreeItem';
import { Service } from '../../src/knative/service';

chai.use(sinonChai);

suite('Open Text Document', () => {
  const sandbox = sinon.createSandbox();

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
  testService.modified = true;
  const testServiceTreeItemModified: KnativeTreeItem = new KnativeTreeItem(
    null,
    testService,
    'example',
    ContextType.SERVICE_MODIFIED,
    vscode.TreeItemCollapsibleState.Expanded,
    null,
    null,
  );

  teardown(() => {
    sandbox.restore();
  });

  test('should open a Service tree item in the editor', () => {
    sandbox.stub(vscode.workspace, 'openTextDocument').resolves(('foo' as unknown) as vscode.TextDocument);
    sandbox.stub(vscode.window, 'showTextDocument').resolves();
    // const stubShowTextDoc = sandbox.stub(vscode.window, 'showTextDocument').resolves();
    // const spyShowTextDoc = sandbox.spy(stubShowTextDoc);
    openTreeItemInEditor(testServiceTreeItem, 'yaml', false);
    // sinon.assert.calledOnce(spyShowTextDoc);
  });
  test('should open a modified Service tree item in the editor', () => {
    sandbox.stub(vscode.workspace, 'openTextDocument').resolves(('foo' as unknown) as vscode.TextDocument);
    sandbox.stub(vscode.window, 'showTextDocument').resolves();
    // const stubShowTextDoc = sandbox.stub(vscode.window, 'showTextDocument').resolves();
    // const spyShowTextDoc = sandbox.spy(stubShowTextDoc);
    openTreeItemInEditor(testServiceTreeItemModified, 'yaml', true);
    // sinon.assert.calledOnce(spyShowTextDoc);
  });
  test('should not attempt to open a Service tree item in the editor when there is no doc', () => {
    sandbox.stub(vscode.workspace, 'openTextDocument').resolves(null);
    const spyTextDoc = sandbox.spy(vscode.window, 'showTextDocument');
    openTreeItemInEditor(testServiceTreeItem, 'yaml', false);
    sinon.assert.notCalled(spyTextDoc);
  });
  test('should not attempt to open a modified Service tree item in the editor when there is no doc', () => {
    sandbox.stub(vscode.workspace, 'openTextDocument').resolves(null);
    const spyTextDoc = sandbox.spy(vscode.window, 'showTextDocument');
    openTreeItemInEditor(testServiceTreeItemModified, 'yaml', true);
    sinon.assert.notCalled(spyTextDoc);
  });
  test('should throw and error when the promise is rejected trying to open a Service tree item in the editor', () => {
    sandbox.stub(vscode.workspace, 'openTextDocument').rejects();
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
    openTreeItemInEditor(testServiceTreeItem, 'yaml', false);
  });
});
