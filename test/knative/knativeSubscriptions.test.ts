import * as vscode from 'vscode';
import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as sinon from 'sinon';
import * as referee from '@sinonjs/referee';
import { beforeEach } from 'mocha';
import * as subscriptionData from '../eventingTree/subscription.json';
import { KnativeSubscriptions } from '../../src/knative/knativeSubscriptions';
import { Subscription } from '../../src/knative/subscription';

const { assert } = referee;
const { expect } = chai;
chai.use(sinonChai);

suite('Knative Subscriptions', () => {
  const sandbox = sinon.createSandbox();
  const knativeSubscriptions: KnativeSubscriptions = KnativeSubscriptions.Instance;
  const testSubscription0: Subscription = new Subscription(
    'exampleSubscription0',
    'Subscriptions',
    null,
    null,
    null,
    null,
    JSON.parse(JSON.stringify(subscriptionData.items[0])),
  );
  const testSubscription1: Subscription = new Subscription(
    'exampleSubscription1',
    'Subscriptions',
    null,
    null,
    null,
    null,
    JSON.parse(JSON.stringify(subscriptionData.items[1])),
  );
  let testSubscriptions: Subscription[];

  beforeEach(() => {
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
    testSubscriptions = [testSubscription0, testSubscription1];
    knativeSubscriptions.addSubscriptions(testSubscriptions);
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('Getting an instance', () => {
    test('should return an instance of the singleton', () => {
      const instance: KnativeSubscriptions = KnativeSubscriptions.Instance;
      assert.equals(instance, knativeSubscriptions);
    });
  });
  suite('Getting a Subscription', () => {
    test('should return a list of subscriptions from the instance', () => {
      const returnedSubscription: Subscription = knativeSubscriptions.getSubscriptions()[0];
      assert.equals(testSubscription0, returnedSubscription);
    });
  });
  suite('Finding a Subscription', () => {
    test('should return a subscription using the subscription name', () => {
      const returnedSubscription: Subscription = knativeSubscriptions.findSubscription('exampleSubscription0');
      assert.equals(testSubscription0, returnedSubscription);
    });
  });
  suite('Adding a Subscription', () => {
    test('should add a subscription and return the subscription added', () => {
      const remainingSubscriptions: Subscription[] = knativeSubscriptions.removeSubscription('exampleSubscription1');
      expect(remainingSubscriptions).to.have.lengthOf(1);
      const returnedSubscription: Subscription = knativeSubscriptions.addSubscription(testSubscription1);
      assert.equals(testSubscription1, returnedSubscription);
    });
  });
  suite('Adding multiple Subscriptions', () => {
    test('should add a list of subscriptions return a list of subscriptions added', () => {
      const remainingSubscriptions: Subscription[] = knativeSubscriptions.removeSubscription('exampleSubscription1');
      expect(remainingSubscriptions).to.have.lengthOf(1);
      const returnedSubscriptions: Subscription[] = knativeSubscriptions.addSubscriptions(testSubscriptions);
      assert.equals(testSubscriptions, returnedSubscriptions);
    });
  });
  suite('Updating a Subscription', () => {
    test('should return a list of subscriptions, including the updated one', () => {
      const returnedSubscriptions: Subscription[] = knativeSubscriptions.updateSubscription(testSubscription1);
      assert.equals(testSubscriptions, returnedSubscriptions);
    });
  });
});
