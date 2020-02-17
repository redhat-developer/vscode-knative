import * as path from 'path';
import * as Mocha from 'mocha';
import * as glob from 'glob';

// Linux: prevent a weird NPE when mocha on Linux requires the window size from the TTY
// Since we are not running in a tty environment, we just implement the method statically
// eslint-disable-next-line @typescript-eslint/no-var-requires
const tty = require('tty');

if (!tty.getWindowSize) {
  tty.getWindowSize = (): number[] => {
    return [80, 75];
  };
}

const config: any = {
  reporter: 'mocha-jenkins-reporter',
  ui: 'tdd',
  timeout: 15000,
  color: true,
};

if (process.env.BUILD_ID && process.env.BUILD_NUMBER) {
  config.reporter = 'mocha-jenkins-reporter';
}

// eslint-disable-next-line import/prefer-default-export
export function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha(config);
  mocha.useColors(true);

  const testsRoot = path.resolve(__dirname, '..');

  return new Promise((resolve, reject) => {
    glob('**/**.test.js', { cwd: testsRoot }, (err, files): void => {
      if (err) {
        return reject(err);
      }

      // Add files to the test suite
      files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

      try {
        // Run the mocha test
        mocha.run((failures) => {
          if (failures > 0) {
            reject(new Error(`${failures} tests failed.`));
          } else {
            resolve();
          }
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(err);
        reject(error);
      }
    });
  });
}
