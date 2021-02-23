/* eslint-disable @typescript-eslint/no-explicit-any */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import fs = require('fs');
import paths = require('path');
import glob = require('glob');
import istanbul = require('istanbul');
import remapIstanbul = require('remap-istanbul');

function _mkDirIfExists(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

export interface TestRunnerOptions {
  relativeCoverageDir?: string;
  relativeSourcePath?: string;
  ignorePatterns?: string[];
  includePid?: boolean;
  reports?: string[];
  verbose?: boolean;
}

export class CoverageRunner {
  private coverageVar = `$$cov_${new Date().getTime()}$$`;

  private transformer: any = undefined;

  private matchFn: any = undefined;

  private instrumenter: any = undefined;

  constructor(private options: TestRunnerOptions, private testsRoot: string) {
    // eslint-disable-next-line no-empty
    if (!options.relativeSourcePath) {
    }
  }

  public setupCoverage(): void {
    // Set up Code Coverage, hooking require so that instrumented code is returned
    // eslint-disable-next-line @typescript-eslint/no-this-alias, consistent-this
    const self = this;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    self.instrumenter = new istanbul.Instrumenter({ coverageVariable: self.coverageVar });
    const sourceRoot = paths.join(self.testsRoot, self.options.relativeSourcePath);

    // Glob source files
    const srcFiles = glob.sync('**/**.js', {
      cwd: sourceRoot,
      ignore: self.options.ignorePatterns,
    });

    // Create a match function - taken from the run-with-cover.js in istanbul.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires, global-require
    const decache = require('decache');
    const fileMap: any = {};
    srcFiles.forEach((file) => {
      const fullPath = paths.join(sourceRoot, file);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      fileMap[fullPath] = true;

      // On Windows, extension is loaded pre-test hooks and this mean we lose
      // our chance to hook the Require call. In order to instrument the code
      // we have to decache the JS file so on next load it gets instrumented.
      // This doesn't impact tests, but is a concern if we had some integration
      // tests that relied on VSCode accessing our module since there could be
      // some shared global state that we lose.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      decache(fullPath);
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
    self.matchFn = (file: string): boolean => fileMap[file];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    self.matchFn.files = Object.keys(fileMap);

    // Hook up to the Require function so that when this is called, if any of our source files
    // are required, the instrumented version is pulled in instead. These instrumented versions
    // write to a global coverage variable with hit counts whenever they are accessed
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    self.transformer = self.instrumenter.instrumentSync.bind(self.instrumenter);
    const hookOpts = { verbose: false, extensions: ['.js'] };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    istanbul.hook.hookRequire(self.matchFn, self.transformer, hookOpts);

    // initialize the global variable to stop mocha from complaining about leaks
    global[self.coverageVar] = {};
  }

  /**
   * Writes a coverage report.
   * Note that as this is called in the process exit callback, all calls must be synchronous.
   *
   * @returns {void}
   *
   * @memberOf CoverageRunner
   */
  public reportCoverage(): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias, consistent-this
    const self = this;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    istanbul.hook.unhookRequire();

    if (typeof global[self.coverageVar] === 'undefined' || Object.keys(global[self.coverageVar]).length === 0) {
      // eslint-disable-next-line no-console
      console.error('No coverage information was collected, exit without writing coverage information');
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const cov = global[self.coverageVar];

    // TODO consider putting this under a conditional flag
    // Files that are not touched by code ran by the test runner is manually instrumented, to
    // illustrate the missing coverage.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    self.matchFn.files.forEach((file: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (cov[file]) {
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      self.transformer(fs.readFileSync(file, 'utf-8'), file);

      // When instrumenting the code, istanbul will give each FunctionDeclaration a value of 1 in coverState.s,
      // presumably to compensate for function hoisting. We need to reset this, as the function was not hoisted,
      // as it was never loaded.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      Object.keys(self.instrumenter.coverState.s).forEach((key) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        self.instrumenter.coverState.s[key] = 0;
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      cov[file] = self.instrumenter.coverState;
    });

    // TODO Allow config of reporting directory with
    const reportingDir = paths.join(self.testsRoot, self.options.relativeCoverageDir);
    const { includePid } = self.options;
    const pidExt = includePid ? `-${process.pid}` : '';
    const coverageFile = paths.resolve(reportingDir, `coverage${pidExt}.json`);

    // yes, do this again since some test runners could clean the dir initially created
    _mkDirIfExists(reportingDir);

    fs.writeFileSync(coverageFile, JSON.stringify(cov), 'utf8');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const remappedCollector = remapIstanbul.remap(cov, {
      warn: (warning: any) => {
        // We expect some warnings as any JS file without a typescript mapping will cause this.
        // By default, we'll skip printing these to the console as it clutters it up
        if (self.options.verbose) {
          // eslint-disable-next-line no-console
          console.warn(warning);
        }
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const reporter = new istanbul.Reporter(undefined, reportingDir);
    const reportTypes = self.options.reports instanceof Array ? self.options.reports : ['lcov'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    reporter.addAll(reportTypes);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    reporter.write(remappedCollector, true, () => {
      // eslint-disable-next-line no-console
      console.log(`reports written to ${reportingDir}`);
    });
  }
}
