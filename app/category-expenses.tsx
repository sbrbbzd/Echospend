
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppContext } from '@/contexts/AppContext';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Calendar } from 'lucide-react-native';
import { getCategoryIcon } from './utils/categoryIcons';
import EditExpenseModal from '@/components/EditExpenseModal';

const CategoryExpensesPage: React.FC = () => {
    const router = useRouter();
    const { category } = useLocalSearchParams<{ category: string }>();
    const { expenses, categories, formatAmount, currencySymbol, updateExpense, deleteExpense } = useAppContext();
    const [modalVisible, setModalVisible] = React.useState(false);
    const [editingExpense, setEditingExpense] = React.useState<any>(null);

    const filteredExpenses = useMemo(() => {
        if (!category) return [];
        return expenses.filter(e => e.category === category);
    }, [expenses, category]);

    const totalAmount = useMemo(() => {
        return filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
    }, [filteredExpenses]);

    const categoryColor = useMemo(() => {
        const found = categories.find(c => c.name === category);
        return found ? found.color : '#10b981';
    }, [categories, category]);

    const handleEditExpense = (expense: any) => {
        setEditingExpense(expense);
        setModalVisible(true);
    };

    const handleSaveExpense = async (updatedData: any) => {
        if (editingExpense) {
            await updateExpense({
                ...editingExpense,
                amount: parseFloat(updatedData.amount),
                category: updatedData.category,
                description: updatedData.item || updatedData.description,
            });
        }
        setModalVisible(false);
        setEditingExpense(null);
    };

    const handleDeleteExpense = (expense: any) => {
        Alert.alert(
            "Delete Expense",
            "Are you sure you want to delete this expense?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await deleteExpense(expense.id);
                        setModalVisible(false);
                        setEditingExpense(null);
                    }
                }
            ]
        );
    };

    return (
        <LinearGradient
            colors={['#0f172a', '#2e1065', '#020617']}
            locations={[0, 0.4, 1]}
            style={styles.container}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
                    <ChevronLeft size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{category}</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={[styles.iconContainer, { backgroundColor: `${categoryColor}20` }]}>
                        {getCategoryIcon(category || 'Other', 32, categoryColor)}
                    </View>
                    <View>
                        <Text style={styles.totalLabel}>Total Spent</Text>
                        <Text style={styles.totalAmount}>
                            {formatAmount(totalAmount)}
                        </Text>
                    </View>
                </View>

                {/* Transactions List */}
                <Text style={styles.sectionTitle}>TRANSACTIONS</Text>

                {filteredExpenses.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No expenses in this category.</Text>
                    </View>
                ) : (
                    <View style={{ gap: 12 }}>
                        {filteredExpenses.map(expense => (
                            <TouchableOpacity
                                key={expense.id}
                                onPress={() => handleEditExpense(expense)}
                                activeOpacity={0.7}
                            >
                                <LinearGradient
                                    colors={['#1e293b', '#0f172a']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.transactionCard}
                                >
                                    <View style={[styles.iconContainerSmall, { borderColor: '#334155' }]}>
                                        {getCategoryIcon(expense.category, 20, categoryColor)}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.description}>{expense.description || 'No description'}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                            <Calendar size={12} color="#64748b" style={{ marginRight: 4 }} />
                                            <Text style={styles.date}>
                                                {new Date(expense.date).toLocaleDateString()} • {expense.time}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.expenseAmount}>
                                        {formatAmount(expense.amount)}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            <EditExpenseModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSave={handleSaveExpense}
                onDelete={handleDeleteExpense}
                initialData={editingExpense}
            />
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginBottom: 32,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
    },
    totalLabel: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    totalAmount: {
        fontSize: 32,
        fontWeight: '700',
        color: '#fff',
    },
    sectionTitle: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
    },
    transactionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 24,
        padding: 16,
        borderWidth: 1,
        borderColor: '#1e293b',
    },
    iconContainerSmall: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        marginRight: 16,
    },
    description: {
        color: '#f8fafc',
        fontSize: 16,
        fontWeight: '600',
    },
    date: {
        color: '#64748b',
        fontSize: 12,
    },
    expenseAmount: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: '#64748b',
        fontSize: 14,
    }
});

export default CategoryExpensesPage;
