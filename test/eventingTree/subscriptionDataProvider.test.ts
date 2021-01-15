import * as vscode from 'vscode';
import * as chai from 'chai';
import { beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as referee from '@sinonjs/referee';
import * as subscriptionIncompleteData from './subscriptionIncomplete.json';
import * as brokerData from './broker.json';
import * as channelData from './channel.json';
import * as multipleServiceData from '../servingTree/multipleServiceServicesList.json';
import * as subscriptionData from './subscription.json';
import { EventingContextType } from '../../src/cli/config';
import { EventingDataProvider } from '../../src/eventingTree/eventingDataProvider';
import { EventingTreeItem } from '../../src/eventingTree/eventingTreeItem';
import { SubscriptionDataProvider } from '../../src/eventingTree/subscriptionDataProvider';
import { Subscription } from '../../src/knative/subscription';
import { BrokerDataProvider } from '../../src/eventingTree/brokerDataProvider';
import { ChannelDataProvider } from '../../src/eventingTree/channelDataProvider';
import { ServingDataProvider } from '../../src/servingTree/servingDataProvider';
import { KnativeSubscriptions } from '../../src/knative/knativeSubscriptions';
import { Service } from '../../src/knative/service';
import { KnativeServices } from '../../src/knative/knativeServices';

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

  const testSubscription0: Subscription = new Subscription(
    'example-subscription0',
    'Subscriptions',
    'example-channel0',
    'aaa',
    undefined,
    undefined,
    JSON.parse(JSON.stringify(subscriptionData.items[5])),
  );
  const testSubscription0TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[3],
    testSubscription0,
    { label: 'example-subscription0' },
    EventingContextType.SUBSCRIPTION,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testSubscription1: Subscription = new Subscription(
    'example-subscription1',
    'Subscriptions',
    'example-channel0',
    'example-broker0',
    JSON.parse(JSON.stringify(subscriptionData.items[6])),
  );
  const testSubscription1TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[3],
    testSubscription1,
    { label: 'example-subscription1' },
    EventingContextType.SUBSCRIPTION,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testSubscription2: Subscription = new Subscription(
    'example-subscription2',
    'Subscriptions',
    undefined,
    undefined,
    undefined,
    undefined,
    JSON.parse(JSON.stringify(subscriptionData.items[7])),
  );
  const testSubscription2TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[3],
    testSubscription2,
    { label: 'example-subscription2' },
    EventingContextType.SUBSCRIPTION,
    vscode.TreeItemCollapsibleState.Expanded,
  );

  const testSubscriptions = [testSubscription0, testSubscription1, testSubscription2];
  const testSubscriptionTreeItems = [testSubscription0TreeItem, testSubscription1TreeItem, testSubscription2TreeItem];

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
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
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
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox
        .stub(subscriptionDataProvider.knExecutor, 'execute')
        .resolves({ error: undefined, stdout: JSON.stringify(subscriptionData) });
      const result = await subscriptionDataProvider.getSubscriptions(eventingFolderNodes[3]);
      assert.equals(result[5], testSubscriptionTreeItems[0]);
      expect(result).to.have.lengthOf(10);
      expect(result[5].label.label).equals('example-subscription0');
    });
    test('should refetch subscription info when it is incomplete, then return subscription nodes', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      const exeStub = sandbox.stub(subscriptionDataProvider.knExecutor, 'execute');
      exeStub.onFirstCall().resolves({ error: undefined, stdout: JSON.stringify(subscriptionIncompleteData) });
      exeStub.onSecondCall().resolves({ error: undefined, stdout: JSON.stringify(subscriptionData) });
      const result = await subscriptionDataProvider.getSubscriptions(eventingFolderNodes[3]);
      assert.equals(result[5], testSubscriptionTreeItems[0]);
      expect(result).to.have.lengthOf(10);
      expect(result[5].label.label).equals('example-subscription0');
    });
    // test('should return subscription nodes when it has no references in the spec', async () => {
    //   sandbox.restore();
    //   sandbox.stub(vscode.window, 'showErrorMessage').resolves();
    //   sandbox
    //     .stub(subscriptionDataProvider.knExecutor, 'execute')
    //     .resolves({ error: undefined, stdout: JSON.stringify(subscriptionData) });
    //   const result = await subscriptionDataProvider.getSubscriptions(eventingFolderNodes[3]);
    //   assert.equals(result[7], testSubscriptionTreeItems[2]);
    //   expect(result).to.have.lengthOf(10);
    //   expect(result[7].label.label).equals('example-subscription2');
    // });
  });
});
