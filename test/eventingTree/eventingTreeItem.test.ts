import * as vscode from 'vscode';
import * as chai from 'chai';
import { beforeEach } from 'mocha';
import * as path from 'path';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as referee from '@sinonjs/referee';
import * as brokerData from './broker.json';
import * as sourceData from './source.json';
import { EventingContextType } from '../../src/cli/config';
import { EventingTreeItem } from '../../src/eventingTree/eventingTreeItem';
import { Broker } from '../../src/knative/broker';
import { GenericSource } from '../../src/knative/genericSource';
import { APIServerSource } from '../../src/knative/apiServerSource';
import { PingSource } from '../../src/knative/pingSource';
import { BindingSource } from '../../src/knative/bindingSource';

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

  test('should get the children of Broker', () => {
    const tested = eventingFolderNodes[0].getChildren();
    assert.equals(tested, []);
  });

  test('should get the children of channel', () => {
    const tested = eventingFolderNodes[1].getChildren();
    assert.equals(tested, []);
  });

  test('should get the children of source', () => {
    const tested = testSource2TreeItem.getChildren();
    assert.equals(tested, []);
  });

  test('should get the children of source_apiserver', () => {
    const tested = testSource0TreeItem.getChildren();
    assert.equals(tested, []);
  });

  test('should get the children of source_binding', () => {
    const tested = testSource3TreeItem.getChildren();
    assert.equals(tested, []);
  });

  test('should get the children of source_ping', () => {
    const tested = testSource1TreeItem.getChildren();
    assert.equals(tested, []);
  });

  test('should get the children of subscription', () => {
    const tested = eventingFolderNodes[3].getChildren();
    assert.equals(tested, []);
  });

  test('should get the children of trigger', () => {
    const tested = eventingFolderNodes[4].getChildren();
    assert.equals(tested, []);
  });
});
