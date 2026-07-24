import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabaseClient';

export const AuthContext = createContext();

const SESSION_KEY = '@oscc_worker_id';
const PINS_KEY    = '@oscc_worker_pins'; // { "WORKER_01": "1234", ... }

export const AuthProvider = ({ children }) => {
  const [workerId, setWorkerId]   = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on app start
  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedId = await AsyncStorage.getItem(SESSION_KEY);
        if (storedId) setWorkerId(storedId);
      } catch (e) {
        console.error('Failed to load session:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadSession();
  }, []);

  /** Check if a Worker ID already has a PIN registered */
  const hasAccount = async (id) => {
    try {
      const key = id.trim().toLowerCase();
      let { data, error } = await supabase.from('clinicians').select('worker_id').eq('worker_id', key).single();
      if (error && error.code === 'PGRST116') return false;
      return !!data;
    } catch {
      return false;
    }
  };

  /** First-time PIN setup — creates account for the worker */
  const setupPin = async (id, pin) => {
    try {
      const key = id.trim().toLowerCase();
      let { data, error } = await supabase.from('clinicians').select('worker_id').eq('worker_id', key).single();
      if (error && error.code === 'PGRST116') {
         error = null;
         data = null;
      }
      
      if (data) return { success: false, error: 'Worker ID already has an account. Please sign in.' };
      
      const { error: insertError } = await supabase.from('clinicians').insert({ worker_id: key, pin });
      if (insertError) throw insertError;

      const upperKey = key.toUpperCase();
      await AsyncStorage.setItem(SESSION_KEY, upperKey);
      setWorkerId(upperKey);
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Setup failed. Please try again.' };
    }
  };

  /** Regular login — validates PIN for given Worker ID */
  const login = async (id, pin) => {
    try {
      const key = id.trim().toLowerCase();
      let { data, error } = await supabase.from('clinicians').select('pin').eq('worker_id', key).single();
      if (error && error.code === 'PGRST116') {
         error = null;
         data = null;
      }
      
      if (error || !data) return { success: false, error: 'no_account' };
      if (data.pin !== pin) return { success: false, error: 'wrong_pin' };
      
      const upperKey = key.toUpperCase();
      await AsyncStorage.setItem(SESSION_KEY, upperKey);
      setWorkerId(upperKey);
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  /** Change PIN — requires the old PIN to verify identity */
  const changePin = async (oldPin, newPin) => {
    try {
      const key = workerId.toLowerCase();
      let { data, error } = await supabase.from('clinicians').select('pin').eq('worker_id', key).single();
      if (error && error.code === 'PGRST116') {
         error = null;
         data = null;
      }
      
      if (error || !data) return { success: false, error: 'Account not found.' };
      if (data.pin !== oldPin) return { success: false, error: 'Old PIN is incorrect.' };
      
      const { error: updateError } = await supabase.from('clinicians').update({ pin: newPin }).eq('worker_id', key);
      if (updateError) throw updateError;
      
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Change failed. Please try again.' };
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setWorkerId(null);
  };

  return (
    <AuthContext.Provider value={{ workerId, isLoading, login, setupPin, changePin, hasAccount, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
