/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { TestItem } from './testFunctionitem';
import { FunctionContextType } from '../../src/cli/config';
import { func, FuncImpl } from '../../src/functions/func';
import { functionExplorer } from '../../src/functions/functionsExplorer';

const { expect } = chai;
chai.use(sinonChai);

suite('Function/FunctionExplorer', () => {
  const sandbox = sinon.createSandbox();
  const element = new TestItem(FuncImpl.ROOT, 'namespace', FunctionContextType.NAMESPACENODE);

  teardown(() => {
    sandbox.restore();
  });

  test('return tree item', () => {
    const result = functionExplorer.getTreeItem(element);
    expect(result).equal(element);
  });

  test('return children node', () => {
    const result = functionExplorer.getChildren(element);
    expect(result).equal(element.getChildren());
  });

  test('return children node from function', async () => {
    sandbox.stub(func, 'getFunctionNodes').resolves([element]);
    const result = await functionExplorer.getChildren();
    expect(result).deep.equal([element]);
  });

  test('return parent node', () => {
    const result = functionExplorer.getParent(element);
    expect(result).equal(element.getParent());
  });

  test('return section', () => {
    sandbox.stub(functionExplorer.treeView, 'selection').value([element]);
    const result = functionExplorer.getSelection();
    expect(result).deep.equal([element]);
  });

  test('tree view is visible', () => {
    sandbox.stub(functionExplorer.treeView, 'visible').value(true);
    const result = functionExplorer.isVisible();
    expect(result).equal(true);
  });

  test('reveal node', async () => {
    const revealStub = sandbox.stub(functionExplorer.treeView, 'reveal').resolves();
    await functionExplorer.reveal(element);
    // eslint-disable-next-line no-unused-expressions
    revealStub.calledTwice;
  });
});
