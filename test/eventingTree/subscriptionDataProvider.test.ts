import * as vscode from 'vscode';
import * as chai from 'chai';
import { beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as referee from '@sinonjs/referee';
import * as subscriptionIncompleteData from './subscriptionIncomplete.json';
import * as subscriptionData from './subscription.json';
import { EventingContextType } from '../../src/cli/config';
import { EventingDataProvider } from '../../src/eventingTree/eventingDataProvider';
import { EventingTreeItem } from '../../src/eventingTree/eventingTreeItem';
import { SubscriptionDataProvider } from '../../src/eventingTree/subscriptionDataProvider';
import { Subscription } from '../../src/knative/subscription';

const { assert } = referee;
const { expect } = chai;
chai.use(sinonChai);

suite('SubscriptionDataProvider', () => {
  const sandbox = sinon.createSandbox();
  const subscriptionDataProvider: SubscriptionDataProvider = new SubscriptionDataProvider();
  const eventingDataProvider: EventingDataProvider = new EventingDataProvider();

  const eventingFolderNodes: EventingTreeItem[] = eventingDataProvider.getEventingFolders();

  const testSubscription0: Subscription = new Subscription(
    'example-subscription0',
    'Subscriptions',
    'example-channel0',
    'aaa',
    undefined,
    undefined,
    JSON.parse(JSON.stringify(subscriptionData.items[4])),
  );
  const testSubscription0TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[3],
    testSubscription0,
    { label: 'example-subscription0' },
    EventingContextType.SUBSCRIPTION,
    vscode.TreeItemCollapsibleState.None,
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
    JSON.parse(JSON.stringify(subscriptionData.items[5])),
  );
  const testSubscription1TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[3],
    testSubscription1,
    { label: 'example-subscription1' },
    EventingContextType.SUBSCRIPTION,
    vscode.TreeItemCollapsibleState.None,
    null,
    null,
  );
  const testSubscription2: Subscription = new Subscription(
    'example-subscription2',
    'Subscriptions',
    undefined,
    undefined,
    undefined,
    undefined,
    JSON.parse(JSON.stringify(subscriptionData.items[6])),
  );
  const testSubscription2TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[3],
    testSubscription2,
    { label: 'example-subscription2' },
    EventingContextType.SUBSCRIPTION,
    vscode.TreeItemCollapsibleState.None,
    null,
    null,
  );
  const testSubscriptionTreeItems = [testSubscription0TreeItem, testSubscription1TreeItem, testSubscription2TreeItem];

  beforeEach(() => {
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
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
      // The list of results gets sorted and the one we want is now at index 4
      assert.equals(result[4], testSubscriptionTreeItems[0]);
      expect(result).to.have.lengthOf(9);
      expect(result[4].label.label).equals('example-subscription0');
    });
    test('should refetch subscription info when it is incomplete, then return subscription nodes', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      const exeStub = sandbox.stub(subscriptionDataProvider.knExecutor, 'execute');
      exeStub.onFirstCall().resolves({ error: undefined, stdout: JSON.stringify(subscriptionIncompleteData) });
      exeStub.onSecondCall().resolves({ error: undefined, stdout: JSON.stringify(subscriptionData) });
      const result = await subscriptionDataProvider.getSubscriptions(eventingFolderNodes[3]);
      // The list of results gets sorted and the one we want is now at index 4
      assert.equals(result[4], testSubscriptionTreeItems[0]);
      expect(result).to.have.lengthOf(9);
      expect(result[4].label.label).equals('example-subscription0');
    });
    test('should return subscription nodes when it has no references in the spec', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox
        .stub(subscriptionDataProvider.knExecutor, 'execute')
        .resolves({ error: undefined, stdout: JSON.stringify(subscriptionData) });
      const result = await subscriptionDataProvider.getSubscriptions(eventingFolderNodes[3]);
      // The list of results gets sorted and the one we want is now at index 4
      assert.equals(result[6], testSubscriptionTreeItems[2]);
      expect(result).to.have.lengthOf(9);
      expect(result[6].label.label).equals('example-subscription2');
    });
  });
});
