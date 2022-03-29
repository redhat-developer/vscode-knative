/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/await-thenable */
import { expect } from 'chai';
import { ActivityBar, ViewControl, SideBarView, WebDriver, VSBrowser, ModalDialog } from 'vscode-extension-tester';
import { KNativeConstants } from './common/constants';
import { cleanUpNotifications, findNotification, safeNotificationExists } from './common/testUtils';
/**
 * @author Ondrej Dockal <odockal@redhat.com>
 */
export function extensionsUITest(clusterIsAvailable: boolean): void {
  let driver: WebDriver;

  before(() => {
    driver = VSBrowser.instance.driver;
  });

  describe('Knative extension UI', () => {
    let view: ViewControl;
    let sideBar: SideBarView;

    before(async () => {
      // eslint-disable-next-line @typescript-eslint/await-thenable
      const activityBar = new ActivityBar();
      const items = await Promise.all(await (await activityBar.getViewControls()).map((item) => item.getTitle()));
      // eslint-disable-next-line no-console
      console.log(items);
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
      this.timeout(15000);
      await driver.wait(async () => safeNotificationExists('Cannot find Knative CLI'), 10000);
    });

    it('allows to download missing kn cli using notification', async function context() {
      this.timeout(100000);
      console.log('findNotification');
      const notification = await driver.wait(async () => findNotification('Cannot find Knative CLI'), 10000);
      console.log('getActions');
      const actions = await notification.getActions();
      console.log('actions.map');
      const actionsTexts = await Promise.all(actions.map(async (item) => item.getText()));
      console.log('find text download');
      const downloadActionText = actionsTexts.find((item) => (item.includes('Download') ? item : undefined));
      console.log('takeAction');
      await notification.takeAction(downloadActionText);
      console.log('findNotification Download Knative CLI');
      await driver.wait(async () => findNotification('Downloading Knative CLI'), 3000);
      console.log('safenotificationexists');
      await driver.wait(async () => {
        const exists = await safeNotificationExists('Downloading Knative CLI');
        return !exists;
      }, 80000);
    });

    it('should contain Serving, Eventing sections and Function sections', async function context() {
      this.timeout(5000);
      const content = sideBar.getContent();
      const sections = await content.getSections();
      expect(sections.length).to.eq(3);
      expect(await Promise.all(sections.map(async (section) => section.getTitle()))).to.has.members([
        KNativeConstants.SECTION_EVENTING,
        KNativeConstants.SECTION_SERVING,
        KNativeConstants.SECTION_FUNCTION,
      ]);
    });

    describe('Serving section', () => {
      it('should provide Add service, Refresh and Report Issue action items', async function context() {
        this.timeout(10000);
        const sectionServing = await sideBar.getContent().getSection(KNativeConstants.SECTION_SERVING);
        const actions = await sectionServing.getActions();
        expect(actions.length).to.equal(4);
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        actions.forEach(async (action) => {
          // eslint-disable-next-line max-nested-callbacks
          expect(await action.getLabel()).to.satisfy((title: string) =>
            [
              KNativeConstants.ACTION_ITEM_ADD_SERVICE,
              KNativeConstants.ACTION_ITEM_REFRESH,
              KNativeConstants.ACTION_ITEM_REPORT_ISSUE,
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
