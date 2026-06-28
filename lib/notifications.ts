import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(userId: string) {
  if (!Device.isDevice) return;
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
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null, // trigger immediately
  });
}
