import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Car } from '../../types';
import { COLORS, SIZES, FONTS, RADIUS } from '../../constants/theme';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';

export default function BookingScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [days, setDays] = useState('1');
  const [expectedKms, setExpectedKms] = useState('0');

  useEffect(() => {
    if (id) fetchCar();
  }, [id]);

  const fetchCar = async () => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      setCar(data as Car);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not load vehicle details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const parsedDays = parseInt(days) || 0;
  const parsedKms = parseInt(expectedKms) || 0;
  
  const totalPrice = car ? (parsedDays * car.per_day_cost) : 0;

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to book');
      return;
    }
    if (parsedDays <= 0) {
      Alert.alert('Error', 'Please enter a valid number of days');
      return;
    }

    setSubmitting(true);
    try {
      // Create a dummy start/end date based on days (since this is an MVP without a full calendar picker)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + parsedDays);

      const { error } = await supabase
        .from('car_bookings')
        .insert({
          user_id: user.id,
          car_id: car?.id,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          total_days: parsedDays,
          expected_kms: parsedKms,
          total_price: totalPrice,
          status: 'pending',
          payment_status: 'unpaid'
        });

      if (error) throw error;

      Alert.alert(
        'Request Sent!',
        'Your booking request has been sent to the Admin for approval. You will be notified once approved.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/bookings') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit booking');
      setSubmitting(false);
    }
  };

  if (loading || !car) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.summaryCard}>
          <Text style={styles.carName}>{car.name}</Text>
          <Text style={styles.brand}>{car.brand}</Text>
          <View style={styles.divider} />
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Daily Rate:</Text>
            <Text style={styles.priceValue}>₹{car.per_day_cost}/day</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Extra KM Rate:</Text>
            <Text style={styles.priceValue}>₹{car.extra_km_cost}/km</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Booking Details</Text>
        
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>How many days?</Text>
          <View style={styles.inputWrapper}>
            <FontAwesome name="calendar" size={16} color={COLORS.textSecondary} />
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={days}
              onChangeText={setDays}
              placeholder="e.g. 2"
            />
          </View>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Expected Extra KMs (Optional)</Text>
          <View style={styles.inputWrapper}>
            <FontAwesome name="road" size={16} color={COLORS.textSecondary} />
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={expectedKms}
              onChangeText={setExpectedKms}
              placeholder="e.g. 50"
            />
          </View>
          <Text style={styles.hintText}>Extra km charges (₹{car.extra_km_cost}/km) will be billed after the trip.</Text>
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Estimated Base Total</Text>
          <Text style={styles.totalPrice}>₹{totalPrice.toLocaleString('en-IN')}</Text>
          <Text style={styles.totalHint}>Excludes extra KM charges</Text>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Request Admin Approval</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: SIZES.lg, paddingBottom: 100 },
  
  summaryCard: {
    backgroundColor: COLORS.primaryLight,
    padding: SIZES.lg,
    borderRadius: RADIUS.lg,
    marginBottom: SIZES.xl,
  },
  carName: { fontSize: 20, fontFamily: FONTS.bold, color: COLORS.primary },
  brand: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.primary, opacity: 0.8 },
  divider: { height: 1, backgroundColor: COLORS.primary, opacity: 0.1, marginVertical: SIZES.md },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  priceLabel: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.textSecondary },
  priceValue: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.primary },

  sectionTitle: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.text, marginBottom: SIZES.md },
  
  inputCard: {
    backgroundColor: COLORS.surface,
    padding: SIZES.md,
    borderRadius: RADIUS.md,
    marginBottom: SIZES.md,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  inputLabel: { fontSize: 14, fontFamily: FONTS.semiBold, color: COLORS.text, marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SIZES.md,
  },
  input: {
    flex: 1, paddingVertical: 12, paddingHorizontal: 12,
    fontFamily: FONTS.medium, fontSize: 16, color: COLORS.text,
  },
  hintText: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 8 },

  totalCard: {
    backgroundColor: COLORS.surfaceAlt,
    padding: SIZES.lg,
    borderRadius: RADIUS.lg,
    marginTop: SIZES.md,
    alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  totalLabel: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.textSecondary },
  totalPrice: { fontSize: 32, fontFamily: FONTS.bold, color: COLORS.primary, marginVertical: 4 },
  totalHint: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textMuted },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.surface,
    padding: SIZES.lg,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: 16, borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  submitButtonText: { color: '#fff', fontSize: 16, fontFamily: FONTS.bold },
});
