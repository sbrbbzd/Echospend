
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppContext } from '../contexts/AppContext';
import { ChevronLeft, Trash2, ArrowUp } from 'lucide-react-native';
import { getCategoryIcon, availableIcons } from './utils/categoryIcons';

// Predefined palette
const COLORS = [
    '#10b981', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#ef4444',
    '#f97316', '#eab308', '#06b6d4', '#14b8a6', '#64748b', '#ffffff',
];

const EditCategoryPage: React.FC = () => {
    const router = useRouter();
    const { updateCategory, deleteCategory } = useAppContext();
    const params = useLocalSearchParams<{ id: string, name: string, icon: string, color: string, isDefault: string }>();

    const [name, setName] = useState(params.name || '');
    const [selectedColor, setSelectedColor] = useState(params.color || COLORS[0]);
    const [selectedIcon, setSelectedIcon] = useState(params.icon || 'Car');

    const handleUpdate = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a category name');
            return;
        }

        await updateCategory({
            id: params.id,
            name: params.name, // Pass original name for tracking changes/expenses update
            icon: params.icon,
            color: params.color,
            isDefault: params.isDefault === 'true'
        }, {
            name: name.trim(),
            color: selectedColor,
            icon: selectedIcon
        });

        router.back();
    };

    const handleDelete = () => {
        Alert.alert(
            "Delete Category",
            `Are you sure you want to delete "${params.name}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await deleteCategory({
                            id: params.id,
                            name: params.name,
                            icon: params.icon,
                            color: params.color,
                            isDefault: params.isDefault === 'true'
                        });
                        router.back();
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.navText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Category</Text>
                <TouchableOpacity onPress={handleUpdate}>
                    <Text style={[styles.navText, { color: '#10b981', fontWeight: '700' }]}>Save</Text>
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
                    placeholder="Name"
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
                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>SELECT ICON</Text>
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

                <View style={{ height: 40 }} />

                <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                    <Trash2 size={20} color="#ef4444" />
                    <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 16 }}>Delete Category</Text>
                </TouchableOpacity>

                <View style={{ height: 100 }} />
            </ScrollView>
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
        width: '22%',
        aspectRatio: 1,
        borderRadius: 12,
        backgroundColor: '#0f131a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)'
    }
});

export default EditCategoryPage;
