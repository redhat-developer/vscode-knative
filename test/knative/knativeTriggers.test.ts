/* eslint-disable no-unused-expressions */
import * as vscode from 'vscode';
import { expect } from 'chai';
import * as chai from 'chai';
import { beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { APIServerSource } from '../../src/knative/apiServerSource';
import { BindingSource } from '../../src/knative/bindingSource';
import { Broker } from '../../src/knative/broker';
import { Channel } from '../../src/knative/channel';
import { GenericSource } from '../../src/knative/genericSource';
import { KnativeBrokers } from '../../src/knative/knativeBrokers';
import { KnativeChannels } from '../../src/knative/knativeChannels';
import { KnativeSources } from '../../src/knative/knativeSources';
import { KnativeTriggers } from '../../src/knative/knativeTriggers';
import { PingSource } from '../../src/knative/pingSource';
import { Service } from '../../src/knative/service';
import { Sink } from '../../src/knative/sink';
import { Trigger } from '../../src/knative/trigger';
import * as brokerData from '../eventingTree/broker.json';
import * as channelData from '../eventingTree/channel.json';
import * as sourceData from '../eventingTree/source.json';
import * as triggerData from '../eventingTree/trigger.json';

chai.use(sinonChai);

suite('Knative Triggers', () => {
  const sandbox = sinon.createSandbox();
  const knativeBrokers: KnativeBrokers = KnativeBrokers.Instance;
  const knativeChannels: KnativeChannels = KnativeChannels.Instance;
  const knativeSources: KnativeSources = KnativeSources.Instance;
  const knativeTriggers: KnativeTriggers = KnativeTriggers.Instance;

  // Brokers
  const testBroker0: Broker = new Broker('example-broker0', 'Brokers', JSON.parse(JSON.stringify(brokerData.items[0])));
  const testBroker1: Broker = new Broker('example-broker1', 'Brokers', JSON.parse(JSON.stringify(brokerData.items[1])));
  const testBrokers = [testBroker0, testBroker1];

  // Channels
  const testChannel0: Channel = new Channel(
    'example-channel0',
    'Channels',
    'InMemoryChannel',
    JSON.parse(JSON.stringify(channelData.items[0])),
  );
  const testChannel1: Channel = new Channel(
    'example-channel1',
    'Channels',
    'InMemoryChannel',
    JSON.parse(JSON.stringify(channelData.items[1])),
  );
  const testChannel2: Channel = new Channel(
    'example-channel2',
    'Channels',
    'InMemoryChannel',
    JSON.parse(JSON.stringify(channelData.items[2])),
  );
  const testChannel3: Channel = new Channel(
    'example-channel3',
    'Channels',
    'InMemoryChannel',
    JSON.parse(JSON.stringify(channelData.items[3])),
  );
  const testChannels = [testChannel0, testChannel1, testChannel2, testChannel3];

  // SOURCES
  // API Server Source
  const testSourceApiserver0: APIServerSource = new APIServerSource(
    'example-source-apiserver0',
    'Sources',
    '',
    'aaa',
    JSON.parse(JSON.stringify(sourceData.items[0])),
  );
  const testSourceApiserver1: APIServerSource = new APIServerSource(
    'example-source-apiserver1',
    'Sources',
    '',
    'example-broker0',
    JSON.parse(JSON.stringify(sourceData.items[1])),
  );
  const testSourceApiserver2: APIServerSource = new APIServerSource(
    'example-source-apiserver2',
    'Sources',
    '',
    'example-channel0',
    JSON.parse(JSON.stringify(sourceData.items[2])),
  );
  const testSourceApiserver3: APIServerSource = new APIServerSource(
    'example-source-apiserver3',
    'Sources',
    '',
    'https://event.receiver.uri',
    JSON.parse(JSON.stringify(sourceData.items[3])),
  );
  // Ping Source
  const testSourcePing0: PingSource = new PingSource(
    'example-source-ping0',
    'Sources',
    '*/2 * * * *',
    '{ value: "hello" }',
    'aaa',
    JSON.parse(JSON.stringify(sourceData.items[4])),
  );
  const testSourcePing2: PingSource = new PingSource(
    'example-source-ping2',
    'Sources',
    '*/2 * * * *',
    '{ value: "hello" }',
    'example-broker0',
    JSON.parse(JSON.stringify(sourceData.items[6])),
  );
  const testSourcePing3: PingSource = new PingSource(
    'example-source-ping3',
    'Sources',
    '*/2 * * * *',
    '{ value: "hello" }',
    'example-channel0',
    JSON.parse(JSON.stringify(sourceData.items[7])),
  );
  const testSourcePing4: PingSource = new PingSource(
    'example-source-ping4',
    'Sources',
    '*/2 * * * *',
    '{ value: "hello" }',
    'https://event.receiver.uri',
    JSON.parse(JSON.stringify(sourceData.items[8])),
  );
  // Sink Binding Source
  const testSourceBinding0: BindingSource = new BindingSource(
    'example-source-binding0',
    'Sources',
    'ddd',
    'aaa',
    JSON.parse(JSON.stringify(sourceData.items[9])),
  );
  const testSourceBinding1: BindingSource = new BindingSource(
    'example-source-binding1',
    'Sources',
    'ddd',
    'example-broker0',
    JSON.parse(JSON.stringify(sourceData.items[10])),
  );
  const testSourceBinding2: BindingSource = new BindingSource(
    'example-source-binding2',
    'Sources',
    'ddd',
    'example-channel0',
    JSON.parse(JSON.stringify(sourceData.items[11])),
  );
  const testSourceBinding3: BindingSource = new BindingSource(
    'example-source-binding3',
    'Sources',
    'ddd',
    'https://event.receiver.uri',
    JSON.parse(JSON.stringify(sourceData.items[12])),
  );
  // ping source as Generic source
  const testSourceGeneric: GenericSource = new GenericSource(
    'example-source-ping1',
    'Sources',
    'Source',
    'aaa',
    null,
    JSON.parse(JSON.stringify(sourceData.items[5])),
  );
  const testSources = [
    testSourceApiserver0,
    testSourceApiserver1,
    testSourceApiserver2,
    testSourceApiserver3,
    testSourcePing0,
    testSourcePing2,
    testSourcePing3,
    testSourcePing4,
    testSourceBinding0,
    testSourceBinding1,
    testSourceBinding2,
    testSourceBinding3,
    testSourceGeneric,
  ];

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
  const testTrigger2: Trigger = new Trigger(
    'example-trigger2',
    'Triggers',
    'example-broker1',
    filters,
    'example-channel0',
    JSON.parse(JSON.stringify(triggerData.items[2])),
  );
  const testTrigger3: Trigger = new Trigger(
    'example-trigger3',
    'Triggers',
    'example-broker1',
    filters,
    'example-broker1',
    JSON.parse(JSON.stringify(triggerData.items[3])),
  );
  const testTrigger4: Trigger = new Trigger(
    'example-trigger4',
    'Triggers',
    'example-broker1',
    filters,
    'https://event.receiver.uri/',
    JSON.parse(JSON.stringify(triggerData.items[4])),
  );
  const testTrigger0Empty: Trigger = new Trigger(
    'example-trigger0Empty',
    'Triggers',
    null,
    null,
    null,
    JSON.parse(JSON.stringify(triggerData.items[0])),
  );
  const testTrigger0Missing: Trigger = new Trigger(
    'example-trigger0Missing',
    'Triggers',
    'missing-broker',
    filters,
    'missing-sink',
    JSON.parse(JSON.stringify(triggerData.items[0])),
  );
  let testTriggers: Trigger[];

  beforeEach(() => {
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
    testTriggers = [testTrigger0, testTrigger1, testTrigger2, testTrigger3, testTrigger4];
    knativeChannels.addChannels(testChannels);
    knativeBrokers.addBrokers(testBrokers);
    knativeSources.addSources(testSources);
    knativeTriggers.addTriggers(testTriggers);
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('Getting an instance', () => {
    test('should return an instance of the singleton', () => {
      const instance: KnativeTriggers = KnativeTriggers.Instance;
      expect(instance).to.deep.equal(knativeTriggers);
    });
  });
  suite('Getting a Trigger', () => {
    test('should return a list of triggers from the instance', () => {
      const returnedTrigger: Trigger = knativeTriggers.getTriggers()[0];
      expect(returnedTrigger).to.deep.equal(testTrigger0);
    });
  });
  suite('Finding a Trigger', () => {
    test('should return a trigger using the trigger name', () => {
      const returnedTrigger: Trigger = knativeTriggers.findTrigger('example-trigger0');
      expect(returnedTrigger).to.deep.equal(testTrigger0);
    });
  });
  suite('Adding a Trigger', () => {
    test('should add a trigger and return the trigger added', () => {
      const remainingTriggers: Trigger[] = knativeTriggers.removeTrigger('example-trigger1');
      expect(remainingTriggers).to.have.lengthOf(4);
      const returnedTrigger: Trigger = knativeTriggers.addTrigger(testTrigger1);
      expect(returnedTrigger).to.deep.equal(testTrigger1);
    });
  });
  suite('Adding multiple Triggers', () => {
    test('should add a list of triggers return a list of triggers added', () => {
      const remainingTriggers: Trigger[] = knativeTriggers.removeTrigger('example-trigger1');
      expect(remainingTriggers).to.have.lengthOf(4);
      const returnedTriggers: Trigger[] = knativeTriggers.addTriggers(testTriggers);
      expect(returnedTriggers).to.deep.equal(testTriggers);
    });
  });
  suite('Adding a Broker', () => {
    test('should add a Broker to the parent trigger and return the Broker added', () => {
      const returnedBroker: Broker = knativeTriggers.addBroker(testTrigger0);
      expect(returnedBroker.name).to.equal('example-broker0');
    });
    test('should return null when adding a Broker to the parent trigger that does not have a broker listed', () => {
      const returnedBroker: Broker = knativeTriggers.addBroker(testTrigger0Empty);
      expect(returnedBroker).to.be.null;
    });
    test('should return undefined when adding a Broker to the parent trigger that has an unused broker name', () => {
      const returnedBroker: Broker = knativeTriggers.addBroker(testTrigger0Missing);
      expect(returnedBroker).to.be.undefined;
    });
  });
  suite('Adding a Sink', () => {
    test('should add a Sink to the parent trigger and return the Sink added', () => {
      const returnedSink: Service = knativeTriggers.addSink(testTrigger0) as Service;
      expect(returnedSink.name).to.equal('aaa');
    });
    test('should return null when adding a Sink to the parent trigger that does not have a Sink listed', () => {
      const returnedSink: Sink = knativeTriggers.addSink(testTrigger0Empty);
      expect(returnedSink).to.be.null;
    });
    test('should return undefined when adding a Sink to the parent trigger that has an unused Sink name', () => {
      const returnedSink: Sink = knativeTriggers.addSink(testTrigger0Missing);
      expect(returnedSink).to.be.undefined;
    });
  });
  suite('Updating a Trigger', () => {
    test('should return a list of triggers, including the updated one', () => {
      const returnedTriggers: Trigger[] = knativeTriggers.updateTrigger(testTrigger1);
      expect(returnedTriggers).to.deep.equal(testTriggers);
    });
  });
});
