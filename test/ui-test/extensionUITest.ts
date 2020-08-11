/* eslint-disable no-console */
import { expect } from 'chai';
import { ActivityBar, ExtensionsViewSection, ExtensionsViewItem, VSBrowser, NotificationType } from 'vscode-extension-tester';
import { KNativeConstants } from './common/constants';
import { getNotifications } from './common/testUtils';
/**
 * @author Ondrej Dockal <odockal@redhat.com>
 */
export function extensionsUITest(): void {
  describe('Knative extension', () => {
    it('should be installed among extensions view', async function context() {
      this.timeout(5000);
      const view = new ActivityBar().getViewControl('Extensions');
      const sideBar = await view.openView();
      const content = sideBar.getContent();
      console.log(await Promise.all((await content.getSections()).map((section) => section.getTitle())));
      const section = (await sideBar.getContent().getSection('Installed')) as ExtensionsViewSection;
      const item = await section.findItem(`@installed ${KNativeConstants.KNATIVE_EXTENSION_NAME}`);
      expect(item).to.be.an.instanceOf(ExtensionsViewItem);
      expect(await item.getTitle()).to.equal(KNativeConstants.KNATIVE_EXTENSION_NAME);
    });

    it('should have Knative Activity Bar available', async function context() {
      this.timeout(5000);
      const view = new ActivityBar().getViewControl(KNativeConstants.KNATIVE_EXTENSION_NAME);
      const sideBar = await view.openView();
      // check that no notification error appeared
      VSBrowser.instance.driver.wait(async function receiveNotifications() {
        const notifs = await getNotifications(NotificationType.Error, NotificationType.Warning);
        return notifs.length === 0;
      }, 3000);
      const titlePart = sideBar.getTitlePart();
      console.log(`${await titlePart.getTitle()} x ${await titlePart.getText()}`);
      const content = sideBar.getContent();
      console.log(await content.getText());
      console.log(await Promise.all((await content.getSections()).map((section) => section.getTitle())));
    });

    after(async function context() {
      this.timeout(5000);
      const sideBar = await new ActivityBar().getViewControl('Extensions').openView();
      const titlePart = sideBar.getTitlePart();
      const actionButton = await titlePart.getAction('Clear Extensions Search Results');
      if (await actionButton.isEnabled()) {
        await actionButton.click();
      }
    });
  });
}
