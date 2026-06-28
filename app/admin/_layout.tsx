import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { ActivityIndicator, View } from 'react-native';
import { COLORS } from '../../constants/theme';

export default function AdminLayout() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!isAdmin) {
        router.replace('/(tabs)');
      } else {
        setIsReady(true);
      }
    }
  }, [isAdmin, loading]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ 
      headerStyle: { backgroundColor: COLORS.surface },
      headerTintColor: COLORS.text,
      headerTitleStyle: { fontWeight: 'bold' }
    }}>
      <Stack.Screen name="index" options={{ title: 'Admin Dashboard' }} />
      <Stack.Screen name="listings" options={{ title: 'Manage Listings' }} />
      <Stack.Screen name="users" options={{ title: 'Manage Users' }} />
      <Stack.Screen name="analytics" options={{ title: 'Analytics' }} />
    </Stack>
  );
}
