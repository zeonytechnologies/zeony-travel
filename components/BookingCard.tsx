import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Booking } from '../types';
import { COLORS, SIZES } from '../constants/theme';
import { FontAwesome } from '@expo/vector-icons';

type BookingCardProps = {
  booking: Booking;
  onCancel?: (id: string) => void;
  onReview?: (booking: Booking) => void;
};

export default function BookingCard({ booking, onCancel, onReview }: BookingCardProps) {
  const listing = booking.listing;
  const imageUrl = listing?.images?.[0] || 'https://via.placeholder.com/300';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return COLORS.success;
      case 'cancelled': return COLORS.error;
      case 'completed': return COLORS.primary;
      default: return COLORS.textSecondary;
    }
  };

  return (
    <View style={styles.card}>
      <Image source={{ uri: imageUrl }} style={styles.image} />
      <View style={styles.infoContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>{listing?.title || 'Unknown Listing'}</Text>
          <View style={[styles.badge, { backgroundColor: getStatusColor(booking.status) }]}>
            <Text style={styles.badgeText}>{booking.status.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.detailText}>
          <FontAwesome name="calendar" size={12} /> {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
        </Text>
        
        <Text style={styles.detailText}>
          <FontAwesome name="user" size={12} /> {booking.guests} Guest(s)
        </Text>

        <View style={styles.footerRow}>
          <Text style={styles.price}>₹{booking.total_price}</Text>

          {booking.status === 'confirmed' && onCancel && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]} 
              onPress={() => onCancel(booking.id)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}

          {booking.status === 'completed' && onReview && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.reviewButton]} 
              onPress={() => onReview(booking)}
            >
              <Text style={styles.reviewButtonText}>Write Review</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: SIZES.md,
    overflow: 'hidden',
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  image: {
    width: 100,
    height: '100%',
  },
  infoContainer: {
    flex: 1,
    padding: SIZES.sm,
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
    marginRight: SIZES.xs,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: COLORS.surface,
    fontSize: 10,
    fontWeight: 'bold',
  },
  detailText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZES.xs,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  actionButton: {
    paddingHorizontal: SIZES.sm,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  cancelButton: {
    borderColor: COLORS.error,
  },
  cancelButtonText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: 'bold',
  },
  reviewButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  reviewButtonText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
