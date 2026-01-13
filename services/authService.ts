import { supabase } from './supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

const TOKEN_KEY = 'echospend_auth_token';

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
  code?: string; // For dev OTP
  isNewUser?: boolean;
}

export interface Session {
  access_token: string;
  user: User | null;
}

// Email/Password Login
export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    if (!supabase) return { success: false, message: 'Supabase client not initialized' };

    const { data, error } = await supabase.rpc('login_user', {
      p_email: email,
      p_password: password
    });

    if (error) throw error;
    if (!data.success) return { success: false, message: data.message };

    await AsyncStorage.setItem(TOKEN_KEY, data.token);

    // Check if we have a refresh token, if not use access token for both (might fail refresh but works for request)
    const refreshToken = data.refresh_token || data.token;
    await supabase.auth.setSession({ access_token: data.token, refresh_token: refreshToken });

    return { success: true, user: data.user, token: data.token };
  } catch (error: any) {
    console.error('Login error:', error);
    return { success: false, message: error.message };
  }
}

// Email/Password Signup
export async function signup(email: string, password: string, fullName: string): Promise<AuthResponse> {
  try {
    if (!supabase) return { success: false, message: 'Supabase client not initialized' };

    const { data, error } = await supabase.rpc('register_user', {
      p_email: email,
      p_password: password,
      p_full_name: fullName
    });

    if (error) throw error;
    if (!data.success) return { success: false, message: data.message };

    await AsyncStorage.setItem(TOKEN_KEY, data.token);

    const refreshToken = data.refresh_token || data.token;
    await supabase.auth.setSession({ access_token: data.token, refresh_token: refreshToken });

    return { success: true, user: data.user, token: data.token };
  } catch (error: any) {
    console.error('Signup error:', error);
    return { success: false, message: error.message };
  }
}

// Request OTP
export async function sendOTP(phone: string): Promise<AuthResponse> {
  try {
    if (!supabase) return { success: false, message: 'Supabase client not initialized' };

    const cleanPhone = phone.replace(/\D/g, '');
    const { data, error } = await supabase.rpc('request_otp', {
      p_phone: cleanPhone
    });

    if (error) throw error;
    if (!data.success) return { success: false, message: data.message };

    return { success: true, message: data.message, code: data.code };
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return { success: false, message: error.message };
  }
}

// Verify OTP
// After OTP verification, the backend checks if user's phone number existed in database.
// Backend returns is_new_user flag:
//   - true: Phone was NOT in DB before, or user hasn't completed profile -> redirect to '/signup'
//   - false: Phone existed AND profile is complete -> redirect to main page '/'
// Session persists during redirect because token is saved before navigation.
export async function verifyOTP(phone: string, code: string): Promise<AuthResponse> {
  try {
    if (!supabase) return { success: false, message: 'Supabase client not initialized' };

    const cleanPhone = phone.replace(/\D/g, '');
    console.log('[verifyOTP] Calling RPC with phone:', cleanPhone);

    const { data, error } = await supabase.rpc('verify_otp', {
      p_phone: cleanPhone,
      p_code: code
    });

    console.log('[verifyOTP] RPC response:', { data, error });

    if (error) throw error;
    if (!data.success) return { success: false, message: data.message };

    // Save token to persist session during redirect
    await AsyncStorage.setItem(TOKEN_KEY, data.token);

    const refreshToken = data.refresh_token || data.token;
    await supabase.auth.setSession({ access_token: data.token, refresh_token: refreshToken });

    // Use backend's is_new_user flag if available (new migration)
    // Fall back to checking full_name if is_new_user is not present (old migration)
    const isNewUser = data.is_new_user !== undefined
      ? data.is_new_user === true
      : !data.user?.full_name;

    console.log('[verifyOTP] isNewUser:', isNewUser, 'full_name:', data.user?.full_name);

    return {
      success: true,
      user: data.user,
      token: data.token,
      isNewUser
    };
  } catch (error: any) {
    console.error('[verifyOTP] Error:', error);
    return { success: false, message: error.message };
  }
}

// Apple Login
export async function signInWithApple(): Promise<AuthResponse> {
  try {
    if (!supabase) return { success: false, message: 'Supabase client not initialized' };

    // In a real app, we would perform the native Apple Sign In here
    // and get the identityToken, user, etc.
    // For this custom implementation, we will simulate it or use Supabase OAuth just to get the ID, 
    // but since we are "not using Supabase Auth", we assume the client handles the native part 
    // and sends the ID to our custom backend.

    // MOCK IMPLEMENTATION FOR DEMO (Since we can't trigger native Apple UI in this environment)
    // In production, use expo-apple-authentication
    const mockAppleId = 'apple_' + Date.now();
    const mockEmail = `user_${Date.now()}@privaterelay.appleid.com`;
    const mockName = 'Apple User';

    const { data, error } = await supabase.rpc('login_apple', {
      p_apple_id: mockAppleId,
      p_email: mockEmail,
      p_full_name: mockName
    });

    if (error) throw error;
    if (!data.success) return { success: false, message: data.message };

    await AsyncStorage.setItem(TOKEN_KEY, data.token);

    const refreshToken = data.refresh_token || data.token;
    await supabase.auth.setSession({ access_token: data.token, refresh_token: refreshToken });

    // Mock Logic: If create_at is within last 10 seconds, it's a new user
    const isNewUser = new Date(data.user.created_at).getTime() > Date.now() - 10000;

    return { success: true, user: data.user, token: data.token, isNewUser };

    /* 
    // REAL IMPLEMENTATION PSEUDO-CODE:
    const credential = await AppleAuthentication.signInAsync(...);
    const { data } = await supabase.rpc('login_apple', {
       p_apple_id: credential.user,
       p_email: credential.email,
       p_full_name: credential.fullName?.givenName
    });
    */
  } catch (error: any) {
    console.error('Apple Sign In error:', error);
    return { success: false, message: error.message };
  }
}

