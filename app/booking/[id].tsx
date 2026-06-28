import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, ScrollView, TextInput, Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Listing } from '../../types';
import { COLORS, SIZES, FONTS, RADIUS } from '../../constants/theme';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { processPayment } from '../../lib/razorpay';
import { useAuth } from '../../hooks/useAuth';

// Web-compatible date input component
function DateInput({ label, value, onChange, minDate }: { label: string; value: Date; onChange: (d: Date) => void; minDate?: Date }) {
  const dateStr = value.toISOString().split('T')[0];
  const minStr = minDate ? minDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  if (Platform.OS === 'web') {
    return (
      <View style={dateStyles.wrapper}>
        <Text style={dateStyles.label}>{label}</Text>
        {/* @ts-ignore */}
        <input
          type="date"
          value={dateStr}
          min={minStr}
          onChange={(e: any) => { if (e.target.value) onChange(new Date(e.target.value)); }}
          style={{
            border: `1.5px solid ${COLORS.border}`,
            borderRadius: 12,
            padding: '12px 14px',
            fontSize: 15,
            fontFamily: 'Outfit',
            color: COLORS.text,
            backgroundColor: COLORS.surface,
            width: '100%',
            outline: 'none',
            cursor: 'pointer',
          }}
        />
      </View>
    );
  }

  // Native fallback (kept for mobile)
  return (
    <TouchableOpacity style={dateStyles.nativeBtn}>
      <Text style={dateStyles.label}>{label}</Text>
      <Text style={dateStyles.nativeDate}>{value.toLocaleDateString('en-IN')}</Text>
    </TouchableOpacity>
  );
}

