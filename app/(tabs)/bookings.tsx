import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, Alert, Image, Platform
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Booking } from '../../types';
import { COLORS, SIZES, FONTS, RADIUS } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import ReviewModal from '../../components/ReviewModal';

const TABS = ['Upcoming', 'Completed', 'Cancelled'];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  confirmed: { label: 'Confirmed', color: COLORS.success, bg: '#ECFDF5' },
  pending: { label: 'Pending', color: '#D97706', bg: '#FEF3C7' },
  completed: { label: 'Completed', color: COLORS.textSecondary, bg: COLORS.borderLight },
  cancelled: { label: 'Cancelled', color: COLORS.error, bg: '#FEE2E2' },
};

export default function BookingsScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, listing:listings(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setBookings(data || []);
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
        const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
        if (!error) fetchBookings();
      }
      return;
    }

    Alert.alert('Cancel Booking', 'Are you sure you want to cancel?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
          if (!error) fetchBookings();
        }
      }
    ]);
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'Upcoming') return b.status === 'confirmed' || b.status === 'pending';
    if (activeTab === 'Completed') return b.status === 'completed';
    if (activeTab === 'Cancelled') return b.status === 'cancelled';
    return true;
  });

  const renderBooking = ({ item: booking }: { item: Booking }) => {
    const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
    const imageUrl = (booking as any).listing?.images?.[0] || 'https://images.unsplash.com/photo-1542314831-c6a4d14d8c53?w=400&q=80';
    const nights = Math.ceil(
      (new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / 86400000
    );

    return (
      <View style={styles.bookingCard}>
        <Image source={{ uri: imageUrl }} style={styles.bookingImage} />
        <View style={styles.bookingContent}>
          <View style={styles.bookingTitleRow}>
            <Text style={styles.bookingTitle} numberOfLines={1}>
              {(booking as any).listing?.title || 'Booking'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>

          <View style={styles.bookingMetaRow}>
            <FontAwesome name="calendar" size={12} color={COLORS.textMuted} />
            <Text style={styles.bookingMeta}>
              {new Date(booking.check_in).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} →{' '}
              {new Date(booking.check_out).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Text>
          </View>

          <View style={styles.bookingMetaRow}>
            <FontAwesome name="users" size={12} color={COLORS.textMuted} />
            <Text style={styles.bookingMeta}>{booking.guests} guest(s) · {nights} night(s)</Text>
          </View>

          <View style={styles.bookingFooter}>
            <Text style={styles.bookingPrice}>₹{booking.total_price.toLocaleString('en-IN')}</Text>
            <View style={styles.bookingActions}>
              {(booking.status === 'confirmed' || booking.status === 'pending') && (
                <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(booking.id)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              )}
              {booking.status === 'completed' && (
                <TouchableOpacity
                  style={styles.reviewBtn}
                  onPress={() => { setSelectedBooking(booking); setReviewModalVisible(true); }}
                >
                  <FontAwesome name="star-o" size={12} color={COLORS.primary} />
                  <Text style={styles.reviewBtnText}>Review</Text>
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
    const emojis: Record<string, string> = { Upcoming: '🧳', Completed: '✅', Cancelled: '❌' };
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>{emojis[activeTab]}</Text>
        <Text style={styles.emptyTitle}>No {activeTab.toLowerCase()} bookings</Text>
        <Text style={styles.emptySubtitle}>
          {activeTab === 'Upcoming' ? 'Start exploring and book your next adventure!' : `Your ${activeTab.toLowerCase()} bookings will appear here.`}
        </Text>
        {activeTab === 'Upcoming' && (
          <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push('/(tabs)')}>
            <Text style={styles.exploreBtnText}>Explore Destinations</Text>
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

      <ReviewModal
        visible={reviewModalVisible}
        booking={selectedBooking}
        onClose={() => { setReviewModalVisible(false); setSelectedBooking(null); }}
        onSuccess={fetchBookings}
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
  tabText: { fontFamily: FONTS.semiBold, color: COLORS.textSecondary, fontSize: 14 },
  activeTabText: { color: '#fff' },

  listContainer: { padding: SIZES.md },

  bookingCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    marginBottom: SIZES.md, overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1, borderColor: COLORS.borderLight,
    boxShadow: '0px 2px 8px rgba(0,103,120,0.07)', elevation: 2,
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

  reviewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  reviewBtnText: { fontSize: 12, fontFamily: FONTS.semiBold, color: COLORS.primary },

  emptyContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: SIZES.xl },
  emptyEmoji: { fontSize: 52, marginBottom: SIZES.md },
  emptyTitle: { fontSize: 20, fontFamily: FONTS.bold, color: COLORS.text, marginBottom: SIZES.sm },
  emptySubtitle: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SIZES.lg },
  exploreBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SIZES.xl, paddingVertical: SIZES.sm, borderRadius: RADIUS.full },
  exploreBtnText: { color: '#fff', fontFamily: FONTS.semiBold, fontSize: 14 },
});
