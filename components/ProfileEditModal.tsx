import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
    TextInput,
    Dimensions,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { X, Check, User, Phone, Calendar, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Path, Circle, Rect, G, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

// Custom Profile Avatar Components - Fun & Enjoyable style
const AvatarIcons = {
    // Friendly faces with various expressions
    happy: ({ size = 48, color = '#10b981' }: { size?: number; color?: string }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r="45" fill={color} opacity="0.15" />
            <Circle cx="50" cy="50" r="40" fill={color} opacity="0.3" />
            <Circle cx="35" cy="42" r="5" fill={color} />
            <Circle cx="65" cy="42" r="5" fill={color} />
            <Path d="M35 60 Q50 75 65 60" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
        </Svg>
    ),
    cool: ({ size = 48, color = '#8b5cf6' }: { size?: number; color?: string }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r="45" fill={color} opacity="0.15" />
            <Circle cx="50" cy="50" r="40" fill={color} opacity="0.3" />
            <Rect x="25" y="38" width="22" height="10" rx="5" fill={color} />
            <Rect x="53" y="38" width="22" height="10" rx="5" fill={color} />
            <Path d="M35 62 Q50 72 65 62" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
        </Svg>
    ),
    wink: ({ size = 48, color = '#f59e0b' }: { size?: number; color?: string }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r="45" fill={color} opacity="0.15" />
            <Circle cx="50" cy="50" r="40" fill={color} opacity="0.3" />
            <Circle cx="35" cy="42" r="5" fill={color} />
            <Path d="M60 42 L70 42" stroke={color} strokeWidth="4" strokeLinecap="round" />
            <Path d="M35 60 Q50 75 65 60" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
        </Svg>
    ),
    love: ({ size = 48, color = '#ec4899' }: { size?: number; color?: string }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r="45" fill={color} opacity="0.15" />
            <Circle cx="50" cy="50" r="40" fill={color} opacity="0.3" />
            <Path d="M30 42 L35 37 L40 42 L35 47 Z" fill={color} />
            <Path d="M60 42 L65 37 L70 42 L65 47 Z" fill={color} />
            <Path d="M35 60 Q50 75 65 60" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
        </Svg>
    ),
    star: ({ size = 48, color = '#eab308' }: { size?: number; color?: string }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r="45" fill={color} opacity="0.15" />
            <Path d="M50 15 L58 40 L85 40 L63 55 L72 80 L50 65 L28 80 L37 55 L15 40 L42 40 Z" fill={color} opacity="0.5" />
            <Circle cx="38" cy="50" r="4" fill={color} />
            <Circle cx="62" cy="50" r="4" fill={color} />
            <Path d="M42 62 Q50 68 58 62" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
        </Svg>
    ),
    ninja: ({ size = 48, color = '#374151' }: { size?: number; color?: string }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r="45" fill={color} opacity="0.15" />
            <Circle cx="50" cy="50" r="40" fill={color} opacity="0.3" />
            <Rect x="20" y="38" width="60" height="14" rx="7" fill={color} opacity="0.7" />
            <Circle cx="35" cy="45" r="4" fill="#fff" />
            <Circle cx="65" cy="45" r="4" fill="#fff" />
        </Svg>
    ),
    wizard: ({ size = 48, color = '#6366f1' }: { size?: number; color?: string }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx="50" cy="55" r="40" fill={color} opacity="0.15" />
            <Path d="M50 5 L60 35 L40 35 Z" fill={color} opacity="0.4" />
            <Circle cx="50" cy="20" r="4" fill={color} />
            <Circle cx="35" cy="52" r="5" fill={color} />
            <Circle cx="65" cy="52" r="5" fill={color} />
            <Path d="M35 68 Q50 80 65 68" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
        </Svg>
    ),
    robot: ({ size = 48, color = '#06b6d4' }: { size?: number; color?: string }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            <Rect x="20" y="25" width="60" height="55" rx="10" fill={color} opacity="0.2" />
            <Rect x="25" y="30" width="50" height="45" rx="8" fill={color} opacity="0.3" />
            <Circle cx="37" cy="48" r="8" fill={color} />
            <Circle cx="63" cy="48" r="8" fill={color} />
            <Circle cx="37" cy="48" r="4" fill="#fff" />
            <Circle cx="63" cy="48" r="4" fill="#fff" />
            <Rect x="40" y="62" width="20" height="6" rx="3" fill={color} />
            <Rect x="45" y="15" width="10" height="12" rx="5" fill={color} opacity="0.5" />
        </Svg>
    ),
    alien: ({ size = 48, color = '#22c55e' }: { size?: number; color?: string }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            <Path d="M50 10 Q15 35 25 70 Q35 85 50 85 Q65 85 75 70 Q85 35 50 10" fill={color} opacity="0.2" />
            <Path d="M30 45 Q35 35 45 45 Q35 50 30 45" fill={color} />
            <Path d="M55 45 Q65 35 70 45 Q65 50 55 45" fill={color} />
            <Path d="M45 65 Q50 70 55 65" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
        </Svg>
    ),
    cat: ({ size = 48, color = '#fb923c' }: { size?: number; color?: string }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx="50" cy="55" r="38" fill={color} opacity="0.15" />
            <Path d="M20 45 L30 20 L40 40" fill={color} opacity="0.4" />
            <Path d="M80 45 L70 20 L60 40" fill={color} opacity="0.4" />
            <Circle cx="50" cy="55" r="32" fill={color} opacity="0.2" />
            <Circle cx="38" cy="50" r="5" fill={color} />
            <Circle cx="62" cy="50" r="5" fill={color} />
            <Circle cx="50" cy="60" r="4" fill={color} />
            <Path d="M46 66 Q50 72 54 66" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
        </Svg>
    ),
    dog: ({ size = 48, color = '#a78bfa' }: { size?: number; color?: string }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx="50" cy="55" r="38" fill={color} opacity="0.15" />
            <Path d="M15 50 Q20 25 35 45" fill={color} opacity="0.4" />
            <Path d="M85 50 Q80 25 65 45" fill={color} opacity="0.4" />
            <Circle cx="50" cy="55" r="32" fill={color} opacity="0.2" />
            <Circle cx="38" cy="48" r="5" fill={color} />
            <Circle cx="62" cy="48" r="5" fill={color} />
            <Circle cx="50" cy="58" r="6" fill={color} />
            <Path d="M42 68 Q50 78 58 68" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
        </Svg>
    ),
    panda: ({ size = 48, color = '#374151' }: { size?: number; color?: string }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx="50" cy="55" r="40" fill="#f3f4f6" opacity="0.3" />
            <Circle cx="30" cy="35" r="12" fill={color} opacity="0.5" />
            <Circle cx="70" cy="35" r="12" fill={color} opacity="0.5" />
            <Circle cx="35" cy="48" r="10" fill={color} opacity="0.3" />
            <Circle cx="65" cy="48" r="10" fill={color} opacity="0.3" />
            <Circle cx="35" cy="48" r="4" fill={color} />
            <Circle cx="65" cy="48" r="4" fill={color} />
            <Circle cx="50" cy="60" r="5" fill={color} />
            <Path d="M45 68 Q50 73 55 68" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
        </Svg>
    ),
    fox: ({ size = 48, color = '#f97316' }: { size?: number; color?: string }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            <Path d="M50 85 Q15 70 20 35 L35 50 L50 15 L65 50 L80 35 Q85 70 50 85" fill={color} opacity="0.2" />
            <Circle cx="38" cy="52" r="5" fill={color} />
            <Circle cx="62" cy="52" r="5" fill={color} />
            <Circle cx="50" cy="65" r="4" fill={color} />
            <Path d="M40 72 Q50 80 60 72" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
        </Svg>
    ),
    unicorn: ({ size = 48, color = '#ec4899' }: { size?: number; color?: string }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx="50" cy="58" r="35" fill={color} opacity="0.15" />
            <Path d="M50 5 L55 30 L45 30 Z" fill="#fbbf24" opacity="0.6" />
            <Circle cx="50" cy="58" r="30" fill={color} opacity="0.2" />
            <Circle cx="38" cy="52" r="5" fill={color} />
            <Circle cx="62" cy="52" r="5" fill={color} />
            <Path d="M40 68 Q50 78 60 68" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
            <Path d="M75 45 Q85 50 78 42" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
        </Svg>
    ),
    ghost: ({ size = 48, color = '#94a3b8' }: { size?: number; color?: string }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            <Path d="M25 45 Q25 15 50 15 Q75 15 75 45 L75 80 L65 70 L55 80 L45 70 L35 80 L25 70 Z" fill={color} opacity="0.25" />
            <Circle cx="38" cy="45" r="6" fill={color} />
            <Circle cx="62" cy="45" r="6" fill={color} />
            <Circle cx="50" cy="60" r="5" fill={color} opacity="0.5" />
        </Svg>
    ),
    astronaut: ({ size = 48, color = '#3b82f6' }: { size?: number; color?: string }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r="40" fill={color} opacity="0.1" />
            <Circle cx="50" cy="50" r="32" fill="#fff" opacity="0.15" />
            <Circle cx="50" cy="50" r="25" fill={color} opacity="0.2" />
            <Circle cx="40" cy="45" r="4" fill={color} />
            <Circle cx="60" cy="45" r="4" fill={color} />
            <Path d="M42 58 Q50 65 58 58" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
            <Path d="M75 35 L85 25 L82 35 L88 38" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
        </Svg>
    ),
    superhero: ({ size = 48, color = '#ef4444' }: { size?: number; color?: string }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r="42" fill={color} opacity="0.15" />
            <Rect x="25" y="40" width="50" height="12" rx="6" fill={color} opacity="0.5" />
            <Circle cx="35" cy="46" r="5" fill="#fff" />
            <Circle cx="65" cy="46" r="5" fill="#fff" />
            <Circle cx="35" cy="46" r="2" fill={color} />
            <Circle cx="65" cy="46" r="2" fill={color} />
            <Path d="M40 65 Q50 75 60 65" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
        </Svg>
    ),
    chef: ({ size = 48, color = '#f59e0b' }: { size?: number; color?: string }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx="35" cy="20" r="12" fill="#fff" opacity="0.3" />
            <Circle cx="50" cy="15" r="14" fill="#fff" opacity="0.3" />
            <Circle cx="65" cy="20" r="12" fill="#fff" opacity="0.3" />
            <Circle cx="50" cy="58" r="32" fill={color} opacity="0.15" />
            <Circle cx="38" cy="52" r="5" fill={color} />
            <Circle cx="62" cy="52" r="5" fill={color} />
            <Path d="M40 68 Q50 78 60 68" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
        </Svg>
    ),
};

// Avatar options with icons
export const AVATAR_OPTIONS = [
    { id: 'happy', label: 'Happy', color: '#10b981', component: AvatarIcons.happy },
    { id: 'cool', label: 'Cool', color: '#8b5cf6', component: AvatarIcons.cool },
    { id: 'wink', label: 'Wink', color: '#f59e0b', component: AvatarIcons.wink },
    { id: 'love', label: 'Love', color: '#ec4899', component: AvatarIcons.love },
    { id: 'star', label: 'Star', color: '#eab308', component: AvatarIcons.star },
    { id: 'ninja', label: 'Ninja', color: '#374151', component: AvatarIcons.ninja },
    { id: 'wizard', label: 'Wizard', color: '#6366f1', component: AvatarIcons.wizard },
    { id: 'robot', label: 'Robot', color: '#06b6d4', component: AvatarIcons.robot },
    { id: 'alien', label: 'Alien', color: '#22c55e', component: AvatarIcons.alien },
    { id: 'cat', label: 'Cat', color: '#fb923c', component: AvatarIcons.cat },
    { id: 'dog', label: 'Dog', color: '#a78bfa', component: AvatarIcons.dog },
    { id: 'panda', label: 'Panda', color: '#374151', component: AvatarIcons.panda },
    { id: 'fox', label: 'Fox', color: '#f97316', component: AvatarIcons.fox },
    { id: 'unicorn', label: 'Unicorn', color: '#ec4899', component: AvatarIcons.unicorn },
    { id: 'ghost', label: 'Ghost', color: '#94a3b8', component: AvatarIcons.ghost },
    { id: 'astronaut', label: 'Astronaut', color: '#3b82f6', component: AvatarIcons.astronaut },
    { id: 'superhero', label: 'Superhero', color: '#ef4444', component: AvatarIcons.superhero },
    { id: 'chef', label: 'Chef', color: '#f59e0b', component: AvatarIcons.chef },
];

// Helper to get avatar component by ID
export const getAvatarById = (id: string) => {
    return AVATAR_OPTIONS.find(a => a.id === id) || AVATAR_OPTIONS[0];
};

interface ProfileEditModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (data: { fullName: string; dob: string; avatar: string }) => Promise<boolean>;
    initialData: {
        fullName?: string;
        dob?: string;
        avatar?: string;
        phone?: string;
        email?: string;
    };
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
    visible,
    onClose,
    onSave,
    initialData
}) => {
    const [fullName, setFullName] = useState('');
    const [dob, setDob] = useState('');
    const [avatar, setAvatar] = useState('happy');
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const [saving, setSaving] = useState(false);

    // Initialize form when modal opens
    useEffect(() => {
        if (visible) {
            setFullName(initialData.fullName || '');
            setDob(initialData.dob || '');
            setAvatar(initialData.avatar || 'happy');
        }
    }, [visible, initialData]);

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
    };

    const handleSave = async () => {
        if (!fullName.trim()) {
            Alert.alert('Error', 'Please enter your name');
            return;
        }

        setSaving(true);
        try {
            const success = await onSave({
                fullName: fullName.trim(),
                dob,
                avatar
            });

            if (success) {
                onClose();
            }
        } finally {
            setSaving(false);
        }
    };

    const selectedAvatar = getAvatarById(avatar);
    const AvatarComponent = selectedAvatar.component;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                    {/* Backdrop */}
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={onClose}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)' }}
                    />

                    <View style={{
                        backgroundColor: '#0f172a',
                        borderTopLeftRadius: 28,
                        borderTopRightRadius: 28,
                        maxHeight: '90%',
                        borderTopWidth: 1,
                        borderTopColor: 'rgba(255,255,255,0.1)'
                    }}>
                        {/* Header */}
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingHorizontal: 24,
                            paddingVertical: 20,
                            borderBottomWidth: 1,
                            borderBottomColor: 'rgba(255,255,255,0.05)'
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <View style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 12,
                                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    <User size={20} color="#10b981" />
                                </View>
                                <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff' }}>Edit Profile</Text>
                            </View>
                            <TouchableOpacity
                                onPress={onClose}
                                style={{ padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)' }}
                            >
                                <X size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Avatar Section */}
                            <View style={{ alignItems: 'center', marginBottom: 32 }}>
                                <TouchableOpacity
                                    onPress={() => setShowAvatarPicker(true)}
                                    style={{ position: 'relative' }}
                                >
                                    <View style={{
                                        width: 100,
                                        height: 100,
                                        borderRadius: 50,
                                        backgroundColor: `${selectedAvatar.color}15`,
                                        borderWidth: 3,
                                        borderColor: selectedAvatar.color,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        shadowColor: selectedAvatar.color,
                                        shadowOffset: { width: 0, height: 0 },
                                        shadowOpacity: 0.4,
                                        shadowRadius: 20,
                                    }}>
                                        <AvatarComponent size={70} color={selectedAvatar.color} />
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
                                        borderColor: '#0f172a'
                                    }}>
                                        <Sparkles size={16} color="#fff" />
                                    </View>
                                </TouchableOpacity>
                                <Text style={{
                                    color: '#64748b',
                                    fontSize: 13,
                                    marginTop: 12,
                                    textAlign: 'center'
                                }}>
                                    Tap to change avatar
                                </Text>
                            </View>

                            {/* Form Fields */}
                            <View style={{ gap: 20 }}>
                                {/* Full Name */}
                                <View>
                                    <Text style={{
                                        fontSize: 12,
                                        fontWeight: '700',
                                        color: '#64748b',
                                        textTransform: 'uppercase',
                                        letterSpacing: 1.5,
                                        marginBottom: 8,
                                        marginLeft: 4
                                    }}>
                                        Full Name
                                    </Text>
                                    <View style={{
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        borderRadius: 16,
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingHorizontal: 16
                                    }}>
                                        <User size={20} color="#64748b" style={{ marginRight: 12 }} />
                                        <TextInput
                                            style={{
                                                flex: 1,
                                                color: '#fff',
                                                fontSize: 16,
                                                height: 56,
                                            }}
                                            placeholder="Enter your name"
                                            placeholderTextColor="#475569"
                                            value={fullName}
                                            onChangeText={setFullName}
                                        />
                                    </View>
                                </View>

                                {/* Phone (Read-only) */}
                                {initialData.phone && (
                                    <View>
                                        <Text style={{
                                            fontSize: 12,
                                            fontWeight: '700',
                                            color: '#64748b',
                                            textTransform: 'uppercase',
                                            letterSpacing: 1.5,
                                            marginBottom: 8,
                                            marginLeft: 4
                                        }}>
                                            Phone Number
                                        </Text>
                                        <View style={{
                                            backgroundColor: 'rgba(255,255,255,0.03)',
                                            borderRadius: 16,
                                            borderWidth: 1,
                                            borderColor: 'rgba(255,255,255,0.05)',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingHorizontal: 16,
                                            height: 56
                                        }}>
                                            <Phone size={20} color="#475569" style={{ marginRight: 12 }} />
                                            <Text style={{ color: '#64748b', fontSize: 16 }}>{initialData.phone}</Text>
                                        </View>
                                    </View>
                                )}

                                {/* Date of Birth */}
                                <View>
                                    <Text style={{
                                        fontSize: 12,
                                        fontWeight: '700',
                                        color: '#64748b',
                                        textTransform: 'uppercase',
                                        letterSpacing: 1.5,
                                        marginBottom: 8,
                                        marginLeft: 4
                                    }}>
                                        Date of Birth
                                    </Text>
                                    <View style={{
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        borderRadius: 16,
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingHorizontal: 16
                                    }}>
                                        <Calendar size={20} color="#64748b" style={{ marginRight: 12 }} />
                                        <TextInput
                                            style={{
                                                flex: 1,
                                                color: '#fff',
                                                fontSize: 16,
                                                height: 56,
                                            }}
                                            placeholder="MM/DD/YYYY"
                                            placeholderTextColor="#475569"
                                            value={dob}
                                            onChangeText={handleDateChange}
                                            keyboardType="numeric"
                                            maxLength={10}
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* Save Button */}
                            <TouchableOpacity
                                onPress={handleSave}
                                disabled={saving}
                                style={{
                                    marginTop: 32,
                                    backgroundColor: '#10b981',
                                    height: 56,
                                    borderRadius: 16,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    opacity: saving ? 0.7 : 1,
                                    shadowColor: '#10b981',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 12,
                                }}
                            >
                                {saving ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Save Changes</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* Avatar Picker Modal */}
            <Modal visible={showAvatarPicker} animationType="fade" transparent>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 }}>
                    <View style={{
                        backgroundColor: '#1e293b',
                        borderRadius: 24,
                        overflow: 'hidden',
                        maxHeight: '80%'
                    }}>
                        {/* Header */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: 20,
                            borderBottomWidth: 1,
                            borderBottomColor: 'rgba(255,255,255,0.1)'
                        }}>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff' }}>Choose Your Avatar</Text>
                            <TouchableOpacity onPress={() => setShowAvatarPicker(false)}>
                                <X size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* Avatar Grid */}
                        <ScrollView contentContainerStyle={{ padding: 16 }}>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
                                {AVATAR_OPTIONS.map((option) => {
                                    const Icon = option.component;
                                    const isSelected = avatar === option.id;
                                    return (
                                        <TouchableOpacity
                                            key={option.id}
                                            onPress={() => {
                                                setAvatar(option.id);
                                                setShowAvatarPicker(false);
                                            }}
                                            style={{
                                                width: (width - 80) / 4,
                                                aspectRatio: 1,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                margin: 6,
                                                borderRadius: 16,
                                                backgroundColor: isSelected ? `${option.color}20` : 'rgba(255,255,255,0.05)',
                                                borderWidth: isSelected ? 2 : 1,
                                                borderColor: isSelected ? option.color : 'rgba(255,255,255,0.1)',
                                            }}
                                        >
                                            <Icon size={40} color={option.color} />
                                            {isSelected && (
                                                <View style={{
                                                    position: 'absolute',
                                                    top: 4,
                                                    right: 4,
                                                    width: 18,
                                                    height: 18,
                                                    borderRadius: 9,
                                                    backgroundColor: option.color,
                                                    justifyContent: 'center',
                                                    alignItems: 'center'
                                                }}>
                                                    <Check size={12} color="#fff" strokeWidth={3} />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </Modal>
    );
};

export default ProfileEditModal;
