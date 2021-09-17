import { expect } from 'chai';
import { ActivityBar, ExtensionsViewItem, ExtensionsViewSection, VSBrowser, WebDriver } from 'vscode-extension-tester';
import { KNativeConstants } from './common/constants';

/**
 * @author Ondrej Dockal <odockal@redhat.com>
 */
export function extensionInstallationUITest(): void {
  let driver: WebDriver;

  before(() => {
    driver = VSBrowser.instance.driver;
  });

  describe('Knative extension', () => {
    it('should be installed among extensions', async function context() {
      this.timeout(10000);
      // eslint-disable-next-line @typescript-eslint/await-thenable
      const viewBar = await new ActivityBar().getViewControl('Extensions');
      const sideBar = await viewBar.openView();
      const section = (await sideBar.getContent().getSection('Installed')) as ExtensionsViewSection;
      const item = await driver.wait(async () => section.findItem(`@installed ${KNativeConstants.KNATIVE_EXTENSION_NAME}`), 3000);
      expect(item).to.be.an.instanceOf(ExtensionsViewItem);
      expect(await item.getTitle()).to.equal(KNativeConstants.KNATIVE_EXTENSION_NAME);
    });

    describe('dependencies', () => {
      it('Yaml, should be installed among extensions', async function context() {
        this.timeout(10000);
        // eslint-disable-next-line @typescript-eslint/await-thenable
        const view = await new ActivityBar().getViewControl('Extensions');
        const sideBar = await view.openView();
        const section = (await sideBar.getContent().getSection('Installed')) as ExtensionsViewSection;
        const item = await driver.wait(async () => section.findItem(`@installed ${KNativeConstants.YAML_EXTENSION_NAME}`), 3000);
        expect(item).to.be.an.instanceOf(ExtensionsViewItem);
        expect(await item.getTitle()).to.equal(KNativeConstants.YAML_EXTENSION_NAME);
      });
    });

    afterEach(async function afterContext() {
      this.timeout(8000);
      // eslint-disable-next-line @typescript-eslint/await-thenable
      const sideBar = await (await new ActivityBar().getViewControl('Extensions')).openView();
      const titlePart = sideBar.getTitlePart();
      const actionButton = await titlePart.getAction('Clear Extensions Search Results');
      if (await actionButton.isEnabled()) {
        await actionButton.click();
      }
    });
  });
}
