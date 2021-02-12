import * as vscode from 'vscode';
import * as chai from 'chai';
import { beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as referee from '@sinonjs/referee';
import * as brokerData from './broker.json';
import * as channelData from './channel.json';
import * as multipleServiceData from '../servingTree/multipleServiceServicesList.json';
import * as triggerData from './trigger.json';
import * as triggerIncompleteData from './triggerIncomplete.json';
import { EventingContextType, ServingContextType } from '../../src/cli/config';
import { BrokerDataProvider } from '../../src/eventingTree/brokerDataProvider';
import { ChannelDataProvider } from '../../src/eventingTree/channelDataProvider';
import { EventingTreeItem } from '../../src/eventingTree/eventingTreeItem';
import { EventingDataProvider } from '../../src/eventingTree/eventingDataProvider';
import { TriggerDataProvider } from '../../src/eventingTree/triggerDataProvider';
import { Broker } from '../../src/knative/broker';
import { Channel } from '../../src/knative/channel';
import { KnativeServices } from '../../src/knative/knativeServices';
import { KnativeTriggers } from '../../src/knative/knativeTriggers';
import { Service } from '../../src/knative/service';
import { Trigger } from '../../src/knative/trigger';
import { ServingDataProvider } from '../../src/servingTree/servingDataProvider';
import { ServingTreeItem } from '../../src/servingTree/servingTreeItem';

const { assert } = referee;
const { expect } = chai;
chai.use(sinonChai);

suite('TriggerDataProvider', () => {
  const sandbox = sinon.createSandbox();
  const eventingDataProvider: EventingDataProvider = new EventingDataProvider();
  const eventingFolderNodes: EventingTreeItem[] = eventingDataProvider.getEventingFolders();
  const brokerDataProvider: BrokerDataProvider = new BrokerDataProvider();
  const channelDataProvider: ChannelDataProvider = new ChannelDataProvider();
  const servingDataProvider: ServingDataProvider = new ServingDataProvider();
  const ksvc: KnativeServices = KnativeServices.Instance;
  const knativeTriggers: KnativeTriggers = KnativeTriggers.Instance;
  const triggerDataProvider: TriggerDataProvider = new TriggerDataProvider();

  const filters = new Map();
  filters.set('name', 'dev.knative.bar');
  filters.set('type', 'dev.knative.foo');

  const testTriggerMissing: Trigger = new Trigger(
    'example-trigger-missing',
    'Triggers',
    'example-broker-missing',
    filters,
    'example-broker-missing',
    JSON.parse(JSON.stringify(triggerData.items[4])),
  );
  const testTriggerMissingTreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[4],
    testTriggerMissing,
    { label: 'example-trigger-missing' },
    EventingContextType.TRIGGER,
    vscode.TreeItemCollapsibleState.Expanded,
  );

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

  const testService0: Service = new Service(
    'aaa',
    'http://aaa-a-serverless-example.apps.devcluster.openshift.com',
    JSON.parse(JSON.stringify(multipleServiceData.items[0])),
  );
  testService0.modified = false;
  const testService0ForTrigger0TreeItem: ServingTreeItem = new ServingTreeItem(
    testTriggerTreeItems[0],
    testService0,
    { label: 'Sink - aaa' },
    ServingContextType.SERVICE,
    vscode.TreeItemCollapsibleState.None,
  );

  const testBroker0: Broker = new Broker('example-broker0', 'Brokers', JSON.parse(JSON.stringify(brokerData.items[0])));
  const testBroker1: Broker = new Broker('example-broker1', 'Brokers', JSON.parse(JSON.stringify(brokerData.items[1])));
  const testBroker0ForTrigger0TreeItem: EventingTreeItem = new EventingTreeItem(
    testTriggerTreeItems[0],
    testBroker0,
    { label: 'Broker - example-broker0' },
    EventingContextType.BROKER,
    vscode.TreeItemCollapsibleState.None,
  );
  const testBroker0ForTrigger1TreeItem: EventingTreeItem = new EventingTreeItem(
    testTriggerTreeItems[1],
    testBroker0,
    { label: 'Broker - example-broker0' },
    EventingContextType.BROKER,
    vscode.TreeItemCollapsibleState.None,
  );
  const testBroker1ForTrigger2TreeItem: EventingTreeItem = new EventingTreeItem(
    testTriggerTreeItems[2],
    testBroker1,
    { label: 'Broker - example-broker1' },
    EventingContextType.BROKER,
    vscode.TreeItemCollapsibleState.None,
  );
  const testBroker1ForTrigger1TreeItem: EventingTreeItem = new EventingTreeItem(
    testTriggerTreeItems[1],
    testBroker1,
    { label: 'Sink - example-broker1' },
    EventingContextType.BROKER,
    vscode.TreeItemCollapsibleState.None,
  );
  const testBroker1ForTrigger4TreeItem: EventingTreeItem = new EventingTreeItem(
    testTriggerTreeItems[4],
    testBroker1,
    { label: 'Broker - example-broker1' },
    EventingContextType.BROKER,
    vscode.TreeItemCollapsibleState.None,
  );
  const testBrokerTreeItems = [
    testBroker0ForTrigger0TreeItem,
    testBroker0ForTrigger1TreeItem,
    testBroker1ForTrigger2TreeItem,
    testBroker1ForTrigger1TreeItem,
    testBroker1ForTrigger4TreeItem,
  ];

  const testChannel0: Channel = new Channel(
    'example-channel0',
    'Channels',
    'InMemoryChannel',
    JSON.parse(JSON.stringify(channelData.items[0])),
  );
  const testChannel0ForTrigger2TreeItem: EventingTreeItem = new EventingTreeItem(
    testTriggerTreeItems[2],
    testChannel0,
    { label: 'Sink - example-channel0' },
    EventingContextType.CHANNEL,
    vscode.TreeItemCollapsibleState.None,
  );

  const testURIForTrigger4TreeItem: EventingTreeItem = new EventingTreeItem(
    testTriggerTreeItems[4],
    null,
    { label: 'Sink - https://event.receiver.uri/' },
    EventingContextType.URI,
    vscode.TreeItemCollapsibleState.None,
  );

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
    // Add the triggers, that will add the above to the trigger objects
    knativeTriggers.addTriggers(testTriggers);
  });
  teardown(() => {
    sandbox.restore();
  });

  suite('Get Triggers', () => {
    test('should return a node of "No Trigger Found" when there is no data returned for Triggers', async () => {
      sandbox.stub(triggerDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: `No triggers found.` });
      const result = await triggerDataProvider.getTriggers(eventingFolderNodes[4]);
      expect(result).to.have.lengthOf(1);
      expect(result[0].description).equals('');
      expect(result[0].label.label).equals('No Trigger Found');
      expect(result[0].getName()).equals('No Trigger Found');
    });
    test('should return trigger nodes', async () => {
      sandbox.stub(triggerDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(triggerData) });
      const result = await triggerDataProvider.getTriggers(eventingFolderNodes[4]);
      assert.equals(result[0], testTriggerTreeItems[0]);
      expect(result).to.have.lengthOf(5);
      expect(result[0].label.label).equals('example-trigger0');
    });
    test('should refetch trigger info when it is incomplete, then return trigger nodes', async () => {
      const exeStub = sandbox.stub(triggerDataProvider.knExecutor, 'execute');
      exeStub.onFirstCall().resolves({ error: undefined, stdout: JSON.stringify(triggerIncompleteData) });
      exeStub.onSecondCall().resolves({ error: undefined, stdout: JSON.stringify(triggerData) });
      const result = await triggerDataProvider.getTriggers(eventingFolderNodes[4]);
      assert.equals(result[0], testTriggerTreeItems[0]);
      expect(result).to.have.lengthOf(5);
      expect(result[0].label.label).equals('example-trigger0');
    });
  });
  suite('Get Trigger Children', () => {
    test('should return a node of "Child Not Found" when there is no data returned for the Children', async () => {
      sandbox.stub(triggerDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(triggerData) });
      await triggerDataProvider.getTriggers(eventingFolderNodes[4]);
      const result = triggerDataProvider.getTriggerChildren(testTriggerMissingTreeItem);
      expect(result).to.have.lengthOf(2);
      expect(result[0].description).equals('');
      expect(result[0].label.label).equals('Broker Not Found');
      expect(result[0].getName()).equals('Broker Not Found');
      expect(result[1].label.label).equals('Sink Not Found');
      expect(result[1].getName()).equals('Sink Not Found');
    });
    test('should return service child nodes', async () => {
      sandbox.stub(triggerDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(triggerData) });
      await triggerDataProvider.getTriggers(eventingFolderNodes[4]);
      const result = triggerDataProvider.getTriggerChildren(testTriggerTreeItems[0]);
      assert.equals(result[0], testBrokerTreeItems[0]);
      assert.equals(result[1], testService0ForTrigger0TreeItem);
      expect(result).to.have.lengthOf(2);
      expect(result[0].label.label).equals('Broker - example-broker0');
      expect(result[1].label.label).equals('Sink - aaa');
    });
    test('should return broker child nodes', async () => {
      sandbox.stub(triggerDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(triggerData) });
      await triggerDataProvider.getTriggers(eventingFolderNodes[4]);
      const result = triggerDataProvider.getTriggerChildren(testTriggerTreeItems[1]);
      assert.equals(result[0], testBrokerTreeItems[1]);
      assert.equals(result[1], testBrokerTreeItems[3]);
      expect(result).to.have.lengthOf(2);
      expect(result[0].label.label).equals('Broker - example-broker0');
      expect(result[1].label.label).equals('Sink - example-broker1');
    });
    test('should return channel child nodes', async () => {
      sandbox.stub(triggerDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(triggerData) });
      await triggerDataProvider.getTriggers(eventingFolderNodes[4]);
      const result = triggerDataProvider.getTriggerChildren(testTriggerTreeItems[2]);
      assert.equals(result[0], testBrokerTreeItems[2]);
      assert.equals(result[1], testChannel0ForTrigger2TreeItem);
      expect(result).to.have.lengthOf(2);
      expect(result[0].label.label).equals('Broker - example-broker1');
      expect(result[1].label.label).equals('Sink - example-channel0');
    });
    test('should return URI child nodes', async () => {
      sandbox.stub(triggerDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(triggerData) });
      await triggerDataProvider.getTriggers(eventingFolderNodes[4]);
      const result = triggerDataProvider.getTriggerChildren(testTriggerTreeItems[4]);
      assert.equals(result[0], testBrokerTreeItems[4]);
      assert.equals(result[1], testURIForTrigger4TreeItem);
      expect(result).to.have.lengthOf(2);
      expect(result[0].label.label).equals('Broker - example-broker1');
      expect(result[1].label.label).equals('Sink - https://event.receiver.uri/');
    });
  });
});
