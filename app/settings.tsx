
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { router } from 'expo-router';
import { db } from '../services/supabaseService';
import { mlService } from '../services/mlService';
import { getCurrentUser, updateProfile } from '../services/authService';
import { useAppContext } from '../contexts/AppContext';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Globe, DollarSign, LogOut, ChevronRight, Cloud, WifiOff, LayoutGrid, Brain, Edit3 } from 'lucide-react-native';
import SelectionModal from '../components/SelectionModal';
import ProfileEditModal, { getAvatarById } from '../components/ProfileEditModal';
import { useAuth } from '@/contexts/AuthContext';

const Settings: React.FC = () => {
  const { currency, language, updateSettings, supportedLanguages, supportedCurrencies } = useAppContext();
  const { user, logout, refreshAuth } = useAuth();
  const isCloudEnabled = db.isConnected();
  const [mlDataConsent, setMlDataConsent] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'currency' | 'language'>('currency');

  // Profile edit modal
  const [showProfileModal, setShowProfileModal] = useState(false);

  const currencies = supportedCurrencies.length > 0 ? supportedCurrencies.map(c => ({
    label: c.name,
    value: c.code,
    subLabel: c.symbol,
    icon: c.icon
  })) : [
    { label: 'US Dollar', value: 'USD', subLabel: '$', icon: '🇺🇸' }
  ];

  const languages = supportedLanguages.length > 0 ? supportedLanguages.map(l => ({
    label: l.name,
    value: l.code,
    subLabel: l.name,
    icon: l.icon
  })) : [
    { label: 'English', value: 'en', subLabel: 'English', icon: '🇺🇸' }
  ];

  const handleOpenModal = (type: 'currency' | 'language') => {
    setModalType(type);
    setModalVisible(true);
  };

  const handleSelect = (value: string) => {
    updateSettings(modalType, value);
  };

  const getCurrentLabel = (type: 'currency' | 'language') => {
    const list = type === 'currency' ? currencies : languages;
    const val = type === 'currency' ? currency : language;
    return list.find(i => i.value === val)?.label || val;
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (e) {
      console.error("Logout failed:", e);
      router.replace('/login');
    }
  };

  // Load ML consent preference
  useEffect(() => {
    const loadMLPreferences = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser?.id) {
        const prefs = await mlService.getUserMLPreferences(currentUser.id);
        if (prefs) {
          setMlDataConsent(prefs.data_collection_consent !== false);
        } else {
          setMlDataConsent(true);
        }
      }
    };
    loadMLPreferences();
  }, []);

  const handleMLConsentToggle = async (value: boolean) => {
    setMlDataConsent(value);
    const currentUser = await getCurrentUser();
    if (currentUser?.id) {
      await mlService.updateMLConsent(currentUser.id, value);
    }
  };

  const handleSaveProfile = async (data: { fullName: string; dob: string; avatar: string }) => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found');
      return false;
    }

    try {
      const success = await updateProfile(user.id, {
        fullName: data.fullName,
        dob: data.dob || undefined,
        avatar: data.avatar || undefined,
      });

      if (success) {
        await refreshAuth();
        Alert.alert('Success', 'Profile updated successfully');
        return true;
      } else {
        Alert.alert('Error', 'Failed to update profile');
        return false;
      }
    } catch (err) {
      console.error('Save profile error:', err);
      Alert.alert('Error', 'Failed to update profile');
      return false;
    }
  };

  // Get user's current avatar
  const currentAvatar = getAvatarById(user?.avatar || 'happy');
  const AvatarComponent = currentAvatar.component;

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0E14' }}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['rgba(16, 185, 129, 0.05)', 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 400 }}
      />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)' }}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '600', textAlign: 'center', color: '#fff', letterSpacing: 0.5 }}>Settings</Text>
        <View style={{ width: 40 }}></View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 24 }}>

        {/* Profile Card */}
        <View style={{ marginTop: 24, alignItems: 'center' }}>
          {/* Avatar with Edit Button */}
          <TouchableOpacity
            onPress={() => setShowProfileModal(true)}
            style={{ position: 'relative' }}
          >
            <View style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              borderWidth: 3,
              borderColor: currentAvatar.color,
              backgroundColor: `${currentAvatar.color}15`,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: currentAvatar.color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 20,
            }}>
              <AvatarComponent size={70} color={currentAvatar.color} />
            </View>
            <View style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: '#10b981',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 3,
              borderColor: '#0B0E14'
            }}>
              <Edit3 size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Name */}
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff', marginTop: 16 }}>
            {user?.full_name || 'Set your name'}
          </Text>

          <Text style={{ fontSize: 14, color: '#9ca3af', marginTop: 4 }}>
            {user?.phone || user?.email || 'No contact info'}
          </Text>

          {/* Edit Profile Button */}
          <TouchableOpacity
            onPress={() => setShowProfileModal(true)}
            style={{
              marginTop: 16,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 100,
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              borderWidth: 1,
              borderColor: 'rgba(16, 185, 129, 0.3)',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Edit3 size={16} color="#10b981" />
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#10b981' }}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Sections */}
        <View style={{ gap: 24 }}>

          {/* General */}
          <View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, paddingLeft: 4 }}>General</Text>
            <View style={{ backgroundColor: '#151b26', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>

              {/* Language */}
              <TouchableOpacity onPress={() => handleOpenModal('language')} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(56, 189, 248, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <Globe size={20} color="#38bdf8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#fff' }}>App Language</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 14, color: '#64748b' }}>{getCurrentLabel('language')}</Text>
                  <ChevronRight size={18} color="#475569" />
                </View>
              </TouchableOpacity>

              {/* Currency */}
              <TouchableOpacity onPress={() => handleOpenModal('currency')} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <DollarSign size={20} color="#34d399" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#fff' }}>Currency</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 14, color: '#64748b' }}>{getCurrentLabel('currency')}</Text>
                  <ChevronRight size={18} color="#475569" />
                </View>
              </TouchableOpacity>

              {/* Categories */}
              <TouchableOpacity onPress={() => router.push('/categories')} style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(168, 85, 247, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <LayoutGrid size={20} color="#a855f7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#fff' }}>Manage Categories</Text>
                </View>
                <ChevronRight size={18} color="#475569" />
              </TouchableOpacity>

            </View>
          </View>

          {/* Data */}
          <View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, paddingLeft: 4 }}>Data</Text>
            <View style={{ backgroundColor: '#151b26', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: isCloudEnabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  {isCloudEnabled ? <Cloud size={20} color="#34d399" /> : <WifiOff size={20} color="#f59e0b" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#fff' }}>Cloud Sync</Text>
                  <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{isCloudEnabled ? 'Active • Last synced 2m ago' : 'Offline • Saving to device'}</Text>
                </View>
                {isCloudEnabled && (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' }} />
                )}
              </View>

              {/* ML Data Collection */}
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(139, 92, 246, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <Brain size={20} color="#8b5cf6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#fff' }}>Help Improve Accuracy</Text>
                  <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Allow anonymous data collection for ML training</Text>
                </View>
                <Switch
                  value={mlDataConsent}
                  onValueChange={handleMLConsentToggle}
                  trackColor={{ false: '#374151', true: '#8b5cf6' }}
                  thumbColor={mlDataConsent ? '#a78bfa' : '#9ca3af'}
                />
              </View>
            </View>
          </View>

          {/* Logout */}
          <TouchableOpacity
            onPress={handleLogout}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)', marginBottom: 32 }}
          >
            <LogOut size={20} color="#f87171" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#f87171' }}>Log Out</Text>
          </TouchableOpacity>

          <Text style={{ textAlign: 'center', color: '#334155', fontSize: 12, marginTop: -16 }}>EchoSpend v2.4.0 (Build 394)</Text>
        </View>

      </ScrollView>

      {/* Currency/Language Modal */}
      <SelectionModal
        visible={modalVisible}
        title={modalType === 'currency' ? 'Select Currency' : 'Select Language'}
        options={modalType === 'currency' ? currencies : languages}
        selectedValue={modalType === 'currency' ? currency : language}
        onClose={() => setModalVisible(false)}
        onSelect={handleSelect}
      />

      {/* Profile Edit Modal */}
      <ProfileEditModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSave={handleSaveProfile}
        initialData={{
          fullName: user?.full_name,
          dob: user?.date_of_birth,
          avatar: user?.avatar,
          phone: user?.phone,
          email: user?.email,
        }}
      />

    </View>
  );
};

export default Settings;
