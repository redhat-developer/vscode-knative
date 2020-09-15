import { expect } from 'chai';
import { URL } from 'url';
import * as revision from '../../src/knative/revision';

suite('Revision class', () => {
  let instance: revision.Revision;
  const annotationObj: revision.Annotations = null;
  const labelsObj: revision.Labels = null;
  const ownerRefObj: revision.OwnerReferencesEntity[] = [
    {
      apiVersion: '1.3.0',
      blockOwnerDeletion: false,
      controller: false,
      kind: 'kind',
      name: 'name',
      uid: 'uid-3',
    },
  ];
  const metadataObj: revision.Metadata = {
    name: 'myMeta',
    uid: 'x123y',
    annotations: annotationObj,
    labels: labelsObj,
    namespace: 'myNamespace',
    creationTimestamp: '2020-06-15',
    generation: 8,
    resourceVersion: '18',
    selfLink: 'https://points.somewhere.out',
    ownerReferences: ownerRefObj,
  };
  const specObj: revision.Spec = null;
  const statusObj: revision.Status = null;
  const urlObj: URL = null;
  const itemsObj: revision.Items = {
    apiVersion: '1.0.0',
    kind: 'type',
    metadata: metadataObj,
    spec: specObj,
    status: statusObj,
  };
  const trafficObj: revision.Traffic[] = [
    {
      configurationName: 'myConfiguration',
      latestRevision: true,
      percent: 50,
      revisionName: 'late night rev',
      tag: 'latest',
      url: urlObj,
    },
  ];
  setup(() => {
    instance = new revision.Revision('myRevision', 'myService');
  });
  test('toRevision should provide proper revision based on give Items and Traffic objects', () => {
    instance = new revision.Revision('x', 'y', itemsObj, trafficObj);
    expect(instance.name).to.equal('x');
    expect(instance.details).to.not.equal(undefined);
    expect(instance.details.apiVersion).to.equal('1.0.0');
    expect(instance.traffic).to.not.equal(undefined);
    expect(instance.traffic[0].revisionName).to.equal('late night rev');
    const newRevision = revision.Revision.toRevision(itemsObj, trafficObj);
    expect(newRevision).to.be.instanceOf(revision.Revision);
    expect(newRevision.name).to.equal('myMeta');
    expect(newRevision.service).to.equal('name');
    expect(newRevision.details.kind).to.equal('type');
    expect(newRevision.traffic).to.equal(trafficObj);
  });
  test('toRevision should fail when Items metadata object contains null or undefined in ownerReferences', () => {
    const itemsObj2 = itemsObj;
    itemsObj2.metadata.ownerReferences = null;
    try {
      revision.Revision.toRevision(itemsObj2, trafficObj);
    } catch (err) {
      expect(err).to.be.instanceOf(TypeError);
      expect(err.message).to.include('Cannot read property');
    }
    itemsObj2.metadata.ownerReferences = undefined;
    try {
      revision.Revision.toRevision(itemsObj2, trafficObj);
    } catch (err) {
      expect(err).to.be.instanceOf(TypeError);
      expect(err.message).to.include('Cannot read property');
    }
  });
});
