import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as sinon from 'sinon';
import * as referee from '@sinonjs/referee';
import { beforeEach } from 'mocha';
import { ServiceDataProvider } from '../../src/tree/serviceDataProvider';
import * as singleServiceData from '../tree/singleServiceServiceList.json';
import * as singleServiceRevisionData from '../tree/singleServiceRevisionList.json';
import { KnativeTreeItem } from '../../src/tree/knativeTreeItem';
import { Service } from '../../src/knative/service';
import { KnativeServices } from '../../src/knative/knativeServices';
import { Revision } from '../../src/knative/revision';

const { assert } = referee;
chai.use(sinonChai);

suite('Knative Services', () => {
  const sandbox = sinon.createSandbox();
  const serviceDataProvider = new ServiceDataProvider();

  const ksvc: KnativeServices = KnativeServices.Instance;

  let serviceTreeItems: KnativeTreeItem[];
  let revisionTreeItems: KnativeTreeItem[];
  let service: Service;
  let revision: Revision;
  beforeEach(async () => {
    sandbox
      .stub(serviceDataProvider.knExecutor, 'execute')
      .resolves({ error: undefined, stdout: JSON.stringify(singleServiceData) });
    serviceTreeItems = await serviceDataProvider.getChildren();
    service = serviceTreeItems[0].getKnativeItem() as Service;
    sandbox.restore();
    sandbox
      .stub(serviceDataProvider.knExecutor, 'execute')
      .resolves({ error: undefined, stdout: JSON.stringify(singleServiceRevisionData) });
    revisionTreeItems = await serviceDataProvider.getRevisions(serviceTreeItems[0]);
    revision = revisionTreeItems[0].getKnativeItem() as Revision;
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('Getting an instance', () => {
    test('should return an instance of the singlton', () => {
      const instance: KnativeServices = KnativeServices.Instance;
      assert.equals(instance, ksvc);
    });
  });
  suite('Getting a Service', () => {
    test('should return a list of services from the instance', () => {
      const returnedService: Service = ksvc.getServices()[0];
      assert.equals(service, returnedService);
    });
  });
  suite('Finding a Service', () => {
    test('should return a service using the service name', () => {
      const returnedService: Service = ksvc.findService('greeter');
      assert.equals(service, returnedService);
    });
  });
  suite('Finding a Revision', () => {
    test('should return a revision using the revision name', () => {
      const returnedRevision: Revision = ksvc.findRevision('greeter-btrnq-1');
      assert.equals(revision, returnedRevision);
    });
  });
  suite('Finding a Service and Revision', () => {
    test('should return an object with both service and revision using the revision name', () => {
      const returnedServiceRevision = ksvc.findRevisionAndService('greeter-btrnq-1');
      assert.equals({ revision, service }, returnedServiceRevision);
    });
  });
  suite('Check Traffic', () => {
    test('should a revision with 2 traffics one tagged', () => {
      const returnedRevision = ksvc.findRevision('greeter-btrnq-1');
      assert.equals(revision, returnedRevision);
      chai.assert.exists(revision.traffic);
      chai.assert.equal(revision.traffic.length, 2);
      chai.assert.equal(revision.traffic[0].percent, 100);
      chai.assert.equal(revision.traffic[1].tag, 'old');
    });
  });
  suite('Finding Service and Revision indexes', () => {
    test('should return an object with both service and revision using the revision name', () => {
      const returnedServiceRevision = ksvc.findRevisionAndServiceIndex('greeter-btrnq-1');
      const revisionIndex = 0;
      const serviceIndex = 0;
      assert.equals({ revisionIndex, serviceIndex }, returnedServiceRevision);
    });
  });
  suite('Adding a Service', () => {
    test('should return the service added', () => {
      const deletedService: Service[] = ksvc.removeService('greeter');
      assert.equals(deletedService, []);
      const returnedService: Service = ksvc.addService(service);
      assert.equals(service, returnedService);
    });
  });
  suite('Adding multiple Services', () => {
    test('should return a list of services added', () => {
      const deletedService: Service[] = ksvc.removeService('greeter');
      assert.equals(deletedService, []);
      const returnedService: Service[] = ksvc.addServices([service]);
      assert.equals([service], returnedService);
    });
  });
  suite('Updating a Service', () => {
    test('should return a list of services, including the updated one', () => {
      const returnedService: Service[] = ksvc.updateService(service);
      assert.equals([service], returnedService);
    });
  });

  suite('Removing a Revision', () => {
    test('should delete a revision from the list inside the service', () => {
      ksvc.removeRevision('greeter-btrnq-1');
      assert.equals(service.revisions, []);
    });
  });
});
