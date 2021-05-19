/* eslint-disable no-console */
import { Notification, VSBrowser, NotificationType, Workbench, SideBarView, ModalDialog } from 'vscode-extension-tester';

/**
 * @author Ondrej Dockal <odockal@redhat.com>
 */
export async function getNotifications(...types: NotificationType[]): Promise<Notification[]> {
  const center = await new Workbench().openNotificationsCenter();
  const notifications: Notification[] = [];
  await Promise.all(
    types.map(async (type) => {
      notifications.push(...(await center.getNotifications(type)));
    }),
  );
  return notifications;
}

export async function cleanUpNotifications(): Promise<void> {
  const nc = await new Workbench().openNotificationsCenter();
  const notifications = await nc.getNotifications(NotificationType.Any);
  if (notifications.length > 0) {
    await nc.clearAllNotifications();
  }
  await nc.close();
}

export async function findNotification(text: string): Promise<Notification | undefined> {
  const center = await new Workbench().openNotificationsCenter();
  const notifications = await center.getNotifications(NotificationType.Any);
  // eslint-disable-next-line no-restricted-syntax
  for (const notification of notifications) {
    // eslint-disable-next-line no-await-in-loop
    const message = await notification.getMessage();
    if (message.includes(text)) {
      return notification;
    }
  }
  return undefined;
}

export async function notificationExists(text: string): Promise<boolean> {
  const notifications = await getNotifications(NotificationType.Any);
  // eslint-disable-next-line no-restricted-syntax
  for (const notification of notifications) {
    if (notification) {
      // eslint-disable-next-line no-await-in-loop
      const message = await notification.getMessage();
      if (message.includes(text)) {
        return true;
      }
    }
  }
  return false;
}

export async function safeNotificationExists(text: string): Promise<boolean> {
  let result: boolean;
  try {
    result = await notificationExists(text);
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (err.name === 'StaleElementReferenceError') {
      result = await notificationExists(text);
    } else {
      throw err;
    }
  }
  return result;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export async function waitForEvent(func: Function, timeout: number): Promise<unknown | undefined> {
  const obj = await VSBrowser.instance.driver.wait(func, timeout);
  return obj;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const asyncFilter = async (arr, predicate): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  const results = await Promise.all(arr.map(predicate));

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  return arr.filter((_v, index) => results[index]);
};

export async function sectionHasItems(sideBar: SideBarView): Promise<boolean> {
  const sections = await sideBar.getContent().getSections();
  return (await sections[0].getVisibleItems()).length > 0;
}

export async function sectionHasItem(sideBar: SideBarView, name: string): Promise<boolean> {
  const section = await sideBar.getContent().getSection(name);
  return !!section;
}

export async function modalDialogExists(name: string): Promise<ModalDialog | undefined> {
  try {
    const dialog = new ModalDialog();
    if ((await dialog.getDetails()).indexOf(name) >= 0) {
      return dialog;
    }
  } catch (error) {
    // omit error
  }
  return undefined;
}
