import * as vscode from 'vscode';
import { expect } from 'chai';
import * as chai from 'chai';
import { beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as brokerData from './broker.json';
import * as brokerIncompleteData from './brokerIncomplete.json';
import { EventingContextType } from '../../src/cli/config';
import { BrokerDataProvider } from '../../src/eventingTree/brokerDataProvider';
import { EventingDataProvider } from '../../src/eventingTree/eventingDataProvider';
import { EventingTreeItem } from '../../src/eventingTree/eventingTreeItem';
import { Broker } from '../../src/knative/broker';

chai.use(sinonChai);

suite('BrokerDataProvider', () => {
  const sandbox = sinon.createSandbox();
  const eventingDataProvider: EventingDataProvider = new EventingDataProvider();
  const eventingFolderNodes: EventingTreeItem[] = eventingDataProvider.getEventingFolders();
  const brokerDataProvider: BrokerDataProvider = new BrokerDataProvider();

  const testBroker0: Broker = new Broker('example-broker0', 'Brokers', JSON.parse(JSON.stringify(brokerData.items[0])));
  const testBroker1: Broker = new Broker('example-broker1', 'Brokers', JSON.parse(JSON.stringify(brokerData.items[1])));
  const testBroker0TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[0],
    testBroker0,
    { label: 'example-broker0' },
    EventingContextType.BROKER,
    vscode.TreeItemCollapsibleState.None,
  );
  const testBroker1TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[0],
    testBroker1,
    { label: 'example-broker1' },
    EventingContextType.BROKER,
    vscode.TreeItemCollapsibleState.None,
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
      expect(result[0].description).to.equal('');
      expect(result[0].description).to.equal('');
      expect(result[0].label.label).to.equal('No Broker Found');
      expect(result[0].getName()).to.equal('No Broker Found');
    });
    test('should return broker nodes', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox.stub(brokerDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(brokerData) });
      const result = await brokerDataProvider.getBrokers(eventingFolderNodes[0]);
      expect(result[0]).to.deep.equal(testBrokerTreeItems[0]);
      expect(result).to.have.lengthOf(2);
      expect(result[0].label.label).to.equal('example-broker0');
    });
    test('should refetch broker info when it is incomplete, then return broker nodes', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      const exeStub = sandbox.stub(brokerDataProvider.knExecutor, 'execute');
      exeStub.onFirstCall().resolves({ error: undefined, stdout: JSON.stringify(brokerIncompleteData) });
      exeStub.onSecondCall().resolves({ error: undefined, stdout: JSON.stringify(brokerData) });
      const result = await brokerDataProvider.getBrokers(eventingFolderNodes[0]);
      expect(result[0]).to.deep.equal(testBrokerTreeItems[0]);
      expect(result).to.have.lengthOf(2);
      expect(result[0].label.label).to.equal('example-broker0');
    });
  });
});
