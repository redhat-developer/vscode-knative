import { extensionInstallationUITest } from './extensionInstallationUITest';
import { extensionsUITest } from './extensionUITest';
import { knativeInitializationUITest } from './initializationUITest';

/**
 * @author Ondrej Dockal <odockal@redhat.com>
 */
describe('VSCode KNative Extension - UI tests', () => {
  extensionInstallationUITest();
  extensionsUITest(true);
  knativeInitializationUITest();
});
