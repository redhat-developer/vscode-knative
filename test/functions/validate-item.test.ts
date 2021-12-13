/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { content, inputFieldValidation, selectLocationValidation } from '../../src/functions/validate-item';
import { Platform } from '../../src/util/platform';

const { expect } = chai;
chai.use(sinonChai);

suite('Tekton/Task', () => {
  const sandbox = sinon.createSandbox();
  const inputField: content = {
    id: 'functionName',
    message: 'Provide name for function',
    value: '',
  };

  teardown(() => {
    sandbox.restore();
  });

  test('return validation item', () => {
    const result = inputFieldValidation(inputField, []);
    expect(result).deep.equal({
      items: [
        {
          severity: 4,
          template: {
            content: 'Provide name for function',
            id: 'functionName',
          },
        },
      ],
    });
  });

  test('show error if Selected disk does not exit', () => {
    const selectLocation = { id: 'selectLocation', message: 'Provide path to create function', value: 's' };
    const result = selectLocationValidation(selectLocation, []);
    expect(result).deep.equal({
      items: [
        {
          severity: 4,
          template: {
            content: 'The selection is not a valid absolute path.',
            id: 'selectLocation',
          },
        },
        {
          severity: 4,
          template: {
            content: 'Selected disk does not exist.',
            id: 'selectLocation',
          },
        },
      ],
    });
  });

  test('show error message if path is not provided', () => {
    const selectLocation = { id: 'selectLocation', message: 'Provide path to create function', value: '' };
    const result = selectLocationValidation(selectLocation, []);
    expect(result).deep.equal({
      items: [
        {
          severity: 4,
          template: {
            content: 'Provide path to create function',
            id: 'selectLocation',
          },
        },
      ],
    });
  });

  test('show error message if path has invalid format', () => {
    sandbox.stub(Platform, 'getOS').returns('win32');
    const selectLocation = {
      id: 'selectLocation',
      message: 'Provide path to create function',
      value: 'c:\\',
    };
    const result = selectLocationValidation(selectLocation, []);
    if (process.platform === 'win32') {
      expect(result).deep.equal({
        items: [
          {
            severity: 4,
            template: {
              content: 'Selected path has invalid format.',
              id: 'selectLocation',
            },
          },
        ],
      });
    }
  });

  test("don't show error message when path is valid ", () => {
    sandbox.stub(Platform, 'getOS').returns('win32');
    const selectLocation = {
      id: 'selectLocation',
      message: 'Provide path to create function',
      value: 'c:',
    };
    const result = selectLocationValidation(selectLocation, []);
    if (process.platform === 'win32') {
      expect(result).deep.equal({
        items: [
          {
            severity: 4,
            template: {
              content: 'The selection is not a valid absolute path.',
              id: 'selectLocation',
            },
          },
        ],
      });
    }
  });

  test("don't show error message when path is valid ", () => {
    const selectLocation = {
      id: 'selectLocation',
      message: 'Provide path to create function',
      value: '/',
    };
    const result = selectLocationValidation(selectLocation, []);
    expect(result).deep.equal({
      items: [],
    });
  });
});
