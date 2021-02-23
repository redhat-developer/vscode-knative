/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { EventEmitter } from 'events';
import * as os from 'os';
import * as path from 'path';
import { expect } from 'chai';
import * as chai from 'chai';
import * as pq from 'proxyquire';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    progressMock = pq('../../src/util/download', {
      'request-progress': () => requestEmitter,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
      request: (_: any) => _,
    }).DownloadUtil;
  });

  teardown(() => {
    sandbox.restore();
  });

  test('reports download progress', () => {
    const callback = sandbox.stub();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const result = progressMock.downloadFile('url', path.join(os.tmpdir(), 'toFile'), callback);
    requestEmitter.emit('progress', { percent: 0.33 });
    requestEmitter.emit('progress', { percent: 0.66 });
    requestEmitter.emit('end');
    streamEmitter.emit('close');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    return result.then(() => {
      expect(callback).calledWith(33, 33);
      expect(callback).calledWith(66, 33);
      expect(callback).calledWith(100, 34);
    });
  });

  test('fails when download fails', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const result = progressMock.downloadFile('url', path.join(os.tmpdir(), 'toFile'));
    requestEmitter.emit('error', new Error('failure'));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    return result
      .then(() => Promise.reject(Error('No failure reported')))
      .catch((err: Error) => {
        expect(err.message).to.equal('failure');
      });
  });

  test('fails when stream fails', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const result = progressMock.downloadFile('url', path.join(os.tmpdir(), 'toFile'));
    streamEmitter.emit('error', new Error('failure'));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    return result
      .then(() => Promise.reject(Error('No failure reported')))
      .catch((err: Error) => {
        expect(err.message).to.equal('failure');
      });
  });
});
