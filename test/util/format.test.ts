import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as referee from '@sinonjs/referee';
import { prettifyJson } from '../../src/util/format';

const { assert } = referee;
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
    assert.equals(convertedJson, expectedJSON);
  });
  test('should catch when a token is included', () => {
    const convertedTokenJson = prettifyJson(startingTokenJSON);
    assert.equals(convertedTokenJson, expectedTokenJSON);
  });
});
