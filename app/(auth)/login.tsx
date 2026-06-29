import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { COLORS, SIZES, FONTS, RADIUS } from '../../constants/theme';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';

const LOGO = require('../../assets/images/icon.png');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { signIn, hashPassword } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    
    setLoading(true);
    try {
      const hashedPass = hashPassword(password);
      
      const { data, error } = await supabase
        .from('car_users')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .eq('password_hash', hashedPass)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        await signIn(data.id);
        // _layout.tsx will automatically redirect upon state change
      } else {
        Alert.alert('Error', 'Invalid email or password');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    router.replace('/(auth)/register');
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoSection}>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        <Text style={styles.appName}>Zeony Car Rentals</Text>
      </View>

      <Text style={styles.subtitle}>Welcome back! Sign in to continue.</Text>

      <View style={styles.inputContainer}>
        <FontAwesome name="envelope" size={16} color={COLORS.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Enter email address"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View style={styles.inputContainer}>
        <FontAwesome name="lock" size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Enter password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>
      
      <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Sign In</Text>}
      </TouchableOpacity>

      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>Don't have an account?</Text>
        <View style={styles.divider} />
      </View>

      <TouchableOpacity style={styles.secondaryButton} onPress={handleSignUp} disabled={loading}>
        <Text style={styles.secondaryButtonText}>Create Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SIZES.lg,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: SIZES.sm,
  },
  appName: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  title: {
    fontSize: 36,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    marginBottom: SIZES.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SIZES.xxl,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    marginBottom: SIZES.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5,
    elevation: 2,
  },
  inputIcon: {
    paddingHorizontal: SIZES.md,
  },
  input: {
    flex: 1,
    padding: SIZES.lg,
    fontSize: 18,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: SIZES.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: COLORS.surface,
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: SIZES.md,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
});
