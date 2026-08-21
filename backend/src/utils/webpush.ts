import webpush from 'web-push';
import dotenv from 'dotenv';

dotenv.config();

const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

if (!publicVapidKey || !privateVapidKey) {
  console.warn('VAPID keys must be set for web push notifications.');
} else {
  webpush.setVapidDetails(
    'mailto:test@test.com',
    publicVapidKey,
    privateVapidKey
  );
}

export const sendPushNotification = async (subscription: any, payload: any) => {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
};

export default webpush;
