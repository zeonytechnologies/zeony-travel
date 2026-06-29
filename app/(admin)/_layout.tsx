import { Tabs, useRouter } from 'expo-router';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace('/(tabs)');
    }
  }, [isAdmin, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!isAdmin) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: FONTS.medium,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="view-dashboard" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cars"
        options={{
          title: 'Fleet',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="car-multiple" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Requests',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="calendar-check" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
