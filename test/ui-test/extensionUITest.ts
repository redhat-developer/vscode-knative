import { expect } from 'chai';
import { ActivityBar, ExtensionsViewSection, ExtensionsViewItem, ViewControl, SideBarView } from 'vscode-extension-tester';
import { KNativeConstants } from './common/constants';
import { cleanUpNotifications } from './common/testUtils';
/**
 * @author Ondrej Dockal <odockal@redhat.com>
 */
export function extensionsUITest(): void {
  describe('Knative extension', () => {
    it('should be installed among extensions view', async function context() {
      this.timeout(5000);
      const view = new ActivityBar().getViewControl('Extensions');
      const sideBar = await view.openView();
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const section = (await sideBar.getContent().getSection('Installed')) as ExtensionsViewSection;
      const item = await section.findItem(`@installed ${KNativeConstants.KNATIVE_EXTENSION_NAME}`);
      expect(item).to.be.an.instanceOf(ExtensionsViewItem);
      expect(await item.getTitle()).to.equal(KNativeConstants.KNATIVE_EXTENSION_NAME);
    });

    describe('Knative Activity Bar', () => {
      let view: ViewControl;
      let sideBar: SideBarView;

      before(async () => {
        const controls = await new ActivityBar().getViewControls();
        // eslint-disable-next-line no-console
        console.log(controls.map((control) => control.getTitle()));
        view = new ActivityBar().getViewControl(KNativeConstants.KNATIVE_EXTENSION_NAME);
        sideBar = await view.openView();
      });

      it('should be available', async function context() {
        this.timeout(5000);
        const titlePart = sideBar.getTitlePart();
        expect(await titlePart.getTitle()).to.equal(KNativeConstants.KNATIVE_EXTENSION_BAR_NAME);
      });

      it('should provide Add service, Refresh action items', async function context() {
        this.timeout(5000);
        const actions = await sideBar.getTitlePart().getActions();
        expect(actions.length).to.equal(3);
        actions.forEach((action) => {
          // eslint-disable-next-line max-nested-callbacks
          expect(action.getTitle()).to.satisfy((title) =>
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

    after(async function context() {
      this.timeout(5000);
      const sideBar = await new ActivityBar().getViewControl('Extensions').openView();
      const titlePart = sideBar.getTitlePart();
      const actionButton = await titlePart.getAction('Clear Extensions Search Results');
      if (await actionButton.isEnabled()) {
        await actionButton.click();
      }

      await cleanUpNotifications();
    });
  });
}
