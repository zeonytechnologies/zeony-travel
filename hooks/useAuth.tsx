import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { CarUser } from '../types';
import CryptoJS from 'crypto-js';

type AuthContextType = {
  user: CarUser | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (userId: string) => Promise<void>;
  signOut: () => Promise<void>;
  hashPassword: (password: string) => string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CarUser | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('user_session');
      if (storedUserId) {
        await fetchUser(storedUserId);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error('Failed to load session', e);
      setLoading(false);
    }
  };

  const fetchUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('car_users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setUser(data as CarUser);
        setIsAdmin(data.role === 'admin');
      }
    } catch (e: any) {
      console.error('Failed to fetch user', e);
      import('react-native').then(({ Alert }) => Alert.alert('Session Error', e.message || 'Failed to verify session'));
      await AsyncStorage.removeItem('user_session');
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (userId: string) => {
    await AsyncStorage.setItem('user_session', userId);
    await fetchUser(userId);
  };

  const signOut = async () => {
    await AsyncStorage.removeItem('user_session');
    setUser(null);
    setIsAdmin(false);
  };

  const hashPassword = (password: string) => {
    return CryptoJS.SHA256(password).toString();
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signIn, signOut, hashPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
