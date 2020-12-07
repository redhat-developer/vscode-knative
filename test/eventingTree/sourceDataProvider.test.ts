import * as vscode from 'vscode';
import * as chai from 'chai';
import { beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as referee from '@sinonjs/referee';
import * as sourceIncompleteData from './sourceIncomplete.json';
import * as sourceData from './source.json';
import { EventingContextType } from '../../src/cli/config';
import { EventingDataProvider } from '../../src/eventingTree/eventingDataProvider';
import { EventingTreeItem } from '../../src/eventingTree/eventingTreeItem';
import { SourceDataProvider } from '../../src/eventingTree/sourceDataProvider';
import { GenericSource } from '../../src/knative/genericSource';
import { BindingSource } from '../../src/knative/bindingSource';
import { PingSource } from '../../src/knative/pingSource';
import { APIServerSource } from '../../src/knative/apiServerSource';

const { assert } = referee;
const { expect } = chai;
chai.use(sinonChai);

suite('SourceDataProvider', () => {
  const sandbox = sinon.createSandbox();
  const sourceDataProvider: SourceDataProvider = new SourceDataProvider();
  const eventingDataProvider: EventingDataProvider = new EventingDataProvider();

  const eventingFolderNodes: EventingTreeItem[] = eventingDataProvider.getEventingFolders();

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
    'example-source0',
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
    'example-source1',
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
    'example-source2',
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
    'example-source3',
    EventingContextType.SOURCE_BINDING,
    vscode.TreeItemCollapsibleState.None,
    null,
    null,
  );
  const testSourceTreeItems = [testSource0TreeItem, testSource1TreeItem, testSource2TreeItem, testSource3TreeItem];

  beforeEach(() => {
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
  });
  teardown(() => {
    sandbox.restore();
  });

  suite('Get Sources', () => {
    test('should return a node of "No Source Found" when there is no data returned for Sources', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox.stub(sourceDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: `No sources found.` });
      const result = await sourceDataProvider.getSources(eventingFolderNodes[2]);
      expect(result).to.have.lengthOf(1);
      expect(result[0].description).equals('');
      expect(result[0].description).equals('');
      expect(result[0].label).equals('No Source Found');
      expect(result[0].getName()).equals('No Source Found');
    });
    test('should return API source nodes', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox.stub(sourceDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(sourceData) });
      const result = await sourceDataProvider.getSources(eventingFolderNodes[2]);
      assert.equals(result[0], testSourceTreeItems[0]);
      expect(result).to.have.lengthOf(4);
      expect(result[0].label).equals('example-source0');
    });
    test('should refetch source info when it is incomplete, then return source nodes', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      const exeStub = sandbox.stub(sourceDataProvider.knExecutor, 'execute');
      exeStub.onFirstCall().resolves({ error: undefined, stdout: JSON.stringify(sourceIncompleteData) });
      exeStub.onSecondCall().resolves({ error: undefined, stdout: JSON.stringify(sourceData) });
      const result = await sourceDataProvider.getSources(eventingFolderNodes[2]);
      assert.equals(result[0], testSourceTreeItems[0]);
      expect(result).to.have.lengthOf(4);
      expect(result[0].label).equals('example-source0');
    });
    test('should return Ping source nodes', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox.stub(sourceDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(sourceData) });
      const result = await sourceDataProvider.getSources(eventingFolderNodes[2]);
      assert.equals(result[1], testSourceTreeItems[1]);
      expect(result).to.have.lengthOf(4);
      expect(result[1].label).equals('example-source1');
    });
    test('should return Generic source nodes', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox.stub(sourceDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(sourceData) });
      const result = await sourceDataProvider.getSources(eventingFolderNodes[2]);
      assert.equals(result[2], testSourceTreeItems[2]);
      expect(result).to.have.lengthOf(4);
      expect(result[2].label).equals('example-source2');
    });
    test('should return Sink Binding source nodes', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox.stub(sourceDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(sourceData) });
      const result = await sourceDataProvider.getSources(eventingFolderNodes[2]);
      assert.equals(result[3], testSourceTreeItems[3]);
      expect(result).to.have.lengthOf(4);
      expect(result[3].label).equals('example-source3');
    });
  });
});
