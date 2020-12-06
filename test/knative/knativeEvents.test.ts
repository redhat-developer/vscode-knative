import * as vscode from 'vscode';
import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as sinon from 'sinon';
import * as referee from '@sinonjs/referee';
import { beforeEach } from 'mocha';
import * as brokerData from '../eventingTree/broker.json';
import * as triggerData from '../eventingTree/trigger.json';
import { KnativeEvents } from '../../src/knative/knativeEvents';
import { KEvent } from '../../src/knative/kEvent';
import { EventingDataProvider } from '../../src/eventingTree/eventingDataProvider';
import { EventingTreeItem } from '../../src/eventingTree/eventingTreeItem';
import { Broker } from '../../src/knative/broker';
import { Trigger } from '../../src/knative/trigger';

const { assert } = referee;
const { expect } = chai;
chai.use(sinonChai);

suite('Knative Events', () => {
  const sandbox = sinon.createSandbox();
  const eventingDataProvider = new EventingDataProvider();

  const knativeEvents: KnativeEvents = KnativeEvents.Instance;

  const testBroker0: Broker = new Broker('exampleBroker0', 'Brokers', JSON.parse(JSON.stringify(brokerData.items[0])));
  const testBroker1: Broker = new Broker('exampleBroker1', 'Brokers', JSON.parse(JSON.stringify(brokerData.items[1])));
  const testTrigger0: Trigger = new Trigger('exampleTrigger0', 'Triggers', JSON.parse(JSON.stringify(triggerData.items[0])));
  const testTrigger1: Trigger = new Trigger('exampleTrigger1', 'Triggers', JSON.parse(JSON.stringify(triggerData.items[1])));

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
      assert.equals(instance, knativeEvents);
    });
  });
  suite('Getting an Event', () => {
    test('should return a list of events from the instance', () => {
      const returnedEvent: KEvent = knativeEvents.getEvents()[0];
      assert.equals(brokerEventFolder, returnedEvent);
    });
  });
  suite('Finding an Event', () => {
    test('should return an event using the event name', () => {
      const returnedEvent: KEvent = knativeEvents.findEvent('Brokers');
      assert.equals(brokerEventFolder, returnedEvent);
    });
  });
  suite('Finding a Child', () => {
    test('should return a child using the child name', () => {
      const returnedEvent = knativeEvents.findChild('exampleTrigger1');
      assert.equals(testTrigger1, returnedEvent);
    });
  });
  suite('Finding an Event and Child', () => {
    test('should return an object with both event and child using the child name', () => {
      const returnedEvent = knativeEvents.findChildAndEvent('exampleTrigger1');
      assert.equals({ child: testTrigger1, event: triggerEventFolder }, returnedEvent);
    });
  });
  suite('Finding Event and Child indexes', () => {
    test('should return an object with both event and child using the child name', () => {
      const returnedEvent = knativeEvents.findChildAndEventIndex('exampleTrigger1');
      const childIndex = 1;
      const eventIndex = 4;
      assert.equals({ childIndex, eventIndex }, returnedEvent);
    });
  });
  suite('Adding an Event', () => {
    test('should return the event added', () => {
      const remainingEvents: KEvent[] = knativeEvents.removeEvent('Brokers');
      expect(remainingEvents).to.have.lengthOf(4);
      const returnedEvent: KEvent = knativeEvents.addEvent(brokerEventFolder);
      assert.equals(brokerEventFolder, returnedEvent);
    });
  });
  suite('Adding multiple Events', () => {
    test('should return a list of events added', () => {
      const remainingEvents: KEvent[] = knativeEvents.removeEvent('Brokers');
      expect(remainingEvents).to.have.lengthOf(4);
      const returnedEvent: KEvent[] = knativeEvents.addEvents([brokerEventFolder]);
      assert.equals([brokerEventFolder], returnedEvent);
    });
  });
  suite('Updating an Event', () => {
    test('should return a list of events, including the updated one', () => {
      const returnedEvent: KEvent[] = knativeEvents.updateEvent(brokerEventFolder);
      assert.equals(brokerEventFolder, returnedEvent[0]);
    });
  });
  suite('Removing an Event child', () => {
    test('should remove a child from an event', () => {
      expect(knativeEvents.getEvents()[0].children).to.have.lengthOf(2);
      knativeEvents.removeChild('exampleBroker1');
      expect(knativeEvents.getEvents()[0].children).to.have.lengthOf(1);
    });
  });
});
