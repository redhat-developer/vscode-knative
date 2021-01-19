import * as vscode from 'vscode';
import * as chai from 'chai';
import { beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as referee from '@sinonjs/referee';
import * as brokerData from './broker.json';
import * as channelData from './channel.json';
import * as multipleServiceData from '../servingTree/multipleServiceServicesList.json';
import * as subscriptionData from './subscription.json';
import * as subscriptionIncompleteData from './subscriptionIncomplete.json';
import { EventingContextType, ServingContextType } from '../../src/cli/config';
import { BrokerDataProvider } from '../../src/eventingTree/brokerDataProvider';
import { ChannelDataProvider } from '../../src/eventingTree/channelDataProvider';
import { EventingDataProvider } from '../../src/eventingTree/eventingDataProvider';
import { EventingTreeItem } from '../../src/eventingTree/eventingTreeItem';
import { SubscriptionDataProvider } from '../../src/eventingTree/subscriptionDataProvider';
import { Broker } from '../../src/knative/broker';
import { Channel } from '../../src/knative/channel';
import { KnativeServices } from '../../src/knative/knativeServices';
import { KnativeSubscriptions } from '../../src/knative/knativeSubscriptions';
import { Service } from '../../src/knative/service';
import { Subscription } from '../../src/knative/subscription';
import { ServingDataProvider } from '../../src/servingTree/servingDataProvider';
import { ServingTreeItem } from '../../src/servingTree/servingTreeItem';

const { assert } = referee;
const { expect } = chai;
chai.use(sinonChai);

suite('SubscriptionDataProvider', () => {
  const sandbox = sinon.createSandbox();
  const eventingDataProvider: EventingDataProvider = new EventingDataProvider();
  const eventingFolderNodes: EventingTreeItem[] = eventingDataProvider.getEventingFolders();
  const brokerDataProvider: BrokerDataProvider = new BrokerDataProvider();
  const channelDataProvider: ChannelDataProvider = new ChannelDataProvider();
  const servingDataProvider: ServingDataProvider = new ServingDataProvider();
  const ksvc: KnativeServices = KnativeServices.Instance;
  const knativeSubscriptions: KnativeSubscriptions = KnativeSubscriptions.Instance;
  const subscriptionDataProvider: SubscriptionDataProvider = new SubscriptionDataProvider();

  const testSubscriptionMissing: Subscription = new Subscription(
    'example-subscription-missing',
    'Subscriptions',
    undefined,
    undefined,
    undefined,
    undefined,
    JSON.parse(JSON.stringify(subscriptionData.items[7])),
  );
  const testSubscriptionMissingTreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[3],
    testSubscriptionMissing,
    { label: 'example-subscription-missing' },
    EventingContextType.SUBSCRIPTION,
    vscode.TreeItemCollapsibleState.Expanded,
  );

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
    undefined,
    undefined,
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

  const testService0: Service = new Service(
    'aaa',
    'http://aaa-a-serverless-example.apps.devcluster.openshift.com',
    JSON.parse(JSON.stringify(multipleServiceData.items[0])),
  );
  testService0.modified = false;
  const testService0ForSubscription0TreeItem: ServingTreeItem = new ServingTreeItem(
    testSubscriptionTreeItems[0],
    testService0,
    { label: 'Subscriber - aaa' },
    ServingContextType.SERVICE,
    vscode.TreeItemCollapsibleState.None,
  );
  const testService0ForSubscription4TreeItem: ServingTreeItem = new ServingTreeItem(
    testSubscriptionTreeItems[4],
    testService0,
    { label: 'Subscriber - aaa' },
    ServingContextType.SERVICE,
    vscode.TreeItemCollapsibleState.None,
  );

  const testBroker0: Broker = new Broker('example-broker0', 'Brokers', JSON.parse(JSON.stringify(brokerData.items[0])));
  const testBroker1: Broker = new Broker('example-broker1', 'Brokers', JSON.parse(JSON.stringify(brokerData.items[1])));
  const testBroker0ForSubscription1TreeItem: EventingTreeItem = new EventingTreeItem(
    testSubscriptionTreeItems[1],
    testBroker0,
    { label: 'Subscriber - example-broker0' },
    EventingContextType.BROKER,
    vscode.TreeItemCollapsibleState.None,
  );
  const testBroker0ForSubscription4TreeItem: EventingTreeItem = new EventingTreeItem(
    testSubscriptionTreeItems[4],
    testBroker0,
    { label: 'Reply - example-broker0' },
    EventingContextType.BROKER,
    vscode.TreeItemCollapsibleState.None,
  );
  const testBroker1ForSubscription4TreeItem: EventingTreeItem = new EventingTreeItem(
    testSubscriptionTreeItems[4],
    testBroker1,
    { label: 'DeadLetterSink - example-broker1' },
    EventingContextType.BROKER,
    vscode.TreeItemCollapsibleState.None,
  );

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
  const testChannel0ForSubscription0TreeItem: EventingTreeItem = new EventingTreeItem(
    testSubscriptionTreeItems[0],
    testChannel0,
    { label: 'Channel - example-channel0' },
    EventingContextType.CHANNEL,
    vscode.TreeItemCollapsibleState.None,
  );
  const testChannel0ForSubscription1TreeItem: EventingTreeItem = new EventingTreeItem(
    testSubscriptionTreeItems[1],
    testChannel0,
    { label: 'Channel - example-channel0' },
    EventingContextType.CHANNEL,
    vscode.TreeItemCollapsibleState.None,
  );
  const testChannel0ForSubscription2TreeItem: EventingTreeItem = new EventingTreeItem(
    testSubscriptionTreeItems[2],
    testChannel0,
    { label: 'Subscriber - example-channel0' },
    EventingContextType.CHANNEL,
    vscode.TreeItemCollapsibleState.None,
  );
  const testChannel1ForSubscription2TreeItem: EventingTreeItem = new EventingTreeItem(
    testSubscriptionTreeItems[2],
    testChannel1,
    { label: 'Channel - example-channel1' },
    EventingContextType.CHANNEL,
    vscode.TreeItemCollapsibleState.None,
  );
  const testChannel2ForSubscription3TreeItem: EventingTreeItem = new EventingTreeItem(
    testSubscriptionTreeItems[3],
    testChannel2,
    { label: 'Channel - example-channel2' },
    EventingContextType.CHANNEL,
    vscode.TreeItemCollapsibleState.None,
  );
  const testChannel3ForSubscription4TreeItem: EventingTreeItem = new EventingTreeItem(
    testSubscriptionTreeItems[4],
    testChannel3,
    { label: 'Channel - example-channel3' },
    EventingContextType.CHANNEL,
    vscode.TreeItemCollapsibleState.None,
  );

  const testURIForSubscription3TreeItem: EventingTreeItem = new EventingTreeItem(
    testSubscriptionTreeItems[3],
    null,
    { label: 'Subscriber - https://event.receiver.uri/' },
    EventingContextType.URI,
    vscode.TreeItemCollapsibleState.None,
  );

  beforeEach(async () => {
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
    sandbox.stub(brokerDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(brokerData) });
    await brokerDataProvider.getBrokers(eventingFolderNodes[0]);
    sandbox.stub(channelDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(channelData) });
    await channelDataProvider.getChannels(eventingFolderNodes[1]);
    sandbox
      .stub(servingDataProvider.knExecutor, 'execute')
      .resolves({ error: undefined, stdout: JSON.stringify(multipleServiceData) });
    const servingTreeItems = await servingDataProvider.getServices();
    const service: Service = servingTreeItems[0].getKnativeItem() as Service;
    service.modified = false;
    ksvc.updateService(service);
    knativeSubscriptions.addSubscriptions(testSubscriptions);
  });
  teardown(() => {
    sandbox.restore();
  });

  suite('Get Subscriptions', () => {
    test('should return a node of "No Subscription Found" when there is no data returned for Subscriptions', async () => {
      sandbox
        .stub(subscriptionDataProvider.knExecutor, 'execute')
        .resolves({ error: undefined, stdout: `No subscriptions found.` });
      const result = await subscriptionDataProvider.getSubscriptions(eventingFolderNodes[3]);
      expect(result).to.have.lengthOf(1);
      expect(result[0].description).equals('');
      expect(result[0].description).equals('');
      expect(result[0].label.label).equals('No Subscription Found');
      expect(result[0].getName()).equals('No Subscription Found');
    });
    test('should return subscription nodes', async () => {
      sandbox
        .stub(subscriptionDataProvider.knExecutor, 'execute')
        .resolves({ error: undefined, stdout: JSON.stringify(subscriptionData) });
      const result = await subscriptionDataProvider.getSubscriptions(eventingFolderNodes[3]);
      assert.equals(result[5], testSubscriptionTreeItems[0]);
      expect(result).to.have.lengthOf(10);
      expect(result[5].label.label).equals('example-subscription0');
    });
    test('should refetch subscription info when it is incomplete, then return subscription nodes', async () => {
      const exeStub = sandbox.stub(subscriptionDataProvider.knExecutor, 'execute');
      exeStub.onFirstCall().resolves({ error: undefined, stdout: JSON.stringify(subscriptionIncompleteData) });
      exeStub.onSecondCall().resolves({ error: undefined, stdout: JSON.stringify(subscriptionData) });
      const result = await subscriptionDataProvider.getSubscriptions(eventingFolderNodes[3]);
      assert.equals(result[5], testSubscriptionTreeItems[0]);
      expect(result).to.have.lengthOf(10);
      expect(result[5].label.label).equals('example-subscription0');
    });
  });
  suite('Get subscription Children', () => {
    test('should return a node of "Child Not Found" when there is no data returned for the Children', async () => {
      sandbox
        .stub(subscriptionDataProvider.knExecutor, 'execute')
        .resolves({ error: undefined, stdout: JSON.stringify(subscriptionData) });
      await subscriptionDataProvider.getSubscriptions(eventingFolderNodes[3]);
      const result = subscriptionDataProvider.getSubscriptionChildren(testSubscriptionMissingTreeItem);
      expect(result).to.have.lengthOf(2);
      expect(result[0].description).equals('');
      expect(result[0].label.label).equals('Channel Not Found');
      expect(result[0].getName()).equals('Channel Not Found');
      expect(result[1].label.label).equals('Subscriber Not Found');
      expect(result[1].getName()).equals('Subscriber Not Found');
    });
    test('should return service child nodes', async () => {
      sandbox
        .stub(subscriptionDataProvider.knExecutor, 'execute')
        .resolves({ error: undefined, stdout: JSON.stringify(subscriptionData) });
      await subscriptionDataProvider.getSubscriptions(eventingFolderNodes[3]);
      const result = subscriptionDataProvider.getSubscriptionChildren(testSubscriptionTreeItems[0]);
      assert.equals(result[0], testChannel0ForSubscription0TreeItem);
      assert.equals(result[1], testService0ForSubscription0TreeItem);
      expect(result).to.have.lengthOf(2);
      expect(result[0].label.label).equals('Channel - example-channel0');
      expect(result[1].label.label).equals('Subscriber - aaa');
    });
    test('should return broker child nodes', async () => {
      sandbox
        .stub(subscriptionDataProvider.knExecutor, 'execute')
        .resolves({ error: undefined, stdout: JSON.stringify(subscriptionData) });
      await subscriptionDataProvider.getSubscriptions(eventingFolderNodes[3]);
      const result = subscriptionDataProvider.getSubscriptionChildren(testSubscriptionTreeItems[1]);
      assert.equals(result[0], testChannel0ForSubscription1TreeItem);
      assert.equals(result[1], testBroker0ForSubscription1TreeItem);
      expect(result).to.have.lengthOf(2);
      expect(result[0].label.label).equals('Channel - example-channel0');
      expect(result[1].label.label).equals('Subscriber - example-broker0');
    });
    test('should return channel child nodes', async () => {
      sandbox
        .stub(subscriptionDataProvider.knExecutor, 'execute')
        .resolves({ error: undefined, stdout: JSON.stringify(subscriptionData) });
      await subscriptionDataProvider.getSubscriptions(eventingFolderNodes[3]);
      const result = subscriptionDataProvider.getSubscriptionChildren(testSubscriptionTreeItems[2]);
      assert.equals(result[0], testChannel1ForSubscription2TreeItem);
      assert.equals(result[1], testChannel0ForSubscription2TreeItem);
      expect(result).to.have.lengthOf(2);
      expect(result[0].label.label).equals('Channel - example-channel1');
      expect(result[1].label.label).equals('Subscriber - example-channel0');
    });
    test('should return URI child nodes', async () => {
      sandbox
        .stub(subscriptionDataProvider.knExecutor, 'execute')
        .resolves({ error: undefined, stdout: JSON.stringify(subscriptionData) });
      await subscriptionDataProvider.getSubscriptions(eventingFolderNodes[3]);
      const result = subscriptionDataProvider.getSubscriptionChildren(testSubscriptionTreeItems[3]);
      assert.equals(result[0], testChannel2ForSubscription3TreeItem);
      assert.equals(result[1], testURIForSubscription3TreeItem);
      expect(result).to.have.lengthOf(2);
      expect(result[0].label.label).equals('Channel - example-channel2');
      expect(result[1].label.label).equals('Subscriber - https://event.receiver.uri/');
    });
    test('should return subscriber, reply, and dead letter reply child nodes', async () => {
      sandbox
        .stub(subscriptionDataProvider.knExecutor, 'execute')
        .resolves({ error: undefined, stdout: JSON.stringify(subscriptionData) });
      await subscriptionDataProvider.getSubscriptions(eventingFolderNodes[3]);
      const result = subscriptionDataProvider.getSubscriptionChildren(testSubscriptionTreeItems[4]);
      assert.equals(result[0], testChannel3ForSubscription4TreeItem);
      assert.equals(result[1], testService0ForSubscription4TreeItem);
      assert.equals(result[2], testBroker0ForSubscription4TreeItem);
      assert.equals(result[3], testBroker1ForSubscription4TreeItem);
      expect(result).to.have.lengthOf(4);
      expect(result[0].label.label).equals('Channel - example-channel3');
      expect(result[1].label.label).equals('Subscriber - aaa');
      expect(result[2].label.label).equals('Reply - example-broker0');
      expect(result[3].label.label).equals('DeadLetterSink - example-broker1');
    });
  });
});
