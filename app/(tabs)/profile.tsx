import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity, TextInput,
  Alert, ScrollView, ActivityIndicator, Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { COLORS, SIZES, FONTS, RADIUS } from '../../constants/theme';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CarUser } from '../../types';

const MENU_ITEMS = [
  { icon: 'car', label: 'My Bookings', sublabel: 'View all rentals', route: '/(tabs)/bookings', color: COLORS.primary },
  { icon: 'bell-o', label: 'Notifications', sublabel: 'Manage alerts', route: null, color: '#D97706' },
  { icon: 'question-circle-o', label: 'Help & Support', sublabel: 'Contact us', route: null, color: '#7C3AED' },
  { icon: 'info-circle', label: 'About Zeony Car Rentals', sublabel: 'Version 1.0.0', route: null, color: COLORS.textSecondary },
];

export default function ProfileScreen() {
  const { user, isAdmin, signOut } = useAuth();
  const [profile, setProfile] = useState<CarUser | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bookingCount, setBookingCount] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => { if (user) { fetchProfile(); fetchBookingCount(); } else setLoading(false); }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data } = await supabase.from('car_users').select('*').eq('id', user.id).maybeSingle();
      if (data) { setProfile(data as CarUser); setFullName(data.full_name || ''); setPhone(data.phone || ''); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchBookingCount = async () => {
    if (!user) return;
    const { count } = await supabase.from('car_bookings').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
    setBookingCount(count || 0);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('car_users').update({ full_name: fullName, phone }).eq('id', user.id);
      if (error) throw error;
      Alert.alert('✅ Saved', 'Profile updated successfully');
      setEditMode(false);
      fetchProfile();
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setSaving(false); }
  };

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) {
        signOut().then(() => router.replace('/(auth)/login'));
      }
      return;
    }
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/(auth)/login'); } }
    ]);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      if (Platform.OS === 'web') window.alert('Failed to pick an image');
      else Alert.alert('Error', 'Failed to pick an image');
    }
  };

  const uploadImage = async (uri: string) => {
    if (!user) return;
    setSaving(true);
    try {
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      let arrayBuffer: ArrayBuffer;
      
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        arrayBuffer = await response.arrayBuffer();
      } else {
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
        arrayBuffer = decode(base64);
      }

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, arrayBuffer, {
          contentType: `image/${fileExt}`,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('images').getPublicUrl(fileName);
      
      const { error: updateError } = await supabase
        .from('car_users')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      setProfile(prev => prev ? { ...prev, avatar_url: data.publicUrl } : null);
      if (Platform.OS === 'web') window.alert('Profile photo updated');
      else Alert.alert('Success', 'Profile photo updated');
    } catch (e: any) {
      if (Platform.OS === 'web') window.alert(e.message);
      else Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'N/A';

  if (loading) return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerBg}>
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Profile</Text>
          {isAdmin && (
            <TouchableOpacity style={styles.adminBadge} onPress={() => router.push('/(admin)')}>
              <FontAwesome name="shield" size={12} color="#fff" />
              <Text style={styles.adminBadgeText}>Admin Panel</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Avatar + Name */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage} disabled={saving}>
            {saving ? (
              <View style={styles.avatarPlaceholder}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            ) : profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <FontAwesome name="user" size={42} color={COLORS.primary} />
              </View>
            )}
            <View style={styles.avatarBadge}>
              <FontAwesome name="camera" size={11} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={styles.profileName}>{fullName || 'Set your name'}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{bookingCount}</Text>
              <Text style={styles.statLabel}>Rentals</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{memberSince.split(' ')[1] || '—'}</Text>
              <Text style={styles.statLabel}>Member since</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Edit Profile Section */}
      <View style={[styles.section, { marginTop: SIZES.md }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <TouchableOpacity onPress={() => editMode ? handleSave() : setEditMode(true)} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={styles.editBtn}>{editMode ? 'Save' : 'Edit'}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoIcon}><FontAwesome name="user-o" size={15} color={COLORS.primary} /></View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Full Name</Text>
            {editMode ? (
              <TextInput style={styles.infoInput} value={fullName} onChangeText={setFullName} placeholder="Enter your name" placeholderTextColor={COLORS.textMuted} />
            ) : (
              <Text style={styles.infoValue}>{fullName || '—'}</Text>
            )}
          </View>
        </View>

        <View style={styles.infoDivider} />

        <View style={styles.infoRow}>
          <View style={styles.infoIcon}><FontAwesome name="envelope-o" size={15} color={COLORS.primary} /></View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email || '—'}</Text>
          </View>
        </View>

        <View style={styles.infoDivider} />

        <View style={styles.infoRow}>
          <View style={styles.infoIcon}><FontAwesome name="phone" size={15} color={COLORS.primary} /></View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Phone</Text>
            {editMode ? (
              <TextInput style={styles.infoInput} value={phone} onChangeText={setPhone} placeholder="Enter phone number" keyboardType="phone-pad" placeholderTextColor={COLORS.textMuted} />
            ) : (
              <Text style={styles.infoValue}>{phone || '—'}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.section}>
        {MENU_ITEMS.map((item, idx) => (
          <React.Fragment key={item.label}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => item.route ? router.push(item.route as any) : Alert.alert('Coming soon', `${item.label} is coming soon!`)}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '18' }]}>
                <FontAwesome name={item.icon as any} size={17} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSublabel}>{item.sublabel}</Text>
              </View>
              <FontAwesome name="chevron-right" size={13} color={COLORS.textMuted} />
            </TouchableOpacity>
            {idx < MENU_ITEMS.length - 1 && <View style={styles.infoDivider} />}
          </React.Fragment>
        ))}
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <FontAwesome name="sign-out" size={16} color={COLORS.error} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Zeony Car Rentals v1.0.0</Text>
      <View style={{ height: SIZES.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  headerBg: { backgroundColor: COLORS.primary, paddingBottom: 0 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.md, paddingTop: SIZES.sm, paddingBottom: SIZES.sm },
  pageTitle: { fontSize: 22, fontFamily: FONTS.bold, color: '#fff' },
  adminBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.full },
  adminBadgeText: { fontSize: 12, fontFamily: FONTS.bold, color: '#fff' },

  avatarSection: { alignItems: 'center', paddingBottom: SIZES.xxl, paddingTop: SIZES.sm, backgroundColor: COLORS.primary },
  avatarWrapper: { position: 'relative', marginBottom: SIZES.sm },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
  avatarPlaceholder: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  avatarBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.secondary, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.primary },

  profileName: { fontSize: 22, fontFamily: FONTS.bold, color: '#fff', marginBottom: 4 },
  profileEmail: { fontSize: 13, fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.75)', marginBottom: SIZES.md },

  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.lg, paddingHorizontal: SIZES.lg, paddingVertical: SIZES.sm, gap: SIZES.xl },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 20, fontFamily: FONTS.bold, color: '#fff' },
  statLabel: { fontSize: 11, fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)' },

  section: {
    backgroundColor: COLORS.surface, marginHorizontal: SIZES.md, marginTop: -SIZES.lg,
    borderRadius: RADIUS.xl, padding: SIZES.md, marginBottom: SIZES.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.md },
  sectionTitle: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.text },
  editBtn: { fontSize: 14, fontFamily: FONTS.semiBold, color: COLORS.primary },

  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SIZES.sm },
  infoIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: SIZES.sm },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, fontFamily: FONTS.medium, color: COLORS.textMuted, marginBottom: 2 },
  infoValue: { fontSize: 15, fontFamily: FONTS.medium, color: COLORS.text },
  infoInput: { fontSize: 15, fontFamily: FONTS.medium, color: COLORS.text, borderBottomWidth: 1.5, borderBottomColor: COLORS.primary, paddingVertical: 4 },
  infoDivider: { height: 1, backgroundColor: COLORS.borderLight, marginVertical: 2 },

  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  menuIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: SIZES.sm },
  menuLabel: { fontSize: 15, fontFamily: FONTS.semiBold, color: COLORS.text },
  menuSublabel: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textMuted },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SIZES.sm,
    marginHorizontal: SIZES.md, borderWidth: 1.5, borderColor: COLORS.error,
    padding: SIZES.md, borderRadius: RADIUS.lg, backgroundColor: '#FEE2E220', marginBottom: SIZES.md,
  },
  signOutText: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.error },

  version: { textAlign: 'center', fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textMuted, marginBottom: SIZES.sm },
});
