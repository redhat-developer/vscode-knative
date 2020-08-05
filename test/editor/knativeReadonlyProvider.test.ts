import { Uri } from 'vscode';
import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as sinon from 'sinon';
import * as referee from '@sinonjs/referee';
import { KnativeReadonlyProvider } from '../../src/editor/knativeReadonlyProvider';
import { ServiceDataProvider } from '../../src/tree/serviceDataProvider';

const { assert } = referee;
chai.use(sinonChai);

suite('Readonly Provider', () => {
  const sandbox = sinon.createSandbox();
  const serviceDataProvider: ServiceDataProvider = new ServiceDataProvider();
  const knrp = new KnativeReadonlyProvider(serviceDataProvider.knvfs);

  const _uriExternalFileReadonly = Uri.parse(
    'knreadonly://loadknativecore/service-example.yaml?contextValue%3Dservice%26name%3Dexample%26_%3D1594328823824',
  );
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

  test('should display text', async () => {
    sandbox.stub(knrp.knvfs, 'loadResource').resolves(externalYamlFileContentFull);
    const fetchedData: string = await knrp.provideTextDocumentContent(_uriExternalFileReadonly);
    assert(fetchedData, externalYamlFileContentFull);
  });
});
