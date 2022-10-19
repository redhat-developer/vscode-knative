/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/await-thenable */
import { expect } from 'chai';
import {
  ActivityBar,
  ViewControl,
  SideBarView,
  WebDriver,
  VSBrowser,
  ModalDialog,
  ViewItem,
  TreeItem,
} from 'vscode-extension-tester';
import { KNativeConstants } from './common/constants';
import { cleanUpNotifications, findNotification, safeNotificationExists } from './common/testUtils';

/**
 * Executes a shell command and return it as a Promise.
 * @param cmd {string}
 * @return {Promise<string>}
 */
function execShellCommand(cmd) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  const { exec } = require('child_process');
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      resolve(stdout || stderr);
    });
  });
}

/**
 * @author Ondrej Dockal <odockal@redhat.com>
 */
export function extensionsUITest(clusterIsAvailable: boolean): void {
  let driver: WebDriver;
  let kubectlExists: boolean;

  before(async () => {
    driver = VSBrowser.instance.driver;
    // check existence of kubectl on the path or in the home folder
    const kubectl = await execShellCommand('kubectl version --output json');
    kubectlExists = !(kubectl as string).includes('kubectl: command not found');
  });

  describe('Knative extension UI', () => {
    let view: ViewControl;
    let sideBar: SideBarView;

    before(async () => {
      const activityBar = new ActivityBar();
      view = await (await activityBar.getViewControl(KNativeConstants.KNATIVE_EXTENSION_NAME)).wait(2000);
      sideBar = await view.openView();
    });

    it('Activity Bar title matches', async function context() {
      this.timeout(5000);
      expect(await sideBar.isDisplayed()).to.equal(true);
      const titlePart = sideBar.getTitlePart();
      expect(await titlePart.getTitle()).to.equal(KNativeConstants.KNATIVE_EXTENSION_BAR_NAME);
    });

    it('view should show kn cli download notification after being opened', async function context() {
      this.timeout(10000);
      await driver.wait(async () => safeNotificationExists('Cannot find Knative CLI'), 5000);
    });

    it('allows to download missing kn cli using notification', async function context() {
      this.timeout(80000);
      const notification = await driver.wait(async () => findNotification('Cannot find Knative CLI'), 5000);
      const actions = await notification.getActions();
      const actionsTexts = await Promise.all(actions.map(async (item) => item.getText()));
      const downloadActionText = actionsTexts.find((item) => (item.includes('Download') ? item : undefined));
      await notification.takeAction(downloadActionText);
      await driver.wait(async () => findNotification('Downloading Knative CLI'), 10000);
      await driver.wait(async () => {
        const exists = await safeNotificationExists('Downloading Knative CLI');
        return !exists;
      }, 50000);
    });

    it('allows to download missing kubectl binary using notification', async function context() {
      if (kubectlExists === true) {
        this.skip();
      }
      this.timeout(80000);
      const notification = await driver.wait(async () => findNotification('Cannot find Kubernetes CLI'), 10000);
      const actions = await notification.getActions();
      const actionsTexts = await Promise.all(actions.map(async (item) => item.getText()));
      const downloadActionText = actionsTexts.find((item) => (item.includes('Download') ? item : undefined));
      await notification.takeAction(downloadActionText);
      await driver.wait(async () => findNotification('Downloading Kubernetes CLI'), 10000);
      await driver.wait(async () => {
        const exists = await safeNotificationExists('Downloading Kubernetes CLI');
        return !exists;
      }, 50000);
    });

    it('should contain Serving, Eventing sections and Function sections', async function context() {
      this.timeout(5000);
      const content = sideBar.getContent();
      const sections = await content.getSections();
      expect(sections.length).to.eq(4);
      expect(await Promise.all(sections.map(async (section) => section.getTitle()))).to.has.members([
        KNativeConstants.SECTION_EVENTING,
        KNativeConstants.SECTION_SERVING,
        KNativeConstants.SECTION_FUNCTION,
        KNativeConstants.SECTION_ACTIVE_COMMAND,
      ]);
    });

    describe('Serving section', () => {
      it('should provide Add service, Refresh and Report Issue action items', async function context() {
        this.timeout(10000);
        const sectionServing = await sideBar.getContent().getSection(KNativeConstants.SECTION_SERVING);
        const actions = await sectionServing.getActions();
        expect(actions.length).to.equal(3);
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        actions.forEach(async (action) => {
          // eslint-disable-next-line max-nested-callbacks
          expect(await action.getLabel()).to.satisfy((title: string) =>
            [
              KNativeConstants.ACTION_ITEM_ADD_SERVICE,
              KNativeConstants.ACTION_ITEM_REFRESH,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, max-nested-callbacks
            ].some((expectedTitle) => title.includes(expectedTitle)),
          );
        });
      });
    });

    describe('Eventing section', () => {
      it('should provide Refresh action items', async function context() {
        this.timeout(10000);
        const sectionServing = await sideBar.getContent().getSection(KNativeConstants.SECTION_EVENTING);
        const actions = await sectionServing.getActions();
        expect(actions.length).to.equal(1);
        expect(await actions[0].getLabel()).to.include(KNativeConstants.ACTION_ITEM_REFRESH);
      });
    });

    describe('Function section', () => {
      it('should provide Create Function, Refresh and Function version action items', async function context() {
        this.timeout(10000);
        const sectionFunction = await sideBar.getContent().getSection(KNativeConstants.SECTION_FUNCTION);
        const actions = await sectionFunction.getActions();
        expect(actions.length).to.equal(5);
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        actions.forEach(async (action) => {
          // eslint-disable-next-line max-nested-callbacks
          expect(await action.getLabel()).to.satisfy((title: string) =>
            [
              KNativeConstants.ACTION_ITEM_CREATE_FUNCTION,
              KNativeConstants.REPOSITORY,
              KNativeConstants.ACTION_ITEM_REFRESH,
              KNativeConstants.ACTION_ITEM_FUNCTION_VERSION,
              KNativeConstants.ACTION_ITEM_REPORT_ISSUE,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, max-nested-callbacks
            ].some((expectedTitle) => title.includes(expectedTitle)),
          );
        });
      });

      it('Function Section contains default function tree item', async function context() {
        this.timeout(10000);
        const sectionFunction = await sideBar.getContent().getSection(KNativeConstants.SECTION_FUNCTION);
        const defaultItem = await sectionFunction.findItem('default');
        expect(defaultItem).is.instanceOf(ViewItem);
        await (defaultItem as TreeItem).expand();
      });

      it('allows to download missing kn func binary using notification', async function context() {
        this.timeout(80000);
        const notification = await driver.wait(async () => findNotification('Cannot find Function CLI'), 5000);
        const actions = await notification.getActions();
        const actionsTexts = await Promise.all(actions.map(async (item) => item.getText()));
        const downloadActionText = actionsTexts.find((item) => (item.includes('Download') ? item : undefined));
        await notification.takeAction(downloadActionText);
        await driver.wait(async () => findNotification('Downloading Function CLI'), 10000);
        await driver.wait(async () => {
          const exists = await safeNotificationExists('Downloading Function CLI');
          return !exists;
        }, 50000);
      });
    });

    if (!clusterIsAvailable) {
      //   it('should notify user that Serving and Eventing operators needs to be installed', async function context() {
      //     this.timeout(10000);
      //     const dialog = await driver.wait(
      //       // eslint-disable-next-line no-return-await
      //       async () =>
      //         // eslint-disable-next-line no-return-await
      //         await modalDialogExists('The Knative / Serving Operator is not installed. Please install it to use this extension.'),
      //       5000,
      //     );
      //     expect(dialog).to.be.instanceOf(ModalDialog);
      //     if (dialog) {
      //       await dialog.pushButton('OK');
      //     }
      //   });
      //   it('should notify user that he must log into a cluster', async function context() {
      //     this.timeout(10000);
      //     const dialog = await driver.wait(
      //       // eslint-disable-next-line no-return-await
      //       async () => await modalDialogExists('The cluster is not up. Please log into a running cluster.'),
      //       5000,
      //     );
      //     expect(dialog).to.be.instanceOf(ModalDialog);
      //     if (dialog) {
      //       await dialog.pushButton('OK');
      //     }
      //   });
    }

    after(async function afterContext() {
      this.timeout(10000);
      // handle possible native dialog about user not logged into cluster
      try {
        const dialog = new ModalDialog();
        // eslint-disable-next-line no-console
        console.log(await dialog.getMessage());
        await dialog.pushButton('Yes');
      } catch (error) {
        // no dialog appeared, no action
      }
      await cleanUpNotifications();
    });
  });
}
