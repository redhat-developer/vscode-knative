/* eslint-disable no-console */
import { expect, assert } from 'chai';
import { ActivityBar, VSBrowser, NotificationType, WebDriver } from 'vscode-extension-tester';
import { KNativeConstants } from './common/constants';
import { getNotifications, cleanUpNotifications } from './common/testUtils';

/**
 * @author Ondrej Dockal <odockal@redhat.com>
 */
export function knativeInitializationUITest(): void {
  let driver: WebDriver;

  before(async function setup() {
    await cleanUpNotifications();
    driver = VSBrowser.instance.driver;
  });

  describe('Knative view', () => {
    it('should be ready for usage, requires access to the cluster', async function context() {
      this.timeout(50000);
      const view = new ActivityBar().getViewControl(KNativeConstants.KNATIVE_EXTENSION_NAME);
      const sideBar = await view.openView();
      // check that no notification error appeared
      try {
        await driver.wait(async () => {
          const notifs = await getNotifications(NotificationType.Error, NotificationType.Warning);
          return notifs === null || notifs === undefined || notifs.length === 0;
        }, 5000);
      } catch (error) {
        assert.fail(`Error notification appeared during cluster loading`);
      }
      await driver.wait(async () => !(await sideBar.getContent().hasProgress()), 3000);
      const servingSection = await sideBar.getContent().getSection(KNativeConstants.SECTION_SERVING);
      if (!(await servingSection.isExpanded())) {
        await servingSection.expand();
      }
      console.log(await servingSection.getText());
      console.log(await servingSection.getTitle());
      await driver.wait(async () => (await servingSection.getVisibleItems()).length > 0, 30000);
      console.log(await Promise.all((await servingSection.getVisibleItems()).map((item) => item.getText())));
      const items = await servingSection.getVisibleItems();
      expect(await items[0].getText()).to.equal(KNativeConstants.NO_SERVICE_FOUND);
      const eventingSection = await sideBar.getContent().getSection(KNativeConstants.SECTION_EVENTING);
      if (!(await eventingSection.isExpanded())) {
        await eventingSection.expand();
      }
      await driver.wait(async () => (await eventingSection.getVisibleItems()).length > 0, 5000);
      const brokersTree = await eventingSection.getVisibleItems();
      console.log(await Promise.all(brokersTree.map((item) => item.getText())));
      expect(brokersTree.length).to.be.greaterThan(0);
      expect(brokersTree).to.has.members(['Brokens', 'Channels', 'Sources', 'Subscriptions', 'Triggers']);
    });
  });
}