export async function logout(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token && supabase) {
      // Best effort logout
      const { error: rpcError } = await supabase.rpc('logout_user', { p_token: token });
      if (rpcError) {
        console.warn('Logout RPC error:', rpcError);
      }
      await supabase.auth.signOut();
    }
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Logout error:', error);
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token || !supabase) return null;

    const { data, error } = await supabase.rpc('get_user_by_token', { p_token: token });

    if (error || !data.success) {
      console.warn("Token invalid, clearing", error);
      await AsyncStorage.removeItem(TOKEN_KEY);
      return null;
    }

    // Ensure session is set for RLS calls
    if (data.token) {
      // We do this silently
      const refreshToken = data.refresh_token || data.token;
      await supabase.auth.setSession({ access_token: data.token, refresh_token: refreshToken }).catch(err => console.error("Failed to set session", err));
    }

    return data.user;
  } catch (error) {
    console.error('Check auth error:', error);
    return null;
  }
}

export async function getCurrentSession(): Promise<Session | null> {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    const user = await getCurrentUser();
    if (!user) return null;

    return {
      access_token: token,
      user: user
    };
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.is_admin === true;
}
// Google Login
export async function signInWithGoogle(): Promise<AuthResponse> {
  try {
    if (!supabase) return { success: false, message: 'Supabase client not initialized' };

    // Mock Implementation
    const mockGoogleId = 'google_' + Date.now();
    const mockEmail = `user_${Date.now()}@gmail.com`;
    // Simulate name/surname from Google
    const mockName = 'Google';
    const mockSurname = 'User';

    const { data, error } = await supabase.rpc('login_google', {
      p_google_id: mockGoogleId,
      p_email: mockEmail,
      p_full_name: `${mockName} ${mockSurname}`
    });

    if (error) {
      // If RPC doesn't exist, we might fail. 
      // For this task, assuming analogous to login_apple or login_user.
      // If login_google RPC is missing, we might need to add it or reuse generic login if possible.
      // Let's assume we reuse login_apple logic or just direct insert for mock.
      throw error;
    }

    if (!data.success) return { success: false, message: data.message };

    await AsyncStorage.setItem(TOKEN_KEY, data.token);

    // Mock Logic: New user detection
    const isNewUser = new Date(data.user.created_at).getTime() > Date.now() - 10000;

    return { success: true, user: data.user, token: data.token, isNewUser };

  } catch (error: any) {
    console.error('Google Sign In error:', error);
    // Fallback for demo if RPC missing
    return { success: false, message: "Google Login RPC missing (Mock)" };
  }
}

// Update Profile
// Uses RPC function to update user profile (bypasses RLS issues with custom auth)
// Falls back to direct table update if RPC is not available
export async function updateProfile(userId: string, updates: {
  fullName?: string;
  currency?: string;
  language?: string;
  dob?: string;
  avatar?: string;
}): Promise<boolean> {
  try {
    if (!supabase) {
      console.error('[updateProfile] Supabase client not initialized');
      return false;
    }

    console.log('[updateProfile] Updating profile for user:', userId, updates);

    // Try RPC function first (recommended - bypasses RLS issues)
    const { data: rpcData, error: rpcError } = await supabase.rpc('update_user_profile', {
      p_user_id: userId,
      p_full_name: updates.fullName || null,
      p_currency: updates.currency || null,
      p_language: updates.language || null,
      p_date_of_birth: updates.dob || null,
      p_avatar: updates.avatar || null
    });

    if (!rpcError && rpcData?.success) {
      console.log('[updateProfile] RPC update successful:', rpcData);
      return true;
    }

    // RPC failed or doesn't exist, try direct update
    console.log('[updateProfile] RPC failed, trying direct update. Error:', rpcError?.message);

    // 1. Update User Profile (Full Name + DOB + Avatar) in app_users table
    const updateFields: any = {};
    if (updates.fullName) updateFields.full_name = updates.fullName;
    if (updates.dob) updateFields.date_of_birth = updates.dob;
    if (updates.avatar) updateFields.avatar = updates.avatar;

    if (Object.keys(updateFields).length > 0) {
      const { data, error } = await supabase
        .from('app_users')
        .update(updateFields)
        .eq('id', userId)
        .select();

      if (error) {
        console.error('[updateProfile] Failed to update user fields:', error);
        return false;
      }
      console.log('[updateProfile] Updated user fields:', data);
    }

    // 2. Update Settings (Currency, Language)
    if (updates.currency) {
      const { error } = await supabase.from('settings').upsert({
        user_id: userId,
        key: 'currency',
        value: updates.currency
      }, { onConflict: 'user_id,key' });

      if (error) {
        console.error('[updateProfile] Failed to update currency:', error);
      }
    }

    if (updates.language) {
      const { error } = await supabase.from('settings').upsert({
        user_id: userId,
        key: 'language',
        value: updates.language
      }, { onConflict: 'user_id,key' });

      if (error) {
        console.error('[updateProfile] Failed to update language:', error);
      }
    }

    console.log('[updateProfile] Profile update successful');
    return true;
  } catch (error) {
    console.error('[updateProfile] Error:', error);
    return false;
  }
}

