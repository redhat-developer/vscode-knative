import * as vscode from 'vscode';
import { expect } from 'chai';
import * as chai from 'chai';
import { beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as brokerData from './broker.json';
import * as channelData from './channel.json';
import * as sourceData from './source.json';
import * as sourceEmptySpec from './sourceEmptySpec.json';
import * as sourceIncompleteData from './sourceIncomplete.json';
import { EventingContextType, ServingContextType } from '../../src/cli/config';
import { BrokerDataProvider } from '../../src/eventingTree/brokerDataProvider';
import { ChannelDataProvider } from '../../src/eventingTree/channelDataProvider';
import { EventingDataProvider } from '../../src/eventingTree/eventingDataProvider';
import { EventingTreeItem } from '../../src/eventingTree/eventingTreeItem';
import { SourceDataProvider } from '../../src/eventingTree/sourceDataProvider';
import { APIServerSource } from '../../src/knative/apiServerSource';
import { BindingSource } from '../../src/knative/bindingSource';
import { Broker } from '../../src/knative/broker';
import { Channel } from '../../src/knative/channel';
import { GenericSource } from '../../src/knative/genericSource';
import { KnativeServices } from '../../src/knative/knativeServices';
import { KnativeSources } from '../../src/knative/knativeSources';
import { PingSource } from '../../src/knative/pingSource';
import { Service } from '../../src/knative/service';
import { ServingDataProvider } from '../../src/servingTree/servingDataProvider';
import { ServingTreeItem } from '../../src/servingTree/servingTreeItem';
import * as multipleServiceData from '../servingTree/multipleServiceServicesList.json';

chai.use(sinonChai);

suite('SourceDataProvider', () => {
  const sandbox = sinon.createSandbox();
  const eventingDataProvider: EventingDataProvider = new EventingDataProvider();
  const eventingFolderNodes: EventingTreeItem[] = eventingDataProvider.getEventingFolders();
  const brokerDataProvider: BrokerDataProvider = new BrokerDataProvider();
  const channelDataProvider: ChannelDataProvider = new ChannelDataProvider();
  const servingDataProvider: ServingDataProvider = new ServingDataProvider();
  const ksvc: KnativeServices = KnativeServices.Instance;
  const knativeSources: KnativeSources = KnativeSources.Instance;
  const sourceDataProvider: SourceDataProvider = new SourceDataProvider();

  // Fake missing data Source
  const testSourceMissingData: APIServerSource = new APIServerSource(
    'example-source-missing',
    'Sources',
    '',
    'service-missing',
    JSON.parse(JSON.stringify(sourceData.items[0])),
  );
  const testSourceMissingDataTreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSourceMissingData,
    { label: 'example-source-missing' },
    EventingContextType.SOURCE_APISERVER,
    vscode.TreeItemCollapsibleState.Expanded,
  );

  // API Server Source
  const testSourceApiserver0: APIServerSource = new APIServerSource(
    'example-source-apiserver0',
    'Sources',
    '',
    'aaa',
    JSON.parse(JSON.stringify(sourceData.items[0])),
  );
  const testSourceApiserver1: APIServerSource = new APIServerSource(
    'example-source-apiserver1',
    'Sources',
    '',
    'example-broker0',
    JSON.parse(JSON.stringify(sourceData.items[1])),
  );
  const testSourceApiserver2: APIServerSource = new APIServerSource(
    'example-source-apiserver2',
    'Sources',
    '',
    'example-channel0',
    JSON.parse(JSON.stringify(sourceData.items[2])),
  );
  const testSourceApiserver3: APIServerSource = new APIServerSource(
    'example-source-apiserver3',
    'Sources',
    '',
    'https://event.receiver.uri',
    JSON.parse(JSON.stringify(sourceData.items[3])),
  );
  // Ping Source
  const testSourcePing0: PingSource = new PingSource(
    'example-source-ping0',
    'Sources',
    '*/2 * * * *',
    '{ value: "hello" }',
    'aaa',
    JSON.parse(JSON.stringify(sourceData.items[4])),
  );
  const testSourcePing2: PingSource = new PingSource(
    'example-source-ping2',
    'Sources',
    '*/2 * * * *',
    '{ value: "hello" }',
    'example-broker0',
    JSON.parse(JSON.stringify(sourceData.items[6])),
  );
  const testSourcePing3: PingSource = new PingSource(
    'example-source-ping3',
    'Sources',
    '*/2 * * * *',
    '{ value: "hello" }',
    'example-channel0',
    JSON.parse(JSON.stringify(sourceData.items[7])),
  );
  const testSourcePing4: PingSource = new PingSource(
    'example-source-ping4',
    'Sources',
    '*/2 * * * *',
    '{ value: "hello" }',
    'https://event.receiver.uri',
    JSON.parse(JSON.stringify(sourceData.items[8])),
  );
  // Sink Binding Source
  const testSourceBinding0: BindingSource = new BindingSource(
    'example-source-binding0',
    'Sources',
    'ddd',
    'aaa',
    JSON.parse(JSON.stringify(sourceData.items[9])),
  );
  const testSourceBinding1: BindingSource = new BindingSource(
    'example-source-binding1',
    'Sources',
    'ddd',
    'example-broker0',
    JSON.parse(JSON.stringify(sourceData.items[10])),
  );
  const testSourceBinding2: BindingSource = new BindingSource(
    'example-source-binding2',
    'Sources',
    'ddd',
    'example-channel0',
    JSON.parse(JSON.stringify(sourceData.items[11])),
  );
  const testSourceBinding3: BindingSource = new BindingSource(
    'example-source-binding3',
    'Sources',
    'ddd',
    'https://event.receiver.uri',
    JSON.parse(JSON.stringify(sourceData.items[12])),
  );
  // ping source as Generic source
  const testSourceGenericPing1: GenericSource = new GenericSource(
    'example-source-ping1',
    'Sources',
    'Source',
    'aaa',
    null,
    JSON.parse(JSON.stringify(sourceData.items[5])),
  );
  const testSourceGenericPing5: GenericSource = new GenericSource(
    'example-source-ping5',
    'Sources',
    'Source',
    'https://event.receiver.uri',
    null,
    JSON.parse(JSON.stringify(sourceData.items[13])),
  );

  const testSources = [
    testSourceApiserver0,
    testSourceApiserver1,
    testSourceApiserver2,
    testSourceApiserver3,
    testSourcePing0,
    testSourcePing2,
    testSourcePing3,
    testSourcePing4,
    testSourceBinding0,
    testSourceBinding1,
    testSourceBinding2,
    testSourceBinding3,
    testSourceGenericPing1,
    testSourceGenericPing5,
  ];

  // API Server Tree Items
  const testSourceApiserver0TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSourceApiserver0,
    { label: 'example-source-apiserver0' },
    EventingContextType.SOURCE_APISERVER,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testSourceApiserver1TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSourceApiserver1,
    { label: 'example-source-apiserver1' },
    EventingContextType.SOURCE_APISERVER,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testSourceApiserver2TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSourceApiserver2,
    { label: 'example-source-apiserver2' },
    EventingContextType.SOURCE_APISERVER,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testSourceApiserver3TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSourceApiserver3,
    { label: 'example-source-apiserver3' },
    EventingContextType.SOURCE_APISERVER,
    vscode.TreeItemCollapsibleState.Expanded,
  );

  // Ping Tree Items
  const testSourcePing0TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSourcePing0,
    { label: 'example-source-ping0' },
    EventingContextType.SOURCE_PING,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testSourcePing2TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSourcePing2,
    { label: 'example-source-ping2' },
    EventingContextType.SOURCE_PING,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testSourcePing3TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSourcePing3,
    { label: 'example-source-ping3' },
    EventingContextType.SOURCE_PING,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testSourcePing4TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSourcePing4,
    { label: 'example-source-ping4' },
    EventingContextType.SOURCE_PING,
    vscode.TreeItemCollapsibleState.Expanded,
  );

  // Binding Tree Items
  const testSourceBinding0TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSourceBinding0,
    { label: 'example-source-binding0' },
    EventingContextType.SOURCE_BINDING,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testSourceBinding1TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSourceBinding1,
    { label: 'example-source-binding1' },
    EventingContextType.SOURCE_BINDING,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testSourceBinding2TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSourceBinding2,
    { label: 'example-source-binding2' },
    EventingContextType.SOURCE_BINDING,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testSourceBinding3TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSourceBinding3,
    { label: 'example-source-binding3' },
    EventingContextType.SOURCE_BINDING,
    vscode.TreeItemCollapsibleState.Expanded,
  );

  const testSourceGenericPing1TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSourceGenericPing1,
    { label: 'example-source-ping1' },
    EventingContextType.SOURCE,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testSourceGenericPing5TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSourceGenericPing5,
    { label: 'example-source-ping5' },
    EventingContextType.SOURCE,
    vscode.TreeItemCollapsibleState.Expanded,
  );

  const testSourceTreeItems = [
    testSourceApiserver0TreeItem,
    testSourceApiserver1TreeItem,
    testSourceApiserver2TreeItem,
    testSourceApiserver3TreeItem,
    testSourcePing0TreeItem,
    testSourcePing2TreeItem,
    testSourcePing3TreeItem,
    testSourcePing4TreeItem,
    testSourceBinding0TreeItem,
    testSourceBinding1TreeItem,
    testSourceBinding2TreeItem,
    testSourceBinding3TreeItem,
    testSourceGenericPing1TreeItem,
    testSourceGenericPing5TreeItem,
  ];

  // Sources without a Spec
  // API Server Source
  const testSource0EmptySpec: APIServerSource = new APIServerSource(
    'example-source-apiserver0-emptySpec',
    'Sources',
    undefined,
    undefined,
    JSON.parse(JSON.stringify(sourceEmptySpec.items[0])),
  );
  const testSourceAPI1EmptySpec: APIServerSource = new APIServerSource(
    'example-source-apiserver1-emptySpec',
    'Sources',
    undefined,
    undefined,
    JSON.parse(JSON.stringify(sourceEmptySpec.items[1])),
  );
  const testSource0TreeItemEmptySpec: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSource0EmptySpec,
    { label: 'example-source-apiserver0-emptySpec' },
    EventingContextType.SOURCE_APISERVER,
    vscode.TreeItemCollapsibleState.Expanded,
  );
  const testSourceAPI1TreeItemEmptySpec: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSourceAPI1EmptySpec,
    { label: 'example-source-apiserver1-emptySpec' },
    EventingContextType.SOURCE_APISERVER,
    vscode.TreeItemCollapsibleState.Expanded,
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
  );
  // ping source as Generic source
  const testSource2EmptySpec: GenericSource = new GenericSource(
    'example-source-ping1-emptySpec',
    'Sources',
    'Source',
    undefined,
    null,
    JSON.parse(JSON.stringify(sourceEmptySpec.items[5])),
  );
  const testSource2TreeItemEmptySpec: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[2],
    testSource2EmptySpec,
    { label: 'example-source-ping1-emptySpec' },
    EventingContextType.SOURCE,
    vscode.TreeItemCollapsibleState.Expanded,
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
  );
  const testSourceTreeItemEmptySpecs = [
    testSource0TreeItemEmptySpec,
    testSource1TreeItemEmptySpec,
    testSource2TreeItemEmptySpec,
    testSource3TreeItemEmptySpec,
  ];

  const testService0: Service = new Service(
    'aaa',
    'http://aaa-a-serverless-example.apps.devcluster.openshift.com',
    JSON.parse(JSON.stringify(multipleServiceData.items[0])),
  );
  testService0.modified = false;
  const testService0ForSourceApiserver0TreeItem: ServingTreeItem = new ServingTreeItem(
    testSourceTreeItems[0],
    testService0,
    { label: 'Sink - aaa' },
    ServingContextType.SERVICE,
    vscode.TreeItemCollapsibleState.None,
  );
  const testService0ForSourcePing0TreeItem: ServingTreeItem = new ServingTreeItem(
    testSourceTreeItems[4],
    testService0,
    { label: 'Sink - aaa' },
    ServingContextType.SERVICE,
    vscode.TreeItemCollapsibleState.None,
  );
  const testService0ForSourceGenericPing1TreeItem: ServingTreeItem = new ServingTreeItem(
    testSourceTreeItems[12],
    testService0,
    { label: 'Sink - aaa' },
    ServingContextType.SERVICE,
    vscode.TreeItemCollapsibleState.None,
  );
  const testService0ForSourceBinding0TreeItem: ServingTreeItem = new ServingTreeItem(
    testSourceTreeItems[8],
    testService0,
    { label: 'Sink - aaa' },
    ServingContextType.SERVICE,
    vscode.TreeItemCollapsibleState.None,
  );

  const testBroker0: Broker = new Broker('example-broker0', 'Brokers', JSON.parse(JSON.stringify(brokerData.items[0])));
  const testBroker0ForSourceApiserver1TreeItem: EventingTreeItem = new EventingTreeItem(
    testSourceTreeItems[1],
    testBroker0,
    { label: 'Sink - example-broker0' },
    EventingContextType.BROKER,
    vscode.TreeItemCollapsibleState.None,
  );
  const testBroker0ForSourcePing1TreeItem: EventingTreeItem = new EventingTreeItem(
    testSourceTreeItems[5],
    testBroker0,
    { label: 'Sink - example-broker0' },
    EventingContextType.BROKER,
    vscode.TreeItemCollapsibleState.None,
  );
  const testBroker0ForSourceBinding1TreeItem: EventingTreeItem = new EventingTreeItem(
    testSourceTreeItems[9],
    testBroker0,
    { label: 'Sink - example-broker0' },
    EventingContextType.BROKER,
    vscode.TreeItemCollapsibleState.None,
  );

  const testChannel0: Channel = new Channel(
    'example-channel0',
    'Channels',
    'InMemoryChannel',
    JSON.parse(JSON.stringify(channelData.items[0])),
  );
  const testChannel0ForSourceApiserver2TreeItem: EventingTreeItem = new EventingTreeItem(
    testSourceTreeItems[2],
    testChannel0,
    { label: 'Sink - example-channel0' },
    EventingContextType.CHANNEL,
    vscode.TreeItemCollapsibleState.None,
  );
  const testChannel0ForSourcePing2TreeItem: EventingTreeItem = new EventingTreeItem(
    testSourceTreeItems[6],
    testChannel0,
    { label: 'Sink - example-channel0' },
    EventingContextType.CHANNEL,
    vscode.TreeItemCollapsibleState.None,
  );
  const testChannel0ForSourceBinding2TreeItem: EventingTreeItem = new EventingTreeItem(
    testSourceTreeItems[10],
    testChannel0,
    { label: 'Sink - example-channel0' },
    EventingContextType.CHANNEL,
    vscode.TreeItemCollapsibleState.None,
  );

  const testURIForSourceApiserver3TreeItem: EventingTreeItem = new EventingTreeItem(
    testSourceTreeItems[3],
    null,
    { label: 'Sink - https://event.receiver.uri/' },
    EventingContextType.URI,
    vscode.TreeItemCollapsibleState.None,
  );
  const testURIForSourcePing3TreeItem: EventingTreeItem = new EventingTreeItem(
    testSourceTreeItems[7],
    null,
    { label: 'Sink - https://event.receiver.uri/' },
    EventingContextType.URI,
    vscode.TreeItemCollapsibleState.None,
  );
  const testURIForSourceBinding3TreeItem: EventingTreeItem = new EventingTreeItem(
    testSourceTreeItems[11],
    null,
    { label: 'Sink - https://event.receiver.uri/' },
    EventingContextType.URI,
    vscode.TreeItemCollapsibleState.None,
  );
  const testURIForSourceGenericPing5TreeItem: EventingTreeItem = new EventingTreeItem(
    testSourceTreeItems[13],
    null,
    { label: 'Sink - https://event.receiver.uri/' },
    EventingContextType.URI,
    vscode.TreeItemCollapsibleState.None,
  );

  beforeEach(async () => {
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
    sandbox.stub(brokerDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(brokerData) });
    await brokerDataProvider.getBrokers(eventingFolderNodes[0]);
    sandbox.stub(channelDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(channelData) });
    await channelDataProvider.getChannels(eventingFolderNodes[1]);
    sandbox
      .stub(servingDataProvider.knExecutor, 'execute')
      .resolves({ error: undefined, stdout: JSON.stringify(multipleServiceData) });
    const servingTreeItems = await servingDataProvider.getServices();
    const service: Service = servingTreeItems[0].getKnativeItem() as Service;
    service.modified = false;
    ksvc.updateService(service);
    knativeSources.addSources(testSources);
  });
  teardown(() => {
    sandbox.restore();
  });

  suite('Get Sources', () => {
    test('should return a node of "No Source Found" when there is no data returned for Sources', async () => {
      sandbox.stub(sourceDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: `No sources found.` });
      const result = await sourceDataProvider.getSources(eventingFolderNodes[2]);
      expect(result).to.have.lengthOf(1);
      expect(result[0].description).to.equal('');
      expect(result[0].description).to.equal('');
      expect(result[0].label.label).to.equal('No Source Found');
      expect(result[0].getName()).to.equal('No Source Found');
    });
    test('should refetch source info when it is incomplete, then return source nodes', async () => {
      const exeStub = sandbox.stub(sourceDataProvider.knExecutor, 'execute');
      exeStub.onFirstCall().resolves({ error: undefined, stdout: JSON.stringify(sourceIncompleteData) });
      exeStub.onSecondCall().resolves({ error: undefined, stdout: JSON.stringify(sourceData) });
      const result = await sourceDataProvider.getSources(eventingFolderNodes[2]);
      expect(result[0]).to.deep.equal(testSourceTreeItems[0]);
      expect(result).to.have.lengthOf(14);
      expect(result[0].label.label).to.equal('example-source-apiserver0');
    });
    test('should return API source nodes', async () => {
      sandbox.stub(sourceDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(sourceData) });
      const result = await sourceDataProvider.getSources(eventingFolderNodes[2]);
      expect(result[0]).to.deep.equal(testSourceTreeItems[0]);
      expect(result).to.have.lengthOf(14);
      expect(result[0].label.label).to.equal('example-source-apiserver0');
    });
    test('should return Ping source nodes', async () => {
      sandbox.stub(sourceDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(sourceData) });
      const result = await sourceDataProvider.getSources(eventingFolderNodes[2]);
      expect(result[8]).to.deep.equal(testSourceTreeItems[4]);
      expect(result).to.have.lengthOf(14);
      expect(result[8].label.label).to.equal('example-source-ping0');
    });
    test('should return Generic source nodes', async () => {
      sandbox.stub(sourceDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(sourceData) });
      const result = await sourceDataProvider.getSources(eventingFolderNodes[2]);
      expect(result[9]).to.deep.equal(testSourceTreeItems[12]);
      expect(result).to.have.lengthOf(14);
      expect(result[9].label.label).to.equal('example-source-ping1');
    });
    test('should return Sink Binding source nodes', async () => {
      sandbox.stub(sourceDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(sourceData) });
      const result = await sourceDataProvider.getSources(eventingFolderNodes[2]);
      expect(result[4]).to.deep.equal(testSourceTreeItems[8]);
      expect(result).to.have.lengthOf(14);
      expect(result[4].label.label).to.equal('example-source-binding0');
    });

    // Test when the spec is empty
    test('should return API source nodes when the spec is empty', async () => {
      sandbox
        .stub(sourceDataProvider.knExecutor, 'execute')
        .resolves({ error: undefined, stdout: JSON.stringify(sourceEmptySpec) });
      const result = await sourceDataProvider.getSources(eventingFolderNodes[2]);
      expect(result[0]).to.deep.equal(testSourceTreeItemEmptySpecs[0]);
      expect(result).to.have.lengthOf(13);
      expect(result[0].label.label).to.equal('example-source-apiserver0-emptySpec');
    });
    test('should return API source nodes when the spec is empty but there is an empty resources node', async () => {
      sandbox
        .stub(sourceDataProvider.knExecutor, 'execute')
        .resolves({ error: undefined, stdout: JSON.stringify(sourceEmptySpec) });
      const result = await sourceDataProvider.getSources(eventingFolderNodes[2]);
      expect(result[1]).to.deep.equal(testSourceAPI1TreeItemEmptySpec);
      expect(result).to.have.lengthOf(13);
      expect(result[1].label.label).to.equal('example-source-apiserver1-emptySpec');
    });
    test('should return Ping source nodes when the spec is empty', async () => {
      sandbox
        .stub(sourceDataProvider.knExecutor, 'execute')
        .resolves({ error: undefined, stdout: JSON.stringify(sourceEmptySpec) });
      const result = await sourceDataProvider.getSources(eventingFolderNodes[2]);
      expect(result[8]).to.deep.equal(testSourceTreeItemEmptySpecs[1]);
      expect(result).to.have.lengthOf(13);
      expect(result[8].label.label).to.equal('example-source-ping0-emptySpec');
    });
    test('should return Generic source nodes when the spec is empty', async () => {
      sandbox
        .stub(sourceDataProvider.knExecutor, 'execute')
        .resolves({ error: undefined, stdout: JSON.stringify(sourceEmptySpec) });
      const result = await sourceDataProvider.getSources(eventingFolderNodes[2]);
      expect(result[9]).to.deep.equal(testSourceTreeItemEmptySpecs[2]);
      expect(result).to.have.lengthOf(13);
      expect(result[9].label.label).to.equal('example-source-ping1-emptySpec');
    });
    test('should return Sink Binding source nodes when the spec is empty', async () => {
      sandbox
        .stub(sourceDataProvider.knExecutor, 'execute')
        .resolves({ error: undefined, stdout: JSON.stringify(sourceEmptySpec) });
      const result = await sourceDataProvider.getSources(eventingFolderNodes[2]);
      expect(result[4]).to.deep.equal(testSourceTreeItemEmptySpecs[3]);
      expect(result).to.have.lengthOf(13);
      expect(result[4].label.label).to.equal('example-source-binding0-emptySpec');
    });
  });
  suite('Get Missing Source Children', () => {
    test('should return a node of "Child Not Found" when there is no data returned for the Children', async () => {
      sandbox.stub(sourceDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(sourceData) });
      await sourceDataProvider.getSources(eventingFolderNodes[2]);
      const result = sourceDataProvider.getSourceChildren(testSourceMissingDataTreeItem);
      expect(result).to.have.lengthOf(1);
      expect(result[0].description).to.equal('');
      expect(result[0].label.label).to.equal('Sink Not Found');
      expect(result[0].getName()).to.equal('Sink Not Found');
    });
  });
  suite('Get Api Server Source Children', () => {
    test('should return a node of "Child Not Found" when there is no data returned for the Children', async () => {
      sandbox.stub(sourceDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(sourceData) });
      await sourceDataProvider.getSources(eventingFolderNodes[2]);
      const result = sourceDataProvider.getSourceChildren(testSourceMissingDataTreeItem);
      expect(result).to.have.lengthOf(1);
      expect(result[0].description).to.equal('');
      expect(result[0].label.label).to.equal('Sink Not Found');
      expect(result[0].getName()).to.equal('Sink Not Found');
    });
    test('should return service child node for Api Server source', async () => {
      sandbox.stub(sourceDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(sourceData) });
      await sourceDataProvider.getSources(eventingFolderNodes[2]);
      const result = sourceDataProvider.getSourceChildren(testSourceTreeItems[0]);
      expect(result[0]).to.deep.equal(testService0ForSourceApiserver0TreeItem);
      expect(result).to.have.lengthOf(1);
      expect(result[0].label.label).to.equal('Sink - aaa');
    });
    test('should return broker child node for Api Server source', async () => {
      sandbox.stub(sourceDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(sourceData) });
      await sourceDataProvider.getSources(eventingFolderNodes[2]);
      const result = sourceDataProvider.getSourceChildren(testSourceTreeItems[1]);
      expect(result[0]).to.deep.equal(testBroker0ForSourceApiserver1TreeItem);
      expect(result).to.have.lengthOf(1);
      expect(result[0].label.label).to.equal('Sink - example-broker0');
    });
    test('should return channel child node for Api Server source', async () => {
      sandbox.stub(sourceDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(sourceData) });
      await sourceDataProvider.getSources(eventingFolderNodes[2]);
      const result = sourceDataProvider.getSourceChildren(testSourceTreeItems[2]);
      expect(result[0]).to.deep.equal(testChannel0ForSourceApiserver2TreeItem);
      expect(result).to.have.lengthOf(1);
      expect(result[0].label.label).to.equal('Sink - example-channel0');
    });
    test('should return URI child node for Api Server source', async () => {
      sandbox.stub(sourceDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(sourceData) });
      await sourceDataProvider.getSources(eventingFolderNodes[2]);
      const result = sourceDataProvider.getSourceChildren(testSourceTreeItems[3]);
      expect(result[0]).to.deep.equal(testURIForSourceApiserver3TreeItem);
      expect(result).to.have.lengthOf(1);
      expect(result[0].label.label).to.equal('Sink - https://event.receiver.uri/');
    });
  });
  suite('Get Ping Source Children', () => {
    test('should return service child node for Ping source', async () => {
      sandbox.stub(sourceDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(sourceData) });
      await sourceDataProvider.getSources(eventingFolderNodes[2]);
      const result = sourceDataProvider.getSourceChildren(testSourceTreeItems[4]);
      expect(result[0]).to.deep.equal(testService0ForSourcePing0TreeItem);
      expect(result).to.have.lengthOf(1);
      expect(result[0].label.label).to.equal('Sink - aaa');
    });
    test('should return broker child node for Ping source', async () => {
      sandbox.stub(sourceDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(sourceData) });
      await sourceDataProvider.getSources(eventingFolderNodes[2]);
      const result = sourceDataProvider.getSourceChildren(testSourceTreeItems[5]);
      expect(result[0]).to.deep.equal(testBroker0ForSourcePing1TreeItem);
      expect(result).to.have.lengthOf(1);
      expect(result[0].label.label).to.equal('Sink - example-broker0');
    });
    test('should return channel child node for Ping source', async () => {
      sandbox.stub(sourceDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(sourceData) });
      await sourceDataProvider.getSources(eventingFolderNodes[2]);
      const result = sourceDataProvider.getSourceChildren(testSourceTreeItems[6]);
      expect(result[0]).to.deep.equal(testChannel0ForSourcePing2TreeItem);
      expect(result).to.have.lengthOf(1);
      expect(result[0].label.label).to.equal('Sink - example-channel0');
    });
    test('should return URI child node for Ping source', async () => {
      sandbox.stub(sourceDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(sourceData) });
      await sourceDataProvider.getSources(eventingFolderNodes[2]);
      const result = sourceDataProvider.getSourceChildren(testSourceTreeItems[7]);
      expect(result[0]).to.deep.equal(testURIForSourcePing3TreeItem);
      expect(result).to.have.lengthOf(1);
      expect(result[0].label.label).to.equal('Sink - https://event.receiver.uri/');
    });
  });
  suite('Get Binding Source Children', () => {
    test('should return service child node for Binding source', async () => {
      sandbox.stub(sourceDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(sourceData) });
      await sourceDataProvider.getSources(eventingFolderNodes[2]);
      const result = sourceDataProvider.getSourceChildren(testSourceTreeItems[8]);
      expect(result[0]).to.deep.equal(testService0ForSourceBinding0TreeItem);
      expect(result).to.have.lengthOf(1);
      expect(result[0].label.label).to.equal('Sink - aaa');
    });
    test('should return broker child node for Binding source', async () => {
      sandbox.stub(sourceDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(sourceData) });
      await sourceDataProvider.getSources(eventingFolderNodes[2]);
      const result = sourceDataProvider.getSourceChildren(testSourceTreeItems[9]);
      expect(result[0]).to.deep.equal(testBroker0ForSourceBinding1TreeItem);
      expect(result).to.have.lengthOf(1);
      expect(result[0].label.label).to.equal('Sink - example-broker0');
    });
    test('should return channel child node for Binding source', async () => {
      sandbox.stub(sourceDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(sourceData) });
      await sourceDataProvider.getSources(eventingFolderNodes[2]);
      const result = sourceDataProvider.getSourceChildren(testSourceTreeItems[10]);
      expect(result[0]).to.deep.equal(testChannel0ForSourceBinding2TreeItem);
      expect(result).to.have.lengthOf(1);
      expect(result[0].label.label).to.equal('Sink - example-channel0');
    });
    test('should return URI child node for Binding source', async () => {
      sandbox.stub(sourceDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(sourceData) });
      await sourceDataProvider.getSources(eventingFolderNodes[2]);
      const result = sourceDataProvider.getSourceChildren(testSourceTreeItems[11]);
      expect(result[0]).to.deep.equal(testURIForSourceBinding3TreeItem);
      expect(result).to.have.lengthOf(1);
      expect(result[0].label.label).to.equal('Sink - https://event.receiver.uri/');
    });
  });
  suite('Get Generic Source Children', () => {
    test('should return service child node for Generic (ping) source', async () => {
      sandbox.stub(sourceDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(sourceData) });
      await sourceDataProvider.getSources(eventingFolderNodes[2]);
      const result = sourceDataProvider.getSourceChildren(testSourceTreeItems[12]);
      expect(result[0]).to.deep.equal(testService0ForSourceGenericPing1TreeItem);
      expect(result).to.have.lengthOf(1);
      expect(result[0].label.label).to.equal('Sink - aaa');
    });
    test('should return URI child node for Generic (ping) source', async () => {
      sandbox.stub(sourceDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(sourceData) });
      await sourceDataProvider.getSources(eventingFolderNodes[2]);
      const result = sourceDataProvider.getSourceChildren(testSourceTreeItems[13]);
      expect(result[0]).to.deep.equal(testURIForSourceGenericPing5TreeItem);
      expect(result).to.have.lengthOf(1);
      expect(result[0].label.label).to.equal('Sink - https://event.receiver.uri/');
    });
  });
});
