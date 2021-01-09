import * as vscode from 'vscode';
import * as chai from 'chai';
import { beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as referee from '@sinonjs/referee';
import * as brokerData from './broker.json';
import * as channelData from './channel.json';
import * as sourceData from './source.json';
import * as subscriptionData from './subscription.json';
import * as triggerData from './trigger.json';
import { EventingContextType } from '../../src/cli/config';
import { Broker } from '../../src/knative/broker';
import { KnativeItem } from '../../src/knative/knativeItem';
import { EventingTreeItem } from '../../src/eventingTree/eventingTreeItem';
import { EventingDataProvider } from '../../src/eventingTree/eventingDataProvider';
import { Channel } from '../../src/knative/channel';
import { GenericSource } from '../../src/knative/genericSource';
import { Subscription } from '../../src/knative/subscription';
import { Trigger } from '../../src/knative/trigger';
import { ServingTreeItem } from '../../src/servingTree/servingTreeItem';

import rewire = require('rewire');
const rewiredEventingDataProvider = rewire('../../src/eventingTree/eventingDataProvider');

const { assert } = referee;
const { expect } = chai;
chai.use(sinonChai);

suite('EventingDataProvider', () => {
  const sandbox = sinon.createSandbox();
  const edp = new rewiredEventingDataProvider.EventingDataProvider();
  const eventingDataProvider: EventingDataProvider = new EventingDataProvider();
  // const brokerDataProvider = new BrokerDataProvider();
  // const channelDataProvider = new ChannelDataProvider();
  // const sourceDataProvider = new SourceDataProvider();
  // const subscriptionDataProvider = new SubscriptionDataProvider();
  // const triggerDataProvider = new TriggerDataProvider();

  let eventingTreeItems: EventingTreeItem[];

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

  const testBroker0: Broker = new Broker('example-broker0', 'Brokers', JSON.parse(JSON.stringify(brokerData.items[0])));
  testBroker0.modified = false;
  const testBroker0TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[0],
    testBroker0,
    { label: 'example-broker0' },
    EventingContextType.BROKER,
    vscode.TreeItemCollapsibleState.Expanded,
    null,
    null,
  );
  const testBroker1: Broker = new Broker('example-broker1', 'Brokers', JSON.parse(JSON.stringify(brokerData.items[1])));
  testBroker1.modified = false;
  const testBroker1TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[0],
    testBroker1,
    { label: 'example-broker1' },
    EventingContextType.BROKER,
    vscode.TreeItemCollapsibleState.Expanded,
    null,
    null,
  );
  const testBrokerTreeItems = [testBroker0TreeItem, testBroker1TreeItem];

  const testChannel0: Channel = new Channel(
    'example-channel0',
    'Channels',
    'InMemoryChannel',
    JSON.parse(JSON.stringify(channelData.items[0])),
  );
  testChannel0.modified = false;
  const testChannel0TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[1],
    testChannel0,
    { label: 'example-channel0' },
    EventingContextType.CHANNEL,
    vscode.TreeItemCollapsibleState.Expanded,
    null,
    null,
  );
  const testChannel1: Channel = new Channel(
    'example-channel1',
    'Channels',
    'InMemoryChannel',
    JSON.parse(JSON.stringify(channelData.items[1])),
  );
  testChannel1.modified = false;
  const testChannel1TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[1],
    testChannel1,
    { label: 'example-channel1' },
    EventingContextType.CHANNEL,
    vscode.TreeItemCollapsibleState.Expanded,
    null,
    null,
  );
  const testChannelTreeItems = [testChannel0TreeItem, testChannel1TreeItem];

  const testSource0: GenericSource = new GenericSource(
    'example-source0',
    'Sources',
    null,
    null,
    JSON.parse(JSON.stringify(sourceData.items[0])),
  );
  testSource0.modified = false;
  const testSource0TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSource0,
    { label: 'example-source0' },
    EventingContextType.SOURCE,
    vscode.TreeItemCollapsibleState.Expanded,
    null,
    null,
  );
  const testSource1: GenericSource = new GenericSource(
    'example-source1',
    'Sources',
    null,
    null,
    JSON.parse(JSON.stringify(sourceData.items[1])),
  );
  testSource1.modified = false;
  const testSource1TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSource1,
    { label: 'example-source1' },
    EventingContextType.SOURCE,
    vscode.TreeItemCollapsibleState.Expanded,
    null,
    null,
  );
  const testSourceTreeItems = [testSource0TreeItem, testSource1TreeItem];

  const testSubscription0: Subscription = new Subscription(
    'example-subscription0',
    'Subscriptions',
    'example-channel0',
    'aaa',
    null,
    null,
    JSON.parse(JSON.stringify(subscriptionData.items[0])),
  );
  testSubscription0.modified = false;
  const testSubscription0TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[3],
    testSubscription0,
    { label: 'example-subscription0' },
    EventingContextType.SUBSCRIPTION,
    vscode.TreeItemCollapsibleState.Expanded,
    null,
    null,
  );
  const testSubscription1: Subscription = new Subscription(
    'example-subscription1',
    'Subscriptions',
    'example-channel1',
    'aaa',
    'example-broker1',
    'example-broker0',
    JSON.parse(JSON.stringify(subscriptionData.items[1])),
  );
  testSubscription1.modified = false;
  const testSubscription1TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[3],
    testSubscription1,
    { label: 'example-subscription1' },
    EventingContextType.SUBSCRIPTION,
    vscode.TreeItemCollapsibleState.Expanded,
    null,
    null,
  );
  const testSubscriptionTreeItems = [testSubscription0TreeItem, testSubscription1TreeItem];

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
  testTrigger0.modified = false;
  const testTrigger0TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[4],
    testTrigger0,
    { label: 'example-trigger0' },
    EventingContextType.TRIGGER,
    vscode.TreeItemCollapsibleState.Expanded,
    null,
    null,
  );
  testTrigger1.modified = false;
  const testTrigger1TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[4],
    testTrigger1,
    { label: 'example-trigger1' },
    EventingContextType.TRIGGER,
    vscode.TreeItemCollapsibleState.Expanded,
    null,
    null,
  );
  const testTriggerTreeItems = [testTrigger0TreeItem, testTrigger1TreeItem];

  beforeEach(() => {
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
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
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    // const sleep = (ms: number) => {
    //   return new Promise((resolve) => setTimeout(resolve, ms));
    // };
    test('should fire the refresh every minute', () => {
      // const spy = sandbox.spy(sdp.onDidChangeTreeDataEmitter, 'fire');
      edp.pollRefresh();
      // eslint-disable-next-line no-console
      // console.log(`EventingDataProvidertest.Poll Refresh before timeout ${Math.round(new Date().getTime() / 1000)}`);
      // give the poll enough time to call
      // eslint-disable-next-line @typescript-eslint/await-thenable

      // await sleep(60001);
      // eslint-disable-next-line no-console
      // console.log(`EventingDataProvidertest.Poll Refresh after timeout ${Math.round(new Date().getTime() / 1000)}`);

      // turn it off so that it doesn't keep polling
      // edp.stopPollRefresh();
      // sandbox.assert.calledOnce(spy);
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
      expect(result).to.have.lengthOf(2);
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
      expect(result).to.have.lengthOf(2);
      expect(result[0].description).equals('');
      expect(result[0].label.label).equals('example-source0');
      expect(result[0].getName()).equals('example-source0');
      expect(result[0].tooltip).equals('');
    });
    test('should return multiple Subscription tree nodes', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox.stub(eventingDataProvider.subscriptionDataProvider, `getSubscriptions`).resolves(testSubscriptionTreeItems);
      const result = await eventingDataProvider.getChildren(eventingFolderNodes[3]);
      expect(result).to.have.lengthOf(2);
      expect(result[0].description).equals('');
      expect(result[0].label.label).equals('example-subscription0');
      expect(result[0].getName()).equals('example-subscription0');
      expect(result[0].tooltip).equals('');
    });
    test('should return multiple Trigger tree nodes', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox.stub(eventingDataProvider.triggerDataProvider, `getTriggers`).resolves(testTriggerTreeItems);
      const result = await eventingDataProvider.getChildren(eventingFolderNodes[4]);
      expect(result).to.have.lengthOf(2);
      expect(result[0].description).equals('');
      expect(result[0].label.label).equals('example-trigger0');
      expect(result[0].getName()).equals('example-trigger0');
      expect(result[0].tooltip).equals('');
    });
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
