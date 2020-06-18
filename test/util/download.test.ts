/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as sinon from 'sinon';
import { EventEmitter } from 'events';
import * as os from 'os';
import * as path from 'path';

import pq = require('proxyquire');

const { expect } = chai;
chai.use(sinonChai);

suite('Download Util', () => {
  let progressMock;
  const sandbox: sinon.SinonSandbox = sinon.createSandbox();
  let requestEmitter: EventEmitter;
  let streamEmitter: EventEmitter;

  setup(() => {
    requestEmitter = new EventEmitter();
    streamEmitter = new EventEmitter();
    // eslint-disable-next-line dot-notation
    requestEmitter['pipe'] = (): EventEmitter => streamEmitter;
    progressMock = pq('../../src/util/download', {
      'request-progress': () => requestEmitter,
      request: (_: any) => _,
    }).DownloadUtil;
  });

  teardown(() => {
    sandbox.restore();
  });

  test('reports download progress', () => {
    const callback = sandbox.stub();
    const result = progressMock.downloadFile('url', path.join(os.tmpdir(), 'toFile'), callback);
    requestEmitter.emit('progress', { percent: 0.33 });
    requestEmitter.emit('progress', { percent: 0.66 });
    requestEmitter.emit('end');
    streamEmitter.emit('close');
    return result.then(() => {
      expect(callback).calledWith(33, 33);
      expect(callback).calledWith(66, 33);
      expect(callback).calledWith(100, 34);
    });
  });

  test('fails when download fails', () => {
    const result = progressMock.downloadFile('url', path.join(os.tmpdir(), 'toFile'));
    requestEmitter.emit('error', new Error('failure'));
    return result
      .then(() => {
        return Promise.reject(Error('No failure reported'));
      })
      .catch((err: Error) => {
        expect(err.message).equals('failure');
      });
  });

  test('fails when stream fails', () => {
    const result = progressMock.downloadFile('url', path.join(os.tmpdir(), 'toFile'));
    streamEmitter.emit('error', new Error('failure'));
    return result
      .then(() => {
        return Promise.reject(Error('No failure reported'));
      })
      .catch((err: Error) => {
        expect(err.message).equals('failure');
      });
  });
});
