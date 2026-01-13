
import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppContext } from '@/contexts/AppContext';
import { LinearGradient } from 'expo-linear-gradient';
import { getCategoryIcon } from './utils/categoryIcons';
import { ChevronLeft, Plus, Search, ChevronRight, Pencil, Trash2 } from 'lucide-react-native';

const CategoriesPage: React.FC = () => {
    const router = useRouter();
    const { categories, expenses, currency, deleteCategory, formatAmount } = useAppContext();
    const [searchQuery, setSearchQuery] = useState('');

    const handleDelete = (cat: any) => {
        Alert.alert(
            "Delete Category",
            `Are you sure? All expenses in "${cat.name}" will be moved to 'Other'.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await deleteCategory(cat);
                    }
                }
            ]
        );
    };

    // Calculate aggregation for all categories
    const categoryStats = useMemo(() => {
        const stats: Record<string, { count: number; total: number }> = {};

        // Initialize stats for ALL available categories (even if 0 spend)
        categories.forEach(cat => {
            stats[cat.name] = { count: 0, total: 0 };
        });

        expenses.forEach(expense => {
            // Normalize category name match (case sensitive? usually db is exact)
            const catName = expense.category;
            if (!stats[catName]) {
                // If expense has a category not in our list (maybe legacy?), add it
                stats[catName] = { count: 0, total: 0 };
            }
            stats[catName].count += 1;
            stats[catName].total += expense.amount;
        });

        return stats;
    }, [categories, expenses]);

    const filteredCategories = useMemo(() => {
        const result = categories.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Move "Other" to the end
        const otherIndex = result.findIndex(c => c.name === 'Other');
        if (otherIndex > -1) {
            const other = result.splice(otherIndex, 1)[0];
            result.push(other);
        }

        return result;
    }, [categories, searchQuery]);

    return (
        <LinearGradient
            colors={['#0f172a', '#2e1065', '#020617']}
            locations={[0, 0.4, 1]}
            style={styles.container}
        >
            {/* Search Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
                    <ChevronLeft size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { flex: 1 }]}>Categories</Text>
                <TouchableOpacity
                    onPress={() => router.push('/new-category')}
                    style={styles.addButton}
                >
                    <Plus size={24} color="#10b981" />
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <Search size={20} color="#64748b" style={{ marginRight: 10 }} />
                <TextInput
                    placeholder="Search categories"
                    placeholderTextColor="#64748b"
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
                <View style={{ gap: 12 }}>
                    {filteredCategories.map((cat) => {
                        const stat = categoryStats[cat.name] || { count: 0, total: 0 };
                        const isProtected = cat.name === 'Other';

                        return (
                            <LinearGradient
                                key={cat.id}
                                colors={['#1e293b', '#0f172a']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[styles.card, { borderWidth: 1, borderColor: '#1e293b', borderRadius: 24 }]}
                            >
                                <TouchableOpacity
                                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                                    onPress={() => router.push({
                                        pathname: '/category-expenses',
                                        params: { category: cat.name }
                                    })}
                                >
                                    <View style={[styles.iconContainer, { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 16 }]}>
                                        {getCategoryIcon(cat.name, 24, cat.color)}
                                    </View>

                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.categoryName}>{cat.name}</Text>
                                        <Text style={styles.transactionCount}>{stat.count} transactions</Text>
                                    </View>

                                    <View style={{ alignItems: 'flex-end', marginRight: 12 }}>
                                        <Text style={styles.amount}>
                                            {formatAmount(stat.total)}
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                {!isProtected && (
                                    <View style={{ flexDirection: 'row', borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.1)', paddingLeft: 8 }}>
                                        <TouchableOpacity
                                            onPress={() => router.push({
                                                pathname: '/edit-category',
                                                params: {
                                                    id: cat.id,
                                                    name: cat.name,
                                                    icon: cat.icon,
                                                    color: cat.color,
                                                    isDefault: String(!!cat.isDefault)
                                                }
                                            })}
                                            style={{ padding: 8 }}
                                        >
                                            <Pencil size={18} color="#64748b" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => handleDelete(cat)}
                                            style={{ padding: 8 }}
                                        >
                                            <Trash2 size={18} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                                {isProtected && (
                                    <View style={{ width: 40, alignItems: 'center' }}>
                                        {/* Placeholder or Lock icon */}
                                    </View>
                                )}
                            </LinearGradient>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Floating Add Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    onPress={() => router.push('/new-category')}
                    style={styles.footerButton}
                >
                    <Plus size={24} color="#000" />
                    <Text style={styles.footerButtonText}>Add New Category</Text>
                </TouchableOpacity>
            </View>

        </LinearGradient>
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
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#151b26',
        marginHorizontal: 20,
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 50,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        letterSpacing: 0,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        // backgroundColor: '#151b26', // Replaced by LinearGradient
        // borderRadius: 20, // Overridden inline
        padding: 16,
        // borderWidth: 1, // Overridden inline
        // borderColor: 'rgba(255,255,255,0.05)', // Overridden inline
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    categoryName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    transactionCount: {
        fontSize: 13,
        color: '#64748b',
    },
    amount: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginRight: 8,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
    },
    footerButton: {
        backgroundColor: '#10b981',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 56,
        borderRadius: 28,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    footerButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 8,
    }
});

export default CategoriesPage;
