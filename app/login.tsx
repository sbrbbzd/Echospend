import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Dimensions, Modal, FlatList } from 'react-native';
import { router, Link } from 'expo-router';
import { Mic, ChevronDown, Search, X } from 'lucide-react-native';
import { Svg, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { sendOTP, verifyOTP, signInWithApple, signInWithGoogle } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

// SVG Icons from provided HTML
const GoogleIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
    <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.27.81-.57z" fill="#FBBC05" />
    <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335" />
  </Svg>
);

const AppleIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="#fff">
    <Path d="M17.05 20.28c-.98.95-2.05 1.72-3.11 1.72-1.01 0-1.44-.61-2.64-.61-1.25 0-1.68.61-2.63.61-1.12 0-2.23-.92-3.31-2.04C3.06 17.65 1.5 13.97 1.5 10.74c0-3.32 1.87-5.11 3.73-5.11 1.06 0 1.95.66 2.68.66.72 0 1.7-.72 2.9-.72.48 0 1.83.05 2.82.97-.24.2-.9.76-.9 2.05 0 1.54 1.12 2.07 1.34 2.16-.1.29-.36.72-.65 1.1-.38.52-.78 1.04-1.26 1.04-.48 0-.61-.31-1.21-.31-.61 0-.75.31-1.21.31-.48 0-.91-.53-1.28-1.04-.84-1.16-1.55-3.23-1.55-5.16 0-3.04 1.89-4.66 3.66-4.66.97 0 1.88.64 2.48.64.6 0 1.48-.68 2.58-.68.42 0 1.62.05 2.49.88-.13.12-.78.71-.78 1.88 0 1.35.98 1.81 1.25 1.93-.09.28-.35.7-.63 1.08zM12.01 4.75c-.01-2.01 1.41-3.75 3.35-3.75.05 2.22-1.63 4-3.35 3.75z" />
  </Svg>
)

