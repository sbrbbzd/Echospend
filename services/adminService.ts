import { supabase } from './supabaseClient';

export interface OTPCode {
  id: string;
  phone: string;
  code: string;
  expires_at: string;
  used: boolean;
  created_at: string;
  verified_at?: string;
}

export interface UserProfile {
  id: string;
  phone?: string;
  apple_id?: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
  is_admin: boolean;
}

/**
 * Get all OTP codes (admin only)
 */
export async function getAllOTPCodes(): Promise<OTPCode[]> {
  try {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('otp_codes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('Error fetching OTP codes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching OTP codes:', error);
    return [];
  }
}

/**
 * Get all user profiles (admin only)
 */
export async function getAllUserProfiles(): Promise<UserProfile[]> {
  try {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('app_users')
      .select('id, email, phone, apple_id, full_name, created_at, updated_at, is_admin')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user profiles:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching user profiles:', error);
    return [];
  }
}

/**
 * Delete OTP code (admin only)
 */
export async function deleteOTPCode(id: string): Promise<boolean> {
  try {
    if (!supabase) return false;

    const { error } = await supabase
      .from('otp_codes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting OTP code:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting OTP code:', error);
    return false;
  }
}

/**
 * Make user admin (admin only)
 */
export async function makeUserAdmin(userId: string): Promise<boolean> {
  try {
    if (!supabase) return false;

    const { error } = await supabase
      .from('user_profiles')
      .update({ is_admin: true })
      .eq('id', userId);

    if (error) {
      console.error('Error making user admin:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error making user admin:', error);
    return false;
  }
}

/**
 * Remove admin status (admin only)
 */
export async function removeAdminStatus(userId: string): Promise<boolean> {
  try {
    if (!supabase) return false;

    const { error } = await supabase
      .from('user_profiles')
      .update({ is_admin: false })
      .eq('id', userId);

    if (error) {
      console.error('Error removing admin status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error removing admin status:', error);
    return false;
  }
}

/**
 * Global Categories Management
 */
export async function getGlobalCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .is('user_id', null)
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function createGlobalCategory(name: string, icon: string, color: string) {
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name, icon, color, user_id: null }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteGlobalCategory(id: string) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

/**
 * Languages Management
 */
export async function getLanguages() {
  const { data, error } = await supabase
    .from('supported_languages')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function addLanguage(code: string, name: string, icon: string) {
  const { data, error } = await supabase
    .from('supported_languages')
    .insert([{ code, name, icon }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteLanguage(id: string) {
  const { error } = await supabase
    .from('supported_languages')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

/**
 * Currencies Management
 */
export async function getCurrencies() {
  const { data, error } = await supabase
    .from('supported_currencies')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function addCurrency(code: string, name: string, symbol: string, icon: string) {
  const { data, error } = await supabase
    .from('supported_currencies')
    .insert([{ code, name, symbol, icon }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCurrency(id: string) {
  const { error } = await supabase
    .from('supported_currencies')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

