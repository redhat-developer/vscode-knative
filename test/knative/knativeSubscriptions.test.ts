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
import { KnativeSubscriptions } from '../../src/knative/knativeSubscriptions';
import { PingSource } from '../../src/knative/pingSource';
import { Service } from '../../src/knative/service';
import { Sink } from '../../src/knative/sink';
import { Subscription } from '../../src/knative/subscription';
import * as brokerData from '../eventingTree/broker.json';
import * as channelData from '../eventingTree/channel.json';
import * as sourceData from '../eventingTree/source.json';
import * as subscriptionData from '../eventingTree/subscription.json';

chai.use(sinonChai);

suite('Knative Subscriptions', () => {
  const sandbox = sinon.createSandbox();
  const knativeBrokers: KnativeBrokers = KnativeBrokers.Instance;
  const knativeChannels: KnativeChannels = KnativeChannels.Instance;
  const knativeSources: KnativeSources = KnativeSources.Instance;
  const knativeSubscriptions: KnativeSubscriptions = KnativeSubscriptions.Instance;

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

  // Subscriptions
  const testSubscription0: Subscription = new Subscription(
    'example-subscription0',
    'Subscriptions',
    'example-channel0',
    'aaa',
    undefined,
    undefined,
    JSON.parse(JSON.stringify(subscriptionData.items[5])),
  );
  const testSubscription1: Subscription = new Subscription(
    'example-subscription1',
    'Subscriptions',
    'example-channel0',
    'example-broker0',
    undefined,
    undefined,
    JSON.parse(JSON.stringify(subscriptionData.items[6])),
  );
  const testSubscription2: Subscription = new Subscription(
    'example-subscription2',
    'Subscriptions',
    'example-channel1',
    'example-channel0',
    undefined,
    undefined,
    JSON.parse(JSON.stringify(subscriptionData.items[7])),
  );
  const testSubscription3: Subscription = new Subscription(
    'example-subscription3',
    'Subscriptions',
    'example-channel2',
    'https://event.receiver.uri/',
    'https://event.receiver.uri/',
    'https://event.receiver.uri/',
    JSON.parse(JSON.stringify(subscriptionData.items[8])),
  );
  const testSubscription4: Subscription = new Subscription(
    'example-subscription4',
    'Subscriptions',
    'example-channel3',
    'aaa',
    'example-broker1',
    'example-broker0',
    JSON.parse(JSON.stringify(subscriptionData.items[9])),
  );
  const testSubscription0Empty: Subscription = new Subscription(
    'example-subscription0Empty',
    'Subscriptions',
    null,
    null,
    null,
    null,
    JSON.parse(JSON.stringify(subscriptionData.items[0])),
  );
  const testSubscription1Empty: Subscription = new Subscription(
    'example-subscription1Empty',
    'Subscriptions',
    'missing-channel',
    'missing-sink',
    'missing-sinkDeadLetter',
    'missing-sinkReply',
    JSON.parse(JSON.stringify(subscriptionData.items[1])),
  );
  let testSubscriptions: Subscription[];

  beforeEach(() => {
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
    testSubscriptions = [
      testSubscription0,
      testSubscription1,
      testSubscription2,
      testSubscription3,
      testSubscription4,
      testSubscription0Empty,
      testSubscription1Empty,
    ];
    knativeChannels.addChannels(testChannels);
    knativeBrokers.addBrokers(testBrokers);
    knativeSources.addSources(testSources);
    knativeSubscriptions.addSubscriptions(testSubscriptions);
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('Getting an instance', () => {
    test('should return an instance of the singleton', () => {
      const instance: KnativeSubscriptions = KnativeSubscriptions.Instance;
      expect(instance).to.deep.equal(knativeSubscriptions);
    });
  });
  suite('Getting a Subscription', () => {
    test('should return a list of subscriptions from the instance', () => {
      const returnedSubscription: Subscription = knativeSubscriptions.getSubscriptions()[0];
      expect(returnedSubscription).to.deep.equal(testSubscription0);
    });
  });
  suite('Finding a Subscription', () => {
    test('should return a subscription using the subscription name', () => {
      const returnedSubscription: Subscription = knativeSubscriptions.findSubscription('example-subscription0');
      expect(returnedSubscription).to.deep.equal(testSubscription0);
    });
  });
  suite('Adding a Subscription', () => {
    test('should add a subscription and return the subscription added', () => {
      const remainingSubscriptions: Subscription[] = knativeSubscriptions.removeSubscription('example-subscription1');
      expect(remainingSubscriptions).to.have.lengthOf(6);
      const returnedSubscription: Subscription = knativeSubscriptions.addSubscription(testSubscription1);
      expect(returnedSubscription).to.deep.equal(testSubscription1);
    });
  });
  suite('Adding multiple Subscriptions', () => {
    test('should add a list of subscriptions return a list of subscriptions added', () => {
      const remainingSubscriptions: Subscription[] = knativeSubscriptions.removeSubscription('example-subscription1');
      expect(remainingSubscriptions).to.have.lengthOf(6);
      const returnedSubscriptions: Subscription[] = knativeSubscriptions.addSubscriptions(testSubscriptions);
      expect(returnedSubscriptions).to.deep.equal(testSubscriptions);
    });
  });

  suite('Adding a Channel', () => {
    test('should add a Channel to the parent subscription and return the Channel added', () => {
      const returnedChannel: Channel = knativeSubscriptions.addChannel(testSubscription4);
      expect(returnedChannel.name).to.equal('example-channel3');
    });
    test('should return null when adding a Channel to the parent subscription that does not have a channel listed', () => {
      const returnedChannel: Channel = knativeSubscriptions.addChannel(testSubscription0Empty);
      expect(returnedChannel).to.be.null;
    });
    test('should return undefined when adding a Channel to the parent subscription that has an unused channel name', () => {
      const returnedChannel: Channel = knativeSubscriptions.addChannel(testSubscription1Empty);
      expect(returnedChannel).to.be.undefined;
    });
  });
  suite('Adding a Sink', () => {
    test('should add a Sink to the parent subscription and return the Sink added', () => {
      const returnedSink: Service = knativeSubscriptions.addSink(testSubscription4) as Service;
      expect(returnedSink.name).to.equal('aaa');
    });
    test('should return null when adding a Sink to the parent subscription that does not have a Sink listed', () => {
      const returnedSink: Sink = knativeSubscriptions.addSink(testSubscription0Empty);
      expect(returnedSink).to.be.null;
    });
    test('should return undefined when adding a Sink to the parent subscription that has an unused Sink name', () => {
      const returnedSink: Sink = knativeSubscriptions.addSink(testSubscription1Empty);
      expect(returnedSink).to.be.undefined;
    });
  });
  suite('Adding a Sink Dead Letter', () => {
    test('should add a Sink to the parent subscription and return the Sink added', () => {
      const returnedSink: Broker = knativeSubscriptions.addSinkDeadLetter(testSubscription4) as Broker;
      expect(returnedSink.name).to.equal('example-broker1');
    });
    test('should return null when adding a Sink to the parent subscription that does not have a Sink listed', () => {
      const returnedSink: Sink = knativeSubscriptions.addSinkDeadLetter(testSubscription0Empty);
      expect(returnedSink).to.be.null;
    });
    test('should return undefined when adding a Sink to the parent subscription that has an unused Sink name', () => {
      const returnedSink: Sink = knativeSubscriptions.addSinkDeadLetter(testSubscription1Empty);
      expect(returnedSink).to.be.undefined;
    });
  });
  suite('Adding a Sink Reply', () => {
    test('should add a Sink to the parent subscription and return the Sink added', () => {
      const returnedSink: Broker = knativeSubscriptions.addSinkReply(testSubscription4) as Broker;
      expect(returnedSink.name).to.equal('example-broker0');
    });
    test('should return null when adding a Sink to the parent subscription that does not have a Sink listed', () => {
      const returnedSink: Sink = knativeSubscriptions.addSinkReply(testSubscription0Empty);
      expect(returnedSink).to.be.null;
    });
    test('should return undefined when adding a Sink to the parent subscription that has an unused Sink name', () => {
      const returnedSink: Sink = knativeSubscriptions.addSinkReply(testSubscription1Empty);
      expect(returnedSink).to.be.undefined;
    });
  });

  suite('Updating a Subscription', () => {
    test('should return a list of subscriptions, including the updated one', () => {
      const returnedSubscriptions: Subscription[] = knativeSubscriptions.updateSubscription(testSubscription1);
      expect(returnedSubscriptions).to.deep.equal(testSubscriptions);
    });
  });
});
