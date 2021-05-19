import { extensionInstallationUITest } from './extensionInstallationUITest';
import { extensionsUITest } from './extensionUITest';

/**
 * @author Ondrej Dockal <odockal@redhat.com>
 */
describe('VSCode KNative Extension - UI tests', () => {
  extensionInstallationUITest();
  extensionsUITest(false);
});
