/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { expect } from 'chai';
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { Platform } from '../../src/util/platform';

chai.use(sinonChai);

suite('Platform Utility', () => {
  const sandbox = sinon.createSandbox();
  teardown(() => {
    sandbox.restore();
  });

  test('getOS returns the platform name', () => {
    const os = Platform.getOS();
    expect(os).to.equal(process.platform);
  });

  test('OS delegates to getOS', () => {
    const spy = sandbox.spy(Platform, 'getOS');
    const os = Platform.OS;

    expect(spy.calledOnce);
    expect(os).to.equal(process.platform);
  });

  test('getEnv returns the platform environment', () => {
    const env = Platform.getEnv();
    expect(env).to.equal(process.env);
  });

  test('ENV delegates to getENV', () => {
    const spy = sandbox.spy(Platform, 'getEnv');
    const env = Platform.ENV;

    expect(spy.calledOnce);
    expect(env).to.equal(process.env);
  });

  test('getUserHomePath returns the path to user home', () => {
    const home = Platform.getUserHomePath();
    if (process.platform === 'win32') {
      expect(home).to.equal(process.env.USERPROFILE);
    } else {
      expect(home).to.equal(process.env.HOME);
    }
  });
});
