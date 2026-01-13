import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { X, Mic, Calendar, Clock, Trash2, Check, ChevronDown, ShoppingBag } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Expense } from '../types';
import SelectionModal from './SelectionModal';
import { useAppContext } from '@/contexts/AppContext';
import { getCategoryIcon } from '../app/utils/categoryIcons';

interface EditExpenseModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (expense: any) => void;
    onDelete?: (expense: any) => void;
    initialData: any;
}

const EditExpenseModal: React.FC<EditExpenseModalProps> = ({ visible, onClose, onSave, onDelete, initialData }) => {
    const { categories, currencySymbol } = useAppContext();
    const [amount, setAmount] = useState('0.00');
    const [category, setCategory] = useState('Groceries');
    const [description, setDescription] = useState('');
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);

    useEffect(() => {
        if (initialData) {
            setAmount(initialData.amount?.toString() || '0.00');
            setCategory(initialData.category || 'Groceries');
            setDescription(initialData.item || initialData.description || '');
        }
    }, [initialData]);

    const handleSave = () => {
        onSave({
            ...initialData,
            amount: parseFloat(amount),
            category,
            item: description,
        });
        onClose();
    };

    const handleDelete = () => {
        if (onDelete) {
            onDelete(initialData);
        }
    };

    const categoryOptions = categories.map(c => ({
        label: c.name,
        value: c.name,
        icon: c.icon,
        color: c.color,
    }));

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

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ width: '100%' }}
                >
                    <View style={{ backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', overflow: 'hidden', paddingBottom: 40, maxHeight: '90%' }}>

                        {/* Header */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20 }}>
                            <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff' }}>Edit Expense</Text>
                            <TouchableOpacity onPress={onClose} style={{ padding: 4, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)' }}>
                                <X size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, gap: 24 }}>

                            {/* Amount Input */}
                            <View style={{ alignItems: 'center', marginVertical: 10 }}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Amount</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                                    <Text style={{ fontSize: 36, fontWeight: '700', color: '#fff', marginTop: 8 }}>{currencySymbol}</Text>
                                    <TextInput
                                        value={amount}
                                        onChangeText={setAmount}
                                        keyboardType="numeric"
                                        style={{ fontSize: 64, fontWeight: '800', color: '#fff', minWidth: 100, textAlign: 'center' }}
                                    />
                                </View>
                            </View>

                            {/* Category */}
                            <View>
                                <Text style={{ fontSize: 14, fontWeight: '500', color: '#cbd5e1', marginBottom: 12 }}>Category</Text>
                                <TouchableOpacity
                                    onPress={() => setCategoryModalVisible(true)}
                                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 16, padding: 16 }}
                                >
                                    <View style={{ marginRight: 12 }}>
                                        {getCategoryIcon(
                                            categories.find(c => c.name === category)?.icon || 'HelpCircle',
                                            24,
                                            categories.find(c => c.name === category)?.color || '#34d399'
                                        )}
                                    </View>
                                    <Text style={{ flex: 1, fontSize: 16, color: '#fff' }}>{category}</Text>
                                    <ChevronDown size={20} color="#94a3b8" />
                                </TouchableOpacity>
                            </View>

                            {/* Description */}
                            <View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#cbd5e1' }}>Description</Text>

                                </View>
                                <TextInput
                                    value={description}
                                    onChangeText={setDescription}
                                    multiline
                                    style={{ backgroundColor: '#1e293b', borderRadius: 16, padding: 16, color: '#fff', fontSize: 16, minHeight: 100, textAlignVertical: 'top' }}
                                    placeholder="What was this expense for?"
                                    placeholderTextColor="#64748b"
                                />
                            </View>

                            {/* Date & Time */}
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', borderWidth: 1, borderColor: '#334155', borderRadius: 12, padding: 12, gap: 8 }}>
                                    <Calendar size={18} color="#9ca3af" />
                                    <Text style={{ color: '#cbd5e1', fontSize: 14 }}>Today</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', borderWidth: 1, borderColor: '#334155', borderRadius: 12, padding: 12, gap: 8 }}>
                                    <Clock size={18} color="#9ca3af" />
                                    <Text style={{ color: '#cbd5e1', fontSize: 14 }}>10:45 AM</Text>
                                </TouchableOpacity>
                            </View>

                        </ScrollView>

                        {/* Footer Buttons */}
                        <View style={{ flexDirection: 'row', padding: 24, paddingTop: 32, gap: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', marginTop: 8 }}>
                            <TouchableOpacity
                                onPress={handleDelete}
                                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(248, 113, 113, 0.1)', gap: 8 }}>
                                <Trash2 size={20} color="#f87171" />
                                <Text style={{ color: '#f87171', fontWeight: '600' }}>Delete</Text>
                            </TouchableOpacity>

                            <View style={{ flex: 1, flexDirection: 'row', gap: 12, justifyContent: 'flex-end' }}>
                                <TouchableOpacity onPress={onClose} style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: '#334155' }}>
                                    <Text style={{ color: '#fff', fontWeight: '600' }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleSave} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: '#10b981', gap: 8, shadowColor: '#34d399', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 }}>
                                    <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
                                    <Check size={18} color="#fff" strokeWidth={3} />
                                </TouchableOpacity>
                            </View>
                        </View>

                    </View>
                </KeyboardAvoidingView>
            </View>

            <SelectionModal
                visible={categoryModalVisible}
                title="Select Category"
                options={categoryOptions}
                selectedValue={category}
                onClose={() => setCategoryModalVisible(false)}
                onSelect={(value) => setCategory(value)}
            />
        </Modal>
    );
};

export default EditExpenseModal;
