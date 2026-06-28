// Push notifications are dynamically required to prevent Expo Go crashes
import * as Device from 'expo-device';
import { supabase } from './supabase';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications: any = null;
let notificationsEnabled = false;

if (Platform.OS !== 'web' && !isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    notificationsEnabled = true;
  } catch (e) {
    console.warn("Notifications native module not found.");
  }
}

export async function registerForPushNotifications(userId: string) {
  if (!Device.isDevice || Platform.OS === 'web' || !notificationsEnabled) return;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') return;
  
  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    // Save token to profiles table: push_token column (Need to ensure this column exists or use metadata)
    // The schema didn't include push_token in profiles. We can add it or just log it for now.
    // Assuming we added push_token to profiles:
    // await supabase.from('profiles').update({ push_token: token }).eq('id', userId);
    console.log('Push token:', token);
  } catch (error) {
    console.error('Error getting push token:', error);
  }
}

export async function sendLocalNotification(title: string, body: string) {
  if (Platform.OS === 'web' || !notificationsEnabled) return;
  
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null, // trigger immediately
    });
  } catch (e) {
    console.warn("Local notification failed", e);
  }
}
