import React, { useRef, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated, Easing, Platform } from 'react-native';
import { Car } from '../types';
import { useRouter } from 'expo-router';
import { COLORS, SIZES, FONTS, RADIUS } from '../constants/theme';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

const IS_WEB = Platform.OS === 'web';

export default function CarCard({ car }: { car: Car }) {
  const router = useRouter();
  const enterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (IS_WEB) return;
    Animated.timing(enterAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const imageUri = car.images && car.images.length > 0 
    ? car.images[0] 
    : 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80';

  const cardContent = (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => router.push(`/car/${car.id}`)}
      activeOpacity={IS_WEB ? 0.7 : 0.9}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.image} />
        {car.status === 'rented' && (
          <View style={styles.rentedBadge}>
            <Text style={styles.rentedText}>Currently Rented</Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{car.name}</Text>
          <Text style={styles.price}>₹{car.per_day_cost.toLocaleString('en-IN')}</Text>
        </View>
        
        <View style={styles.brandRow}>
          <Text style={styles.brand}>{car.brand}</Text>
          <Text style={styles.priceNight}>/ day</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="car-shift-pattern" size={14} color={COLORS.primary} />
            <Text style={styles.featureText}>+₹{car.extra_km_cost}/km extra</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (IS_WEB) return cardContent;

  return (
    <Animated.View style={{
      opacity: enterAnim,
      transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
    }}>
      {cardContent}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    marginBottom: SIZES.lg,
    marginHorizontal: SIZES.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  rentedBadge: {
    position: 'absolute',
    top: SIZES.sm,
    left: SIZES.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  rentedText: {
    color: '#fff',
    fontFamily: FONTS.bold,
    fontSize: 12,
  },
  content: {
    padding: SIZES.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    flex: 1,
    marginRight: SIZES.sm,
  },
  price: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  brand: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  priceNight: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SIZES.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  featureText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  }
});
