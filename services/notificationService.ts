import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

type NotificationsType = typeof import('expo-notifications');

let notificationsModule: NotificationsType | null = null;
let isHandlerConfigured = false;
let activeRestNotificationId: string | null = null;

/**
 * Detect whether the app is running inside Expo Go on Android.
 * In Expo Go SDK 53+, expo-notifications triggers a fatal error on Android
 * when initialized because push notifications are unsupported in Expo Go.
 */
function isExpoGoOnAndroid(): boolean {
  if (Platform.OS !== 'android') return false;
  return (
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
    Constants.appOwnership === 'expo'
  );
}

/**
 * Safely retrieve the expo-notifications module only when supported.
 */
function getNotifications(): NotificationsType | null {
  if (Platform.OS === 'web' || isExpoGoOnAndroid()) {
    return null;
  }

  if (!notificationsModule) {
    try {
      notificationsModule = require('expo-notifications');
      if (notificationsModule && !isHandlerConfigured) {
        notificationsModule.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
        isHandlerConfigured = true;
      }
    } catch (err) {
      console.warn('[notificationService] Failed to initialize expo-notifications:', err);
      return null;
    }
  }

  return notificationsModule;
}

/**
 * Request notification permissions safely.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) return false;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (err) {
    console.warn('[notificationService] Permission request notice:', err);
    return false;
  }
}

/**
 * Schedule a local notification when rest interval ends.
 * Fires even when the phone is locked or music is playing.
 */
export async function scheduleRestIntervalNotification(
  seconds: number,
  exerciseName?: string
): Promise<string | null> {
  if (seconds <= 0) return null;

  const Notifications = getNotifications();
  if (!Notifications) return null;

  try {
    // Cancel existing rest notification
    if (activeRestNotificationId) {
      await Notifications.cancelScheduledNotificationAsync(activeRestNotificationId);
      activeRestNotificationId = null;
    }

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'REST COMPLETE',
        body: `Interval elapsed. Ready for next set ${exerciseName ? `• ${exerciseName}` : ''}`,
        sound: true,
        vibrate: [0, 250, 250, 250],
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, Math.round(seconds)),
      },
    });

    activeRestNotificationId = id;
    return id;
  } catch (err) {
    console.warn('[notificationService] Failed to schedule notification:', err);
    return null;
  }
}

/**
 * Cancel any pending rest interval notifications (e.g. when skipped).
 */
export async function cancelRestIntervalNotification(): Promise<void> {
  if (!activeRestNotificationId) return;

  const Notifications = getNotifications();
  if (Notifications) {
    try {
      await Notifications.cancelScheduledNotificationAsync(activeRestNotificationId);
    } catch {}
  }
  activeRestNotificationId = null;
}
