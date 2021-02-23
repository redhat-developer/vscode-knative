/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { expect } from 'chai';
import * as sinon from 'sinon';
import { Filters } from '../../src/util/filters';

suite('Filters utility class', () => {
  const sandbox = sinon.createSandbox();

  teardown(() => {
    sandbox.restore();
  });

  test('should replace token string in given text', () => {
    const spy = sandbox.spy(Filters, 'filterToken');
    expect(Filters.filterToken('some string and given --token=xxx, should result in filtered string')).to.include(
      '--token **********',
    );
    expect(spy.calledOnce);
  });
  test('should not replace similar token-like expression string in given text', () => {
    expect(
      Filters.filterToken('some string and given token=xxx or --token xxx or -- token=xxx, should not result in filtered string'),
    ).not.to.include('--token **********');
  });
  test('should replace password string in given text', () => {
    const spy = sandbox.spy(Filters, 'filterToken');
    expect(
      Filters.filterPassword(`some string and given password -p 'MySecretT3xt?*', should result in filtered string`),
    ).to.include('-p **********');
    expect(spy.calledOnce);
  });
  test('should not replace similar password-like string or parameter annotation in given text', () => {
    expect(
      Filters.filterPassword(
        `some string and given parameter --p 'not exactlyPass' or --p='again not a password' neither -p=someValue`,
      ),
    ).to.include('-p **********');
  });
  test('should return same falsy object if not full string', () => {
    expect(Filters.filterToken('')).to.equal('');
    expect(Filters.filterToken(null)).to.equal(null);
    expect(Filters.filterToken(undefined)).to.equal(undefined);
  });
});
