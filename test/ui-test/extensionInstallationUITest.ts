import { expect } from 'chai';
import { ActivityBar, ExtensionsViewItem, ExtensionsViewSection } from 'vscode-extension-tester';
import { KNativeConstants } from './common/constants';

/**
 * @author Ondrej Dockal <odockal@redhat.com>
 */
export function extensionInstallationUITest(): void {
  let extensions: ExtensionsViewItem[];

  before(async function context() {
    this.timeout(5000);
    const viewBar = await new ActivityBar().getViewControl('Extensions');
    const sideBar = await viewBar.openView();
    const section = (await sideBar.getContent().getSection('Installed')) as ExtensionsViewSection;
    extensions = await section.getVisibleItems();
  });

  describe('Knative extension', () => {
    it('should be installed among extensions', async function context() {
      this.timeout(3000);
      expect(await Promise.all(extensions.map((item) => item.getTitle()))).to.include(KNativeConstants.KNATIVE_EXTENSION_NAME);
    });

    describe('dependencies', () => {
      it('Yaml, should be installed among extensions', async function context() {
        this.timeout(3000);
        expect(await Promise.all(extensions.map((item) => item.getTitle()))).to.include(KNativeConstants.YAML_EXTENSION_NAME);
      });
    });
  });
}
