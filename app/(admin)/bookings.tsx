import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { supabase } from '../../lib/supabase';
import { CarBooking } from '../../types';
import { COLORS, SIZES, FONTS, RADIUS } from '../../constants/theme';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminBookings() {
  const [bookings, setBookings] = useState<CarBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('car_bookings')
        .select('*, car:cars(*), user:car_users(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setBookings(data as CarBooking[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('car_bookings').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      fetchBookings();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    Alert.alert(`Confirm ${action}`, `Are you sure you want to ${action.replace('ed', '')} this request?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes', onPress: () => updateStatus(id, action) }
    ]);
  };

  const renderItem = ({ item }: { item: CarBooking }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.userName}>{item.user?.full_name || item.user?.email}</Text>
        <Text style={styles.phone}>{item.user?.phone}</Text>
      </View>
      
      <View style={styles.carInfo}>
        <Image source={{ uri: item.car?.images?.[0] || 'https://via.placeholder.com/150' }} style={styles.image} />
        <View style={styles.content}>
          <Text style={styles.title}>{item.car?.name}</Text>
          <Text style={styles.details}>{item.total_days} days · {item.expected_kms} extra km expected</Text>
          <Text style={styles.price}>₹{item.total_price}</Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Status: <Text style={{ color: item.status === 'pending' ? '#D97706' : item.status === 'approved' ? COLORS.success : COLORS.error }}>{item.status.toUpperCase()}</Text></Text>
      </View>

      {item.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={() => handleAction(item.id, 'rejected')}>
            <Text style={styles.btnText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.approveBtn]} onPress={() => handleAction(item.id, 'approved')}>
            <Text style={[styles.btnText, { color: '#fff' }]}>Approve</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Review Bookings</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderItem}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: SIZES.md }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SIZES.md },
  headerTitle: { fontSize: 24, fontFamily: FONTS.bold, color: COLORS.text },
  
  card: { backgroundColor: COLORS.surface, marginBottom: SIZES.md, borderRadius: RADIUS.lg, padding: SIZES.md, borderWidth: 1, borderColor: COLORS.borderLight, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SIZES.sm, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, paddingBottom: 8 },
  userName: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.text },
  phone: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.textSecondary },
  
  carInfo: { flexDirection: 'row', marginBottom: SIZES.sm },
  image: { width: 60, height: 60, borderRadius: 8, marginRight: SIZES.sm },
  content: { flex: 1 },
  title: { fontSize: 15, fontFamily: FONTS.bold, color: COLORS.text },
  details: { fontSize: 12, fontFamily: FONTS.medium, color: COLORS.textSecondary },
  price: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.primary, marginTop: 4 },
  
  statusRow: { marginBottom: SIZES.sm },
  statusLabel: { fontSize: 13, fontFamily: FONTS.bold, color: COLORS.textSecondary },
  
  actions: { flexDirection: 'row', gap: SIZES.sm, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  btn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: RADIUS.sm, borderWidth: 1 },
  rejectBtn: { borderColor: COLORS.error, backgroundColor: '#fff' },
  approveBtn: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  btnText: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.error },
});
