import * as vscode from 'vscode';
import * as chai from 'chai';
import { beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as referee from '@sinonjs/referee';
import { EventingContextType } from '../../src/cli/config';
import { EventingExplorer } from '../../src/eventingTree/eventingExplorer';
import { EventingTreeItem } from '../../src/eventingTree/eventingTreeItem';

const { assert } = referee;
chai.use(sinonChai);

let eventingExplorer: EventingExplorer;

const eventingFolderNodes = [
  new EventingTreeItem(null, null, 'Brokers', EventingContextType.BROKER, vscode.TreeItemCollapsibleState.Expanded, null, null),
  new EventingTreeItem(null, null, 'Channels', EventingContextType.CHANNEL, vscode.TreeItemCollapsibleState.Expanded, null, null),
  new EventingTreeItem(null, null, 'Sources', EventingContextType.SOURCE, vscode.TreeItemCollapsibleState.Expanded, null, null),
  new EventingTreeItem(
    null,
    null,
    'Subscriptions',
    EventingContextType.SUBSCRIPTION,
    vscode.TreeItemCollapsibleState.Expanded,
    null,
    null,
  ),
  new EventingTreeItem(null, null, 'Triggers', EventingContextType.TRIGGER, vscode.TreeItemCollapsibleState.Expanded, null, null),
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
    assert.equals(eventingExplorer.registeredCommands.length, 1);
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
