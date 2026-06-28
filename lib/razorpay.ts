import { Platform } from 'react-native';
import { supabase } from './supabase';
import { sendLocalNotification } from './notifications';
import { Profile } from '../types';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let RazorpayCheckout: any;
if (Platform.OS !== 'web' && !isExpoGo) {
  try {
    RazorpayCheckout = require('react-native-razorpay').default;
  } catch (e) {
    console.warn("react-native-razorpay not linked. Are you using Expo Go?");
  }
}

export const RAZORPAY_KEY_ID = 'rzp_test_SoNU3WPAitKTgk';

const loadRazorpayWebScript = () => {
  return new Promise((resolve) => {
    if (Platform.OS !== 'web' || (window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const processPayment = async (
  amountInPaise: number,
  user: Profile,
  bookingDetails: any
) => {
  try {
    await loadRazorpayWebScript();
    
    // 1. Create order ID
    const orderId = `order_${Date.now()}`; 

    const options = {
      description: 'Travel Booking - Zeony Technologies',
      image: 'https://www.zeonytechnologies.com/logo.png',
      currency: 'INR',
      key: RAZORPAY_KEY_ID,
      amount: amountInPaise,
      name: 'Zeony Travel',
      prefill: {
        email: user.full_name ? `${user.full_name.replace(' ', '')}@example.com` : 'user@example.com',
        contact: user.phone || '',
        name: user.full_name || 'User',
      },
      theme: { color: '#000000' }
    };

    let paymentData: any = {};

    if (Platform.OS === 'web') {
      paymentData = await new Promise((resolve, reject) => {
        const razorpay = new (window as any).Razorpay({
          ...options,
          handler: function (response: any) {
            resolve(response);
          }
        });
        razorpay.on('payment.failed', function (response: any) {
          reject(response.error);
        });
        razorpay.open();
      });
    } else if (!isExpoGo && RazorpayCheckout && typeof RazorpayCheckout.open === 'function') {
      paymentData = await RazorpayCheckout.open(options);
    } else {
      throw new Error('Razorpay native module is not linked correctly. Please test on Web, or build a custom Dev Client (APK).');
    }
    
    // On Success:
    // paymentData.razorpay_payment_id
    // paymentData.razorpay_order_id
    // paymentData.razorpay_signature

    // 2. Insert into bookings table
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        listing_id: bookingDetails.listingId,
        check_in: bookingDetails.checkIn,
        check_out: bookingDetails.checkOut,
        guests: bookingDetails.guests,
        total_price: bookingDetails.totalPrice,
        status: 'confirmed',
        payment_id: paymentData.razorpay_payment_id,
        payment_status: 'paid',
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // 3. Insert into payments table
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        booking_id: bookingData.id,
        amount: bookingDetails.totalPrice,
        currency: 'INR',
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        status: 'paid',
      });

    if (paymentError) throw paymentError;

    // 4. Send notification
    await sendLocalNotification(
      'Booking Confirmed! 🎉',
      `Your booking for ${bookingDetails.listingTitle} is confirmed.`
    );

    return { success: true, bookingId: bookingData.id };
  } catch (error: any) {
    console.error('Payment Error:', error);
    // User cancelled or payment failed
    return { success: false, error: error.description || error.message || 'Payment failed' };
  }
};
