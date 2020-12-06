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
    'exampleSubscription0',
    'Subscriptions',
    null,
    null,
    null,
    null,
    JSON.parse(JSON.stringify(subscriptionData.items[0])),
  );
  const testSubscription0TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[3],
    testSubscription0,
    'exampleSubscription0',
    EventingContextType.SUBSCRIPTION,
    vscode.TreeItemCollapsibleState.None,
    null,
    null,
  );
  const testSubscription1: Subscription = new Subscription(
    'exampleSubscription1',
    'Subscriptions',
    null,
    null,
    null,
    null,
    JSON.parse(JSON.stringify(subscriptionData.items[1])),
  );
  const testSubscription1TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[3],
    testSubscription1,
    'exampleSubscription1',
    EventingContextType.SUBSCRIPTION,
    vscode.TreeItemCollapsibleState.None,
    null,
    null,
  );
  const testSubscriptionTreeItems = [testSubscription0TreeItem, testSubscription1TreeItem];

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
      expect(result[0].label).equals('No Subscription Found');
      expect(result[0].getName()).equals('No Subscription Found');
    });
    test('should return subscription nodes', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox
        .stub(subscriptionDataProvider.knExecutor, 'execute')
        .resolves({ error: undefined, stdout: JSON.stringify(subscriptionData) });
      const result = await subscriptionDataProvider.getSubscriptions(eventingFolderNodes[3]);
      // The list of results gets sorted and the one we want is not at index 4
      assert.equals(result[4], testSubscriptionTreeItems[0]);
      expect(result).to.have.lengthOf(9);
      expect(result[4].label).equals('exampleSubscription0');
    });
    test('should refetch subscription info when it is incomplete, then return subscription nodes', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      const exeStub = sandbox.stub(subscriptionDataProvider.knExecutor, 'execute');
      exeStub.onFirstCall().resolves({ error: undefined, stdout: JSON.stringify(subscriptionIncompleteData) });
      exeStub.onSecondCall().resolves({ error: undefined, stdout: JSON.stringify(subscriptionData) });
      const result = await subscriptionDataProvider.getSubscriptions(eventingFolderNodes[3]);
      // The list of results gets sorted and the one we want is not at index 4
      assert.equals(result[4], testSubscriptionTreeItems[0]);
      expect(result).to.have.lengthOf(9);
      expect(result[4].label).equals('exampleSubscription0');
    });
  });
});
