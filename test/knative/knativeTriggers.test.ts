import * as vscode from 'vscode';
import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as sinon from 'sinon';
import * as referee from '@sinonjs/referee';
import { beforeEach } from 'mocha';
import * as triggerData from '../eventingTree/trigger.json';
import { KnativeTriggers } from '../../src/knative/knativeTriggers';
import { Trigger } from '../../src/knative/trigger';

const { assert } = referee;
const { expect } = chai;
chai.use(sinonChai);

suite('Knative Triggers', () => {
  const sandbox = sinon.createSandbox();
  const knativeTriggers: KnativeTriggers = KnativeTriggers.Instance;
  const testTrigger0: Trigger = new Trigger('example-trigger0', 'Triggers', JSON.parse(JSON.stringify(triggerData.items[0])));
  const testTrigger1: Trigger = new Trigger('example-trigger1', 'Triggers', JSON.parse(JSON.stringify(triggerData.items[1])));
  let testTriggers: Trigger[];

  beforeEach(() => {
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
    testTriggers = [testTrigger0, testTrigger1];
    knativeTriggers.addTriggers(testTriggers);
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('Getting an instance', () => {
    test('should return an instance of the singleton', () => {
      const instance: KnativeTriggers = KnativeTriggers.Instance;
      assert.equals(instance, knativeTriggers);
    });
  });
  suite('Getting a Trigger', () => {
    test('should return a list of triggers from the instance', () => {
      const returnedTrigger: Trigger = knativeTriggers.getTriggers()[0];
      assert.equals(testTrigger0, returnedTrigger);
    });
  });
  suite('Finding a Trigger', () => {
    test('should return a trigger using the trigger name', () => {
      const returnedTrigger: Trigger = knativeTriggers.findTrigger('example-trigger0');
      assert.equals(testTrigger0, returnedTrigger);
    });
  });
  suite('Adding a Trigger', () => {
    test('should add a trigger and return the trigger added', () => {
      const remainingTriggers: Trigger[] = knativeTriggers.removeTrigger('example-trigger1');
      expect(remainingTriggers).to.have.lengthOf(1);
      const returnedTrigger: Trigger = knativeTriggers.addTrigger(testTrigger1);
      assert.equals(testTrigger1, returnedTrigger);
    });
  });
  suite('Adding multiple Triggers', () => {
    test('should add a list of triggers return a list of triggers added', () => {
      const remainingTriggers: Trigger[] = knativeTriggers.removeTrigger('example-trigger1');
      expect(remainingTriggers).to.have.lengthOf(1);
      const returnedTriggers: Trigger[] = knativeTriggers.addTriggers(testTriggers);
      assert.equals(testTriggers, returnedTriggers);
    });
  });
  suite('Updating a Trigger', () => {
    test('should return a list of triggers, including the updated one', () => {
      const returnedTriggers: Trigger[] = knativeTriggers.updateTrigger(testTrigger1);
      assert.equals(testTriggers, returnedTriggers);
    });
  });
});
