import * as vscode from 'vscode';
import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as sinon from 'sinon';
import * as referee from '@sinonjs/referee';
import { ServiceDataProvider } from '../../src/tree/serviceDataProvider';
import * as singleServiceData from './singleServiceServiceList.json';
import * as singleServiceRevisionData from './singleServiceRevisionList.json';
import { KnativeTreeItem } from '../../src/tree/knativeTreeItem';
import { ContextType } from '../../src/kn/config';
import { KnativeItem } from '../../src/knative/knativeItem';
import { Service } from '../../src/knative/service';

// import rewire = require('rewire');

const { assert } = referee;
const { expect } = chai;
chai.use(sinonChai);

suite('ServiceDataProvider', () => {
  const sandbox = sinon.createSandbox();
  const serviceDataProvider = new ServiceDataProvider();

  teardown(() => {
    sandbox.restore();
  });

  // TODO: figure out how to test an event that is fired.
  suite('Refresh', () => {
    test('should fire the tree data change event', () => {
      const spy = sandbox.spy();
      serviceDataProvider.onDidChangeTreeData(spy);
      serviceDataProvider.refresh();
      assert(spy.calledOnce);
    });
  });

  suite('Getting a Tree Item', () => {
    test('should return the specific tree element requested', async () => {
      const parentKnativeItem: KnativeItem = new Service('greeter', 'quay.io/rhdevelopers/knative-tutorial-greeter:quarkus');
      const parent: KnativeTreeItem = new KnativeTreeItem(null, parentKnativeItem, 'greeter', ContextType.SERVICE, 0, null, null);
      const item: vscode.TreeItem = await serviceDataProvider.getTreeItem(parent);
      assert.equals(item, parent);
    });
  });

  suite('No Services', () => {
    test('getChildren should return the No Services node when KN execute returns "No Services found"', async () => {
      sandbox.stub(serviceDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: 'No services found.' });
      const result = await serviceDataProvider.getChildren();
      expect(result).to.have.lengthOf(1);
      expect(result[0].description).equals('');
      expect(result[0].label).equals('No Service Found');
      expect(result[0].getName()).equals('No Service Found');
    });
  });

  suite('Single service', () => {
    test('getChildren should return single node', async () => {
      sandbox
        .stub(serviceDataProvider.knExecutor, 'execute')
        .resolves({ error: undefined, stdout: JSON.stringify(singleServiceData) });
      const result = await serviceDataProvider.getChildren();
      expect(result).to.have.lengthOf(1);
      expect(result[0].description).equals('');
      expect(result[0].label).equals('greeter');
      expect(result[0].getName()).equals('greeter');
      expect(result[0].tooltip).equals('Service: greeter');
    });
  });

  suite('Single revision', () => {
    test('getChildren should return single node', async () => {
      sandbox
        .stub(serviceDataProvider.knExecutor, 'execute')
        .resolves({ error: undefined, stdout: JSON.stringify(singleServiceRevisionData) });
      const parentKnativeItem: KnativeItem = new Service('greeter', 'quay.io/rhdevelopers/knative-tutorial-greeter:quarkus');
      const parent: KnativeTreeItem = new KnativeTreeItem(null, parentKnativeItem, 'greeter', ContextType.SERVICE, 0, null, null);
      const result = await serviceDataProvider.getChildren(parent);
      expect(result).to.have.lengthOf(1);
      expect(result[0].description).equals('');
      expect(result[0].label).equals('greeter-btrnq-1');
      expect(result[0].getName()).equals('greeter-btrnq-1');
      expect(result[0].tooltip).equals('Revision: greeter-btrnq-1');
    });
  });

  suite('Getting a Parent Item', () => {
    test('should return null for a Service', () => {
      const parentKnativeItem: KnativeItem = new Service('greeter', 'quay.io/rhdevelopers/knative-tutorial-greeter:quarkus');
      const parent: KnativeTreeItem = new KnativeTreeItem(null, parentKnativeItem, 'greeter', ContextType.SERVICE, 0, null, null);
      const item: KnativeTreeItem = serviceDataProvider.getParent(parent);
      assert.equals(item, null);
    });
  });

  suite('Getting a Parent Item', () => {
    test('should return the Service of the Revision', async () => {
      sandbox
        .stub(serviceDataProvider.knExecutor, 'execute')
        .resolves({ error: undefined, stdout: JSON.stringify(singleServiceRevisionData) });
      const parentKnativeItem: KnativeItem = new Service('greeter', 'quay.io/rhdevelopers/knative-tutorial-greeter:quarkus');
      const parent: KnativeTreeItem = new KnativeTreeItem(null, parentKnativeItem, 'greeter', ContextType.SERVICE, 0, null, null);
      const result = await serviceDataProvider.getRevisions(parent);
      const item: KnativeTreeItem = serviceDataProvider.getParent(result[0]);
      assert.equals(item, parent);
    });
  });
});
