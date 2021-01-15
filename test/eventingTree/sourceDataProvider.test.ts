import * as vscode from 'vscode';
import * as chai from 'chai';
import { beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as referee from '@sinonjs/referee';
import * as sourceIncompleteData from './sourceIncomplete.json';
import * as sourceEmptySpec from './sourceEmptySpec.json';
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
  const testSourceApiserver0: APIServerSource = new APIServerSource(
    'example-source-apiserver0',
    'Sources',
    '',
    'aaa',
    JSON.parse(JSON.stringify(sourceData.items[0])),
  );
  const testSource0TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSourceApiserver0,
    { label: 'example-source-apiserver0' },
    EventingContextType.SOURCE_APISERVER,
    vscode.TreeItemCollapsibleState.Expanded,
    null,
    null,
  );
  // Ping Source
  const testSource1: PingSource = new PingSource(
    'example-source-ping0',
    'Sources',
    '*/2 * * * *',
    '{ value: "hello" }',
    'aaa',
    JSON.parse(JSON.stringify(sourceData.items[4])),
  );
  const testSource1TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSource1,
    { label: 'example-source-ping0' },
    EventingContextType.SOURCE_PING,
    vscode.TreeItemCollapsibleState.Expanded,
    null,
    null,
  );
  // ping source as Generic source
  const testSource2: GenericSource = new GenericSource(
    'example-source-ping1',
    'Sources',
    'UnknownSource',
    null,
    JSON.parse(JSON.stringify(sourceData.items[5])),
  );
  const testSource2TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSource2,
    { label: 'example-source-ping1' },
    EventingContextType.SOURCE,
    vscode.TreeItemCollapsibleState.Expanded,
    null,
    null,
  );
  // Sink Binding Source
  const testSource3: BindingSource = new BindingSource(
    'example-source-binding0',
    'Sources',
    'ddd',
    'aaa',
    JSON.parse(JSON.stringify(sourceData.items[9])),
  );
  const testSource3TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSource3,
    { label: 'example-source-binding0' },
    EventingContextType.SOURCE_BINDING,
    vscode.TreeItemCollapsibleState.Expanded,
    null,
    null,
  );

  // Sources without a Spec
  // API Server Source
  const testSource0EmptySpec: APIServerSource = new APIServerSource(
    'example-source-apiserver0-emptySpec',
    'Sources',
    undefined,
    undefined,
    JSON.parse(JSON.stringify(sourceEmptySpec.items[0])),
  );
  const testSource0TreeItemEmptySpec: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSource0EmptySpec,
    { label: 'example-source-apiserver0-emptySpec' },
    EventingContextType.SOURCE_APISERVER,
    vscode.TreeItemCollapsibleState.Expanded,
    null,
    null,
  );
  // Ping Source
  const testSource1EmptySpec: PingSource = new PingSource(
    'example-source-ping0-emptySpec',
    'Sources',
    undefined,
    undefined,
    undefined,
    JSON.parse(JSON.stringify(sourceEmptySpec.items[4])),
  );
  const testSource1TreeItemEmptySpec: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSource1EmptySpec,
    { label: 'example-source-ping0-emptySpec' },
    EventingContextType.SOURCE_PING,
    vscode.TreeItemCollapsibleState.Expanded,
    null,
    null,
  );
  // ping source as Generic source
  const testSource2EmptySpec: GenericSource = new GenericSource(
    'example-source-ping1-emptySpec',
    'Sources',
    'UnknownSource',
    null,
    JSON.parse(JSON.stringify(sourceEmptySpec.items[5])),
  );
  const testSource2TreeItemEmptySpec: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSource2EmptySpec,
    { label: 'example-source-ping1-emptySpec' },
    EventingContextType.SOURCE,
    vscode.TreeItemCollapsibleState.Expanded,
    null,
    null,
  );
  // Sink Binding Source
  const testSource3EmptySpec: BindingSource = new BindingSource(
    'example-source-binding0-emptySpec',
    'Sources',
    undefined,
    undefined,
    JSON.parse(JSON.stringify(sourceEmptySpec.items[9])),
  );
  const testSource3TreeItemEmptySpec: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSource3EmptySpec,
    { label: 'example-source-binding0-emptySpec' },
    EventingContextType.SOURCE_BINDING,
    vscode.TreeItemCollapsibleState.Expanded,
    null,
    null,
  );
  const testSourceTreeItems = [
    testSource0TreeItem,
    testSource1TreeItem,
    testSource2TreeItem,
    testSource3TreeItem,
    testSource0TreeItemEmptySpec,
    testSource1TreeItemEmptySpec,
    testSource2TreeItemEmptySpec,
    testSource3TreeItemEmptySpec,
  ];

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
      expect(result[0].label.label).equals('No Source Found');
      expect(result[0].getName()).equals('No Source Found');
    });
    test('should refetch source info when it is incomplete, then return source nodes', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      const exeStub = sandbox.stub(sourceDataProvider.knExecutor, 'execute');
      exeStub.onFirstCall().resolves({ error: undefined, stdout: JSON.stringify(sourceIncompleteData) });
      exeStub.onSecondCall().resolves({ error: undefined, stdout: JSON.stringify(sourceData) });
      const result = await sourceDataProvider.getSources(eventingFolderNodes[2]);
      assert.equals(result[0], testSourceTreeItems[0]);
      expect(result).to.have.lengthOf(13);
      expect(result[0].label.label).equals('example-source-apiserver0');
    });
    test('should return API source nodes', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox.stub(sourceDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(sourceData) });
      const result = await sourceDataProvider.getSources(eventingFolderNodes[2]);
      assert.equals(result[0], testSourceTreeItems[0]);
      expect(result).to.have.lengthOf(13);
      expect(result[0].label.label).equals('example-source-apiserver0');
    });
    test('should return Ping source nodes', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox.stub(sourceDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(sourceData) });
      const result = await sourceDataProvider.getSources(eventingFolderNodes[2]);
      assert.equals(result[8], testSourceTreeItems[1]);
      expect(result).to.have.lengthOf(13);
      expect(result[8].label.label).equals('example-source-ping0');
    });
    // test('should return Generic source nodes', async () => {
    //   sandbox.restore();
    //   sandbox.stub(vscode.window, 'showErrorMessage').resolves();
    //   sandbox.stub(sourceDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(sourceData) });
    //   const result = await sourceDataProvider.getSources(eventingFolderNodes[2]);
    //   assert.equals(result[9], testSourceTreeItems[2]);
    //   expect(result).to.have.lengthOf(13);
    //   expect(result[9].label.label).equals('example-source-ping1');
    // });
    test('should return Sink Binding source nodes', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox.stub(sourceDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(sourceData) });
      const result = await sourceDataProvider.getSources(eventingFolderNodes[2]);
      assert.equals(result[4], testSourceTreeItems[3]);
      expect(result).to.have.lengthOf(13);
      expect(result[4].label.label).equals('example-source-binding0');
    });

    // Test when the spec is empty
    test('should return API source nodes when the spec is empty', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox
        .stub(sourceDataProvider.knExecutor, 'execute')
        .resolves({ error: undefined, stdout: JSON.stringify(sourceEmptySpec) });
      const result = await sourceDataProvider.getSources(eventingFolderNodes[2]);
      // eslint-disable-next-line no-console
      console.log(`sourceDataProvider test api source empty spec result ${result.length}`);
      assert.equals(result[0], testSourceTreeItems[4]);
      expect(result).to.have.lengthOf(13);
      expect(result[0].label.label).equals('example-source-apiserver0-emptySpec');
    });
    test('should return Ping source nodes when the spec is empty', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox
        .stub(sourceDataProvider.knExecutor, 'execute')
        .resolves({ error: undefined, stdout: JSON.stringify(sourceEmptySpec) });
      const result = await sourceDataProvider.getSources(eventingFolderNodes[2]);
      assert.equals(result[8], testSourceTreeItems[5]);
      expect(result).to.have.lengthOf(13);
      expect(result[8].label.label).equals('example-source-ping0-emptySpec');
    });
    // test('should return Generic source nodes when the spec is empty', async () => {
    //   sandbox.restore();
    //   sandbox.stub(vscode.window, 'showErrorMessage').resolves();
    //   sandbox
    //     .stub(sourceDataProvider.knExecutor, 'execute')
    //     .resolves({ error: undefined, stdout: JSON.stringify(sourceEmptySpec) });
    //   const result = await sourceDataProvider.getSources(eventingFolderNodes[2]);
    //   assert.equals(result[9], testSourceTreeItems[6]);
    //   expect(result).to.have.lengthOf(13);
    //   expect(result[9].label.label).equals('example-source-ping1-emptySpec');
    // });
    test('should return Sink Binding source nodes when the spec is empty', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox
        .stub(sourceDataProvider.knExecutor, 'execute')
        .resolves({ error: undefined, stdout: JSON.stringify(sourceEmptySpec) });
      const result = await sourceDataProvider.getSources(eventingFolderNodes[2]);
      assert.equals(result[4], testSourceTreeItems[7]);
      expect(result).to.have.lengthOf(13);
      expect(result[4].label.label).equals('example-source-binding0-emptySpec');
    });
  });
});
