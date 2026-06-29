import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  RefreshControl, ScrollView, Image, Animated, Easing, Platform
} from 'react-native';
import { COLORS, SIZES, FONTS, RADIUS } from '../../constants/theme';
import { useCars } from '../../hooks/useCars';
import CarCard from '../../components/CarCard';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';

const LOGO = require('../../assets/images/icon.png');
const IS_WEB = Platform.OS === 'web';

const FILTERS = [
  { label: 'All Cars',   icon: 'car-multiple', value: '' },
  { label: 'Available',  icon: 'check-circle', value: 'available' },
  { label: 'Rented',     icon: 'clock-outline',value: 'rented' },
];

export default function HomeScreen() {
  const { cars, loading, search, filterByStatus, refresh, typeFilter } = useCars();
  const [searchInput, setSearchInput] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // Only animate on native
  const logoAnim   = useRef(new Animated.Value(0)).current;
  const heroAnim   = useRef(new Animated.Value(0)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (IS_WEB) return;
    Animated.stagger(130, [
      Animated.timing(logoAnim,   { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(heroAnim,   { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(searchAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSearchChange = useCallback((text: string) => {
    setSearchInput(text);
    search(text);
  }, [search]);

  const handleFilter = (value: string) => {
    filterByStatus(value);
  };

  const renderHeader = () => (
    <View>
      {/* ── Hero ── */}
      <View style={styles.heroSection}>
        {/* Top row */}
        <View style={styles.heroTop}>
          {IS_WEB ? (
            <View style={styles.logoCard}>
              <Image source={LOGO} style={styles.logoImage} resizeMode="contain" />
            </View>
          ) : (
            <Animated.View style={[styles.logoCard, {
              opacity: logoAnim,
              transform: [{ scale: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] }) }],
            }]}>
              <Image source={LOGO} style={styles.logoImage} resizeMode="contain" />
            </Animated.View>
          )}

          {IS_WEB ? (
            <View style={styles.statsPill}>
              <Text style={styles.statsNumber}>{cars.length}</Text>
              <Text style={styles.statsLabel}>Vehicles</Text>
            </View>
          ) : (
            <Animated.View style={[styles.statsPill, { opacity: logoAnim }]}>
              <Text style={styles.statsNumber}>{cars.length}</Text>
              <Text style={styles.statsLabel}>Vehicles</Text>
            </Animated.View>
          )}
        </View>

        {/* Greeting */}
        {IS_WEB ? (
          <View>
            <Text style={styles.heroGreeting}>Hello, {user?.full_name || user?.email?.split('@')[0] || 'Guest'} 👋</Text>
            <Text style={styles.heroTitle}>Find your perfect ride.</Text>
          </View>
        ) : (
          <Animated.View style={{
            opacity: heroAnim,
            transform: [{ translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
          }}>
            <Text style={styles.heroGreeting}>Hello, {user?.full_name || user?.email?.split('@')[0] || 'Guest'} 👋</Text>
            <Text style={styles.heroTitle}>Find your perfect ride.</Text>
          </Animated.View>
        )}

        {/* Search bar */}
        {IS_WEB ? (
          <View style={[styles.searchContainer, searchFocused && styles.searchContainerFocused]}>
            <FontAwesome name="search" size={18} color={searchFocused ? COLORS.primary : COLORS.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by car name or brand..."
              placeholderTextColor={COLORS.textMuted}
              value={searchInput}
              onChangeText={handleSearchChange}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              returnKeyType="search"
            />
            {searchInput.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchInput(''); search(''); }}>
                <FontAwesome name="times-circle" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Animated.View style={{
            opacity: searchAnim,
            transform: [{ translateY: searchAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
          }}>
            <View style={[styles.searchContainer, searchFocused && styles.searchContainerFocused]}>
              <FontAwesome name="search" size={18} color={searchFocused ? COLORS.primary : COLORS.textMuted} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by car name or brand..."
                placeholderTextColor={COLORS.textMuted}
                value={searchInput}
                onChangeText={handleSearchChange}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                returnKeyType="search"
              />
              {searchInput.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchInput(''); search(''); }}>
                  <FontAwesome name="times-circle" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        )}
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {FILTERS.map((f) => {
          const isActive = typeFilter === f.value;
          return (
            <TouchableOpacity
              key={f.value}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => handleFilter(f.value)}
            >
              <MaterialCommunityIcons name={f.icon as any} size={16} color={isActive ? '#fff' : COLORS.textSecondary} />
              <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Results Header */}
      <View style={[styles.sectionHeader, { marginTop: SIZES.lg }]}>
        <Text style={styles.sectionTitle}>
          {searchInput ? `Results for "${searchInput}"` : 'Our Fleet'}
        </Text>
        {!loading && <Text style={styles.resultCount}>{cars.length} cars</Text>}
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="car-off" size={64} color={COLORS.border} />
        <Text style={styles.emptyTitle}>No cars found</Text>
        <Text style={styles.emptySubtitle}>Try adjusting your search or filters</Text>
        <TouchableOpacity style={styles.resetButton} onPress={() => { setSearchInput(''); search(''); filterByStatus(''); }}>
          <Text style={styles.resetButtonText}>Reset Search</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={cars}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CarCard car={item} />}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.background },
  listContainer: { paddingBottom: SIZES.xxl },

  heroSection: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.md,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  logoCard: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: 90,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  logoImage: { width: 80, height: 46 },

  statsPill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statsNumber: { fontSize: 20, fontFamily: FONTS.bold,   color: '#fff' },
  statsLabel:  { fontSize: 10, fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.7)' },

  heroGreeting: { fontSize: 14, fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.8)', marginBottom: 2 },
  heroTitle:    { fontSize: 28, fontFamily: FONTS.bold,   color: '#fff', marginBottom: SIZES.md },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SIZES.md,
    height: 52,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  searchContainerFocused: { borderColor: COLORS.secondary },
  searchIcon:  { marginRight: SIZES.sm },
  searchInput: { flex: 1, fontSize: 15, fontFamily: FONTS.medium, color: COLORS.text, height: '100%' },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.sm,
  },
  sectionTitle: { fontSize: 18, fontFamily: FONTS.bold,   color: COLORS.text },
  resultCount:  { fontSize: 13, fontFamily: FONTS.medium, color: COLORS.textSecondary },

  filterRow: { paddingHorizontal: SIZES.md, paddingVertical: SIZES.xs, marginTop: SIZES.md },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SIZES.sm,
    gap: 6,
  },
  filterChipActive:  { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterLabel:       { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.textSecondary },
  filterLabelActive: { color: '#fff' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: SIZES.xl },
  emptyTitle:    { fontSize: 20, fontFamily: FONTS.bold,   color: COLORS.text,          marginTop: SIZES.md, marginBottom: SIZES.sm },
  emptySubtitle: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SIZES.lg },
  resetButton:   { backgroundColor: COLORS.primaryLight, paddingHorizontal: SIZES.lg, paddingVertical: SIZES.sm, borderRadius: RADIUS.full },
  resetButtonText: { color: COLORS.primary, fontFamily: FONTS.semiBold, fontSize: 14 },
});
