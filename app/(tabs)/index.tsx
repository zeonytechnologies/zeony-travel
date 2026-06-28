import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  RefreshControl, ScrollView, Image, Animated, Easing, Platform
} from 'react-native';
import { COLORS, SIZES, FONTS, RADIUS } from '../../constants/theme';
import { useListings } from '../../hooks/useListings';
import ListingCard from '../../components/ListingCard';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';

const LOGO = require('../../assets/images/icon.png');
const IS_WEB = Platform.OS === 'web';

const FILTERS = [
  { label: 'All',      icon: 'earth',           value: 'all' },
  { label: 'Hotels',   icon: 'bed',              value: 'hotel' },
  { label: 'Tours',    icon: 'map-marker-path',  value: 'tour' },
  { label: 'Packages', icon: 'package-variant',  value: 'package' },
];

const POPULAR_CITIES = [
  { name: 'Mumbai',    icon: 'city',         color: '#3B82F6' },
  { name: 'Kerala',    icon: 'palm-tree',    color: '#10B981' },
  { name: 'Goa',       icon: 'beach',        color: '#F59E0B' },
  { name: 'Rajasthan', icon: 'castle',       color: '#EF4444' },
  { name: 'Himachal',  icon: 'image-filter-hdr', color: '#8B5CF6' },
];

export default function HomeScreen() {
  const { listings, loading, search, filterByType, refresh, typeFilter } = useListings();
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

  const handleCityPress = (city: string) => {
    setSearchInput(city);
    search(city);
  };

  const handleFilter = (value: string) => {
    filterByType(value === 'all' ? '' : value);
  };

  const renderHeader = () => (
    <View>
      {/* ── Hero ── */}
      <View style={styles.heroSection}>
        {/* Top row */}
        <View style={styles.heroTop}>
          {/* Logo – no Animated on web */}
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

          {/* Stats pill */}
          {IS_WEB ? (
            <View style={styles.statsPill}>
              <Text style={styles.statsNumber}>{listings.length}</Text>
              <Text style={styles.statsLabel}>Destinations</Text>
            </View>
          ) : (
            <Animated.View style={[styles.statsPill, { opacity: logoAnim }]}>
              <Text style={styles.statsNumber}>{listings.length}</Text>
              <Text style={styles.statsLabel}>Destinations</Text>
            </Animated.View>
          )}
        </View>

        {/* Greeting */}
        {IS_WEB ? (
          <View>
            <Text style={styles.heroGreeting}>Hello, {user?.email?.split('@')[0] || 'Traveller'} 👋</Text>
            <Text style={styles.heroTitle}>Where to next?</Text>
          </View>
        ) : (
          <Animated.View style={{
            opacity: heroAnim,
            transform: [{ translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
          }}>
            <Text style={styles.heroGreeting}>Hello, {user?.email?.split('@')[0] || 'Traveller'} 👋</Text>
            <Text style={styles.heroTitle}>Where to next?</Text>
          </Animated.View>
        )}

        {/* Search bar */}
        {IS_WEB ? (
          <View style={[styles.searchContainer, searchFocused && styles.searchContainerFocused]}>
            <FontAwesome name="search" size={18} color={searchFocused ? COLORS.primary : COLORS.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search destination, city, hotel..."
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
                placeholder="Search destination, city, hotel..."
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

      {/* Popular Cities */}
      <View style={[styles.sectionHeader, { marginTop: SIZES.lg }]}>
        <Text style={styles.sectionTitle}>Popular Destinations</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.citiesRow}>
        {POPULAR_CITIES.map((city, idx) => (
          <CityChip
            key={city.name}
            city={city}
            idx={idx}
            isActive={searchInput === city.name}
            onPress={() => handleCityPress(city.name)}
          />
        ))}
      </ScrollView>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {FILTERS.map((f) => {
          const isActive = (typeFilter === f.value) || (f.value === 'all' && !typeFilter);
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
          {searchInput ? `Results for "${searchInput}"` : 'All Listings'}
        </Text>
        {!loading && <Text style={styles.resultCount}>{listings.length} found</Text>}
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="map-search-outline" size={64} color={COLORS.border} />
        <Text style={styles.emptyTitle}>No results found</Text>
        <Text style={styles.emptySubtitle}>Try a different search or filter</Text>
        <TouchableOpacity style={styles.resetButton} onPress={() => { setSearchInput(''); search(''); filterByType(''); }}>
          <Text style={styles.resetButtonText}>Reset Search</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ListingCard listing={item} />}
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

// City chip — native gets bounce-in animation, web gets plain view
function CityChip({ city, idx, isActive, onPress }: { city: any; idx: number; isActive: boolean; onPress: () => void }) {
  const enterAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (IS_WEB) return;
    Animated.timing(enterAnim, {
      toValue: 1,
      duration: 380,
      delay: 600 + idx * 70,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, []);

  const onPressIn  = () => !IS_WEB && Animated.spring(pressAnim, { toValue: 0.92, useNativeDriver: true, speed: 50 }).start();
  const onPressOut = () => !IS_WEB && Animated.spring(pressAnim, { toValue: 1,    useNativeDriver: true, speed: 50 }).start();

  const chip = (
    <TouchableOpacity
      style={[styles.cityChip, isActive && styles.cityChipActive]}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={IS_WEB ? 0.7 : 1}
    >
      <View style={[styles.cityIconBox, { backgroundColor: city.color + '22' }]}>
        <MaterialCommunityIcons name={city.icon as any} size={22} color={city.color} />
      </View>
      <Text style={[styles.cityName, isActive && styles.cityNameActive]}>{city.name}</Text>
    </TouchableOpacity>
  );

  if (IS_WEB) return chip;

  return (
    <Animated.View style={{
      opacity: enterAnim,
      transform: [
        { scale: pressAnim },
        { translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
      ],
    }}>
      {chip}
    </Animated.View>
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
    boxShadow: '0px 4px 14px rgba(0,0,0,0.18)',
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

  citiesRow: { paddingHorizontal: SIZES.md, paddingVertical: SIZES.xs },

  cityChip: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SIZES.sm,
    minWidth: 80,
    boxShadow: '0px 2px 6px rgba(0,0,0,0.06)',
    elevation: 2,
  },
  cityChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  cityIconBox: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 6,
  },
  cityName:       { fontSize: 12, fontFamily: FONTS.semiBold, color: COLORS.textSecondary },
  cityNameActive: { color: COLORS.primary },

  filterRow: { paddingHorizontal: SIZES.md, paddingVertical: SIZES.xs, marginTop: SIZES.sm },
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
