import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import { Listing } from '../types';
import { useRouter } from 'expo-router';

type ListingCardProps = {
  listing: Listing;
};

export default function ListingCard({ listing }: ListingCardProps) {
  const router = useRouter();
  const imageUrl = listing.images && listing.images.length > 0 ? listing.images[0] : 'https://via.placeholder.com/300x200';

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => router.push(`/listing/${listing.id}`)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: imageUrl }} style={styles.image} />
      
      <TouchableOpacity style={styles.favoriteButton}>
        <FontAwesome name="heart-o" size={20} color={COLORS.surface} />
      </TouchableOpacity>

      <View style={styles.infoContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>{listing.title}</Text>
          <View style={styles.ratingContainer}>
            <FontAwesome name="star" size={14} color={COLORS.warning} />
            <Text style={styles.ratingText}>{listing.rating}</Text>
          </View>
        </View>

        <Text style={styles.location} numberOfLines={1}>{listing.city}, {listing.location}</Text>
        
        <Text style={styles.priceContainer}>
          <Text style={styles.price}>₹{listing.price_per_night}</Text>
          <Text style={styles.night}> / night</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: SIZES.lg,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 200,
  },
  favoriteButton: {
    position: 'absolute',
    top: SIZES.sm,
    right: SIZES.sm,
    padding: SIZES.sm,
  },
  infoContainer: {
    padding: SIZES.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.xs,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: SIZES.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  location: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SIZES.sm,
  },
  priceContainer: {
    marginTop: SIZES.xs,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  night: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
