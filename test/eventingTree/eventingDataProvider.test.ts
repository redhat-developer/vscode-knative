import * as vscode from 'vscode';
import * as chai from 'chai';
import { beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as referee from '@sinonjs/referee';
import * as brokerData from './broker.json';
import * as channelData from './channel.json';
import * as multipleServiceData from '../servingTree/multipleServiceServicesList.json';
import * as sourceData from './source.json';
import * as subscriptionData from './subscription.json';
import * as triggerData from './trigger.json';
import { EventingContextType, ServingContextType } from '../../src/cli/config';
import { BrokerDataProvider } from '../../src/eventingTree/brokerDataProvider';
import { ChannelDataProvider } from '../../src/eventingTree/channelDataProvider';
import { EventingDataProvider } from '../../src/eventingTree/eventingDataProvider';
import { EventingTreeItem } from '../../src/eventingTree/eventingTreeItem';
// import { SourceDataProvider } from '../../src/eventingTree/sourceDataProvider';
// import { SubscriptionDataProvider } from '../../src/eventingTree/subscriptionDataProvider';
// import { TriggerDataProvider } from '../../src/eventingTree/triggerDataProvider';
import { APIServerSource } from '../../src/knative/apiServerSource';
import { BindingSource } from '../../src/knative/bindingSource';
import { Broker } from '../../src/knative/broker';
import { Channel } from '../../src/knative/channel';
import { GenericSource } from '../../src/knative/genericSource';
import { KnativeServices } from '../../src/knative/knativeServices';
import { KnativeSubscriptions } from '../../src/knative/knativeSubscriptions';
import { KnativeSources } from '../../src/knative/knativeSources';
import { KnativeTriggers } from '../../src/knative/knativeTriggers';
import { PingSource } from '../../src/knative/pingSource';
import { Service } from '../../src/knative/service';
import { ServingDataProvider } from '../../src/servingTree/servingDataProvider';
import { ServingTreeItem } from '../../src/servingTree/servingTreeItem';
import { KnativeItem } from '../../src/knative/knativeItem';
import { Subscription } from '../../src/knative/subscription';
import { Trigger } from '../../src/knative/trigger';

import rewire = require('rewire');
const rewiredEventingDataProvider = rewire('../../src/eventingTree/eventingDataProvider');

const { assert } = referee;
const { expect } = chai;
chai.use(sinonChai);

suite('EventingDataProvider', () => {
  const sandbox = sinon.createSandbox();
  const edp = new rewiredEventingDataProvider.EventingDataProvider();
  const eventingDataProvider: EventingDataProvider = new EventingDataProvider();
  const brokerDataProvider: BrokerDataProvider = new BrokerDataProvider();
  const channelDataProvider: ChannelDataProvider = new ChannelDataProvider();
  const servingDataProvider: ServingDataProvider = new ServingDataProvider();
  const ksvc: KnativeServices = KnativeServices.Instance;
  const knativeSources: KnativeSources = KnativeSources.Instance;
  // const sourceDataProvider: SourceDataProvider = new SourceDataProvider();
  const knativeSubscriptions: KnativeSubscriptions = KnativeSubscriptions.Instance;
  // const subscriptionDataProvider: SubscriptionDataProvider = new SubscriptionDataProvider();
  const knativeTriggers: KnativeTriggers = KnativeTriggers.Instance;
  // const triggerDataProvider: TriggerDataProvider = new TriggerDataProvider();

  let eventingTreeItems: EventingTreeItem[];

  // Folder nodes
  const eventingFolderNodes = [
    new EventingTreeItem(
      null,
      null,
      { label: 'Brokers' },
      EventingContextType.BROKER_FOLDER,
      vscode.TreeItemCollapsibleState.Expanded,
      null,
      null,
    ),
    new EventingTreeItem(
      null,
      null,
      { label: 'Channels' },
      EventingContextType.CHANNEL_FOLDER,
      vscode.TreeItemCollapsibleState.Expanded,
      null,
      null,
    ),
    new EventingTreeItem(
      null,
      null,
      { label: 'Sources' },
      EventingContextType.SOURCE_FOLDER,
      vscode.TreeItemCollapsibleState.Expanded,
      null,
      null,
    ),
    new EventingTreeItem(
      null,
      null,
      { label: 'Subscriptions' },
      EventingContextType.SUBSCRIPTION_FOLDER,
      vscode.TreeItemCollapsibleState.Expanded,
      null,
      null,
    ),
    new EventingTreeItem(
      null,
      null,
      { label: 'Triggers' },
      EventingContextType.TRIGGER_FOLDER,
      vscode.TreeItemCollapsibleState.Expanded,
      null,
      null,
    ),
  ];

  // Brokers
  const testBroker0: Broker = new Broker('example-broker0', 'Brokers', JSON.parse(JSON.stringify(brokerData.items[0])));
  const testBroker1: Broker = new Broker('example-broker1', 'Brokers', JSON.parse(JSON.stringify(brokerData.items[1])));

  // Broker Tree Items
  const testBroker0TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[0],
    testBroker0,
    { label: 'example-broker0' },
    EventingContextType.BROKER,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testBroker1TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[0],
    testBroker1,
    { label: 'example-broker1' },
    EventingContextType.BROKER,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testBrokerTreeItems = [testBroker0TreeItem, testBroker1TreeItem];

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

  // Channel Tree Items
  const testChannel0TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[1],
    testChannel0,
    { label: 'example-channel0' },
    EventingContextType.CHANNEL,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testChannel1TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[1],
    testChannel1,
    { label: 'example-channel1' },
    EventingContextType.CHANNEL,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testChannel2TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testChannel2,
    { label: 'example-channel2' },
    EventingContextType.CHANNEL,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testChannel3TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[3],
    testChannel3,
    { label: 'example-channel3' },
    EventingContextType.CHANNEL,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testChannelTreeItems = [testChannel0TreeItem, testChannel1TreeItem, testChannel2TreeItem, testChannel3TreeItem];

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

  // API Server Tree Items
  const testSourceApiserver0TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSourceApiserver0,
    { label: 'example-source-apiserver0' },
    EventingContextType.SOURCE_APISERVER,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testSourceApiserver1TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSourceApiserver1,
    { label: 'example-source-apiserver1' },
    EventingContextType.SOURCE_APISERVER,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testSourceApiserver2TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSourceApiserver2,
    { label: 'example-source-apiserver2' },
    EventingContextType.SOURCE_APISERVER,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testSourceApiserver3TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSourceApiserver3,
    { label: 'example-source-apiserver3' },
    EventingContextType.SOURCE_APISERVER,
    vscode.TreeItemCollapsibleState.Expanded,
  );

  // Ping Tree Items
  const testSourcePing0TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSourcePing0,
    { label: 'example-source-ping0' },
    EventingContextType.SOURCE_PING,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testSourcePing2TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSourcePing2,
    { label: 'example-source-ping2' },
    EventingContextType.SOURCE_PING,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testSourcePing3TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSourcePing3,
    { label: 'example-source-ping3' },
    EventingContextType.SOURCE_PING,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testSourcePing4TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSourcePing4,
    { label: 'example-source-ping4' },
    EventingContextType.SOURCE_PING,
    vscode.TreeItemCollapsibleState.Expanded,
  );

  // Binding Tree Items
  const testSourceBinding0TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSourceBinding0,
    { label: 'example-source-binding0' },
    EventingContextType.SOURCE_BINDING,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testSourceBinding1TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSourceBinding1,
    { label: 'example-source-binding1' },
    EventingContextType.SOURCE_BINDING,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testSourceBinding2TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSourceBinding2,
    { label: 'example-source-binding2' },
    EventingContextType.SOURCE_BINDING,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testSourceBinding3TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSourceBinding3,
    { label: 'example-source-binding3' },
    EventingContextType.SOURCE_BINDING,
    vscode.TreeItemCollapsibleState.Expanded,
  );

  const testSourceGenericTreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSourceGeneric,
    { label: 'example-source-ping1' },
    EventingContextType.SOURCE,
    vscode.TreeItemCollapsibleState.Expanded,
  );

  const testSourceTreeItems = [
    testSourceApiserver0TreeItem,
    testSourceApiserver1TreeItem,
    testSourceApiserver2TreeItem,
    testSourceApiserver3TreeItem,
    testSourcePing0TreeItem,
    testSourcePing2TreeItem,
    testSourcePing3TreeItem,
    testSourcePing4TreeItem,
    testSourceBinding0TreeItem,
    testSourceBinding1TreeItem,
    testSourceBinding2TreeItem,
    testSourceBinding3TreeItem,
    testSourceGenericTreeItem,
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
  const testSubscriptions = [testSubscription0, testSubscription1, testSubscription2, testSubscription3, testSubscription4];

  // Subscription Tree Items
  const testSubscription0TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[3],
    testSubscription0,
    { label: 'example-subscription0' },
    EventingContextType.SUBSCRIPTION,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testSubscription1TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[3],
    testSubscription1,
    { label: 'example-subscription1' },
    EventingContextType.SUBSCRIPTION,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testSubscription2TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[3],
    testSubscription2,
    { label: 'example-subscription2' },
    EventingContextType.SUBSCRIPTION,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testSubscription3TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[3],
    testSubscription3,
    { label: 'example-subscription3' },
    EventingContextType.SUBSCRIPTION,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testSubscription4TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[3],
    testSubscription4,
    { label: 'example-subscription4' },
    EventingContextType.SUBSCRIPTION,
    vscode.TreeItemCollapsibleState.Expanded,
  );

  const testSubscriptionTreeItems = [
    testSubscription0TreeItem,
    testSubscription1TreeItem,
    testSubscription2TreeItem,
    testSubscription3TreeItem,
    testSubscription4TreeItem,
  ];

  // Triggers
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
  const testTriggers = [testTrigger0, testTrigger1, testTrigger2, testTrigger3, testTrigger4];

  // Trigger Tree Items
  const testTrigger0TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[4],
    testTrigger0,
    { label: 'example-trigger0' },
    EventingContextType.TRIGGER,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testTrigger1TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[4],
    testTrigger1,
    { label: 'example-trigger1' },
    EventingContextType.TRIGGER,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testTrigger2TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[4],
    testTrigger2,
    { label: 'example-trigger2' },
    EventingContextType.TRIGGER,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testTrigger3TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[4],
    testTrigger3,
    { label: 'example-trigger3' },
    EventingContextType.TRIGGER,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testTrigger4TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[4],
    testTrigger4,
    { label: 'example-trigger4' },
    EventingContextType.TRIGGER,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testTriggerTreeItems = [
    testTrigger0TreeItem,
    testTrigger1TreeItem,
    testTrigger2TreeItem,
    testTrigger3TreeItem,
    testTrigger4TreeItem,
  ];

  // Services
  const testService0: Service = new Service(
    'aaa',
    'http://aaa-a-serverless-example.apps.devcluster.openshift.com',
    JSON.parse(JSON.stringify(multipleServiceData.items[0])),
  );
  testService0.modified = false;

  // Children of Source Tree Items
  const testBroker0ForSourceApiserver1TreeItem: EventingTreeItem = new EventingTreeItem(
    testSourceTreeItems[1],
    testBroker0,
    { label: 'Sink - example-broker0' },
    EventingContextType.BROKER,
    vscode.TreeItemCollapsibleState.None,
  );
  // const testBroker0ForSourcePing1TreeItem: EventingTreeItem = new EventingTreeItem(
  //   testSourceTreeItems[5],
  //   testBroker0,
  //   { label: 'Sink - example-broker0' },
  //   EventingContextType.BROKER,
  //   vscode.TreeItemCollapsibleState.None,
  // );
  // const testBroker0ForSourceBinding1TreeItem: EventingTreeItem = new EventingTreeItem(
  //   testSourceTreeItems[9],
  //   testBroker0,
  //   { label: 'Sink - example-broker0' },
  //   EventingContextType.BROKER,
  //   vscode.TreeItemCollapsibleState.None,
  // );
  // const testChannel0ForSourceApiserver2TreeItem: EventingTreeItem = new EventingTreeItem(
  //   testSourceTreeItems[2],
  //   testChannel0,
  //   { label: 'Sink - example-channel0' },
  //   EventingContextType.CHANNEL,
  //   vscode.TreeItemCollapsibleState.None,
  // );
  // const testChannel0ForSourcePing2TreeItem: EventingTreeItem = new EventingTreeItem(
  //   testSourceTreeItems[6],
  //   testChannel0,
  //   { label: 'Sink - example-channel0' },
  //   EventingContextType.CHANNEL,
  //   vscode.TreeItemCollapsibleState.None,
  // );
  // const testChannel0ForSourceBinding2TreeItem: EventingTreeItem = new EventingTreeItem(
  //   testSourceTreeItems[10],
  //   testChannel0,
  //   { label: 'Sink - example-channel0' },
  //   EventingContextType.CHANNEL,
  //   vscode.TreeItemCollapsibleState.None,
  // );
  // const testService0ForSourceApiserver0TreeItem: ServingTreeItem = new ServingTreeItem(
  //   testSourceTreeItems[0],
  //   testService0,
  //   { label: 'Sink - aaa' },
  //   ServingContextType.SERVICE,
  //   vscode.TreeItemCollapsibleState.None,
  // );
  const testService0ForSourcePing0TreeItem: ServingTreeItem = new ServingTreeItem(
    testSourceTreeItems[4],
    testService0,
    { label: 'Sink - aaa' },
    ServingContextType.SERVICE,
    vscode.TreeItemCollapsibleState.None,
  );
  // const testService0ForSourceGenericTreeItem: ServingTreeItem = new ServingTreeItem(
  //   testSourceTreeItems[12],
  //   testService0,
  //   { label: 'Sink - aaa' },
  //   ServingContextType.SERVICE,
  //   vscode.TreeItemCollapsibleState.None,
  // );
  const testService0ForSourceBinding0TreeItem: ServingTreeItem = new ServingTreeItem(
    testSourceTreeItems[8],
    testService0,
    { label: 'Sink - aaa' },
    ServingContextType.SERVICE,
    vscode.TreeItemCollapsibleState.None,
  );
  // const testURIForSourceApiserver3TreeItem: EventingTreeItem = new EventingTreeItem(
  //   testSourceTreeItems[3],
  //   null,
  //   { label: 'Sink - https://event.receiver.uri/' },
  //   EventingContextType.URI,
  //   vscode.TreeItemCollapsibleState.None,
  // );
  // const testURIForSourcePing3TreeItem: EventingTreeItem = new EventingTreeItem(
  //   testSourceTreeItems[7],
  //   null,
  //   { label: 'Sink - https://event.receiver.uri/' },
  //   EventingContextType.URI,
  //   vscode.TreeItemCollapsibleState.None,
  // );
  // const testURIForSourceBinding3TreeItem: EventingTreeItem = new EventingTreeItem(
  //   testSourceTreeItems[11],
  //   null,
  //   { label: 'Sink - https://event.receiver.uri/' },
  //   EventingContextType.URI,
  //   vscode.TreeItemCollapsibleState.None,
  // );

  // Children of Subscription Tree Items
  // const testBroker0ForSubscription1TreeItem: EventingTreeItem = new EventingTreeItem(
  //   testSubscriptionTreeItems[1],
  //   testBroker0,
  //   { label: 'Subscriber - example-broker0' },
  //   EventingContextType.BROKER,
  //   vscode.TreeItemCollapsibleState.None,
  // );
  // const testBroker0ForSubscription4TreeItem: EventingTreeItem = new EventingTreeItem(
  //   testSubscriptionTreeItems[4],
  //   testBroker0,
  //   { label: 'Reply - example-broker0' },
  //   EventingContextType.BROKER,
  //   vscode.TreeItemCollapsibleState.None,
  // );
  // const testBroker1ForSubscription4TreeItem: EventingTreeItem = new EventingTreeItem(
  //   testSubscriptionTreeItems[4],
  //   testBroker1,
  //   { label: 'DeadLetterSink - example-broker1' },
  //   EventingContextType.BROKER,
  //   vscode.TreeItemCollapsibleState.None,
  // );
  const testChannel0ForSubscription0TreeItem: EventingTreeItem = new EventingTreeItem(
    testSubscriptionTreeItems[0],
    testChannel0,
    { label: 'Channel - example-channel0' },
    EventingContextType.CHANNEL,
    vscode.TreeItemCollapsibleState.None,
  );
  // const testChannel0ForSubscription1TreeItem: EventingTreeItem = new EventingTreeItem(
  //   testSubscriptionTreeItems[1],
  //   testChannel0,
  //   { label: 'Channel - example-channel0' },
  //   EventingContextType.CHANNEL,
  //   vscode.TreeItemCollapsibleState.None,
  // );
  // const testChannel0ForSubscription2TreeItem: EventingTreeItem = new EventingTreeItem(
  //   testSubscriptionTreeItems[2],
  //   testChannel0,
  //   { label: 'Subscriber - example-channel0' },
  //   EventingContextType.CHANNEL,
  //   vscode.TreeItemCollapsibleState.None,
  // );
  // const testChannel1ForSubscription2TreeItem: EventingTreeItem = new EventingTreeItem(
  //   testSubscriptionTreeItems[2],
  //   testChannel1,
  //   { label: 'Channel - example-channel1' },
  //   EventingContextType.CHANNEL,
  //   vscode.TreeItemCollapsibleState.None,
  // );
  // const testChannel2ForSubscription3TreeItem: EventingTreeItem = new EventingTreeItem(
  //   testSubscriptionTreeItems[3],
  //   testChannel2,
  //   { label: 'Channel - example-channel2' },
  //   EventingContextType.CHANNEL,
  //   vscode.TreeItemCollapsibleState.None,
  // );
  // const testChannel3ForSubscription4TreeItem: EventingTreeItem = new EventingTreeItem(
  //   testSubscriptionTreeItems[4],
  //   testChannel3,
  //   { label: 'Channel - example-channel3' },
  //   EventingContextType.CHANNEL,
  //   vscode.TreeItemCollapsibleState.None,
  // );
  const testService0ForSubscription0TreeItem: ServingTreeItem = new ServingTreeItem(
    testSubscriptionTreeItems[0],
    testService0,
    { label: 'Subscriber - aaa' },
    ServingContextType.SERVICE,
    vscode.TreeItemCollapsibleState.None,
  );
  // const testService0ForSubscription4TreeItem: ServingTreeItem = new ServingTreeItem(
  //   testSubscriptionTreeItems[4],
  //   testService0,
  //   { label: 'Subscriber - aaa' },
  //   ServingContextType.SERVICE,
  //   vscode.TreeItemCollapsibleState.None,
  // );
  // const testURIForSubscription3TreeItem: EventingTreeItem = new EventingTreeItem(
  //   testSubscriptionTreeItems[3],
  //   null,
  //   { label: 'Subscriber - https://event.receiver.uri/' },
  //   EventingContextType.URI,
  //   vscode.TreeItemCollapsibleState.None,
  // );

  // Children of Trigger Tree Items
  const testBroker0ForTrigger0TreeItem: EventingTreeItem = new EventingTreeItem(
    testTriggerTreeItems[0],
    testBroker0,
    { label: 'Broker - example-broker0' },
    EventingContextType.BROKER,
    vscode.TreeItemCollapsibleState.None,
  );
  // const testBroker0ForTrigger1TreeItem: EventingTreeItem = new EventingTreeItem(
  //   testTriggerTreeItems[1],
  //   testBroker0,
  //   { label: 'Broker - example-broker0' },
  //   EventingContextType.BROKER,
  //   vscode.TreeItemCollapsibleState.None,
  // );
  // const testBroker1ForTrigger2TreeItem: EventingTreeItem = new EventingTreeItem(
  //   testTriggerTreeItems[2],
  //   testBroker1,
  //   { label: 'Broker - example-broker1' },
  //   EventingContextType.BROKER,
  //   vscode.TreeItemCollapsibleState.None,
  // );
  // const testBroker1ForTrigger1TreeItem: EventingTreeItem = new EventingTreeItem(
  //   testTriggerTreeItems[1],
  //   testBroker1,
  //   { label: 'Sink - example-broker1' },
  //   EventingContextType.BROKER,
  //   vscode.TreeItemCollapsibleState.None,
  // );
  // const testBroker1ForTrigger4TreeItem: EventingTreeItem = new EventingTreeItem(
  //   testTriggerTreeItems[4],
  //   testBroker1,
  //   { label: 'Broker - example-broker1' },
  //   EventingContextType.BROKER,
  //   vscode.TreeItemCollapsibleState.None,
  // );
  // const testTriggerChildrenBrokerTreeItems = [
  //   testBroker0ForTrigger0TreeItem,
  //   testBroker0ForTrigger1TreeItem,
  //   testBroker1ForTrigger2TreeItem,
  //   testBroker1ForTrigger1TreeItem,
  //   testBroker1ForTrigger4TreeItem,
  // ];
  // const testChannel0ForTrigger2TreeItem: EventingTreeItem = new EventingTreeItem(
  //   testTriggerTreeItems[2],
  //   testChannel0,
  //   { label: 'Sink - example-channel0' },
  //   EventingContextType.CHANNEL,
  //   vscode.TreeItemCollapsibleState.None,
  // );
  const testService0ForTrigger0TreeItem: ServingTreeItem = new ServingTreeItem(
    testTriggerTreeItems[0],
    testService0,
    { label: 'Sink - aaa' },
    ServingContextType.SERVICE,
    vscode.TreeItemCollapsibleState.None,
  );
  // const testURIForTrigger4TreeItem: EventingTreeItem = new EventingTreeItem(
  //   testTriggerTreeItems[4],
  //   null,
  //   { label: 'Sink - https://event.receiver.uri/' },
  //   EventingContextType.URI,
  //   vscode.TreeItemCollapsibleState.None,
  // );

  beforeEach(async () => {
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
    // Get the Brokers
    sandbox.stub(brokerDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(brokerData) });
    await brokerDataProvider.getBrokers(eventingFolderNodes[0]);
    // Get the Channels
    sandbox.stub(channelDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(channelData) });
    await channelDataProvider.getChannels(eventingFolderNodes[1]);
    // Get the Services
    sandbox
      .stub(servingDataProvider.knExecutor, 'execute')
      .resolves({ error: undefined, stdout: JSON.stringify(multipleServiceData) });
    const servingTreeItems = await servingDataProvider.getServices();
    const service: Service = servingTreeItems[0].getKnativeItem() as Service;
    service.modified = false;
    ksvc.updateService(service);
    // Add the sources, that will add the above to the source objects
    knativeSources.addSources(testSources);
    // Add the subscriptions, that will add the above to the subscriptions objects
    knativeSubscriptions.addSubscriptions(testSubscriptions);
    // Add the triggers, that will add the above to the trigger objects
    knativeTriggers.addTriggers(testTriggers);
  });
  teardown(() => {
    sandbox.restore();
  });

  suite('Refresh', () => {
    // TODO: figure out how to test an event that is fired.
    test('should fire the tree data change event', () => {
      const spy = sandbox.spy(edp.onDidChangeTreeDataEmitter, 'fire');
      edp.refresh();
      sandbox.assert.calledOnce(spy);
    });
  });

  suite('Poll Refresh', () => {
    test('should fire the refresh every minute', () => {
      edp.pollRefresh();
    });
  });

  suite('Getting Eventing folders', () => {
    test('should return the folder tree element of the eventing concepts', () => {
      eventingTreeItems = eventingDataProvider.getEventingFolders();
      assert.equals(eventingTreeItems[0].getName(), 'Brokers');
    });
  });

  suite('Getting a Tree Item', () => {
    test('should return the specific tree element requested', async () => {
      const knativeItem: KnativeItem = new Broker('example', 'Brokers');
      const treeItem: EventingTreeItem = new EventingTreeItem(
        null,
        knativeItem,
        { label: 'example' },
        EventingContextType.BROKER,
        vscode.TreeItemCollapsibleState.None,
        null,
        null,
      );
      const item: vscode.TreeItem = await eventingDataProvider.getTreeItem(treeItem);
      assert.equals(item, treeItem);
    });
  });

  suite('Getting Tree Children', () => {
    test('should return the Eventing folders"', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      const result = await eventingDataProvider.getChildren();
      expect(result).to.have.lengthOf(5);
      expect(result[0].description).equals('');
      expect(result[0].label.label).equals('Brokers');
      expect(result[0].getName()).equals('Brokers');
      expect(result[0].tooltip).equals('');
    });
    test('should return a child of "No Broker Found" when there is no data returned for Brokers', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      const b = eventingDataProvider.brokerDataProvider;
      sandbox.stub(b.knExecutor, 'execute').resolves({ error: undefined, stdout: `No brokers found.` });
      const result = await eventingDataProvider.getChildren(eventingFolderNodes[0]);
      expect(result).to.have.lengthOf(1);
      expect(result[0].description).equals('');
      expect(result[0].description).equals('');
      expect(result[0].label.label).equals('No Broker Found');
      expect(result[0].getName()).equals('No Broker Found');
    });
    test('should return multiple Broker tree nodes', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox.stub(eventingDataProvider.brokerDataProvider, `getBrokers`).resolves(testBrokerTreeItems);
      const result = await eventingDataProvider.getChildren(eventingFolderNodes[0]);
      expect(result).to.have.lengthOf(2);
      expect(result[0].description).equals('');
      expect(result[0].label.label).equals('example-broker0');
      expect(result[0].getName()).equals('example-broker0');
      expect(result[0].tooltip).equals('');
    });
    test('should return multiple Channel tree nodes', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox.stub(eventingDataProvider.channelDataProvider, `getChannels`).resolves(testChannelTreeItems);
      const result = await eventingDataProvider.getChildren(eventingFolderNodes[1]);
      expect(result).to.have.lengthOf(4);
      expect(result[0].description).equals('');
      expect(result[0].label.label).equals('example-channel0');
      expect(result[0].getName()).equals('example-channel0');
      expect(result[0].tooltip).equals('');
    });
    test('should return multiple Source tree nodes', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox.stub(eventingDataProvider.sourceDataProvider, `getSources`).resolves(testSourceTreeItems);
      const result = await eventingDataProvider.getChildren(eventingFolderNodes[2]);
      expect(result).to.have.lengthOf(13);
      expect(result[0].description).equals('');
      expect(result[0].label.label).equals('example-source-apiserver0');
      expect(result[0].getName()).equals('example-source-apiserver0');
      expect(result[0].tooltip).equals('');
    });
    test('should return children of an API Server Source', async () => {
      sandbox
        .stub(eventingDataProvider.sourceDataProvider, `getSourceChildren`)
        .resolves([testBroker0ForSourceApiserver1TreeItem]);
      const result = await eventingDataProvider.getChildren(testSourceTreeItems[1]);
      expect(result).to.have.lengthOf(1);
      expect(result[0].description).equals('');
      expect(result[0].label.label).equals('Sink - example-broker0');
      expect(result[0].getName()).equals('Sink - example-broker0');
      expect(result[0].tooltip).equals('');
    });
    test('should return children of a Ping Source', async () => {
      sandbox.stub(eventingDataProvider.sourceDataProvider, `getSourceChildren`).resolves([testService0ForSourcePing0TreeItem]);
      const result = await eventingDataProvider.getChildren(testSourceTreeItems[4]);
      expect(result).to.have.lengthOf(1);
      expect(result[0].description).equals('');
      expect(result[0].label.label).equals('Sink - aaa');
      expect(result[0].getName()).equals('Sink - aaa');
      expect(result[0].tooltip).equals('Service: Sink - aaa');
    });
    test('should return children of a Binding Source', async () => {
      sandbox
        .stub(eventingDataProvider.sourceDataProvider, `getSourceChildren`)
        .resolves([testService0ForSourceBinding0TreeItem]);
      const result = await eventingDataProvider.getChildren(testSourceTreeItems[8]);
      expect(result).to.have.lengthOf(1);
      expect(result[0].description).equals('');
      expect(result[0].label.label).equals('Sink - aaa');
      expect(result[0].getName()).equals('Sink - aaa');
      expect(result[0].tooltip).equals('Service: Sink - aaa');
    });
    test('should return multiple Subscription tree nodes', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox.stub(eventingDataProvider.subscriptionDataProvider, `getSubscriptions`).resolves(testSubscriptionTreeItems);
      const result = await eventingDataProvider.getChildren(eventingFolderNodes[3]);
      expect(result).to.have.lengthOf(5);
      expect(result[0].description).equals('');
      expect(result[0].label.label).equals('example-subscription0');
      expect(result[0].getName()).equals('example-subscription0');
      expect(result[0].tooltip).equals('');
    });
    test('should return children of a Subscription', async () => {
      sandbox
        .stub(eventingDataProvider.sourceDataProvider, `getSourceChildren`)
        .resolves([testChannel0ForSubscription0TreeItem, testService0ForSubscription0TreeItem]);
      const result = await eventingDataProvider.getChildren(testSubscriptionTreeItems[0]);
      expect(result).to.have.lengthOf(2);
      expect(result[0].description).equals('');
      expect(result[0].label.label).equals('Channel - example-channel0');
      expect(result[0].getName()).equals('Channel - example-channel0');
      expect(result[0].tooltip).equals('');
    });
    test('should return multiple Trigger tree nodes', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox.stub(eventingDataProvider.triggerDataProvider, `getTriggers`).resolves(testTriggerTreeItems);
      const result = await eventingDataProvider.getChildren(eventingFolderNodes[4]);
      expect(result).to.have.lengthOf(5);
      expect(result[0].description).equals('');
      expect(result[0].label.label).equals('example-trigger0');
      expect(result[0].getName()).equals('example-trigger0');
      expect(result[0].tooltip).equals('');
    });
    test('should return children of a Trigger', async () => {
      sandbox
        .stub(eventingDataProvider.sourceDataProvider, `getSourceChildren`)
        .resolves([testBroker0ForTrigger0TreeItem, testService0ForTrigger0TreeItem]);
      const result = await eventingDataProvider.getChildren(testTriggerTreeItems[0]);
      expect(result).to.have.lengthOf(2);
      expect(result[0].description).equals('');
      expect(result[0].label.label).equals('Broker - example-broker0');
      expect(result[0].getName()).equals('Broker - example-broker0');
      expect(result[0].tooltip).equals('');
    });
    // test('should throw an error when the promise is rejected trying to get eventing children', async () => {
    //   sandbox.restore();
    //   sandbox.stub(eventingDataProvider.triggerDataProvider, `getTriggers`).rejects('Forced rejection of the Promise for a test');
    //   const stubShowError = sandbox.stub(vscode.window, 'showErrorMessage').resolves();
    //   const result = await eventingDataProvider.getChildren(eventingFolderNodes[4]);
    //   sinon.assert.calledOnce(stubShowError);
    //   const showErrorArgs = stubShowError.firstCall.args;
    //   chai.expect(showErrorArgs.length).to.eq(1);
    //   chai
    //     .expect(showErrorArgs[0])
    //     .to.include('Caught an error getting the Eventing data.\n Forced rejection of the Promise for a test');
    //   assert.equals(result, null);
    // });
  });

  suite('Getting a Parent Item', () => {
    test('should return null for a top level folder', () => {
      const item: EventingTreeItem | ServingTreeItem = eventingDataProvider.getParent(eventingFolderNodes[0]);
      assert.equals(item, null);
    });
    test('should return the Broker folder for a Broker instance', async () => {
      // set parent folders
      // set children
      sandbox.stub(eventingDataProvider.brokerDataProvider, `getBrokers`).resolves(testBrokerTreeItems);
      const result = await eventingDataProvider.getChildren(eventingTreeItems[0]);
      const item: EventingTreeItem | ServingTreeItem = eventingDataProvider.getParent(result[0]);
      assert.equals(item.getName(), 'Brokers');
    });
  });
});
