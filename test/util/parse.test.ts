import { assert, expect } from 'chai';
import { loadJSON } from '../../src/util/parse';

import fs = require('fs');
import path = require('path');

suite('Parse utility class', () => {
  const json = {
    parent: {
      child: 'foo',
    },
  };
  const filePath = path.join(__dirname, 'valid.json');
  const invalidJsonFilePath = path.join(__dirname, 'invalid.json');

  suiteSetup(() => {
    fs.writeFile(filePath, JSON.stringify(json), 'utf8', function erroneous(err: Error) {
      if (err) {
        throw err;
      }
    });
    fs.writeFile(invalidJsonFilePath, 'Invalid json', 'utf8', function erroneous(err: Error) {
      if (err) {
        throw err;
      }
    });
  });

  test('should parse valid JSON from existing file', async () => {
    const jsonFromFile = await loadJSON<string>(filePath);
    const expected = {
      parent: {
        child: 'foo',
      },
    };
    const expectedStr = JSON.stringify(expected);
    const actual = JSON.stringify(jsonFromFile);
    assert.deepInclude(actual, expectedStr, `Comparison failed, expected ${expectedStr} but got: ${actual}`);
  });

  test('should throw an error when processing invalid JSON file', async () => {
    try {
      await loadJSON<string>(invalidJsonFilePath);
    } catch (err) {
      expect(err).to.be.an('error', 'Unexpected token');
    }
  });

  test('should throw an error when passing non-existing file', async () => {
    try {
      await loadJSON<string>('/not/really/a/path.json');
    } catch (err) {
      expect(err).to.be.an('error', 'Cannot find module');
    }
  });

  suiteTeardown(() => {
    fs.unlinkSync(filePath);
    fs.unlinkSync(invalidJsonFilePath);
  });
});
