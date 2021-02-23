import * as vscode from 'vscode';
import { expect } from 'chai';
import * as chai from 'chai';
import { beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { EventingContextType } from '../../src/cli/config';
import { EventingExplorer } from '../../src/eventingTree/eventingExplorer';
import { EventingTreeItem } from '../../src/eventingTree/eventingTreeItem';

chai.use(sinonChai);

let eventingExplorer: EventingExplorer;

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

suite('EventingExplorer', () => {
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('should add registered commands to', () => {
    // This test allows us to create a new EventingExplorer after the one in Extension is called
    // giving the extension test enough time to dispose of it. Otherwise we would have 2 registered
    // commands for each one in EventingExplorer.
    eventingExplorer = new EventingExplorer();
    expect(eventingExplorer.registeredCommands).to.be.lengthOf(1);
  });

  test('should connect the output command to refreshing the tree', async () => {
    const stub = sandbox.stub(eventingExplorer.treeDataProvider, 'refresh').returns(null);
    await vscode.commands.executeCommand('eventing.explorer.refresh');
    sinon.assert.calledOnce(stub);
  });

  test('should reveal the tree view', async () => {
    const stub = sandbox.stub(eventingExplorer.treeView, 'reveal').resolves();
    await eventingExplorer.reveal(eventingFolderNodes[0]);
    sinon.assert.calledOnce(stub);
  });
});
