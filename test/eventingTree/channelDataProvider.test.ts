import * as vscode from 'vscode';
import * as chai from 'chai';
import { beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as referee from '@sinonjs/referee';
import * as channelData from './channel.json';
import * as channelEmptySpecData from './channelEmptySpec.json';
import * as channelIncompleteData from './channelIncomplete.json';
import { EventingContextType } from '../../src/cli/config';
import { EventingDataProvider } from '../../src/eventingTree/eventingDataProvider';
import { EventingTreeItem } from '../../src/eventingTree/eventingTreeItem';
import { ChannelDataProvider } from '../../src/eventingTree/channelDataProvider';
import { Channel } from '../../src/knative/channel';

const { assert } = referee;
const { expect } = chai;
chai.use(sinonChai);

suite('ChannelDataProvider', () => {
  const sandbox = sinon.createSandbox();
  const channelDataProvider: ChannelDataProvider = new ChannelDataProvider();
  const eventingDataProvider: EventingDataProvider = new EventingDataProvider();

  const eventingFolderNodes: EventingTreeItem[] = eventingDataProvider.getEventingFolders();

  const testChannel0: Channel = new Channel(
    'example-channel0',
    'Channels',
    'InMemoryChannel',
    JSON.parse(JSON.stringify(channelData.items[0])),
  );
  const testChannel1: Channel = new Channel(
    'example-channel1',
    'Channels',
    'InMemoryChannel',
    JSON.parse(JSON.stringify(channelData.items[1])),
  );
  const testChannel0TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[1],
    testChannel0,
    { label: 'example-channel0' },
    EventingContextType.CHANNEL,
    vscode.TreeItemCollapsibleState.None,
  );
  const testChannel1TreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[1],
    testChannel1,
    { label: 'example-channel1' },
    EventingContextType.CHANNEL,
    vscode.TreeItemCollapsibleState.None,
  );
  const testChannelTreeItems = [testChannel0TreeItem, testChannel1TreeItem];

  // Empty Spec version
  const testChannel0EmptySpec: Channel = new Channel(
    'example-channel0',
    'Channels',
    undefined,
    JSON.parse(JSON.stringify(channelEmptySpecData.items[0])),
  );
  const testChannel0EmptySpecTreeItem: EventingTreeItem = new EventingTreeItem(
    eventingFolderNodes[1],
    testChannel0EmptySpec,
    { label: 'example-channel0' },
    EventingContextType.CHANNEL,
    vscode.TreeItemCollapsibleState.None,
  );

  beforeEach(() => {
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
  });
  teardown(() => {
    sandbox.restore();
  });

  suite('Get Channels', () => {
    test('should return a node of "No Channel Found" when there is no data returned for Channels', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox.stub(channelDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: `No channels found.` });
      const result = await channelDataProvider.getChannels(eventingFolderNodes[1]);
      expect(result).to.have.lengthOf(1);
      expect(result[0].description).equals('');
      expect(result[0].description).equals('');
      expect(result[0].label.label).equals('No Channel Found');
      expect(result[0].getName()).equals('No Channel Found');
    });
    test('should return channel nodes', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox.stub(channelDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: JSON.stringify(channelData) });
      const result = await channelDataProvider.getChannels(eventingFolderNodes[1]);
      assert.equals(result[0], testChannelTreeItems[0]);
      expect(result).to.have.lengthOf(4);
      expect(result[0].label.label).equals('example-channel0');
    });
    test('should return channel nodes when the spec is empty', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      sandbox
        .stub(channelDataProvider.knExecutor, 'execute')
        .resolves({ error: undefined, stdout: JSON.stringify(channelEmptySpecData) });
      const result = await channelDataProvider.getChannels(eventingFolderNodes[1]);
      assert.equals(result[0], testChannel0EmptySpecTreeItem);
      expect(result).to.have.lengthOf(4);
      expect(result[0].label.label).equals('example-channel0');
    });
    test('should refetch channel info when it is incomplete, then return channel nodes', async () => {
      sandbox.restore();
      sandbox.stub(vscode.window, 'showErrorMessage').resolves();
      const exeStub = sandbox.stub(channelDataProvider.knExecutor, 'execute');
      exeStub.onFirstCall().resolves({ error: undefined, stdout: JSON.stringify(channelIncompleteData) });
      exeStub.onSecondCall().resolves({ error: undefined, stdout: JSON.stringify(channelData) });
      const result = await channelDataProvider.getChannels(eventingFolderNodes[1]);
      assert.equals(result[0], testChannelTreeItems[0]);
      expect(result).to.have.lengthOf(4);
      expect(result[0].label.label).equals('example-channel0');
    });
  });
});
