import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { COLORS, SIZES, FONTS, RADIUS } from '../../constants/theme';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCars: 0,
    activeBookings: 0,
    totalRevenue: 0,
    pendingApprovals: 0
  });
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch total cars
      const { count: totalCars } = await supabase.from('cars').select('id', { count: 'exact', head: true });
      
      // Fetch active bookings (approved)
      const { count: activeBookings } = await supabase.from('car_bookings').select('id', { count: 'exact', head: true }).eq('status', 'approved');

      // Fetch pending approvals
      const { count: pendingApprovals } = await supabase.from('car_bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending');

      // Fetch total revenue (sum of completed/approved bookings)
      const { data: revenueData } = await supabase.from('car_bookings')
        .select('total_price')
        .in('status', ['approved', 'completed']);
        
      const totalRevenue = revenueData?.reduce((acc, curr) => acc + (curr.total_price || 0), 0) || 0;

      setStats({
        totalCars: totalCars || 0,
        activeBookings: activeBookings || 0,
        pendingApprovals: pendingApprovals || 0,
        totalRevenue
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const renderStatCard = (title: string, value: string | number, icon: any, color: string) => (
    <View style={styles.statCard}>
      <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity style={styles.exitButton} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.exitText}>Exit</Text>
          <FontAwesome name="sign-out" size={16} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchStats} />}
      >
        <View style={styles.grid}>
          {renderStatCard('Total Revenue', `₹${stats.totalRevenue.toLocaleString('en-IN')}`, 'currency-inr', COLORS.success)}
          {renderStatCard('Pending Requests', stats.pendingApprovals, 'clock-alert-outline', '#D97706')}
          {renderStatCard('Active Rentals', stats.activeBookings, 'car-key', COLORS.primary)}
          {renderStatCard('Total Cars', stats.totalCars, 'car-multiple', '#7C3AED')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(admin)/cars')}>
            <View style={[styles.actionIcon, { backgroundColor: '#7C3AED20' }]}>
              <MaterialCommunityIcons name="car-cog" size={24} color="#7C3AED" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Manage Fleet</Text>
              <Text style={styles.actionSubtitle}>Add, edit, or remove vehicles</Text>
            </View>
            <FontAwesome name="angle-right" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(admin)/bookings')}>
            <View style={[styles.actionIcon, { backgroundColor: '#D9770620' }]}>
              <MaterialCommunityIcons name="calendar-check" size={24} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Review Bookings</Text>
              <Text style={styles.actionSubtitle}>Approve or reject pending requests</Text>
            </View>
            {stats.pendingApprovals > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{stats.pendingApprovals}</Text>
              </View>
            )}
            <FontAwesome name="angle-right" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SIZES.md },
  headerTitle: { fontSize: 24, fontFamily: FONTS.bold, color: COLORS.text },
  exitButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full },
  exitText: { color: COLORS.error, fontFamily: FONTS.bold, fontSize: 12 },
  
  scrollContent: { padding: SIZES.md },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm, marginBottom: SIZES.xl },
  statCard: { 
    width: '48%', backgroundColor: COLORS.surface, padding: SIZES.md, 
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.borderLight,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  iconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: SIZES.sm },
  statValue: { fontSize: 22, fontFamily: FONTS.bold, color: COLORS.text },
  statTitle: { fontSize: 13, fontFamily: FONTS.medium, color: COLORS.textSecondary },

  section: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SIZES.md, borderWidth: 1, borderColor: COLORS.borderLight },
  sectionTitle: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.text, marginBottom: SIZES.md },
  
  actionCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: SIZES.sm, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  actionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: SIZES.md },
  actionTitle: { fontSize: 16, fontFamily: FONTS.semiBold, color: COLORS.text },
  actionSubtitle: { fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textSecondary },
  badge: { backgroundColor: COLORS.error, paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full, marginRight: SIZES.sm },
  badgeText: { color: '#fff', fontSize: 12, fontFamily: FONTS.bold },
});
