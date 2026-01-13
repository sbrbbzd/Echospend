
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppContext } from '../contexts/AppContext';
import { ChevronLeft, Plus } from 'lucide-react-native';
import { getCategoryIcon, availableIcons } from './utils/categoryIcons';

// Predefined palette from screenshot (approximate)
const COLORS = [
    '#10b981', // green
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#a855f7', // purple
    '#ec4899', // pink
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#06b6d4', // cyan
    '#14b8a6', // teal
    '#64748b', // slate
    '#ffffff', // white
];

const NewCategoryPage: React.FC = () => {
    const router = useRouter();
    const { addCategory } = useAppContext();

    const [name, setName] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    const [selectedIcon, setSelectedIcon] = useState('Car'); // default

    const handleCreate = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a category name');
            return;
        }

        const result = await addCategory({
            name: name.trim(),
            color: selectedColor,
            icon: selectedIcon
        });

        if (result) {
            router.back();
        } else {
            Alert.alert('Error', 'Failed to save category');
        }
    };

    return (
        <View style={styles.container}>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.navText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Category</Text>
                <TouchableOpacity onPress={handleCreate}>
                    <Text style={[styles.navText, { color: '#10b981', fontWeight: '700' }]}>Done</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20 }}>

                {/* Preview */}
                <View style={styles.previewContainer}>
                    <View style={[styles.previewIcon, { backgroundColor: '#151b26' }]}>
                        {getCategoryIcon(selectedIcon, 32, selectedColor)}
                    </View>
                    <Text style={styles.previewLabel}>APPEARANCE PREVIEW</Text>
                </View>

                {/* Name Input */}
                <TextInput
                    placeholder="Name  e.g. Transport"
                    placeholderTextColor="#64748b"
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                />

                {/* Color Picker */}
                <Text style={styles.sectionTitle}>THEME COLOR</Text>
                <View style={styles.colorGrid}>
                    {COLORS.map(color => (
                        <TouchableOpacity
                            key={color}
                            style={[
                                styles.colorCircle,
                                { backgroundColor: color },
                                selectedColor === color && styles.colorSelected
                            ]}
                            onPress={() => setSelectedColor(color)}
                        >
                            {selectedColor === color && <View style={styles.innerDot} />}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Icon Picker */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 }}>
                    <Text style={styles.sectionTitle}>SELECT ICON</Text>
                    <View style={styles.toggleContainer}>
                        <Text style={[styles.toggleText, { color: '#10b981' }]}>SYMBOLS</Text>
                        {/* EMOJIS unimplemented for now */}
                    </View>
                </View>

                <View style={styles.iconGrid}>
                    {availableIcons.map(icon => (
                        <TouchableOpacity
                            key={icon}
                            style={[
                                styles.iconTile,
                                selectedIcon === icon && { backgroundColor: selectedColor, borderColor: selectedColor }
                            ]}
                            onPress={() => setSelectedIcon(icon)}
                        >
                            {getCategoryIcon(icon, 24, selectedIcon === icon ? '#000' : '#64748b')}
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Floating Create Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    onPress={handleCreate}
                    style={styles.footerButton}
                >
                    <Text style={styles.footerButtonText}>Create Category</Text>
                    <Plus size={20} color="#000" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0B0E14',
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    navText: {
        fontSize: 16,
        color: '#10b981',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    previewContainer: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 10,
    },
    previewIcon: {
        width: 80,
        height: 80,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    previewLabel: {
        marginTop: 12,
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
        letterSpacing: 1,
    },
    input: {
        backgroundColor: '#151b26',
        borderRadius: 16,
        padding: 16,
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748b',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        padding: 16,
        backgroundColor: '#151b26',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    colorCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorSelected: {
        borderWidth: 2,
        borderColor: '#fff',
        transform: [{ scale: 1.1 }],
    },
    innerDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#151b26',
        borderRadius: 8,
        padding: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    toggleText: {
        fontSize: 12,
        fontWeight: '700',
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    iconGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        padding: 16,
        backgroundColor: '#151b26',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'space-between',
    },
    iconTile: {
        width: '22%', // approx 4 per row
        aspectRatio: 1,
        borderRadius: 12,
        backgroundColor: '#0f131a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
    },
    footerButton: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 56,
        borderRadius: 28,
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    footerButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
    }
});

export default NewCategoryPage;
