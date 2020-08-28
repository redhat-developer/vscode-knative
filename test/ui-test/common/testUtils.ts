import { Notification, VSBrowser, NotificationsCenter, NotificationType, Workbench, SideBarView } from 'vscode-extension-tester';

/**
 * @author Ondrej Dockal <odockal@redhat.com>
 */
export async function findNotification(text: string): Promise<Notification | undefined> {
  await new Workbench().openNotificationsCenter();
  const notifications = await new NotificationsCenter().getNotifications(NotificationType.Any);
  notifications.map(async (notification) => {
    if (notification) {
      const message = await notification.getMessage();
      if (message.includes(text)) {
        return notification;
      }
    }
  });
  return undefined;
}

export async function getNotifications(...types: NotificationType[]): Promise<Notification[]> {
  await new Workbench().openNotificationsCenter();
  const notifications = [];
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  types.forEach(async (type) => {
    notifications.push(await new NotificationsCenter().getNotifications(type));
  });
  return notifications;
}

export async function notificationExists(text: string): Promise<boolean> {
  const notifications = await getNotifications();
  notifications.map(async (notification) => {
    if (notification) {
      const message = await notification.getMessage();
      if (message.includes(text)) {
        return true;
      }
    }
  });
  return false;
}

export async function safeNotificationExists(text: string): Promise<boolean> {
  let result;
  try {
    result = await notificationExists(text);
  } catch (err) {
    if (err.name === 'StaleElementReferenceError') {
      result = await notificationExists(text);
    } else {
      throw err;
    }
  }
  return result;
}

export async function waitForEvent(func: Function, timeout: number): Promise<unknown | undefined> {
  const obj = await VSBrowser.instance.driver.wait(func, timeout);
  return obj;
}

export const asyncFilter = async (arr, predicate): Promise<void> => {
  const results = await Promise.all(arr.map(predicate));

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
