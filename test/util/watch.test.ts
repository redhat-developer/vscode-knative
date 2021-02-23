/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { expect } from 'chai';
import * as chai from 'chai';
import * as fs from 'fs-extra';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as tmp from 'tmp';
import { WatchUtil } from '../../src/util/watch';

chai.use(sinonChai);

suite('File Watch Utility', () => {
  const sandbox = sinon.createSandbox();
  let ensureStub: sinon.SinonStub;
  let watchStub: sinon.SinonStub;
  const location = 'location';
  const filename = 'file';

  setup(() => {
    ensureStub = sandbox.stub(fs, 'ensureDirSync');
    watchStub = sandbox.stub(fs, 'watch');
  });

  teardown(() => {
    sandbox.restore();
  });

  test('watchFileForContextChange ensures the location exists', () => {
    WatchUtil.watchFileForContextChange(location, filename);

    expect(ensureStub).calledOnceWith(location);
  });

  test('watchFileForContextChange creates a file watcher for the given path', () => {
    WatchUtil.watchFileForContextChange(location, filename);

    expect(watchStub).calledOnceWith(location, sinon.match.func);
  });

  test('watchFileForContextChange returns a content change notifier', () => {
    const result = WatchUtil.watchFileForContextChange(location, filename);

    expect(result).has.ownProperty('watcher');
    expect(result).has.ownProperty('emitter');
  });

  test('emits change message when context changes', async () => {
    ensureStub.restore();
    watchStub.restore();
    const fileToWatch = fs.realpathSync(tmp.fileSync().name);
    fs.ensureFileSync(fileToWatch);
    const notifier = WatchUtil.watchFileForContextChange(path.dirname(fileToWatch), path.basename(fileToWatch));
    setTimeout(() => {
      fs.writeFileSync(fileToWatch, 'current-context:test2');
    }, 1000);
    return new Promise((res) => {
      notifier.emitter.on('file-changed', (file) => {
        expect(file).to.equal(undefined);
        res(null);
      });
    });
  });
});
