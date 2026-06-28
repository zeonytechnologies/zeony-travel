import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../types';
import { COLORS, SIZES } from '../../constants/theme';
import { FontAwesome } from '@expo/vector-icons';

export default function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    Alert.alert('Change Role', `Change role to ${newRole}?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Confirm', 
        onPress: async () => {
          try {
            const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id);
            if (error) throw error;
            fetchUsers();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }: { item: Profile }) => (
    <View style={styles.card}>
      <View style={styles.avatarPlaceholder}>
        <FontAwesome name="user" size={24} color={COLORS.textSecondary} />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.name}>{item.full_name || 'Anonymous'}</Text>
        <Text style={styles.phone}>{item.phone || 'No Phone'}</Text>
        <View style={[styles.roleBadge, { backgroundColor: item.role === 'admin' ? COLORS.warning : COLORS.primary }]}>
          <Text style={styles.roleText}>{item.role.toUpperCase()}</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.actionBtn}
        onPress={() => toggleAdminRole(item.id, item.role)}
      >
        <FontAwesome name="shield" size={16} color={COLORS.primary} />
        <Text style={styles.actionText}>Toggle Role</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SIZES.xl }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: SIZES.xl }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SIZES.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: SIZES.md,
    borderRadius: 12,
    marginBottom: SIZES.md,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  cardInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  phone: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleText: {
    color: COLORS.surface,
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.sm,
  },
  actionText: {
    fontSize: 10,
    color: COLORS.primary,
    marginTop: 4,
    fontWeight: 'bold',
  },
});
