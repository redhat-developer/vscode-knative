import * as vscode from 'vscode';
import { expect } from 'chai';
import * as chai from 'chai';
import { beforeEach } from 'mocha';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { compareNodes } from '../../src/knative/knativeItem';

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
      expect(result).to.be.lessThan(0);
    });
    test('should return greater than zero when comparing tree nodes with string labels that are not in order', () => {
      const result = compareNodes(treeItemStringLabel2, treeItemStringLabel1);
      expect(result).to.be.greaterThan(0);
    });
    test('should return less than zero when comparing tree nodes with object labels that are in order', () => {
      const result = compareNodes(treeItemObjectLabel1, treeItemObjectLabel2);
      expect(result).to.be.lessThan(0);
    });
    test('should return greater than zero when comparing tree nodes with object labels that are not in order', () => {
      const result = compareNodes(treeItemObjectLabel2, treeItemObjectLabel1);
      expect(result).to.be.greaterThan(0);
    });
  });
});
