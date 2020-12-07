import * as vscode from 'vscode';
import * as chai from 'chai';
import { beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as referee from '@sinonjs/referee';
import * as triggerIncompleteData from './triggerIncomplete.json';
import * as triggerData from './trigger.json';
import { EventingContextType } from '../../src/cli/config';
import { EventingDataProvider } from '../../src/eventingTree/eventingDataProvider';
import { EventingTreeItem } from '../../src/eventingTree/eventingTreeItem';
import { TriggerDataProvider } from '../../src/eventingTree/triggerDataProvider';
import { Trigger } from '../../src/knative/trigger';

const { assert } = referee;
const { expect } = chai;
chai.use(sinonChai);

suite('TriggerDataProvider', () => {
  const sandbox = sinon.createSandbox();
  const triggerDataProvider: TriggerDataProvider = new TriggerDataProvider();
  const eventingDataProvider: EventingDataProvider = new EventingDataProvider();

  const eventingFolderNodes: EventingTreeItem[] = eventingDataProvider.getEventingFolders();

  const testTrigger0: Trigger = new Trigger('example-trigger0', 'Triggers', JSON.parse(JSON.stringify(triggerData.items[0])));
  const testTrigger0TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[4],
    testTrigger0,
    'example-trigger0',
    EventingContextType.TRIGGER,
    vscode.TreeItemCollapsibleState.None,
    null,
    null,
  );
  const testTrigger1: Trigger = new Trigger('example-trigger1', 'Triggers', JSON.parse(JSON.stringify(triggerData.items[1])));
  const testTrigger1TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[4],
    testTrigger1,
    'example-trigger1',
    EventingContextType.TRIGGER,
    vscode.TreeItemCollapsibleState.None,
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

  suite('Get Triggers', () => {
    test('should return a node of "No Trigger Found" when there is no data returned for Triggers', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox.stub(triggerDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: `No triggers found.` });
      const result = await triggerDataProvider.getTriggers(eventingFolderNodes[4]);
      expect(result).to.have.lengthOf(1);
      expect(result[0].description).equals('');
      expect(result[0].description).equals('');
      expect(result[0].label).equals('No Trigger Found');
      expect(result[0].getName()).equals('No Trigger Found');
    });
    test('should return trigger nodes', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox.stub(triggerDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(triggerData) });
      const result = await triggerDataProvider.getTriggers(eventingFolderNodes[4]);
      assert.equals(result[0], testTriggerTreeItems[0]);
      expect(result).to.have.lengthOf(4);
      expect(result[0].label).equals('example-trigger0');
    });
    test('should refetch trigger info when it is incomplete, then return trigger nodes', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      const exeStub = sandbox.stub(triggerDataProvider.knExecutor, 'execute');
      exeStub.onFirstCall().resolves({ error: undefined, stdout: JSON.stringify(triggerIncompleteData) });
      exeStub.onSecondCall().resolves({ error: undefined, stdout: JSON.stringify(triggerData) });
      const result = await triggerDataProvider.getTriggers(eventingFolderNodes[4]);
      assert.equals(result[0], testTriggerTreeItems[0]);
      expect(result).to.have.lengthOf(4);
      expect(result[0].label).equals('example-trigger0');
    });
  });
});
