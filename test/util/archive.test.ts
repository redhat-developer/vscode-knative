/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import path = require('path');
import * as chai from 'chai';
import fs = require('fs-extra');
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import targz = require('targz');
import tmp = require('tmp');
import { Archive } from '../../src/util/archive';

const { expect } = chai;
chai.use(sinonChai);

suite('Archive Utility', () => {
  const sandbox = sinon.createSandbox();
  let tarStub: sinon.SinonStub;
  let zipStub: sinon.SinonStub;
  const errorMessage = 'FATAL ERROR';
  const extractTo = 'here';
  const tarPath = 'file.tar.gz';
  const gzipPath = 'file.gz';

  setup(() => {
    tarStub = sandbox.stub(targz, 'decompress').yields();
    zipStub = sandbox.stub(Archive, 'gunzip').resolves();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('calls untar if file is a tar.gz archive', async () => {
    await Archive.unzip(tarPath, extractTo);

    expect(tarStub).calledOnceWith({
      src: tarPath,
      dest: extractTo,
      tar: sinon.match.object,
    });
  });

  test('untars file correctly without prefix', async () => {
    sandbox.restore();
    const tempDir = fs.realpathSync(tmp.dirSync().name);
    const testArchive = path.join(__dirname, '..', '..', '..', 'test', 'fixtures', 'test.tar.gz');
    await Archive.unzip(testArchive, tempDir);
    // eslint-disable-next-line no-unused-expressions
    expect(fs.existsSync(path.join(tempDir, 'test', 'test.json'))).is.true;
  });

  test('untars file correctly with prefix', async () => {
    sandbox.restore();
    const tempDir = fs.realpathSync(tmp.dirSync().name);
    const testArchive = path.join(__dirname, '..', '..', '..', 'test', 'fixtures', 'test.tar.gz');
    await Archive.unzip(testArchive, tempDir, 'test');
    // eslint-disable-next-line no-unused-expressions
    expect(fs.existsSync(path.join(tempDir, 'test.json'))).is.true;
  });

  test('untar rejects when error occurs', async () => {
    tarStub.yields(errorMessage);
    try {
      await Archive.unzip(tarPath, extractTo);
    } catch (err) {
      expect(err).equals(errorMessage);
    }
  });

  test('calls gunzip when file is a .gz archive', async () => {
    await Archive.unzip(gzipPath, extractTo);

    expect(zipStub).calledOnceWith(gzipPath, extractTo);
  });

  test('rejects when gunzip fails', async () => {
    zipStub.rejects(errorMessage);
    try {
      await Archive.unzip(gzipPath, extractTo);
    } catch (err) {
      expect(err).matches(new RegExp(errorMessage));
    }
  });

  test('gunzips file correctly', async () => {
    sandbox.restore();
    const tempDir = tmp.dirSync().name;
    const tempFile = path.join(tempDir, 'test.json');
    const testArchive = path.join(__dirname, '..', '..', '..', 'test', 'fixtures', 'test.gz');
    await Archive.gunzip(testArchive, tempFile);
    // eslint-disable-next-line no-unused-expressions
    expect(fs.existsSync(tempFile)).is.true;
  });

  test('unzips file correctly', async () => {
    sandbox.restore();
    const tempDir = tmp.dirSync().name;
    const testArchive = path.join(__dirname, '..', '..', '..', 'test', 'fixtures', 'test.zip');
    await Archive.unzip(testArchive, tempDir);
    // eslint-disable-next-line no-unused-expressions
    expect(fs.existsSync(path.join(tempDir, 'test', 'test.json'))).is.true;
  });

  test('rejects if the file type in not supported', async () => {
    const file = 'file.whatever';
    try {
      await Archive.unzip('file.whatever', extractTo);
    } catch (err) {
      expect(err).equals(`Unsupported extension for '${file}'`);
    }
  });
});
