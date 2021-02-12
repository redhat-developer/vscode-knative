import * as vscode from 'vscode';
import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as sinon from 'sinon';
import * as referee from '@sinonjs/referee';
import { beforeEach } from 'mocha';
import * as brokerData from '../eventingTree/broker.json';
import * as channelData from '../eventingTree/channel.json';
import * as sourceData from '../eventingTree/source.json';
import { APIServerSource } from '../../src/knative/apiServerSource';
import { BindingSource } from '../../src/knative/bindingSource';
import { Broker } from '../../src/knative/broker';
import { Channel } from '../../src/knative/channel';
import { GenericSource } from '../../src/knative/genericSource';
import { KnativeBrokers } from '../../src/knative/knativeBrokers';
import { KnativeChannels } from '../../src/knative/knativeChannels';
import { KnativeSources, SourceTypes } from '../../src/knative/knativeSources';
import { PingSource } from '../../src/knative/pingSource';
import { Service } from '../../src/knative/service';
import { Sink } from '../../src/knative/sink';

const { assert } = referee;
const { expect } = chai;
chai.use(sinonChai);

suite('Knative Sources', () => {
  const sandbox = sinon.createSandbox();
  const knativeBrokers: KnativeBrokers = KnativeBrokers.Instance;
  const knativeChannels: KnativeChannels = KnativeChannels.Instance;
  const knativeSources: KnativeSources = KnativeSources.Instance;

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
  const testSourceGenericEmpty: GenericSource = new GenericSource(
    'example-source-ping1',
    'Sources',
    'Source',
    null,
    null,
    JSON.parse(JSON.stringify(sourceData.items[5])),
  );
  const testSourceGenericMissing: GenericSource = new GenericSource(
    'example-source-ping1',
    'Sources',
    'Source',
    'missing-sink',
    null,
    JSON.parse(JSON.stringify(sourceData.items[5])),
  );

  let testSources: SourceTypes[];

  beforeEach(() => {
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
    testSources = [
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
      testSourceGenericEmpty,
      testSourceGenericMissing,
    ];
    knativeChannels.addChannels(testChannels);
    knativeBrokers.addBrokers(testBrokers);
    knativeSources.addSources(testSources);
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('Getting an instance', () => {
    test('should return an instance of the singleton', () => {
      const instance: KnativeSources = KnativeSources.Instance;
      assert.equals(instance, knativeSources);
    });
  });
  suite('Getting a Source', () => {
    test('should return a list of sources from the instance', () => {
      const returnedSource: SourceTypes = knativeSources.getSources()[0];
      assert.equals(testSourceApiserver0, returnedSource);
    });
  });
  suite('Finding a Source', () => {
    test('should return a source using the source name', () => {
      const returnedSource: SourceTypes = knativeSources.findSource('example-source-apiserver0');
      assert.equals(testSourceApiserver0, returnedSource);
    });
  });
  suite('Adding a Source', () => {
    test('should add a source and return the source added', () => {
      const remainingSources: SourceTypes[] = knativeSources.removeSource('example-source-apiserver1');
      expect(remainingSources).to.have.lengthOf(14);
      const returnedSource: SourceTypes = knativeSources.addSource(testSourceApiserver1);
      assert.equals(testSourceApiserver1, returnedSource);
    });
  });
  suite('Adding multiple Sources', () => {
    test('should add a list of sources return a list of sources added', () => {
      const remainingSources: SourceTypes[] = knativeSources.removeSource('example-source-apiserver1');
      expect(remainingSources).to.have.lengthOf(14);
      const returnedSources: SourceTypes[] = knativeSources.addSources(testSources);
      assert.equals(testSources, returnedSources);
    });
  });
  suite('Adding a Sink', () => {
    test('should add a Sink to the parent source and return the Sink added', () => {
      const returnedSink: Service = knativeSources.addSink(testSourceApiserver0) as Service;
      assert.equals(returnedSink.name, 'aaa');
    });
    test('should return null when adding a Sink to the parent source that does not have a Sink listed', () => {
      const returnedSink: Sink = knativeSources.addSink(testSourceGenericEmpty);
      assert.isNull(returnedSink);
    });
    test('should return undefined when adding a Sink to the parent source that has an unused Sink name', () => {
      const returnedSink: Sink = knativeSources.addSink(testSourceGenericMissing);
      assert.isUndefined(returnedSink);
    });
  });
  suite('Updating a Source', () => {
    test('should return a list of sources, including the updated one', () => {
      const returnedSources: SourceTypes[] = knativeSources.updateSource(testSourceApiserver1);
      assert.equals(testSources, returnedSources);
    });
  });
});
