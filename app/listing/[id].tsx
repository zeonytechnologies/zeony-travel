import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, FlatList, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Listing, Review } from '../../types';
import { COLORS, SIZES } from '../../constants/theme';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';

const { width } = Dimensions.get('window');

// Initialize Mappls Map globally if needed, usually done in App.tsx but we'll assume it's set up
let MapplsGL: any = null;
if (Platform.OS !== 'web') {
  MapplsGL = require('mappls-map-react-native').default;
  MapplsGL.setMapSDKKey("92986412724d75ceac8cb5dabeef2c5c");
  MapplsGL.setRestAPIKey("92986412724d75ceac8cb5dabeef2c5c"); 
  MapplsGL.setAtlasClientId("96dHZVzsAutvcrp10SUPTjFinjyUZtj4AHk2Bx_GSJPKZ0MfPfEncXGHh_VWDkIC9ZEUVm--FjQwgQW5JtJySJ3XiXx9PNpO");
  MapplsGL.setAtlasClientSecret("lrFxI-iSEg_GvhgnGZuda8riQfYkOQPRnyF7V2ANpYQPhNjBfsR_fg-HAXdLnIv2yGmXgehXPBzCH-RcQPbHFotoemJ8m8S6EU8Z09pXRjQ=");
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDesc, setExpandedDesc] = useState(false);

  useEffect(() => {
    fetchListingDetails();
  }, [id]);

  const fetchListingDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data: listingData, error: listingError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single();
        
      if (listingError) throw listingError;
      setListing(listingData);

      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`*, profile:profiles(full_name, avatar_url)`)
        .eq('listing_id', id)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;
      setReviews(reviewsData || []);
    } catch (error) {
      console.error('Error fetching listing details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAmenityIcon = (amenity: string) => {
    const a = amenity.toLowerCase();
    if (a.includes('wifi')) return 'wifi';
    if (a.includes('park')) return 'parking';
    if (a.includes('pool')) return 'pool';
    if (a.includes('gym') || a.includes('fitness')) return 'dumbbell';
    if (a.includes('break')) return 'coffee';
    return 'check';
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

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.imageContainer}>
          <FlatList
            data={listing.images?.length ? listing.images : ['https://via.placeholder.com/800x600']}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.image} />
            )}
          />
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome name="chevron-left" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>{listing.title}</Text>
            <View style={styles.ratingBadge}>
              <FontAwesome name="star" size={14} color={COLORS.warning} />
              <Text style={styles.ratingText}>{listing.rating}</Text>
            </View>
          </View>

          <Text style={styles.location}>
            <FontAwesome name="map-marker" size={14} color={COLORS.textSecondary} /> {listing.location}, {listing.city}
          </Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.sectionTitle}>About</Text>
          <Text 
            style={styles.description} 
            numberOfLines={expandedDesc ? undefined : 3}
          >
            {listing.description}
          </Text>
          <TouchableOpacity onPress={() => setExpandedDesc(!expandedDesc)}>
            <Text style={styles.readMore}>{expandedDesc ? 'Read Less' : 'Read More'}</Text>
          </TouchableOpacity>

          {/* Amenities */}
          {listing.amenities && listing.amenities.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesContainer}>
                {listing.amenities.map((amenity, index) => (
                  <View key={index} style={styles.amenityBadge}>
                    <MaterialCommunityIcons name={getAmenityIcon(amenity) as any} size={20} color={COLORS.primary} />
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Mappls Map */}
          {listing.latitude && listing.longitude && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Location</Text>
              <View style={styles.mapContainer}>
                {Platform.OS !== 'web' && MapplsGL ? (
                  <MapplsGL.MapView 
                    style={styles.map}
                  >
                    <MapplsGL.Camera
                      zoomLevel={14}
                      centerCoordinate={[listing.longitude, listing.latitude]}
                    />
                    <MapplsGL.PointAnnotation
                      id="marker"
                      coordinate={[listing.longitude, listing.latitude]}
                    />
                  </MapplsGL.MapView>
                ) : (
                  <View style={[styles.map, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5', borderWidth: 1, borderColor: '#e1e4e8', borderRadius: 12 }]}>
                    <FontAwesome name="map-marker" size={40} color={COLORS.primary} style={{ marginBottom: 10 }} />
                    <Text style={{ color: COLORS.textSecondary, fontSize: 16, fontWeight: '500' }}>Map View</Text>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 4, textAlign: 'center', paddingHorizontal: 20 }}>
                      Interactive maps are available on the mobile app.
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}

          {/* Reviews */}
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Reviews ({listing.review_count})</Text>
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Image 
                    source={{ uri: review.profile?.avatar_url || 'https://via.placeholder.com/150' }} 
                    style={styles.reviewerImage} 
                  />
                  <View style={styles.reviewerInfo}>
                    <Text style={styles.reviewerName}>{review.profile?.full_name || 'Anonymous'}</Text>
                    <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.ratingBadge}>
                    <FontAwesome name="star" size={12} color={COLORS.warning} />
                    <Text style={styles.ratingText}>{review.rating}</Text>
                  </View>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noReviews}>No reviews yet.</Text>
          )}
          
          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.priceValue}>₹{listing.price_per_night} <Text style={styles.priceNight}>/ night</Text></Text>
        </View>
        <TouchableOpacity 
          style={styles.bookButton}
          onPress={() => router.push(`/booking/${listing.id}`)}
        >
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
  },
  imageContainer: {
    height: 300,
    width: width,
  },
  image: {
    width: width,
    height: 300,
    resizeMode: 'cover',
  },
  backButton: {
    position: 'absolute',
    top: 50, // rough safe area padding
    left: SIZES.md,
    backgroundColor: 'rgba(255,255,255,0.8)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: SIZES.md,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.xs,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: SIZES.sm,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    marginLeft: 4,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  location: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SIZES.md,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SIZES.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  description: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  readMore: {
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: SIZES.xs,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: 8,
    marginRight: SIZES.sm,
    marginBottom: SIZES.sm,
  },
  amenityText: {
    marginLeft: SIZES.xs,
    fontSize: 14,
    color: COLORS.text,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  reviewCard: {
    backgroundColor: COLORS.background,
    padding: SIZES.md,
    borderRadius: 12,
    marginBottom: SIZES.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  reviewerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SIZES.sm,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontWeight: 'bold',
    color: COLORS.text,
  },
  reviewDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  reviewComment: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  noReviews: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  bottomPadding: {
    height: 100, // Make room for sticky bottom bar
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.md,
    paddingBottom: SIZES.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  priceLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  priceNight: {
    fontSize: 14,
    fontWeight: 'normal',
    color: COLORS.textSecondary,
  },
  bookButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.xl,
    paddingVertical: SIZES.md,
    borderRadius: 12,
  },
  bookButtonText: {
    color: COLORS.surface,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
