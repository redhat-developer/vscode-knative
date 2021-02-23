import * as vscode from 'vscode';
import { expect } from 'chai';
import * as chai from 'chai';
import { beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { Channel } from '../../src/knative/channel';
import { KnativeChannels } from '../../src/knative/knativeChannels';
import * as channelData from '../eventingTree/channel.json';

chai.use(sinonChai);

suite('Knative Channels', () => {
  const sandbox = sinon.createSandbox();
  const knativeChannels: KnativeChannels = KnativeChannels.Instance;
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
  let testChannels: Channel[];

  beforeEach(() => {
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
    testChannels = [testChannel0, testChannel1];
    knativeChannels.addChannels(testChannels);
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('Getting an instance', () => {
    test('should return an instance of the singleton', () => {
      const instance: KnativeChannels = KnativeChannels.Instance;
      expect(instance).to.deep.equal(knativeChannels);
    });
  });
  suite('Getting a Channel', () => {
    test('should return a list of channels from the instance', () => {
      const returnedChannel: Channel = knativeChannels.getChannels()[0];
      expect(returnedChannel).to.deep.equal(testChannel0);
    });
  });
  suite('Finding a Channel', () => {
    test('should return a channel using the channel name', () => {
      const returnedChannel: Channel = knativeChannels.findChannel('example-channel0');
      expect(returnedChannel).to.deep.equal(testChannel0);
    });
  });
  suite('Adding a Channel', () => {
    test('should add a channel and return the channel added', () => {
      const remainingChannels: Channel[] = knativeChannels.removeChannel('example-channel1');
      expect(remainingChannels).to.have.lengthOf(1);
      const returnedChannel: Channel = knativeChannels.addChannel(testChannel1);
      expect(returnedChannel).to.deep.equal(testChannel1);
    });
  });
  suite('Adding multiple channels', () => {
    test('should add a list of channels return a list of channels added', () => {
      const remainingChannels: Channel[] = knativeChannels.removeChannel('example-channel1');
      expect(remainingChannels).to.have.lengthOf(1);
      const returnedChannels: Channel[] = knativeChannels.addChannels(testChannels);
      expect(returnedChannels).to.deep.equal(testChannels);
    });
  });
  suite('Updating a Channel', () => {
    test('should return a list of channels, including the updated one', () => {
      const returnedChannels: Channel[] = knativeChannels.updateChannel(testChannel1);
      expect(returnedChannels).to.deep.equal(testChannels);
    });
  });
});
