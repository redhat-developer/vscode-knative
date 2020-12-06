import * as vscode from 'vscode';
import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as sinon from 'sinon';
import * as referee from '@sinonjs/referee';
import { beforeEach } from 'mocha';
import * as brokerData from '../eventingTree/broker.json';
import { KnativeBrokers } from '../../src/knative/knativeBrokers';
import { Broker } from '../../src/knative/broker';

const { assert } = referee;
const { expect } = chai;
chai.use(sinonChai);

suite('Knative Brokers', () => {
  const sandbox = sinon.createSandbox();
  const knativeBrokers: KnativeBrokers = KnativeBrokers.Instance;
  const testBroker0: Broker = new Broker('exampleBroker0', 'Brokers', JSON.parse(JSON.stringify(brokerData.items[0])));
  const testBroker1: Broker = new Broker('exampleBroker1', 'Brokers', JSON.parse(JSON.stringify(brokerData.items[1])));
  let testBrokers: Broker[];

  beforeEach(() => {
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
    testBrokers = [testBroker0, testBroker1];
    knativeBrokers.addBrokers(testBrokers);
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('Getting an instance', () => {
    test('should return an instance of the singleton', () => {
      const instance: KnativeBrokers = KnativeBrokers.Instance;
      assert.equals(instance, knativeBrokers);
    });
  });
  suite('Getting a Broker', () => {
    test('should return a list of brokers from the instance', () => {
      const returnedBroker: Broker = knativeBrokers.getBrokers()[0];
      assert.equals(testBroker0, returnedBroker);
    });
  });
  suite('Finding a Broker', () => {
    test('should return a broker using the broker name', () => {
      const returnedBroker: Broker = knativeBrokers.findBroker('exampleBroker0');
      assert.equals(testBroker0, returnedBroker);
    });
  });
  suite('Adding a Broker', () => {
    test('should add a broker and return the broker added', () => {
      const remainingBrokers: Broker[] = knativeBrokers.removeBroker('exampleBroker1');
      expect(remainingBrokers).to.have.lengthOf(1);
      const returnedBroker: Broker = knativeBrokers.addBroker(testBroker1);
      assert.equals(testBroker1, returnedBroker);
    });
  });
  suite('Adding multiple Brokers', () => {
    test('should add a list of brokers return a list of brokers added', () => {
      const remainingBrokers: Broker[] = knativeBrokers.removeBroker('exampleBroker1');
      expect(remainingBrokers).to.have.lengthOf(1);
      const returnedBrokers: Broker[] = knativeBrokers.addBrokers(testBrokers);
      assert.equals(testBrokers, returnedBrokers);
    });
  });
  suite('Updating a Broker', () => {
    test('should return a list of brokers, including the updated one', () => {
      const returnedBrokers: Broker[] = knativeBrokers.updateBroker(testBroker1);
      assert.equals(testBrokers, returnedBrokers);
    });
  });
});
