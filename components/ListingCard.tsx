import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, RADIUS } from '../constants/theme';
import { Listing } from '../types';
import { useRouter } from 'expo-router';

type ListingCardProps = {
  listing: Listing;
};

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  hotel: { label: 'Hotel', icon: 'bed', color: COLORS.primary },
  tour: { label: 'Tour', icon: 'map-marker-path', color: '#7C3AED' },
  package: { label: 'Package', icon: 'package-variant', color: '#D97706' },
};

export default function ListingCard({ listing }: ListingCardProps) {
  const router = useRouter();
  const imageUrl =
    listing.images && listing.images.length > 0
      ? listing.images[0]
      : 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80';

  const typeConf = TYPE_CONFIG[listing.type] || TYPE_CONFIG.hotel;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/listing/${listing.id}`)}
      activeOpacity={0.9}
    >
      {/* Image */}
      <View style={styles.imageWrapper}>
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />

        {/* Type Badge */}
        <View style={[styles.typeBadge, { backgroundColor: typeConf.color }]}>
          <MaterialCommunityIcons name={typeConf.icon as any} size={12} color="#fff" />
          <Text style={styles.typeBadgeText}>{typeConf.label}</Text>
        </View>

        {/* Favourite */}
        <TouchableOpacity style={styles.favouriteBtn} activeOpacity={0.8}>
          <FontAwesome name="heart-o" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{listing.title}</Text>
          <View style={styles.ratingBadge}>
            <FontAwesome name="star" size={12} color={COLORS.warning} />
            <Text style={styles.ratingText}>{listing.rating}</Text>
          </View>
        </View>

        <View style={styles.locationRow}>
          <FontAwesome name="map-marker" size={12} color={COLORS.textSecondary} />
          <Text style={styles.location}>{listing.city}, {listing.location}</Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <FontAwesome name="users" size={11} color={COLORS.textMuted} />
            <Text style={styles.metaText}>Up to {listing.max_guests} guests</Text>
          </View>
          {listing.review_count > 0 && (
            <View style={styles.metaItem}>
              <FontAwesome name="comment-o" size={11} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{listing.review_count} reviews</Text>
            </View>
          )}
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{listing.price_per_night.toLocaleString('en-IN')}</Text>
          <Text style={styles.priceNight}> / night</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => router.push(`/listing/${listing.id}`)}
          >
            <Text style={styles.bookBtnText}>View</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginBottom: SIZES.md,
    marginHorizontal: SIZES.md,
    overflow: 'hidden',
    boxShadow: '0px 4px 16px rgba(0, 103, 120, 0.10)',
    elevation: 4,
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 210,
  },
  typeBadge: {
    position: 'absolute',
    top: SIZES.sm,
    left: SIZES.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: '#fff',
  },
  favouriteBtn: {
    position: 'absolute',
    top: SIZES.sm,
    right: SIZES.sm,
    backgroundColor: 'rgba(0,0,0,0.35)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    padding: SIZES.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginRight: SIZES.sm,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: '#D97706',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  location: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    gap: SIZES.md,
    marginBottom: SIZES.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  price: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  priceNight: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  bookBtn: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  bookBtnText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },
});
