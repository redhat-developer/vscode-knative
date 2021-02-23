import * as vscode from 'vscode';
import { expect } from 'chai';
import * as chai from 'chai';
import { beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { EventingDataProvider } from '../../src/eventingTree/eventingDataProvider';
import { EventingTreeItem } from '../../src/eventingTree/eventingTreeItem';
import { Broker } from '../../src/knative/broker';
import { KEvent } from '../../src/knative/kEvent';
import { KnativeEvents } from '../../src/knative/knativeEvents';
import { Trigger } from '../../src/knative/trigger';
import * as brokerData from '../eventingTree/broker.json';
import * as triggerData from '../eventingTree/trigger.json';

chai.use(sinonChai);

suite('Knative Events', () => {
  const sandbox = sinon.createSandbox();
  const eventingDataProvider = new EventingDataProvider();

  const knativeEvents: KnativeEvents = KnativeEvents.Instance;

  const testBroker0: Broker = new Broker('example-broker0', 'Brokers', JSON.parse(JSON.stringify(brokerData.items[0])));
  const testBroker1: Broker = new Broker('example-broker1', 'Brokers', JSON.parse(JSON.stringify(brokerData.items[1])));
  const filters = new Map();
  filters.set('name', 'dev.knative.bar');
  filters.set('type', 'dev.knative.foo');
  const testTrigger0: Trigger = new Trigger(
    'example-trigger0',
    'Triggers',
    'example-broker0',
    filters,
    'aaa',
    JSON.parse(JSON.stringify(triggerData.items[0])),
  );
  const testTrigger1: Trigger = new Trigger(
    'example-trigger1',
    'Triggers',
    'example-broker0',
    filters,
    'example-broker1',
    JSON.parse(JSON.stringify(triggerData.items[1])),
  );

  let eventingTreeItems: EventingTreeItem[];
  let brokerEventFolder: KEvent;
  let triggerEventFolder: KEvent;

  beforeEach(() => {
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
    eventingTreeItems = eventingDataProvider.getEventingFolders();
    knativeEvents.addChildren([testBroker0, testBroker1]);
    knativeEvents.addChildren([testTrigger0, testTrigger1]);
    brokerEventFolder = eventingTreeItems[0].getKnativeItem() as KEvent;
    triggerEventFolder = eventingTreeItems[4].getKnativeItem() as KEvent;
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('Getting an instance', () => {
    test('should return an instance of the singleton', () => {
      const instance: KnativeEvents = KnativeEvents.Instance;
      expect(instance).to.deep.equal(knativeEvents);
    });
  });
  suite('Getting an Event', () => {
    test('should return a list of events from the instance', () => {
      const returnedEvent: KEvent = knativeEvents.getEvents()[0];
      expect(returnedEvent).to.deep.equal(brokerEventFolder);
    });
  });
  suite('Finding an Event', () => {
    test('should return an event using the event name', () => {
      const returnedEvent: KEvent = knativeEvents.findEvent('Brokers');
      expect(returnedEvent).to.deep.equal(brokerEventFolder);
    });
  });
  suite('Finding a Child', () => {
    test('should return a child using the child name', () => {
      const returnedEvent = knativeEvents.findChild('example-trigger1');
      expect(returnedEvent).to.deep.equal(testTrigger1);
    });
  });
  suite('Finding an Event and Child', () => {
    test('should return an object with both event and child using the child name', () => {
      const returnedEvent = knativeEvents.findChildAndEvent('example-trigger1');
      expect(returnedEvent).to.deep.equal({ child: testTrigger1, event: triggerEventFolder });
    });
  });
  suite('Finding Event and Child indexes', () => {
    test('should return an object with both event and child using the child name', () => {
      const childIndex = 1;
      const eventIndex = 4;
      const returnedEvent = knativeEvents.findChildAndEventIndex('example-trigger1');
      expect(returnedEvent).to.deep.equal({ childIndex, eventIndex });
    });
  });
  suite('Adding an Event', () => {
    test('should return the event added', () => {
      const remainingEvents: KEvent[] = knativeEvents.removeEvent('Brokers');
      expect(remainingEvents).to.have.lengthOf(4);
      const returnedEvent: KEvent = knativeEvents.addEvent(brokerEventFolder);
      expect(returnedEvent).to.deep.equal(brokerEventFolder);
    });
  });
  suite('Adding multiple Events', () => {
    test('should return a list of events added', () => {
      const remainingEvents: KEvent[] = knativeEvents.removeEvent('Brokers');
      expect(remainingEvents).to.have.lengthOf(4);
      const returnedEvent: KEvent[] = knativeEvents.addEvents([brokerEventFolder]);
      expect(returnedEvent).to.deep.equal([brokerEventFolder]);
    });
  });
  suite('Updating an Event', () => {
    test('should return a list of events, including the updated one', () => {
      const returnedEvent: KEvent[] = knativeEvents.updateEvent(brokerEventFolder);
      expect(returnedEvent[0]).to.deep.equal(brokerEventFolder);
    });
  });
  suite('Removing an Event child', () => {
    test('should remove a child from an event', () => {
      expect(knativeEvents.getEvents()[0].children).to.have.lengthOf(2);
      knativeEvents.removeChild('example-broker1');
      expect(knativeEvents.getEvents()[0].children).to.have.lengthOf(1);
    });
  });
});
