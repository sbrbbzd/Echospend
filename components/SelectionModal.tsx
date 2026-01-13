import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Platform, KeyboardAvoidingView, TextInput } from 'react-native';
import { X, Check, Search } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { getCategoryIcon } from '../app/utils/categoryIcons';

interface Option {
    label: string;
    value: string;
    subLabel?: string;
    icon?: string;
    color?: string;
}

interface SelectionModalProps {
    visible: boolean;
    title: string;
    options: Option[];
    selectedValue: string;
    onClose: () => void;
    onSelect: (value: string) => void;
}

const SelectionModal: React.FC<SelectionModalProps> = ({ visible, title, options, selectedValue, onClose, onSelect }) => {
    const [searchQuery, setSearchQuery] = React.useState('');

    // Filter options based on search query
    const filteredOptions = React.useMemo(() => {
        if (!searchQuery) return options;
        const query = searchQuery.toLowerCase();
        return options.filter(option =>
            option.label.toLowerCase().includes(query) ||
            (option.subLabel && option.subLabel.toLowerCase().includes(query)) ||
            (option.value && option.value.toLowerCase().includes(query))
        );
    }, [options, searchQuery]);

    // Reset search when modal opens/closes
    React.useEffect(() => {
        if (!visible) {
            setSearchQuery('');
        }
    }, [visible]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                {/* Backdrop */}
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={onClose}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' }}
                />

                <View style={{ backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', overflow: 'hidden', paddingBottom: 40, maxHeight: '80%' }}>

                    {/* Header */}
                    <View style={{ paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff' }}>{title}</Text>
                            <TouchableOpacity onPress={onClose} style={{ padding: 4, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)' }}>
                                <X size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        {/* Search Input */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
                            <Search size={18} color="#94a3b8" style={{ marginRight: 8 }} />
                            <TextInput
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholder="Search..."
                                placeholderTextColor="#64748b"
                                style={{ flex: 1, color: '#fff', fontSize: 16, padding: 0 }}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <X size={16} color="#64748b" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
                        {filteredOptions.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                onPress={() => {
                                    onSelect(option.value);
                                    onClose();
                                }}
                                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, marginBottom: 8, borderRadius: 16, backgroundColor: selectedValue === option.value ? 'rgba(52, 211, 153, 0.1)' : 'transparent', borderWidth: 1, borderColor: selectedValue === option.value ? '#10b981' : 'rgba(255,255,255,0.05)' }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    {option.icon && (
                                        <View>
                                            {getCategoryIcon(option.icon, 24, option.color || (selectedValue === option.value ? '#34d399' : '#9ca3af'))}
                                        </View>
                                    )}
                                    <View>
                                        <Text style={{ fontSize: 16, fontWeight: '600', color: selectedValue === option.value ? '#34d399' : '#f3f4f6' }}>{option.label}</Text>
                                        {option.subLabel && <Text style={{ fontSize: 12, color: '#9ca3af' }}>{option.subLabel}</Text>}
                                    </View>
                                </View>

                                {selectedValue === option.value && (
                                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center' }}>
                                        <Check size={16} color="#fff" strokeWidth={3} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                </View>
            </View>
        </Modal>
    );
};

export default SelectionModal;
