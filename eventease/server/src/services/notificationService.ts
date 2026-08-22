import { Notification } from '../models';

export const sendNotification = async (
  userId: string,
  title: string,
  message: string,
  type: string = 'system',
  link = ''
): Promise<void> => {
  try {
    await Notification.create({ userId, title, message, type, link });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
};
