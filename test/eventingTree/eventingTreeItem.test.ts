import * as vscode from 'vscode';
import * as chai from 'chai';
import { beforeEach } from 'mocha';
import * as path from 'path';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as referee from '@sinonjs/referee';
import * as brokerData from './broker.json';
import * as channelData from './channel.json';
import * as sourceData from './source.json';
import * as subscriptionData from './subscription.json';
import * as triggerData from './trigger.json';
import { EventingContextType } from '../../src/cli/config';
import { EventingTreeItem } from '../../src/eventingTree/eventingTreeItem';
import { Broker } from '../../src/knative/broker';
import { GenericSource } from '../../src/knative/genericSource';
import { APIServerSource } from '../../src/knative/apiServerSource';
import { PingSource } from '../../src/knative/pingSource';
import { BindingSource } from '../../src/knative/bindingSource';
import { Channel } from '../../src/knative/channel';
import { Subscription } from '../../src/knative/subscription';
import { Trigger } from '../../src/knative/trigger';

const { assert } = referee;
chai.use(sinonChai);

suite('EventingTreeItem', () => {
  const sandbox = sinon.createSandbox();
  beforeEach(() => {
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
  });

  teardown(() => {
    sandbox.restore();
  });

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
  const testBroker0TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[0],
    testBroker0,
    { label: 'example-broker0' },
    EventingContextType.BROKER,
    vscode.TreeItemCollapsibleState.None,
    null,
    null,
  );

  // Channels
  const testChannel0: Channel = new Channel(
    'example-channel0',
    'Channels',
    'InMemoryChannel',
    JSON.parse(JSON.stringify(channelData.items[0])),
  );
  // Channel Tree Items
  const testChannel0TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[1],
    testChannel0,
    { label: 'example-channel0' },
    EventingContextType.CHANNEL,
    vscode.TreeItemCollapsibleState.Expanded,
  );

  // API Server Source
  const testSource0: APIServerSource = new APIServerSource(
    'example-source0',
    'Sources',
    '',
    'aaa',
    JSON.parse(JSON.stringify(sourceData.items[0])),
  );
  const testSource0TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSource0,
    { label: 'example-source0' },
    EventingContextType.SOURCE_APISERVER,
    vscode.TreeItemCollapsibleState.None,
    null,
    null,
  );
  // Ping Source
  const testSource1: PingSource = new PingSource(
    'example-source1',
    'Sources',
    '*/2 * * * *',
    '{ value: "hello" }',
    'aaa',
    JSON.parse(JSON.stringify(sourceData.items[1])),
  );
  const testSource1TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSource1,
    { label: 'example-source1' },
    EventingContextType.SOURCE_PING,
    vscode.TreeItemCollapsibleState.None,
    null,
    null,
  );
  // ping source as Generic source
  const testSource2: GenericSource = new GenericSource(
    'example-source2',
    'Sources',
    'UnknownSource',
    null,
    JSON.parse(JSON.stringify(sourceData.items[2])),
  );
  const testSource2TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSource2,
    { label: 'example-source2' },
    EventingContextType.SOURCE,
    vscode.TreeItemCollapsibleState.None,
    null,
    null,
  );
  // Sink Binding Source
  const testSource3: BindingSource = new BindingSource(
    'example-source3',
    'Sources',
    'knative-tut',
    'aaa',
    JSON.parse(JSON.stringify(sourceData.items[3])),
  );
  const testSource3TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSource3,
    { label: 'example-source3' },
    EventingContextType.SOURCE_BINDING,
    vscode.TreeItemCollapsibleState.None,
    null,
    null,
  );

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
  // Subscription Tree Items
  const testSubscription0TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[3],
    testSubscription0,
    { label: 'example-subscription0' },
    EventingContextType.SUBSCRIPTION,
    vscode.TreeItemCollapsibleState.Expanded,
  );

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
  const testTrigger4: Trigger = new Trigger(
    'example-trigger4',
    'Triggers',
    'example-broker1',
    filters,
    'https://event.receiver.uri/',
    JSON.parse(JSON.stringify(triggerData.items[4])),
  );
  // Trigger Tree Items
  const testTrigger0TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[4],
    testTrigger0,
    { label: 'example-trigger0' },
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

  // URI
  const testURIForTrigger4TreeItem: EventingTreeItem = new EventingTreeItem(
    testTrigger4TreeItem,
    null,
    { label: 'Sink - https://event.receiver.uri/' },
    EventingContextType.URI,
    vscode.TreeItemCollapsibleState.None,
  );

  test('should get the icon path', () => {
    const revPath = testBroker0TreeItem.iconPath;
    const localDir = __dirname;
    // use regex for search since the backslash for windows needs to be escaped in a regex string
    const expected = vscode.Uri.file(
      `${localDir.substring(0, localDir.search(/out.test/))}images${path.sep}context${path.sep}broker.svg`,
    );
    assert.equals(revPath, expected);
  });

  test('should get the tooltip', () => {
    const tested = testBroker0TreeItem.tooltip;
    assert.equals(tested, ``);
  });

  test('should get the description and it should be blank', () => {
    const tested = testBroker0TreeItem.description;
    assert.equals(tested, '');
  });

  test('should get the command for selected tree item and return undefined if No Broker Found', () => {
    const noBrokerFoundTreeItem: EventingTreeItem = new EventingTreeItem(
      eventingFolderNodes[0],
      null,
      { label: 'No Broker Found' },
      EventingContextType.NONE,
      vscode.TreeItemCollapsibleState.None,
      null,
      null,
    );
    const tested = noBrokerFoundTreeItem.command;
    assert.isUndefined(tested);
  });

  test('should get the command for selected tree item and return Describe if NOT modified', () => {
    const tested = testBroker0TreeItem.command;
    assert.equals(tested.command, 'eventing.explorer.openFile');
  });

  test('should get the children of Not Found', () => {
    const noBrokerFoundTreeItem: EventingTreeItem = new EventingTreeItem(
      eventingFolderNodes[0],
      null,
      { label: 'No Broker Found' },
      EventingContextType.NONE,
      vscode.TreeItemCollapsibleState.None,
      null,
      null,
    );
    const tested = noBrokerFoundTreeItem.getChildren();
    assert.equals(tested, []);
  });

  test('should get the children of the Broker Folder', () => {
    const tested = eventingFolderNodes[0].getChildren();
    assert.equals(tested, []);
  });

  test('should get the children of a Broker', () => {
    const tested = testBroker0TreeItem.getChildren();
    assert.equals(tested, []);
  });

  test('should get the children of the Channel Folder', () => {
    const tested = eventingFolderNodes[1].getChildren();
    assert.equals(tested, []);
  });

  test('should get the children of a Channel', () => {
    const tested = testChannel0TreeItem.getChildren();
    assert.equals(tested, []);
  });

  test('should get the children of the Source Folder', () => {
    const tested = eventingFolderNodes[2].getChildren();
    assert.equals(tested, []);
  });

  test('should get the children of a source_apiserver', () => {
    const tested = testSource0TreeItem.getChildren();
    assert.equals(tested, []);
  });

  test('should get the children of a source_ping', () => {
    const tested = testSource1TreeItem.getChildren();
    assert.equals(tested, []);
  });

  test('should get the children of a source_generic', () => {
    const tested = testSource2TreeItem.getChildren();
    assert.equals(tested, []);
  });

  test('should get the children of a source_binding', () => {
    const tested = testSource3TreeItem.getChildren();
    assert.equals(tested, []);
  });

  test('should get the children of the Subscription Folder', () => {
    const tested = eventingFolderNodes[3].getChildren();
    assert.equals(tested, []);
  });

  test('should get the children of a Subscription', () => {
    const tested = testSubscription0TreeItem.getChildren();
    assert.equals(tested, []);
  });

  test('should get the children of the Trigger Folder', () => {
    const tested = eventingFolderNodes[4].getChildren();
    assert.equals(tested, []);
  });
  test('should get the children of a Trigger', () => {
    const tested = testTrigger0TreeItem.getChildren();
    assert.equals(tested, []);
  });

  test('should get the children of a URI', () => {
    const tested = testURIForTrigger4TreeItem.getChildren();
    assert.equals(tested, []);
  });
});
