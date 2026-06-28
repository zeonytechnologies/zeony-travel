import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  FlatList, ActivityIndicator, Dimensions, Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Listing, Review } from '../../types';
import { COLORS, SIZES, FONTS, RADIUS } from '../../constants/theme';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

import MapView, { Marker } from 'react-native-maps';

const AMENITY_ICONS: Record<string, string> = {
  wifi: 'wifi',
  pool: 'pool',
  gym: 'dumbbell',
  fitness: 'dumbbell',
  spa: 'spa',
  restaurant: 'silverware-fork-knife',
  parking: 'parking',
  breakfast: 'coffee',
  'room service': 'room-service',
  ac: 'air-conditioner',
  bar: 'glass-cocktail',
  beach: 'beach',
  tv: 'television',
  guide: 'account-tie',
  meals: 'food-variant',
  conditioning: 'snowflake',
};

function getAmenityIcon(amenity: string): string {
  const lower = amenity.toLowerCase();
  for (const key of Object.keys(AMENITY_ICONS)) {
    if (lower.includes(key)) return AMENITY_ICONS[key];
  }
  return 'check-circle';
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (id && id !== '[id]') {
      fetchListingDetails();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchListingDetails = async () => {
    try {
      const { data: listingData, error: listingError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single();

      if (listingError) throw listingError;
      setListing(listingData);

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*, profile:profiles(full_name, avatar_url)')
        .eq('listing_id', id)
        .order('created_at', { ascending: false });

      setReviews(reviewsData || []);
    } catch (error) {
      console.error('Error fetching listing:', error);
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

  if (!listing) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.errorText}>Listing not found.</Text>
      </View>
    );
  }

  const images = listing.images?.length ? listing.images : ['https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80'];

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
          {/* Title + Rating */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{listing.title}</Text>
            <View style={styles.ratingBadge}>
              <FontAwesome name="star" size={13} color={COLORS.warning} />
              <Text style={styles.ratingText}>{listing.rating}</Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.locationRow}>
            <FontAwesome name="map-marker" size={14} color={COLORS.primary} />
            <Text style={styles.location}>{listing.location}, {listing.city}</Text>
          </View>

          {/* Meta Info Row */}
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <FontAwesome name="users" size={13} color={COLORS.primary} />
              <Text style={styles.metaChipText}>Up to {listing.max_guests} guests</Text>
            </View>
            <View style={styles.metaChip}>
              <FontAwesome name="comment-o" size={13} color={COLORS.primary} />
              <Text style={styles.metaChipText}>{listing.review_count} reviews</Text>
            </View>
            <View style={styles.metaChip}>
              <MaterialCommunityIcons name="tag" size={13} color={COLORS.primary} />
              <Text style={styles.metaChipText}>{listing.type}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.sectionTitle}>About this place</Text>
          <Text style={styles.description} numberOfLines={expandedDesc ? undefined : 4}>
            {listing.description}
          </Text>
          <TouchableOpacity onPress={() => setExpandedDesc(!expandedDesc)}>
            <Text style={styles.readMore}>{expandedDesc ? '▲ Read Less' : '▼ Read More'}</Text>
          </TouchableOpacity>

          {/* Amenities */}
          {listing.amenities && listing.amenities.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesGrid}>
                {listing.amenities.map((amenity, i) => (
                  <View key={i} style={styles.amenityItem}>
                    <View style={styles.amenityIconBox}>
                      <MaterialCommunityIcons name={getAmenityIcon(amenity) as any} size={22} color={COLORS.primary} />
                    </View>
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Map */}
          {listing.latitude && listing.longitude && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Location</Text>
              <View style={styles.mapContainer}>
                {Platform.OS !== 'web' ? (
                  <MapView 
                    style={styles.map}
                    initialRegion={{
                      latitude: listing.latitude,
                      longitude: listing.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                  >
                    <Marker
                      coordinate={{ latitude: listing.latitude, longitude: listing.longitude }}
                      title={listing.title}
                    />
                  </MapView>
                ) : (
                  // @ts-ignore
                  <iframe
                    title="Location Map"
                    width="100%"
                    height="220"
                    style={{ border: 0, borderRadius: 12 }}
                    src={`https://www.google.com/maps?q=${listing.latitude},${listing.longitude}&z=15&output=embed`}
                    allowFullScreen
                  />
                )}
              </View>
              {/* Address info */}
              <View style={styles.addressCard}>
                <FontAwesome name="map-marker" size={16} color={COLORS.primary} />
                <Text style={styles.addressText}>{listing.location}, {listing.city}</Text>
              </View>
            </>
          )}

          {/* Reviews */}
          <View style={styles.divider} />
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            <View style={styles.overallRating}>
              <FontAwesome name="star" size={16} color={COLORS.warning} />
              <Text style={styles.overallRatingText}>{listing.rating} · {listing.review_count} reviews</Text>
            </View>
          </View>

          {reviews.length > 0 ? reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewAvatar}>
                  {review.profile?.avatar_url ? (
                    <Image source={{ uri: review.profile.avatar_url }} style={styles.reviewerImg} />
                  ) : (
                    <View style={styles.reviewAvatarPlaceholder}>
                      <FontAwesome name="user" size={18} color={COLORS.textSecondary} />
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewerName}>{review.profile?.full_name || 'Anonymous'}</Text>
                  <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</Text>
                </View>
                <View style={styles.reviewRating}>
                  {[1,2,3,4,5].map((s) => (
                    <FontAwesome key={s} name="star" size={11} color={s <= review.rating ? COLORS.warning : COLORS.border} />
                  ))}
                </View>
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
            </View>
          )) : (
            <View style={styles.noReviewsBox}>
              <Text style={styles.noReviewsEmoji}>✍️</Text>
              <Text style={styles.noReviewsText}>No reviews yet. Be the first!</Text>
            </View>
          )}

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.priceLabel}>Starting from</Text>
          <Text style={styles.priceValue}>
            ₹{listing.price_per_night.toLocaleString('en-IN')}
            <Text style={styles.priceNight}> / night</Text>
          </Text>
        </View>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => router.push(`/booking/${listing.id}`)}
        >
          <Text style={styles.bookButtonText}>Book Now →</Text>
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
    boxShadow: '0px 2px 8px rgba(0,0,0,0.15)', elevation: 4,
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
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full,
  },
  ratingText: { fontSize: 14, fontFamily: FONTS.bold, color: '#D97706' },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SIZES.md },
  location: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.textSecondary },

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
  readMore: { color: COLORS.primary, fontFamily: FONTS.semiBold, marginTop: SIZES.xs, fontSize: 14 },

  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm },
  amenityItem: { alignItems: 'center', width: 80, marginBottom: SIZES.sm },
  amenityIconBox: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  amenityText: { fontSize: 11, fontFamily: FONTS.medium, color: COLORS.text, textAlign: 'center' },

  mapContainer: { height: 220, borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: SIZES.sm },
  map: { flex: 1 },
  addressCard: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.sm,
    backgroundColor: COLORS.primaryLight, padding: SIZES.sm,
    borderRadius: RADIUS.md, marginTop: SIZES.sm,
  },
  addressText: { fontSize: 13, fontFamily: FONTS.medium, color: COLORS.primary },

  reviewsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.sm },
  overallRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  overallRatingText: { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.textSecondary },

  reviewCard: {
    backgroundColor: COLORS.surfaceAlt, padding: SIZES.md,
    borderRadius: RADIUS.md, marginBottom: SIZES.md,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.sm },
  reviewAvatar: { marginRight: SIZES.sm },
  reviewerImg: { width: 42, height: 42, borderRadius: 21 },
  reviewAvatarPlaceholder: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center',
  },
  reviewerName: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.text },
  reviewDate: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 2 },
  reviewRating: { flexDirection: 'row', gap: 2 },
  reviewComment: { fontSize: 14, fontFamily: FONTS.regular, color: COLORS.textSecondary, lineHeight: 22 },

  noReviewsBox: { alignItems: 'center', paddingVertical: SIZES.xl },
  noReviewsEmoji: { fontSize: 36, marginBottom: SIZES.sm },
  noReviewsText: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.textSecondary },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.surface,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SIZES.lg, paddingVertical: SIZES.md,
    paddingBottom: Platform.OS === 'ios' ? SIZES.xl : SIZES.md,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    boxShadow: '0px -2px 10px rgba(0,0,0,0.06)', elevation: 10,
  },
  priceLabel: { fontSize: 12, fontFamily: FONTS.medium, color: COLORS.textSecondary },
  priceValue: { fontSize: 22, fontFamily: FONTS.bold, color: COLORS.primary },
  priceNight: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.textSecondary },
  bookButton: {
    backgroundColor: COLORS.primary, paddingHorizontal: SIZES.xl,
    paddingVertical: 14, borderRadius: RADIUS.lg,
  },
  bookButtonText: { color: '#fff', fontFamily: FONTS.bold, fontSize: 16 },
});