const dateStyles = StyleSheet.create({
  wrapper: { flex: 1 },
  label: { fontSize: 12, fontFamily: FONTS.medium, color: COLORS.textSecondary, marginBottom: 6 },
  nativeBtn: {
    flex: 1, backgroundColor: COLORS.surface,
    padding: SIZES.md, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  nativeDate: { fontSize: 15, fontFamily: FONTS.semiBold, color: COLORS.text, marginTop: 4 },
});

export default function BookingScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [checkIn, setCheckIn] = useState<Date>(new Date());
  const [checkOut, setCheckOut] = useState<Date>(new Date(Date.now() + 86400000));
  const [guests, setGuests] = useState(1);
  const [phone, setPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  useEffect(() => {
    if (id && id !== '[id]') fetchListing();
    else setLoading(false);
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

  const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000));
  const basePrice = listing ? nights * listing.price_per_night : 0;
  const taxes = Math.round(basePrice * 0.18);
  const serviceFee = 500;
  const totalPrice = basePrice + taxes + serviceFee;

  const handleCheckInChange = (d: Date) => {
    setCheckIn(d);
    if (d >= checkOut) setCheckOut(new Date(d.getTime() + 86400000));
  };

  const handlePayment = async () => {
    if (!user) { Alert.alert('Error', 'You must be logged in to book'); return; }
    if (nights <= 0) { Alert.alert('Error', 'Check-out must be after check-in'); return; }

    setProcessing(true);
    const result = await processPayment(
      totalPrice * 100,
      { ...user, full_name: user.email?.split('@')[0] || 'User', role: 'user', id: user.id, avatar_url: null, phone: phone || null, created_at: '' },
      { listingId: listing?.id, listingTitle: listing?.title, checkIn: checkIn.toISOString().split('T')[0], checkOut: checkOut.toISOString().split('T')[0], guests, totalPrice }
    );
    setProcessing(false);

    if (result.success) {
      Alert.alert('🎉 Booking Confirmed!', 'Your booking has been confirmed successfully.');
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Listing Summary */}
        <View style={styles.listingCard}>
          <View style={styles.listingInfo}>
            <Text style={styles.listingTitle}>{listing.title}</Text>
            <View style={styles.listingLocationRow}>
              <FontAwesome name="map-marker" size={12} color={COLORS.primary} />
              <Text style={styles.listingLocation}>{listing.location}, {listing.city}</Text>
            </View>
          </View>
          <View style={styles.listingPricePill}>
            <Text style={styles.listingPriceAmount}>₹{listing.price_per_night.toLocaleString('en-IN')}</Text>
            <Text style={styles.listingPriceUnit}>/night</Text>
          </View>
        </View>

        {/* Dates Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <FontAwesome name="calendar" size={16} color={COLORS.primary} />  Select Dates
          </Text>
          <View style={styles.datesRow}>
            <DateInput label="Check-In" value={checkIn} onChange={handleCheckInChange} />
            <View style={styles.dateArrow}>
              <FontAwesome name="arrow-right" size={14} color={COLORS.textMuted} />
            </View>
            <DateInput label="Check-Out" value={checkOut} onChange={setCheckOut} minDate={new Date(checkIn.getTime() + 86400000)} />
          </View>
          <View style={styles.nightsBadge}>
            <MaterialCommunityIcons name="weather-night" size={14} color={COLORS.primary} />
            <Text style={styles.nightsBadgeText}>{nights} night{nights > 1 ? 's' : ''}</Text>
          </View>
        </View>

        {/* Guests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <FontAwesome name="users" size={16} color={COLORS.primary} />  Guests
          </Text>
          <View style={styles.guestRow}>
            <TouchableOpacity style={styles.guestBtn} onPress={() => setGuests(Math.max(1, guests - 1))}>
              <FontAwesome name="minus" size={14} color={guests <= 1 ? COLORS.border : COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.guestCount}>{guests}</Text>
            <TouchableOpacity
              style={[styles.guestBtn, guests >= listing.max_guests && styles.guestBtnDisabled]}
              onPress={() => setGuests(Math.min(listing.max_guests, guests + 1))}
              disabled={guests >= listing.max_guests}
            >
              <FontAwesome name="plus" size={14} color={guests >= listing.max_guests ? COLORS.border : COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.maxGuestsText}>Max {listing.max_guests}</Text>
          </View>
        </View>

        {/* Contact Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <FontAwesome name="user" size={16} color={COLORS.primary} />  Contact Details
          </Text>
          <View style={styles.inputField}>
            <FontAwesome name="envelope" size={14} color={COLORS.textMuted} />
            <Text style={styles.inputValue}>{user?.email || 'Not set'}</Text>
          </View>
          <View style={styles.inputWrapper}>
            <FontAwesome name="phone" size={14} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Phone number (optional)"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>
          <View style={styles.inputWrapper}>
            <FontAwesome name="commenting-o" size={14} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Special requests (optional)"
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={3}
              value={specialRequests}
              onChangeText={setSpecialRequests}
            />
          </View>
        </View>

        {/* Price Breakdown */}
        <View style={styles.priceCard}>
          <Text style={styles.sectionTitle}>Price Breakdown</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceRowLabel}>₹{listing.price_per_night.toLocaleString()} × {nights} nights</Text>
            <Text style={styles.priceRowValue}>₹{basePrice.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceRowLabel}>Taxes (18% GST)</Text>
            <Text style={styles.priceRowValue}>₹{taxes.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceRowLabel}>Service fee</Text>
            <Text style={styles.priceRowValue}>₹{serviceFee.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceRow}>
            <Text style={styles.priceTotalLabel}>Total (INR)</Text>
            <Text style={styles.priceTotalValue}>₹{totalPrice.toLocaleString('en-IN')}</Text>
          </View>

          {/* Cancellation note */}
          <View style={styles.cancellationNote}>
            <FontAwesome name="info-circle" size={13} color={COLORS.success} />
            <Text style={styles.cancellationText}>Free cancellation before check-in</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Pay Button */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{totalPrice.toLocaleString('en-IN')}</Text>
        </View>
        <TouchableOpacity style={[styles.payBtn, processing && styles.payBtnDisabled]} onPress={handlePayment} disabled={processing}>
          {processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="lock" size={16} color="#fff" />
              <Text style={styles.payBtnText}>Pay Securely</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: SIZES.md },

  listingCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SIZES.md, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SIZES.md,
    borderWidth: 1, borderColor: COLORS.borderLight,
    boxShadow: '0px 2px 8px rgba(0,103,120,0.07)', elevation: 2,
  },
  listingInfo: { flex: 1, marginRight: SIZES.sm },
  listingTitle: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.text, marginBottom: 4 },
  listingLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  listingLocation: { fontSize: 13, fontFamily: FONTS.medium, color: COLORS.textSecondary },
  listingPricePill: { alignItems: 'center', backgroundColor: COLORS.primaryLight, padding: SIZES.sm, borderRadius: RADIUS.md },
  listingPriceAmount: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.primary },
  listingPriceUnit: { fontSize: 11, fontFamily: FONTS.medium, color: COLORS.textSecondary },

  section: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SIZES.md, marginBottom: SIZES.md, borderWidth: 1, borderColor: COLORS.borderLight },
  sectionTitle: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.text, marginBottom: SIZES.md },

  datesRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm },
  dateArrow: { paddingHorizontal: 4, paddingTop: 20 },
  nightsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.primaryLight, alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.full, marginTop: SIZES.sm,
  },
  nightsBadgeText: { fontSize: 12, fontFamily: FONTS.semiBold, color: COLORS.primary },

  guestRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.md },
  guestBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1.5, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surface,
  },
  guestBtnDisabled: { borderColor: COLORS.borderLight },
  guestCount: { fontSize: 22, fontFamily: FONTS.bold, color: COLORS.text, minWidth: 36, textAlign: 'center' },
  maxGuestsText: { fontSize: 12, fontFamily: FONTS.medium, color: COLORS.textMuted, marginLeft: 4 },

  inputField: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.sm,
    backgroundColor: COLORS.surfaceAlt, padding: SIZES.sm,
    borderRadius: RADIUS.md, marginBottom: SIZES.sm,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  inputValue: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.textSecondary },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: RADIUS.md, paddingHorizontal: SIZES.sm, marginBottom: SIZES.sm,
  },
  inputIcon: { marginTop: 14, marginRight: SIZES.sm },
  textInput: { flex: 1, fontSize: 15, fontFamily: FONTS.medium, color: COLORS.text, paddingVertical: 12 },
  textArea: { height: 80, textAlignVertical: 'top' },

  priceCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SIZES.md, marginBottom: SIZES.md, borderWidth: 1, borderColor: COLORS.borderLight },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  priceRowLabel: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.textSecondary },
  priceRowValue: { fontSize: 14, fontFamily: FONTS.semiBold, color: COLORS.text },
  priceDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: SIZES.sm },
  priceTotalLabel: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.text },
  priceTotalValue: { fontSize: 20, fontFamily: FONTS.bold, color: COLORS.primary },
  cancellationNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SIZES.sm,
    backgroundColor: '#ECFDF5', padding: SIZES.sm, borderRadius: RADIUS.sm,
  },
  cancellationText: { fontSize: 12, fontFamily: FONTS.medium, color: COLORS.success },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.surface, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SIZES.lg, paddingVertical: SIZES.md,
    paddingBottom: Platform.OS === 'ios' ? SIZES.xl : SIZES.md,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    boxShadow: '0px -2px 10px rgba(0,0,0,0.06)', elevation: 10,
  },
  totalLabel: { fontSize: 12, fontFamily: FONTS.medium, color: COLORS.textSecondary },
  totalValue: { fontSize: 20, fontFamily: FONTS.bold, color: COLORS.primary },
  payBtn: {
    backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: SIZES.xl, paddingVertical: 14, borderRadius: RADIUS.lg,
  },
  payBtnDisabled: { opacity: 0.7 },
  payBtnText: { color: '#fff', fontFamily: FONTS.bold, fontSize: 16 },
});
