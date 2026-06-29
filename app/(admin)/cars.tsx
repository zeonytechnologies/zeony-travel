import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Car } from '../../types';
import { COLORS, SIZES, FONTS, RADIUS } from '../../constants/theme';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminCars() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  const fetchCars = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('cars').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setCars(data as Car[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCars(); }, []);

  const deleteCar = async (id: string) => {
    Alert.alert('Confirm', 'Are you sure you want to delete this car?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const { error } = await supabase.from('cars').delete().eq('id', id);
            if (error) throw error;
            fetchCars();
          } catch (e: any) { Alert.alert('Error', e.message); }
      }}
    ]);
  };

  const renderItem = ({ item }: { item: Car }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.images?.[0] || 'https://via.placeholder.com/150' }} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.brand}>{item.brand}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.price}>₹{item.per_day_cost}/day</Text>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'available' ? '#D1FAE5' : '#FEE2E2' }]}>
            <Text style={[styles.statusText, { color: item.status === 'available' ? '#059669' : '#DC2626' }]}>{item.status}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteCar(item.id)}>
        <FontAwesome name="trash" size={20} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Fleet</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => Alert.alert('Coming Soon', 'Add car form will open here')}>
          <FontAwesome name="plus" size={14} color="#fff" />
          <Text style={styles.addBtnText}>Add Car</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={cars}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SIZES.md },
  headerTitle: { fontSize: 24, fontFamily: FONTS.bold, color: COLORS.text },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.md },
  addBtnText: { color: '#fff', fontFamily: FONTS.bold, fontSize: 14 },
  
  card: { flexDirection: 'row', backgroundColor: COLORS.surface, marginBottom: SIZES.md, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.borderLight, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  image: { width: 100, height: 100 },
  content: { flex: 1, padding: SIZES.sm },
  title: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.text },
  brand: { fontSize: 13, fontFamily: FONTS.medium, color: COLORS.textSecondary, marginBottom: 8 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.primary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full },
  statusText: { fontSize: 10, fontFamily: FONTS.bold, textTransform: 'uppercase' },
  deleteBtn: { padding: SIZES.md, justifyContent: 'center' },
});
