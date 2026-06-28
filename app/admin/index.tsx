import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { COLORS, SIZES } from '../../constants/theme';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Booking } from '../../types';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    activeListings: 0,
    totalUsers: 0,
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch Total Bookings & Revenue
      const { data: bookingsData } = await supabase.from('bookings').select('total_price, status');
      let totalRev = 0;
      let totalB = 0;
      if (bookingsData) {
        totalB = bookingsData.length;
        totalRev = bookingsData
          .filter(b => b.status === 'confirmed' || b.status === 'completed')
          .reduce((sum, b) => sum + b.total_price, 0);
      }

      // Fetch Active Listings
      const { count: listingsCount } = await supabase.from('listings').select('*', { count: 'exact', head: true }).eq('is_active', true);
      
      // Fetch Total Users
      const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

      setStats({
        totalBookings: totalB,
        totalRevenue: totalRev,
        activeListings: listingsCount || 0,
        totalUsers: usersCount || 0,
      });

      // Fetch Recent Bookings
      const { data: recent } = await supabase
        .from('bookings')
        .select('*, listing:listings(title), profile:profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentBookings(recent || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStatCard = (title: string, value: string | number, icon: string, color: string) => (
    <View style={styles.statCard}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <FontAwesome name={icon as any} size={24} color={color} />
      </View>
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statsGrid}>
        {renderStatCard('Total Revenue', `₹${stats.totalRevenue}`, 'money', COLORS.success)}
        {renderStatCard('Bookings', stats.totalBookings, 'ticket', COLORS.primary)}
        {renderStatCard('Active Listings', stats.activeListings, 'building', COLORS.warning)}
        {renderStatCard('Total Users', stats.totalUsers, 'users', COLORS.secondary)}
      </View>

      <View style={styles.quickLinksContainer}>
        <Text style={styles.sectionTitle}>Quick Links</Text>
        <View style={styles.linksRow}>
          <TouchableOpacity style={styles.linkCard} onPress={() => router.push('/admin/listings')}>
            <FontAwesome name="list" size={24} color={COLORS.primary} />
            <Text style={styles.linkText}>Listings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkCard} onPress={() => router.push('/admin/users')}>
            <FontAwesome name="users" size={24} color={COLORS.primary} />
            <Text style={styles.linkText}>Users</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkCard} onPress={() => router.push('/admin/analytics')}>
            <FontAwesome name="line-chart" size={24} color={COLORS.primary} />
            <Text style={styles.linkText}>Analytics</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.recentBookingsContainer}>
        <Text style={styles.sectionTitle}>Recent Bookings</Text>
        {recentBookings.length > 0 ? recentBookings.map(booking => (
          <View key={booking.id} style={styles.bookingRow}>
            <View style={styles.bookingInfo}>
              <Text style={styles.bookingTitle}>{booking.listing?.title || 'Unknown'}</Text>
              <Text style={styles.bookingUser}>By {(booking as any).profile?.full_name || 'User'}</Text>
            </View>
            <View style={styles.bookingStatus}>
              <Text style={styles.bookingPrice}>₹{booking.total_price}</Text>
              <Text style={[styles.statusBadge, { 
                color: booking.status === 'confirmed' ? COLORS.success : 
                       booking.status === 'cancelled' ? COLORS.error : COLORS.textSecondary 
              }]}>
                {booking.status.toUpperCase()}
              </Text>
            </View>
          </View>
        )) : (
          <Text style={styles.emptyText}>No recent bookings</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SIZES.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SIZES.lg,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    padding: SIZES.md,
    borderRadius: 12,
    marginBottom: SIZES.sm,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.sm,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  quickLinksContainer: {
    marginBottom: SIZES.xl,
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  linkCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SIZES.md,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  linkText: {
    marginTop: SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  recentBookingsContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SIZES.md,
    marginBottom: SIZES.xl,
  },
  bookingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  bookingUser: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  bookingStatus: {
    alignItems: 'flex-end',
  },
  bookingPrice: {
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: SIZES.sm,
  },
});
