import * as vscode from 'vscode';
import { expect } from 'chai';
import * as chai from 'chai';
import { beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { Broker } from '../../src/knative/broker';
import { KnativeBrokers } from '../../src/knative/knativeBrokers';
import * as brokerData from '../eventingTree/broker.json';

chai.use(sinonChai);

suite('Knative Brokers', () => {
  const sandbox = sinon.createSandbox();
  const knativeBrokers: KnativeBrokers = KnativeBrokers.Instance;
  const testBroker0: Broker = new Broker('example-broker0', 'Brokers', JSON.parse(JSON.stringify(brokerData.items[0])));
  const testBroker1: Broker = new Broker('example-broker1', 'Brokers', JSON.parse(JSON.stringify(brokerData.items[1])));
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
      expect(instance).to.deep.equal(knativeBrokers);
    });
  });
  suite('Getting a Broker', () => {
    test('should return a list of brokers from the instance', () => {
      const returnedBroker: Broker = knativeBrokers.getBrokers()[0];
      expect(returnedBroker).to.deep.equal(testBroker0);
    });
  });
  suite('Finding a Broker', () => {
    test('should return a broker using the broker name', () => {
      const returnedBroker: Broker = knativeBrokers.findBroker('example-broker0');
      expect(returnedBroker).to.deep.equal(testBroker0);
    });
  });
  suite('Adding a Broker', () => {
    test('should add a broker and return the broker added', () => {
      const remainingBrokers: Broker[] = knativeBrokers.removeBroker('example-broker1');
      expect(remainingBrokers).to.have.lengthOf(1);
      const returnedBroker: Broker = knativeBrokers.addBroker(testBroker1);
      expect(returnedBroker).to.deep.equal(testBroker1);
    });
  });
  suite('Adding multiple Brokers', () => {
    test('should add a list of brokers return a list of brokers added', () => {
      const remainingBrokers: Broker[] = knativeBrokers.removeBroker('example-broker1');
      expect(remainingBrokers).to.have.lengthOf(1);
      const returnedBrokers: Broker[] = knativeBrokers.addBrokers(testBrokers);
      expect(returnedBrokers).to.deep.equal(testBrokers);
    });
  });
  suite('Updating a Broker', () => {
    test('should return a list of brokers, including the updated one', () => {
      const returnedBrokers: Broker[] = knativeBrokers.updateBroker(testBroker1);
      expect(returnedBrokers).to.deep.equal(testBrokers);
    });
  });
});
