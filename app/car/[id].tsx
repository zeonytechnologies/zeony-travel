import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  FlatList, ActivityIndicator, Dimensions, Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Car } from '../../types';
import { COLORS, SIZES, FONTS, RADIUS } from '../../constants/theme';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useAuth } from '../../hooks/useAuth';

const { width } = Dimensions.get('window');

export default function CarDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (id && id !== '[id]') {
      fetchCarDetails();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchCarDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCar(data as Car);
    } catch (error) {
      console.error('Error fetching car:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!car) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.errorText}>Vehicle not found.</Text>
      </View>
    );
  }

  const images = car.images?.length ? car.images : ['https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80'];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.imageContainer}>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => i.toString()}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveImage(idx);
            }}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.image} resizeMode="cover" />
            )}
          />
          {/* Back button */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome name="chevron-left" size={18} color={COLORS.text} />
          </TouchableOpacity>
          {/* Image dots */}
          {images.length > 1 && (
            <View style={styles.dotsContainer}>
              {images.map((_, i) => (
                <View key={i} style={[styles.dot, i === activeImage && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>

        {/* Content Card */}
        <View style={styles.contentCard}>
          {/* Title + Status */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{car.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: car.status === 'available' ? '#D1FAE5' : '#FEE2E2' }]}>
              <Text style={[styles.statusText, { color: car.status === 'available' ? '#059669' : '#DC2626' }]}>
                {car.status.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Brand */}
          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="car-info" size={16} color={COLORS.primary} />
            <Text style={styles.location}>{car.brand}</Text>
          </View>

          {/* Meta Info Row */}
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <FontAwesome name="money" size={13} color={COLORS.primary} />
              <Text style={styles.metaChipText}>₹{car.per_day_cost} / day</Text>
            </View>
            <View style={styles.metaChip}>
              <MaterialCommunityIcons name="speedometer" size={13} color={COLORS.primary} />
              <Text style={styles.metaChipText}>+₹{car.extra_km_cost} per extra km</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.sectionTitle}>About this vehicle</Text>
          <Text style={styles.description}>
            {car.description || 'No description provided.'}
          </Text>

          {/* Features */}
          {car.features && car.features.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Features</Text>
              <View style={styles.amenitiesGrid}>
                {car.features.map((feature, i) => (
                  <View key={i} style={styles.featureItem}>
                    <FontAwesome name="check-circle" size={16} color={COLORS.primary} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Contact Admin */}
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Need Help?</Text>
          <TouchableOpacity 
            style={styles.contactCard}
            onPress={() => Linking.openURL('tel:638265436')}
          >
            <View style={styles.contactIconBox}>
              <FontAwesome name="phone" size={24} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactTitle}>Contact Support</Text>
              <Text style={styles.contactSubtitle}>Call 638265436 for inquiries</Text>
            </View>
            <FontAwesome name="angle-right" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.priceLabel}>Daily Rate</Text>
          <Text style={styles.priceValue}>
            ₹{car.per_day_cost.toLocaleString('en-IN')}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.bookButton, car.status !== 'available' && { backgroundColor: COLORS.textMuted }]}
          onPress={() => router.push(`/book/${car.id}`)}
          disabled={car.status !== 'available'}
        >
          <Text style={styles.bookButtonText}>Request Booking →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: COLORS.error, fontFamily: FONTS.medium },

  imageContainer: { height: 320, width },
  image: { width, height: 320 },
  backButton: {
    position: 'absolute', top: 50, left: SIZES.md,
    backgroundColor: 'rgba(255,255,255,0.92)',
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  dotsContainer: {
    position: 'absolute', bottom: 16, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#fff', width: 20 },

  contentCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    marginTop: -28, padding: SIZES.lg,
  },

  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  title: { flex: 1, fontSize: 24, fontFamily: FONTS.bold, color: COLORS.text, marginRight: SIZES.sm },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full,
  },
  statusText: { fontSize: 12, fontFamily: FONTS.bold },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SIZES.md },
  location: { fontSize: 15, fontFamily: FONTS.medium, color: COLORS.textSecondary },

  metaRow: { flexDirection: 'row', gap: SIZES.sm, flexWrap: 'wrap' },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full,
  },
  metaChipText: { fontSize: 12, fontFamily: FONTS.semiBold, color: COLORS.primary },

  divider: { height: 1, backgroundColor: COLORS.borderLight, marginVertical: SIZES.lg },

  sectionTitle: { fontSize: 19, fontFamily: FONTS.bold, color: COLORS.text, marginBottom: SIZES.sm },
  description: { fontSize: 15, fontFamily: FONTS.regular, color: COLORS.textSecondary, lineHeight: 24 },

  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.md, marginTop: SIZES.sm },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '45%' },
  featureText: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.text },

  contactCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    padding: SIZES.md, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  contactIconBox: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    marginRight: SIZES.md,
  },
  contactTitle: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.text },
  contactSubtitle: { fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textSecondary },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.surface,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SIZES.lg, paddingVertical: SIZES.md,
    paddingBottom: Platform.OS === 'ios' ? SIZES.xl : SIZES.md,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 10,
  },
  priceLabel: { fontSize: 12, fontFamily: FONTS.medium, color: COLORS.textSecondary },
  priceValue: { fontSize: 24, fontFamily: FONTS.bold, color: COLORS.primary },
  bookButton: {
    backgroundColor: COLORS.primary, paddingHorizontal: SIZES.xl,
    paddingVertical: 14, borderRadius: RADIUS.lg,
  },
  bookButtonText: { color: '#fff', fontFamily: FONTS.bold, fontSize: 16 },
});
