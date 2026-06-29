import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { COLORS, SIZES, FONTS, RADIUS } from '../../constants/theme';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

const LOGO = require('../../assets/images/icon.png');

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick an image');
    }
  };

  const uploadImage = async (uri: string, userId: string) => {
    try {
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      const arrayBuffer = decode(base64);

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt}`,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const { signIn, hashPassword } = useAuth();

  const handleRegister = async () => {
    if (!email || !password || !fullName.trim()) {
      Alert.alert('Error', 'Please enter email, password, and full name');
      return;
    }

    setLoading(true);
    try {
      // 1. Hash password
      const hashedPass = hashPassword(password);
      
      // We will generate a UUID on the client side just so we can use it for the image upload before insert
      const tempUserId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      // 2. Upload avatar if selected
      let avatarUrl = null;
      if (imageUri) {
        avatarUrl = await uploadImage(imageUri, tempUserId);
      }

      // 3. Insert into car_users
      const { data, error } = await supabase
        .from('car_users')
        .insert({
          email: email.trim().toLowerCase(),
          password_hash: hashedPass,
          full_name: fullName,
          avatar_url: avatarUrl
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('An account with this email already exists');
        }
        throw error;
      }
      if (data) {
        await signIn(data.id);
        // _layout.tsx will automatically redirect to (tabs)
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.container}>
      {/* Logo */}
      <View style={styles.logoSection}>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        <Text style={styles.appName}>Zeony Car Rentals</Text>
      </View>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join Zeony Car Rentals today.</Text>

      <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <FontAwesome name="camera" size={30} color={COLORS.textSecondary} />
          </View>
        )}
      </TouchableOpacity>
      <Text style={styles.avatarText}>Tap to upload photo</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email address"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
        />
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Sign Up</Text>}
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.signInLink}>
         <Text style={styles.signInLinkText}>Already have an account? <Text style={{ fontFamily: FONTS.bold }}>Sign In</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.xl,
    justifyContent: 'center',
    flexGrow: 1,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  logo: {
    width: 110,
    height: 110,
    marginBottom: SIZES.xs,
  },
  appName: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    marginBottom: SIZES.sm,
  },
  title: {
    fontSize: 32,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    marginBottom: SIZES.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SIZES.xl,
    textAlign: 'center',
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: SIZES.sm,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginBottom: SIZES.xl,
  },
  inputContainer: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    marginBottom: SIZES.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5,
    elevation: 2,
  },
  input: {
    padding: 18,
    fontSize: 18,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 16,
    marginBottom: SIZES.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: COLORS.surface,
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  signInLink: {
    marginTop: SIZES.lg,
    alignItems: 'center',
  },
  signInLinkText: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.medium,
    fontSize: 14,
  },
});
