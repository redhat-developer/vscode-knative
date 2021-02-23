/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as fs from 'fs';
import * as path from 'path';
import { expect, assert } from 'chai';
import { loadJSON } from '../../src/util/parse';

suite('Parse utility class', () => {
  const json = {
    parent: {
      child: 'foo',
    },
  };
  const filePath = path.join(__dirname, 'valid.json');
  const invalidJsonFilePath = path.join(__dirname, 'invalid.json');

  suiteSetup(() => {
    fs.writeFileSync(filePath, JSON.stringify(json), 'utf8');
    fs.writeFileSync(invalidJsonFilePath, 'Invalid json', 'utf8');
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
