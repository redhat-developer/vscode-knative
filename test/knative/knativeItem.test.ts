import * as vscode from 'vscode';
import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as sinon from 'sinon';
import * as referee from '@sinonjs/referee';
import { beforeEach } from 'mocha';
import { compareNodes } from '../../src/knative/knativeItem';

const { assert } = referee;
// const { expect } = chai;
chai.use(sinonChai);

suite('Knative Brokers', () => {
  const sandbox = sinon.createSandbox();

  const treeItemStringLabel1: vscode.TreeItem = new vscode.TreeItem('first');
  treeItemStringLabel1.contextValue = 'alpha';
  const treeItemStringLabel2: vscode.TreeItem = new vscode.TreeItem('second');
  treeItemStringLabel2.contextValue = 'beta';
  const treeItemObjectLabel1: vscode.TreeItem = new vscode.TreeItem({ label: 'first' });
  treeItemObjectLabel1.contextValue = 'alpha';
  const treeItemObjectLabel2: vscode.TreeItem = new vscode.TreeItem({ label: 'second' });
  treeItemObjectLabel2.contextValue = 'beta';

  beforeEach(() => {
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('Compare Tree Items', () => {
    test('should return less than zero when comparing tree nodes with string labels that are in order', () => {
      const result = compareNodes(treeItemStringLabel1, treeItemStringLabel2);
      assert.less(result, 0);
    });
    test('should return greater than zero when comparing tree nodes with string labels that are not in order', () => {
      const result = compareNodes(treeItemStringLabel2, treeItemStringLabel1);
      assert.greater(result, 0);
    });
    test('should return less than zero when comparing tree nodes with object labels that are in order', () => {
      const result = compareNodes(treeItemObjectLabel1, treeItemObjectLabel2);
      assert.less(result, 0);
    });
    test('should return greater than zero when comparing tree nodes with object labels that are not in order', () => {
      const result = compareNodes(treeItemObjectLabel2, treeItemObjectLabel1);
      assert.greater(result, 0);
    });
  });
});
