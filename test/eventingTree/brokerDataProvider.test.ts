import * as vscode from 'vscode';
import * as chai from 'chai';
import { beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as referee from '@sinonjs/referee';
import * as brokerData from './broker.json';
import * as brokerIncompleteData from './brokerIncomplete.json';
import { EventingContextType } from '../../src/cli/config';
import { Broker } from '../../src/knative/broker';
import { EventingDataProvider } from '../../src/eventingTree/eventingDataProvider';
import { EventingTreeItem } from '../../src/eventingTree/eventingTreeItem';
import { BrokerDataProvider } from '../../src/eventingTree/brokerDataProvider';

const { assert } = referee;
const { expect } = chai;
chai.use(sinonChai);

suite('BrokerDataProvider', () => {
  const sandbox = sinon.createSandbox();
  const brokerDataProvider: BrokerDataProvider = new BrokerDataProvider();
  const eventingDataProvider: EventingDataProvider = new EventingDataProvider();

  const eventingFolderNodes: EventingTreeItem[] = eventingDataProvider.getEventingFolders();

  const testBroker0: Broker = new Broker('exampleBroker0', 'Brokers', JSON.parse(JSON.stringify(brokerData.items[0])));
  const testBroker0TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[0],
    testBroker0,
    'exampleBroker0',
    EventingContextType.BROKER,
    vscode.TreeItemCollapsibleState.None,
    null,
    null,
  );
  const testBroker1: Broker = new Broker('exampleBroker1', 'Brokers', JSON.parse(JSON.stringify(brokerData.items[1])));
  const testBroker1TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[0],
    testBroker1,
    'exampleBroker1',
    EventingContextType.BROKER,
    vscode.TreeItemCollapsibleState.None,
    null,
    null,
  );
  const testBrokerTreeItems = [testBroker0TreeItem, testBroker1TreeItem];

  beforeEach(() => {
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
  });
  teardown(() => {
    sandbox.restore();
  });

  suite('Get Brokers', () => {
    test('should return a node of "No Broker Found" when there is no data returned for Brokers', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox.stub(brokerDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: `No brokers found.` });
      const result = await brokerDataProvider.getBrokers(eventingFolderNodes[0]);
      expect(result).to.have.lengthOf(1);
      expect(result[0].description).equals('');
      expect(result[0].description).equals('');
      expect(result[0].label).equals('No Broker Found');
      expect(result[0].getName()).equals('No Broker Found');
    });
    test('should return broker nodes', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox.stub(brokerDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(brokerData) });
      const result = await brokerDataProvider.getBrokers(eventingFolderNodes[0]);
      assert.equals(result[0], testBrokerTreeItems[0]);
      expect(result).to.have.lengthOf(2);
      expect(result[0].label).equals('exampleBroker0');
    });
    test('should refetch broker info when it is incomplete, then return broker nodes', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      const exeStub = sandbox.stub(brokerDataProvider.knExecutor, 'execute');
      exeStub.onFirstCall().resolves({ error: undefined, stdout: JSON.stringify(brokerIncompleteData) });
      exeStub.onSecondCall().resolves({ error: undefined, stdout: JSON.stringify(brokerData) });
      const result = await brokerDataProvider.getBrokers(eventingFolderNodes[0]);
      assert.equals(result[0], testBrokerTreeItems[0]);
      expect(result).to.have.lengthOf(2);
      expect(result[0].label).equals('exampleBroker0');
    });
  });
});
