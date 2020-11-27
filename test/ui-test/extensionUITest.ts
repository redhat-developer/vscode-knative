import { expect } from 'chai';
import { DialogHandler } from 'vscode-extension-tester-native';
import {
  ActivityBar,
  ExtensionsViewSection,
  ExtensionsViewItem,
  ViewControl,
  SideBarView,
  WebDriver,
  VSBrowser,
} from 'vscode-extension-tester';
import { KNativeConstants } from './common/constants';
import { cleanUpNotifications } from './common/testUtils';
/**
 * @author Ondrej Dockal <odockal@redhat.com>
 */
export function extensionsUITest(): void {
  let driver: WebDriver;

  before(() => {
    driver = VSBrowser.instance.driver;
  });

  describe('Knative extension', () => {
    it('should be installed among extensions', async function context() {
      this.timeout(10000);
      const view = new ActivityBar().getViewControl('Extensions');
      const sideBar = await view.openView();
      const section = (await sideBar.getContent().getSection('Installed')) as ExtensionsViewSection;
      const item = await driver.wait(async () => {
        return section.findItem(`@installed ${KNativeConstants.KNATIVE_EXTENSION_NAME}`);
      }, 3000);
      expect(item).to.be.an.instanceOf(ExtensionsViewItem);
      expect(await item.getTitle()).to.equal(KNativeConstants.KNATIVE_EXTENSION_NAME);
    });
    describe('dependencies', () => {
      it('Yaml, should be installed among extensions', async function context() {
        this.timeout(10000);
        const view = new ActivityBar().getViewControl('Extensions');
        const sideBar = await view.openView();
        const section = (await sideBar.getContent().getSection('Installed')) as ExtensionsViewSection;
        const item = await driver.wait(async () => {
          return section.findItem(`@installed ${KNativeConstants.YAML_EXTENSION_NAME}`);
        }, 3000);
        expect(item).to.be.an.instanceOf(ExtensionsViewItem);
        expect(await item.getTitle()).to.equal(KNativeConstants.YAML_EXTENSION_NAME);
      });
    });

    afterEach(async function afterContext() {
      this.timeout(8000);
      const sideBar = await new ActivityBar().getViewControl('Extensions').openView();
      const titlePart = sideBar.getTitlePart();
      const actionButton = await titlePart.getAction('Clear Extensions Search Results');
      if (await actionButton.isEnabled()) {
        await actionButton.click();
      }
    });
  });

  describe('Knative Activity Bar', () => {
    let view: ViewControl;
    let sideBar: SideBarView;

    before(async () => {
      view = new ActivityBar().getViewControl(KNativeConstants.KNATIVE_EXTENSION_NAME);
      sideBar = await view.openView();
    });

    it('should be available', async function context() {
      this.timeout(10000);
      const titlePart = sideBar.getTitlePart();
      expect(await titlePart.getTitle()).to.equal(KNativeConstants.KNATIVE_EXTENSION_BAR_NAME);
    });

    it('should contain Serving and Eventing sections', async function context() {
      this.timeout(5000);
      const content = sideBar.getContent();
      const sections = await content.getSections();
      expect(sections.length).to.eq(2);
      expect(await Promise.all(sections.map(async (section) => section.getTitle()))).to.has.members([
        KNativeConstants.SECTION_EVENTING,
        KNativeConstants.SECTION_SERVING,
      ]);
    });

    describe('Serving section', () => {
      it('should provide Add service, Refresh and Report Issue action items', async function context() {
        this.timeout(10000);
        const sectionServing = await sideBar.getContent().getSection(KNativeConstants.SECTION_SERVING);
        const actions = await sectionServing.getActions();
        expect(actions.length).to.equal(3);
        actions.forEach((action) => {
          // eslint-disable-next-line max-nested-callbacks
          expect(action.getLabel()).to.satisfy((title) =>
            [
              KNativeConstants.ACTION_ITEM_ADD_SERVICE,
              KNativeConstants.ACTION_ITEM_REFRESH,
              KNativeConstants.ACTION_ITEM_REPORT_ISSUE,
              // eslint-disable-next-line max-nested-callbacks
            ].some((expectedTitle) => {
              return title.includes(expectedTitle);
            }),
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
        expect(actions[0].getLabel()).to.include(KNativeConstants.ACTION_ITEM_REFRESH);
      });
    });

    after(async function afterContext() {
      this.timeout(10000);
      // handle possible native dialog about user not logged into cluster
      try {
        const dialog = await DialogHandler.getOpenDialog();
        await dialog.confirm();
      } catch (error) {
        // no dialog appeared, no action
      }
      await cleanUpNotifications();
    });
  });
}
