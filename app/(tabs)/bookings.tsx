import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, Alert, Image, Platform
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { supabase } from '../../lib/supabase';
import { CarBooking } from '../../types';
import { COLORS, SIZES, FONTS, RADIUS } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

const TABS = ['Pending', 'Approved', 'Completed', 'Cancelled'];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  approved: { label: 'Approved', color: COLORS.success, bg: '#ECFDF5' },
  pending: { label: 'Pending', color: '#D97706', bg: '#FEF3C7' },
  completed: { label: 'Completed', color: COLORS.textSecondary, bg: COLORS.borderLight },
  cancelled: { label: 'Cancelled', color: COLORS.error, bg: '#FEE2E2' },
  rejected: { label: 'Rejected', color: COLORS.error, bg: '#FEE2E2' },
};

export default function BookingsScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Pending');
  const [bookings, setBookings] = useState<CarBooking[]>([]);
  const [loading, setLoading] = useState(true);


  const insets = useSafeAreaInsets();
  const router = useRouter();

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('car_bookings')
        .select('*, car:cars(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setBookings(data as CarBooking[]);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleCancel = async (bookingId: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to cancel this booking?')) {
        const { error } = await supabase.from('car_bookings').update({ status: 'cancelled' }).eq('id', bookingId);
        if (!error) fetchBookings();
      }
      return;
    }

    Alert.alert('Cancel Booking', 'Are you sure you want to cancel?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('car_bookings').update({ status: 'cancelled' }).eq('id', bookingId);
          if (!error) fetchBookings();
        }
      }
    ]);
  };

  const handlePayment = async (booking: CarBooking) => {
    if (!user) return;
    
    // Razorpay Integration
    var options = {
      description: `Payment for ${booking.car?.name}`,
      image: booking.car?.images?.[0] || 'https://i.imgur.com/3g7nmJC.png',
      currency: 'INR',
      key: 'rzp_test_YOUR_TEST_KEY', // Replace with real key
      amount: booking.total_price * 100, // Amount in paise
      name: 'Zeony Car Rentals',
      prefill: {
        email: user.email,
        contact: user.phone || '9999999999',
        name: user.full_name || 'Customer'
      },
      theme: { color: COLORS.primary }
    };
    
    try {
      const data = await RazorpayCheckout.open(options);
      // Payment success!
      setLoading(true);
      const { error } = await supabase
        .from('car_bookings')
        .update({ payment_status: 'paid' })
        .eq('id', booking.id);
        
      if (error) throw error;
      
      Alert.alert('Success', `Payment of ₹${booking.total_price} successful! Payment ID: ${data.razorpay_payment_id}`);
      fetchBookings();
    } catch (error: any) {
      // Payment failure or cancelled
      console.log('Payment Error', error);
      Alert.alert('Payment Failed', error.description || 'The payment was cancelled or failed.');
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'Pending') return b.status === 'pending';
    if (activeTab === 'Approved') return b.status === 'approved';
    if (activeTab === 'Completed') return b.status === 'completed';
    if (activeTab === 'Cancelled') return b.status === 'cancelled' || b.status === 'rejected';
    return true;
  });

  const renderBooking = ({ item: booking }: { item: CarBooking }) => {
    const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
    const imageUrl = booking.car?.images?.[0] || 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=400&q=80';

    return (
      <View style={styles.bookingCard}>
        <Image source={{ uri: imageUrl }} style={styles.bookingImage} />
        <View style={styles.bookingContent}>
          <View style={styles.bookingTitleRow}>
            <Text style={styles.bookingTitle} numberOfLines={1}>
              {booking.car?.name || 'Booking'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>

          <View style={styles.bookingMetaRow}>
            <FontAwesome name="calendar" size={12} color={COLORS.textMuted} />
            <Text style={styles.bookingMeta}>
              {new Date(booking.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} →{' '}
              {new Date(booking.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
            </Text>
          </View>

          <View style={styles.bookingMetaRow}>
            <MaterialCommunityIcons name="clock-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.bookingMeta}>{booking.total_days} days</Text>
          </View>

          <View style={styles.bookingFooter}>
            <Text style={styles.bookingPrice}>₹{booking.total_price.toLocaleString('en-IN')}</Text>
            <View style={styles.bookingActions}>
              {booking.status === 'approved' && booking.payment_status === 'unpaid' && (
                <TouchableOpacity style={styles.payBtn} onPress={() => handlePayment(booking)}>
                  <Text style={styles.payBtnText}>Pay Now</Text>
                </TouchableOpacity>
              )}
              {booking.payment_status === 'paid' && (
                <View style={styles.paidBadge}>
                  <Text style={styles.paidText}>Paid</Text>
                </View>
              )}
              {(booking.status === 'approved' || booking.status === 'pending') && booking.payment_status === 'unpaid' && (
                <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(booking.id)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    const emojis: Record<string, string> = { Pending: '⏳', Approved: '🚗', Completed: '✅', Cancelled: '❌' };
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>{emojis[activeTab]}</Text>
        <Text style={styles.emptyTitle}>No {activeTab.toLowerCase()} bookings</Text>
        <Text style={styles.emptySubtitle}>
          {activeTab === 'Pending' ? 'Start exploring and book your next ride!' : `Your ${activeTab.toLowerCase()} bookings will appear here.`}
        </Text>
        {activeTab === 'Pending' && (
          <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push('/(tabs)')}>
            <Text style={styles.exploreBtnText}>Explore Cars</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        {bookings.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{bookings.length}</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBooking}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchBookings} colors={[COLORS.primary]} />
        }
        showsVerticalScrollIndicator={false}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.md,
    gap: SIZES.sm,
  },
  headerTitle: { fontSize: 26, fontFamily: FONTS.bold, color: COLORS.text },
  countBadge: {
    backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  countText: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.primary },

  tabsContainer: {
    flexDirection: 'row', marginHorizontal: SIZES.md, marginBottom: SIZES.md,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 4,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  tab: { flex: 1, paddingVertical: SIZES.sm, alignItems: 'center', borderRadius: RADIUS.sm },
  activeTab: { backgroundColor: COLORS.primary },
  tabText: { fontFamily: FONTS.semiBold, color: COLORS.textSecondary, fontSize: 11 },
  activeTabText: { color: '#fff' },

  listContainer: { padding: SIZES.md },

  bookingCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    marginBottom: SIZES.md, overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1, borderColor: COLORS.borderLight,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
  bookingImage: { width: 100, height: '100%', minHeight: 130 },
  bookingContent: { flex: 1, padding: SIZES.sm },
  bookingTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  bookingTitle: { flex: 1, fontSize: 14, fontFamily: FONTS.bold, color: COLORS.text, marginRight: SIZES.xs },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  statusText: { fontSize: 10, fontFamily: FONTS.bold },

  bookingMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  bookingMeta: { fontSize: 12, fontFamily: FONTS.medium, color: COLORS.textSecondary },

  bookingFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SIZES.xs },
  bookingPrice: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.primary },
  bookingActions: { flexDirection: 'row', gap: SIZES.xs },

  cancelBtn: {
    borderWidth: 1, borderColor: COLORS.error, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  cancelBtnText: { fontSize: 12, fontFamily: FONTS.semiBold, color: COLORS.error },
  
  payBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  payBtnText: { fontSize: 12, fontFamily: FONTS.bold, color: '#fff' },

  paidBadge: {
    backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.success,
  },
  paidText: { fontSize: 12, fontFamily: FONTS.bold, color: COLORS.success },

  emptyContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: SIZES.xl },
  emptyEmoji: { fontSize: 52, marginBottom: SIZES.md },
  emptyTitle: { fontSize: 20, fontFamily: FONTS.bold, color: COLORS.text, marginBottom: SIZES.sm },
  emptySubtitle: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SIZES.lg },
  exploreBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SIZES.xl, paddingVertical: SIZES.sm, borderRadius: RADIUS.full },
  exploreBtnText: { color: '#fff', fontFamily: FONTS.semiBold, fontSize: 14 },

});
