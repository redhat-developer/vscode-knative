import { expect, assert } from 'chai';
import { ActivityBar, VSBrowser, NotificationType, WebDriver } from 'vscode-extension-tester';
import { KNativeConstants } from './common/constants';
import { getNotifications, cleanUpNotifications } from './common/testUtils';

/**
 * @author Ondrej Dockal <odockal@redhat.com>
 */
export function knativeInitializationUITest(): void {
  let driver: WebDriver;

  before(async () => {
    driver = VSBrowser.instance.driver;
    await cleanUpNotifications();
  });

  describe('Knative view', () => {
    it('should be ready for usage, requires access to the cluster', async function context() {
      this.timeout(10000);
      const view = new ActivityBar().getViewControl(KNativeConstants.KNATIVE_EXTENSION_NAME);
      const sideBar = await view.openView();
      // check that no notification error appeared
      try {
        await driver.wait(async () => {
          const notifs = await getNotifications(NotificationType.Error, NotificationType.Warning);
          return !notifs || notifs.length === 0;
        }, 5000);
      } catch (error) {
        assert.fail(`Error notification appeared during cluster loading`);
      }
      const content = sideBar.getContent();
      expect(await content.getText()).to.equal(KNativeConstants.NO_SERVICE_FOUND);
      const sections = await content.getSections();
      expect(sections.length).to.equal(1);
      const section = sections[0];
      expect(await section.getTitle()).to.equal(KNativeConstants.KNATIVE_EXTENSION_NAME);
      const items = await sections[0].getVisibleItems();
      expect(items.length).to.equal(1);
      const item = items[0];
      expect(await item.getText()).to.equal(KNativeConstants.NO_SERVICE_FOUND);
    });
  });
}
