/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { expect } from 'chai';
import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import { prettifyJson } from '../../src/util/format';

chai.use(sinonChai);

suite('Format', () => {
  const startingJSON = '{"name":"John", "age":31, "city":"New York"}';
  const expectedJSON = `{
  "name": "John",
  "age": 31,
  "city": "New York"
}`;
  const startingTokenJSON = `/bin/kn revision list --token=xxx -o json -s knative-tut`;
  const expectedTokenJSON = `/bin/kn revision list --token ********** -o json -s knative-tut`;

  test('should convert unstructured JSON into nicely formatted JSON', () => {
    const convertedJson = prettifyJson(startingJSON);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    expect(convertedJson).to.equal(expectedJSON);
  });
  test('should catch when a token is included', () => {
    const convertedTokenJson = prettifyJson(startingTokenJSON);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    expect(convertedTokenJson).to.equal(expectedTokenJSON);
  });
});
