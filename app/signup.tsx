import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Dimensions, Modal, FlatList } from 'react-native';
import { router, Link } from 'expo-router';
import { Mic, Calendar, ChevronDown, Check, Search, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import RNDateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { sendOTP, verifyOTP, updateProfile } from '../services/authService';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';

const { width } = Dimensions.get('window');

// Country list (same as login page)
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

type SignupStep = 'phone' | 'otp' | 'profile';

const Signup: React.FC = () => {
  const { user, refreshAuth } = useAuth();
  const { supportedCurrencies, supportedLanguages } = useAppContext();

  // Step state
  const [step, setStep] = useState<SignupStep>('phone');

  // Phone & OTP state
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [otp, setOtp] = useState('');
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Profile state
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('en');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());

  // Verified user from OTP
  const [verifiedUser, setVerifiedUser] = useState<any>(null);

  const languageOptions = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'az', name: 'Azərbaycan' },
  ];

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return allCountries;
    const lower = searchQuery.toLowerCase();
    return allCountries.filter(c =>
      c.name.toLowerCase().includes(lower) ||
      c.code.includes(lower)
    );
  }, [searchQuery]);

  // Check if user is already authenticated (came from login flow)
  React.useEffect(() => {
    if (user) {
      // User is already authenticated, skip to profile
      setVerifiedUser(user);
      setStep('profile');
      if (user.full_name) {
        setFullName(user.full_name);
      }
    }
  }, [user]);

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
    setLoading(true);

    try {
      const result = await verifyOTP(countryCode + phone, otp);
      setLoading(false);

      if (result.success) {
        setVerifiedUser(result.user);

        // Check if user already has profile completed
        if (!result.isNewUser && result.user?.full_name) {
          // User exists and has profile, refresh auth and go to main page
          await refreshAuth();
          router.replace('/');
        } else {
          // New user or incomplete profile, show profile step
          // DON'T call refreshAuth() here - it would trigger _layout redirect
          // We'll call it after profile is completed
          setStep('profile');
        }
      } else {
        Alert.alert('Error', result.message || 'Invalid OTP');
      }
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Error', err.message || 'Verification failed');
    }
  };

  const handleDateChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    if (cleaned.length > 4) {
      formatted = formatted.slice(0, 5) + '/' + cleaned.slice(4, 8);
    }
    setDob(formatted);

    if (cleaned.length === 8) {
      const month = parseInt(cleaned.slice(0, 2), 10) - 1;
      const day = parseInt(cleaned.slice(2, 4), 10);
      const year = parseInt(cleaned.slice(4, 8), 10);
      const newDate = new Date(year, month, day);
      if (!isNaN(newDate.getTime())) {
        setDate(newDate);
      }
    }
  };

  const handlePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      const yyyy = selectedDate.getFullYear();
      setDob(`${mm}/${dd}/${yyyy}`);
    }
  };

  const handleCompleteProfile = async () => {
    if (!termsAccepted) {
      Alert.alert('Terms', 'Please agree to the Terms of Service');
      return;
    }
    if (!fullName.trim()) {
      Alert.alert('Required', 'Please enter your full name');
      return;
    }

    const userId = verifiedUser?.id || user?.id;
    if (!userId) {
      Alert.alert('Error', 'No authenticated user found. Please start over.');
      setStep('phone');
      return;
    }

    setLoading(true);
    const success = await updateProfile(userId, {
      fullName,
      currency,
      language,
      dob,
      avatar: 'happy' // Set default avatar during registration
    });
    setLoading(false);

    if (success) {
      await refreshAuth();
      router.replace('/');
    } else {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const renderPickerModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    data: { code: string; name: string }[],
    selectedValue: string,
    onSelect: (code: string) => void
  ) => (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={{ backgroundColor: '#1e1b4b', borderRadius: 20, width: width - 48, maxHeight: 400, overflow: 'hidden' }}>
          <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' }}>{title}</Text>
          </View>
          <FlatList
            data={data}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  onSelect(item.code);
                  onClose();
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  backgroundColor: selectedValue === item.code ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                }}
              >
                <Text style={{ color: selectedValue === item.code ? '#10b981' : '#fff', fontSize: 16 }}>
                  {item.code} - {item.name}
                </Text>
                {selectedValue === item.code && <Check size={20} color="#10b981" />}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.05)' }} />}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Get step title and subtitle
  const getStepInfo = () => {
    switch (step) {
      case 'phone':
        return { title: 'Create Account', subtitle: 'Enter your phone number to get started' };
      case 'otp':
        return { title: 'Verify Phone', subtitle: 'Enter the 6-digit code we sent you' };
      case 'profile':
        return { title: 'Complete Profile', subtitle: 'Personalize your experience' };
    }
  };

  const stepInfo = getStepInfo();

  return (
    <LinearGradient
      colors={['#0f172a', '#2e1065', '#020617']}
      locations={[0, 0.4, 1]}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 32 }}>

          {/* Header */}
          <View style={{ marginTop: 20, marginBottom: 40, alignItems: 'center' }}>
            <View style={{ width: 64, height: 64, backgroundColor: '#10b981', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 24, shadowColor: '#10b981', shadowOpacity: 0.4, shadowRadius: 20 }}>
              <Mic size={32} color="#020617" strokeWidth={2.5} />
            </View>
            <Text style={{ fontSize: 32, fontWeight: '700', color: '#fff', marginBottom: 8, textAlign: 'center' }}>{stepInfo.title}</Text>
            <Text style={{ fontSize: 16, color: '#94a3b8', textAlign: 'center' }}>{stepInfo.subtitle}</Text>

            {/* Step indicator */}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 32, width: '100%' }}>
              {['phone', 'otp', 'profile'].map((s, i) => (
                <View
                  key={s}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: ['phone', 'otp', 'profile'].indexOf(step) >= i ? '#10b981' : 'rgba(255,255,255,0.1)'
                  }}
                />
              ))}
            </View>
          </View>

          {/* Step: Phone */}
          {step === 'phone' && (
            <View style={{ gap: 24 }}>
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
              </View>

              <TouchableOpacity
                onPress={handleSendOTP}
                disabled={loading}
                style={{ backgroundColor: '#10b981', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 20 }}
              >
                {loading ? <ActivityIndicator color="#020617" /> : <Text style={{ color: '#020617', fontSize: 16, fontWeight: '700' }}>Send OTP</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* Step: OTP */}
          {step === 'otp' && (
            <View style={{ gap: 24 }}>
              <View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, marginLeft: 4 }}>Enter Code</Text>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', height: 56, justifyContent: 'center', paddingHorizontal: 16 }}>
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
              </View>

              <TouchableOpacity
                onPress={handleVerifyOTP}
                disabled={loading}
                style={{ backgroundColor: '#10b981', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 20 }}
              >
                {loading ? <ActivityIndicator color="#020617" /> : <Text style={{ color: '#020617', fontSize: 16, fontWeight: '700' }}>Verify</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setStep('phone')} style={{ alignItems: 'center' }}>
                <Text style={{ color: '#94a3b8' }}>Change Phone Number</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step: Profile */}
          {step === 'profile' && (
            <View style={{ gap: 24 }}>
              {/* Full Name */}
              <View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, marginLeft: 4 }}>Full Name</Text>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', height: 56, justifyContent: 'center', paddingHorizontal: 16 }}>
                  <TextInput
                    style={{ color: '#fff', fontSize: 16, height: '100%' }}
                    placeholder="Alex Rivera"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>
              </View>

              {/* DOB */}
              <View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, marginLeft: 4 }}>Date of Birth</Text>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', height: 56, justifyContent: 'center', paddingHorizontal: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <TextInput
                      style={{ color: '#fff', fontSize: 16, height: '100%', flex: 1 }}
                      placeholder="MM / DD / YYYY"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      value={dob}
                      onChangeText={handleDateChange}
                      maxLength={10}
                      keyboardType="numeric"
                    />
                    <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                      <Calendar size={20} color="#94a3b8" />
                    </TouchableOpacity>
                  </View>
                </View>
                {showDatePicker && (
                  <RNDateTimePicker
                    value={date}
                    textColor="#fff"
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handlePickerChange}
                    maximumDate={new Date()}
                  />
                )}
              </View>

              {/* Currency Dropdown */}
              <View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, marginLeft: 4 }}>Default Currency</Text>
                <TouchableOpacity
                  onPress={() => setShowCurrencyPicker(true)}
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', height: 56, justifyContent: 'center', paddingHorizontal: 16 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#fff', fontSize: 16 }}>{currency} - {supportedCurrencies.find(c => c.code === currency)?.name || 'Default'}</Text>
                    <ChevronDown size={20} color="#94a3b8" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Language Dropdown */}
              <View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, marginLeft: 4 }}>Preferred Language</Text>
                <TouchableOpacity
                  onPress={() => setShowLanguagePicker(true)}
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', height: 56, justifyContent: 'center', paddingHorizontal: 16 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#fff', fontSize: 16 }}>{languageOptions.find(l => l.code === language)?.name || 'English'}</Text>
                    <ChevronDown size={20} color="#94a3b8" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Terms */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 8, gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setTermsAccepted(!termsAccepted)}
                  style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: termsAccepted ? '#10b981' : 'rgba(255,255,255,0.3)', backgroundColor: termsAccepted ? '#10b981' : 'transparent', alignItems: 'center', justifyContent: 'center' }}
                >
                  {termsAccepted && <Text style={{ color: '#020617', fontWeight: 'bold' }}>✓</Text>}
                </TouchableOpacity>
                <Text style={{ color: '#94a3b8', fontSize: 14, flex: 1, lineHeight: 20 }}>
                  I agree to the <Text style={{ color: '#10b981' }}>Terms of Service</Text> and <Text style={{ color: '#10b981' }}>Privacy Policy</Text>
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleCompleteProfile}
                disabled={loading}
                style={{ marginTop: 16, backgroundColor: '#10b981', height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 20 }}
              >
                {loading ? <ActivityIndicator color="#020617" /> : <Text style={{ color: '#020617', fontSize: 18, fontWeight: '700' }}>Complete Signup</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* Login link */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32, marginBottom: 40 }}>
            <Text style={{ color: '#6b7280' }}>Already have an account? </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text style={{ color: '#10b981', fontWeight: '600' }}>Log In</Text>
              </TouchableOpacity>
            </Link>
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

      {/* Currency Picker Modal */}
      {renderPickerModal(
        showCurrencyPicker,
        () => setShowCurrencyPicker(false),
        'Select Currency',
        supportedCurrencies,
        currency,
        setCurrency
      )}

      {/* Language Picker Modal */}
      {renderPickerModal(
        showLanguagePicker,
        () => setShowLanguagePicker(false),
        'Select Language',
        languageOptions,
        language,
        setLanguage
      )}
    </LinearGradient>
  );
};

export default Signup;
