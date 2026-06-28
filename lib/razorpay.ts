import RazorpayCheckout from 'react-native-razorpay';
import { supabase } from './supabase';
import { sendLocalNotification } from './notifications';
import { Profile } from '../types';

export const RAZORPAY_KEY_ID = 'rzp_test_SoNU3WPAitKTgk';

export const processPayment = async (
  amountInPaise: number,
  user: Profile,
  bookingDetails: any
) => {
  try {
    // 1. Create order via Supabase Edge Function (mocked or actual endpoint)
    // Replace with your actual edge function URL and logic
    /*
    const { data: orderData, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
      body: { amount: amountInPaise, receipt: `receipt_${Date.now()}` }
    });
    if (orderError) throw orderError;
    const orderId = orderData.id;
    */
    
    // For now, we proceed with a dummy order ID or let Razorpay generate it if allowed without server
    // In production, an order MUST be generated on the server.
    const orderId = `order_${Date.now()}`; 

    const options = {
      description: 'Travel Booking - Zeony Technologies',
      image: 'https://www.zeonytechnologies.com/logo.png',
      currency: 'INR',
      key: RAZORPAY_KEY_ID,
      amount: amountInPaise,
      name: 'Zeony Travel',
      order_id: orderId,
      prefill: {
        email: user.full_name ? `${user.full_name.replace(' ', '')}@example.com` : 'user@example.com',
        contact: user.phone || '',
        name: user.full_name || 'User',
      },
      theme: { color: '#000000' }
    };

    const data = await RazorpayCheckout.open(options);
    
    // On Success:
    // data.razorpay_payment_id
    // data.razorpay_order_id
    // data.razorpay_signature

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
        payment_id: data.razorpay_payment_id,
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
        razorpay_order_id: data.razorpay_order_id,
        razorpay_payment_id: data.razorpay_payment_id,
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
