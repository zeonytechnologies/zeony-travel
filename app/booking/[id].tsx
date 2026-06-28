import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Listing } from '../../types';
import { COLORS, SIZES } from '../../constants/theme';
import { FontAwesome } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { processPayment } from '../../lib/razorpay';
import { useAuth } from '../../hooks/useAuth';

export default function BookingScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Booking state
  const [checkIn, setCheckIn] = useState<Date>(new Date());
  const [checkOut, setCheckOut] = useState<Date>(new Date(Date.now() + 86400000)); // Next day
  const [guests, setGuests] = useState(1);
  const [isCheckInVisible, setCheckInVisible] = useState(false);
  const [isCheckOutVisible, setCheckOutVisible] = useState(false);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      setListing(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateNights = () => {
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();
  const totalPrice = listing ? nights * listing.price_per_night : 0;

  const handlePayment = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to book');
      return;
    }
    if (nights <= 0) {
      Alert.alert('Error', 'Check-out date must be after check-in date');
      return;
    }

    setProcessing(true);
    
    // Total price in paise (INR)
    const amountInPaise = totalPrice * 100;
    
    const result = await processPayment(
      amountInPaise,
      { ...user, full_name: user.email?.split('@')[0] || 'User', role: 'user', id: user.id, avatar_url: null, phone: null, created_at: '' }, // Type cast workaround
      {
        listingId: listing?.id,
        listingTitle: listing?.title,
        checkIn: checkIn.toISOString().split('T')[0],
        checkOut: checkOut.toISOString().split('T')[0],
        guests,
        totalPrice,
      }
    );

    setProcessing(false);

    if (result.success) {
      Alert.alert('Success', 'Booking confirmed!');
      router.replace('/(tabs)/bookings');
    } else {
      Alert.alert('Payment Failed', result.error);
    }
  };

  if (loading || !listing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome name="chevron-left" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirm Booking</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.listingTitle}>{listing.title}</Text>
          <Text style={styles.listingLocation}>{listing.location}</Text>
        </View>

        <Text style={styles.sectionTitle}>Select Dates</Text>
        
        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.dateButton} onPress={() => setCheckInVisible(true)}>
            <Text style={styles.dateLabel}>Check-In</Text>
            <Text style={styles.dateText}>{checkIn.toLocaleDateString()}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateButton} onPress={() => setCheckOutVisible(true)}>
            <Text style={styles.dateLabel}>Check-Out</Text>
            <Text style={styles.dateText}>{checkOut.toLocaleDateString()}</Text>
          </TouchableOpacity>
        </View>

        <DateTimePickerModal
          isVisible={isCheckInVisible}
          mode="date"
          minimumDate={new Date()}
          onConfirm={(date) => {
            setCheckIn(date);
            setCheckInVisible(false);
            if (date >= checkOut) {
              setCheckOut(new Date(date.getTime() + 86400000));
            }
          }}
          onCancel={() => setCheckInVisible(false)}
        />
        
        <DateTimePickerModal
          isVisible={isCheckOutVisible}
          mode="date"
          minimumDate={new Date(checkIn.getTime() + 86400000)}
          onConfirm={(date) => {
            setCheckOut(date);
            setCheckOutVisible(false);
          }}
          onCancel={() => setCheckOutVisible(false)}
        />

        <Text style={styles.sectionTitle}>Guests</Text>
        <View style={styles.guestSelector}>
          <TouchableOpacity 
            style={styles.guestButton} 
            onPress={() => setGuests(Math.max(1, guests - 1))}
          >
            <FontAwesome name="minus" size={16} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.guestCount}>{guests}</Text>
          <TouchableOpacity 
            style={[styles.guestButton, guests >= listing.max_guests && styles.guestButtonDisabled]} 
            onPress={() => setGuests(Math.min(listing.max_guests, guests + 1))}
            disabled={guests >= listing.max_guests}
          >
            <FontAwesome name="plus" size={16} color={guests >= listing.max_guests ? COLORS.border : COLORS.primary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.maxGuestsInfo}>Maximum {listing.max_guests} guests allowed</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Price Breakdown</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>₹{listing.price_per_night} x {nights} nights</Text>
            <Text style={styles.summaryText}>₹{totalPrice}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalText}>Total</Text>
            <Text style={styles.totalPrice}>₹{totalPrice}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.payButton, processing && styles.payButtonDisabled]} 
          onPress={handlePayment}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color={COLORS.surface} />
          ) : (
            <Text style={styles.payButtonText}>Proceed to Pay</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.md,
    paddingTop: 50,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    padding: SIZES.sm,
    marginRight: SIZES.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: SIZES.md,
    margin: SIZES.md,
    borderRadius: 12,
  },
  listingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  listingLocation: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: SIZES.md,
    marginTop: SIZES.md,
    marginBottom: SIZES.sm,
  },
  dateRow: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.md,
  },
  dateButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SIZES.md,
    borderRadius: 8,
    marginHorizontal: SIZES.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  dateText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
    marginTop: SIZES.xs,
  },
  guestSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SIZES.md,
    borderRadius: 8,
    padding: SIZES.sm,
    width: 150,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  guestButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestButtonDisabled: {
    backgroundColor: COLORS.background,
  },
  guestCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  maxGuestsInfo: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: SIZES.md,
    marginTop: SIZES.xs,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    margin: SIZES.md,
    padding: SIZES.md,
    borderRadius: 12,
    marginTop: SIZES.xl,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.sm,
  },
  summaryText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SIZES.sm,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  bottomBar: {
    padding: SIZES.md,
    paddingBottom: SIZES.xl,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  payButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    color: COLORS.surface,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