// Minimal Country List
const allCountries = [
  { code: '+1', flag: '🇺🇸', name: 'United States' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+1', flag: '🇨🇦', name: 'Canada' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+82', flag: '🇰🇷', name: 'South Korea' },
  { code: '+86', flag: '🇨🇳', name: 'China' },
  { code: '+7', flag: '🇷🇺', name: 'Russia' },
  { code: '+55', flag: '🇧🇷', name: 'Brazil' },
  { code: '+52', flag: '🇲🇽', name: 'Mexico' },
  { code: '+39', flag: '🇮🇹', name: 'Italy' },
  { code: '+34', flag: '🇪🇸', name: 'Spain' },
  { code: '+31', flag: '🇳🇱', name: 'Netherlands' },
  { code: '+47', flag: '🇳🇴', name: 'Norway' },
  { code: '+46', flag: '🇸🇪', name: 'Sweden' },
  { code: '+41', flag: '🇨🇭', name: 'Switzerland' },
  { code: '+90', flag: '🇹🇷', name: 'Turkey' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+994', flag: '🇦🇿', name: 'Azerbaijan' },
];

const Login: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');

  // Country Selection
  const [countryCode, setCountryCode] = useState('+1');
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(false);
  const { refreshAuth } = useAuth();

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return allCountries;
    const lower = searchQuery.toLowerCase();
    return allCountries.filter(c =>
      c.name.toLowerCase().includes(lower) ||
      c.code.includes(lower)
    );
  }, [searchQuery]);

  const handleSendOTP = async () => {
    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }
    setLoading(true);
    const result = await sendOTP(countryCode + phone);
    setLoading(false);

    if (result.success) {
      setStep('otp');
      if (result.code) Alert.alert('Dev OTP', `Your code is: ${result.code}`);
    } else {
      Alert.alert('Error', result.message || 'Failed to send OTP');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit code');
      return;
    }
    console.log('[handleVerifyOTP] Starting verification...');
    setLoading(true);

    try {
      const result = await verifyOTP(countryCode + phone, otp);
      console.log('[handleVerifyOTP] Result:', result);
      setLoading(false);

      if (result.success) {
        console.log('[handleVerifyOTP] Success! Refreshing auth...');
        // Refresh auth state to persist session during redirect
        await refreshAuth();
        console.log('[handleVerifyOTP] Auth refreshed. isNewUser:', result.isNewUser);

        // Check if user exists in database (has completed profile)
        // isNewUser: true -> User phone exists but no profile data -> redirect to '/signup'
        // isNewUser: false -> User exists with full profile -> redirect to main page '/'
        if (result.isNewUser) {
          console.log('[handleVerifyOTP] Redirecting to /signup');
          router.replace('/signup');
        } else {
          console.log('[handleVerifyOTP] Redirecting to /');
          router.replace('/');
        }
      } else {
        console.log('[handleVerifyOTP] Failed:', result.message);
        Alert.alert('Error', result.message || 'Invalid OTP');
      }
    } catch (err: any) {
      console.error('[handleVerifyOTP] Exception:', err);
      setLoading(false);
      Alert.alert('Error', err.message || 'Verification failed');
    }
  };

  const handleSocialLogin = async (provider: 'apple' | 'google') => {
    setLoading(true);
    let result = provider === 'apple' ? await signInWithApple() : await signInWithGoogle();
    setLoading(false);

    if (result.success) {
      await refreshAuth();
      // Redirect to Signup if New User OR Name is missing (Legacy check)
      if (result.isNewUser || (result.user && !result.user.full_name)) {
        router.replace('/signup');
      } else {
        router.replace('/');
      }
    } else {
      Alert.alert('Error', result.message || `${provider} Sign In failed`);
    }
  };

  return (
    <LinearGradient
      colors={['#0f172a', '#2e1065', '#020617']}
      locations={[0, 0.4, 1]}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>

          <View style={{ alignItems: 'center', marginBottom: 48 }}>
            <View style={{ width: 64, height: 64, backgroundColor: '#10b981', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 24, shadowColor: '#10b981', shadowOpacity: 0.4, shadowRadius: 20 }}>
              <Mic size={32} color="#020617" strokeWidth={2.5} />
            </View>
            <Text style={{ fontSize: 32, fontWeight: '700', color: '#fff', marginBottom: 8, textAlign: 'center' }}>Welcome Back</Text>
            <Text style={{ fontSize: 16, color: '#94a3b8', textAlign: 'center' }}>Securely access your voice-first finance workspace</Text>
          </View>

          <View style={{ gap: 24 }}>
            {step === 'phone' ? (
              <View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, marginLeft: 4 }}>Phone Number</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => setShowCountryModal(true)}
                    style={{ width: 100, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', paddingHorizontal: 12, height: 56 }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#fff', fontSize: 16 }}>{countryCode}</Text>
                      <ChevronDown size={16} color="#94a3b8" />
                    </View>
                  </TouchableOpacity>

                  <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', height: 56, justifyContent: 'center', paddingHorizontal: 16 }}>
                    <TextInput
                      style={{ color: '#fff', fontSize: 16, height: '100%' }}
                      placeholder="(555) 000-0000"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleSendOTP}
                  disabled={loading}
                  style={{ marginTop: 24, backgroundColor: '#10b981', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 20 }}
                >
                  {loading ? <ActivityIndicator color="#020617" /> : <Text style={{ color: '#020617', fontSize: 16, fontWeight: '700' }}>Send OTP</Text>}
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, marginLeft: 4 }}>Enter Code</Text>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', height: 56, justifyContent: 'center', paddingHorizontal: 16, marginBottom: 24 }}>
                  <TextInput
                    style={{ color: '#fff', fontSize: 24, height: '100%', textAlign: 'center', letterSpacing: 8 }}
                    placeholder="000000"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                </View>
                <TouchableOpacity
                  onPress={handleVerifyOTP}
                  disabled={loading}
                  style={{ backgroundColor: '#10b981', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 20 }}
                >
                  {loading ? <ActivityIndicator color="#020617" /> : <Text style={{ color: '#020617', fontSize: 16, fontWeight: '700' }}>Verify</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStep('phone')} style={{ marginTop: 16, alignItems: 'center' }}>
                  <Text style={{ color: '#94a3b8' }}>Change Phone Number</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
              <Text style={{ marginHorizontal: 16, color: '#94a3b8', fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>OR</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            </View>

            <View style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={() => handleSocialLogin('google')}
                style={{ height: 56, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.02)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}
              >
                <GoogleIcon />
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Continue with Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSocialLogin('apple')}
                style={{ height: 56, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.02)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}
              >
                <AppleIcon />
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Continue with Apple</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
              <Text style={{ color: '#94a3b8' }}>Don't have an account? </Text>
              <Link href="/signup" asChild>
                <TouchableOpacity>
                  <Text style={{ color: '#10b981', fontWeight: '600' }}>Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country Selection Modal */}
      <Modal visible={showCountryModal} animationType="slide" transparent>
        <LinearGradient
          colors={['#0f172a', '#2e1065', '#020617']}
          locations={[0, 0.4, 1]}
          style={{ flex: 1 }}
        >
          <View style={{ padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
              <View style={{ flex: 1, height: 44, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }}>
                <Search size={20} color="#94a3b8" style={{ marginRight: 8 }} />
                <TextInput
                  style={{ flex: 1, color: '#fff', fontSize: 16 }}
                  placeholder="Search country"
                  placeholderTextColor="#64748b"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
              </View>
            </View>
          </View>


          <FlatList
            data={filteredCountries}
            keyExtractor={(item, index) => item.code + index}
            contentContainerStyle={{ padding: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                onPress={() => {
                  setCountryCode(item.code);
                  setShowCountryModal(false);
                  setSearchQuery('');
                }}
              >
                <Text style={{ fontSize: 16, color: '#fff' }}>{item.flag}  {item.name}</Text>
                <Text style={{ fontSize: 16, color: '#94a3b8' }}>{item.code}</Text>
              </TouchableOpacity>
            )}
          />
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
};

export default Login;
