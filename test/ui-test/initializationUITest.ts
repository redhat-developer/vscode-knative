/* eslint-disable no-return-await */
/* eslint-disable no-console */
import { expect, assert } from 'chai';
import { ActivityBar, VSBrowser, NotificationType, WebDriver } from 'vscode-extension-tester';
import { KNativeConstants } from './common/constants';
import { findNotification, getNotifications, safeNotificationExists } from './common/testUtils';

/**
 * @author Ondrej Dockal <odockal@redhat.com>
 */
export function knativeInitializationUITest(): void {
  let driver: WebDriver;

  before(function setup() {
    // await cleanUpNotifications();
    process.env.KUBECONFIG = '/home/odockal/kubeconfig';
    driver = VSBrowser.instance.driver;
  });

  describe('Knative extension', () => {
    it('requires Knative CLI tool Notification to pop up after Knative view is opened', async function context() {
      this.timeout(10000);
      const view = new ActivityBar().getViewControl(KNativeConstants.KNATIVE_EXTENSION_NAME);
      const sideBar = await view.openView();
      expect(await sideBar.isDisplayed()).to.equal(true);
      await driver.wait(async () => {
        return await safeNotificationExists('Cannot find Knative CLI');
      }, 5000);
    });
    it('allows to download missing kn cli using notification', async function context() {
      this.timeout(90000);
      const notification = await driver.wait(async () => {
        return findNotification('Cannot find Knative CLI');
      }, 3000);
      const actions = await notification.getActions();
      //   const action = await asyncFilter(actions, async (item) => {
      //     const text = await item.getText();
      //     return text.indexOf('Download') > 0;
      //   });
      const actionsTexts = await Promise.all(actions.map(async (item) => item.getText()));
      const downloadActionText = actionsTexts.find((item) => {
        console.log(`going over: ${item}`);
        const index = item.indexOf('Download');
        console.log(`${index}`);
        return item.includes('Download') ? item : undefined;
      });
      console.log(downloadActionText);
      await notification.takeAction(downloadActionText);
      await driver.wait(async () => {
        return findNotification('Downloading Knative CLI');
      }, 3000);
      await driver.wait(async () => {
        const exists = await safeNotificationExists('Downloading Knative CLI');
        console.log(`Notification exists: ${exists}`);
        return !exists;
      }, 80000);
    });
  });

  describe('Knative view', () => {
    it('should be ready for usage, requires access to the cluster', async function context() {
      this.timeout(60000);
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
      await driver.wait(async () => (await servingSection.getVisibleItems()).length > 0, 15000);
      const items = await servingSection.getVisibleItems();
      expect(await items[0].getText()).to.equal(KNativeConstants.NO_SERVICE_FOUND);
      const eventingSection = await sideBar.getContent().getSection(KNativeConstants.SECTION_EVENTING);
      if (!(await eventingSection.isExpanded())) {
        await eventingSection.expand();
      }
      await driver.wait(async () => (await eventingSection.getVisibleItems()).length > 0, 30000);
      const brokersTree = await eventingSection.getVisibleItems();
      expect(brokersTree.length).to.be.greaterThan(0);
      expect(await Promise.all(brokersTree.map(async (item) => item.getText()))).to.include.members([
        'Brokers',
        'Channels',
        'Sources',
        'Subscriptions',
        'Triggers',
      ]);
    });
  });
}
