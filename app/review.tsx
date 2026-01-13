
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppContext } from '@/contexts/AppContext';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, MoreHorizontal, AudioLines, Bot, Calendar, Pencil, ArrowUp, Keyboard } from 'lucide-react-native';

import { getCategoryIcon } from './utils/categoryIcons';

const ReviewExpense: React.FC = () => {
  const { addExpense, categories, currencySymbol } = useAppContext();
  const { parsedData: parsedDataString, originalText } = useLocalSearchParams<{ parsedData: string, originalText: string }>();
  const parsedData = parsedDataString ? JSON.parse(parsedDataString) : null;

  const [formData, setFormData] = useState(parsedData || {
    amount: 0,
    category: 'Other',
    description: '',
    date: new Date().toISOString().split('T')[0],
    isIncome: false
  });

  const [isSelectingCategory, setIsSelectingCategory] = useState(false);

  const handleSave = () => {
    addExpense({
      ...formData,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    router.replace('/');
  };

  if (!parsedData) {
    return (
      <LinearGradient
        colors={['#0f172a', '#2e1065', '#020617']}
        locations={[0, 0.4, 1]}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}
      >
        <Text style={{ color: '#94a3b8', marginBottom: 16, fontWeight: '500' }}>No data found to review.</Text>
        <TouchableOpacity
          onPress={() => router.replace('/')}
          style={{ paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#2563eb', borderRadius: 999 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Return Home</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  // Helper to highlight transcript (naive implementation for demo)
  const renderHighlightedTranscript = (text: string) => {
    // Logic to find amount and wrap in green, find potential entities and wrap in dark grey
    // For this demo, we'll try to match the Amount from formData

    const words = text.split(' ');
    return words.map((word, index) => {
      // Check if word looks like the amount
      const cleanWord = word.replace(/[^0-9.]/g, '');
      const isAmount = cleanWord && Math.abs(parseFloat(cleanWord) - formData.amount) < 0.01;

      if (word.includes('$') || isAmount) {
        return (
          <View key={index} style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginHorizontal: 2, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.4)' }}>
            <Text style={{ color: '#34d399', fontWeight: '600', fontSize: 18 }}>{word}</Text>
          </View>
        )
      }

      // Naively check for proper nouns or "at [Place]" for the dark grey pill
      // Hardcoded check for "Miller's" or typical proper nouns for demo effect
      if (word.match(/^[A-Z]/) && !index.toString().match(/^0$/)) {
        return (
          <View key={index} style={{ backgroundColor: '#374151', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginHorizontal: 2 }}>
            <Text style={{ color: '#e5e7eb', fontSize: 18 }}>{word}</Text>
          </View>
        )
      }

      return <Text key={index} style={{ color: '#e2e8f0', fontSize: 18, lineHeight: 28 }}> {word}</Text>
    })
  }

  return (
    <LinearGradient
      colors={['#0f172a', '#2e1065', '#020617']}
      locations={[0, 0.4, 1]}
      style={{ flex: 1 }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20, justifyContent: 'space-between', paddingTop: 60 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginLeft: -8 }}>
          <ChevronLeft size={24} color="#e2e8f0" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#f8fafc' }}>Processing</Text>
        <TouchableOpacity style={{ padding: 8, marginRight: -8 }}>
          <MoreHorizontal size={24} color="#e2e8f0" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }}>

        {/* Detected Voice Section */}
        <View style={{ marginBottom: 32 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <AudioLines size={16} color="#10b981" />
            <Text style={{ color: '#10b981', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>Detected Voice</Text>
          </View>

          <View style={{
            backgroundColor: '#1e293b',
            borderRadius: 24,
            padding: 24,
            borderWidth: 1,
            borderColor: '#334155'
          }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
              {renderHighlightedTranscript(originalText)}
            </View>
            <Text style={{ textAlign: 'right', color: '#64748b', fontSize: 12, marginTop: 16, fontWeight: '600' }}>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        {/* Extraction Section */}
        <View style={{ marginBottom: 100 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Bot size={16} color="#34d399" />
            <Text style={{ color: '#34d399', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>Extraction</Text>
          </View>

          <View style={{
            backgroundColor: '#1e293b',
            borderRadius: 32,
            padding: 24,
            borderWidth: 1,
            borderColor: '#334155'
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                <View style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  backgroundColor: '#0f172a',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: '#334155'
                }}>
                  {getCategoryIcon(formData.category, 32, '#fff')}
                </View>
                <View>
                  <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Category</Text>
                  <Text style={{ color: '#f8fafc', fontSize: 20, fontWeight: '700' }}>{formData.category}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsSelectingCategory(true)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: '#334155',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                <Pencil size={16} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Date & Total Row */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Date</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#334155' }}>
                  <Calendar size={14} color="#94a3b8" />
                  <Text style={{ color: '#f1f5f9', fontWeight: '600', fontSize: 13 }}>
                    {new Date(formData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Total</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, fontWeight: '600', color: '#10b981', marginRight: 4 }}>{currencySymbol}</Text>
                  <Text style={{ fontSize: 48, fontWeight: '700', color: '#f8fafc', letterSpacing: -1 }}>{formData.amount.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Footer Input */}
      <View style={{ padding: 20, paddingBottom: 40 }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          backgroundColor: '#1e293b',
          borderRadius: 20,
          padding: 8,
          borderWidth: 1,
          borderColor: '#334155'
        }}>
          <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
            <Keyboard size={20} color="#64748b" />
          </View>
          <TextInput
            style={{ flex: 1, color: '#f8fafc', fontSize: 15, fontWeight: '500' }}
            placeholder="Add details manually..."
            placeholderTextColor="#64748b"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
          />
          <TouchableOpacity
            onPress={handleSave}
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: '#10b981',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#10b981',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8
            }}
          >
            <ArrowUp size={24} color="#064e3b" strokeWidth={3} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Selection Modal */}
      <Modal visible={isSelectingCategory} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'flex-end' }}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setIsSelectingCategory(false)} />
          <View style={{ backgroundColor: '#1e293b', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '60%', borderWidth: 1, borderColor: '#334155' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#f8fafc' }}>Change Category</Text>
              <TouchableOpacity onPress={() => setIsSelectingCategory(false)} style={{ padding: 4, backgroundColor: '#334155', borderRadius: 999 }}>
                <Text style={{ fontSize: 16, color: '#94a3b8', fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => { setFormData({ ...formData, category: cat.name }); setIsSelectingCategory(false); }}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 16,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: formData.category === cat.name ? '#10b981' : '#334155',
                      backgroundColor: formData.category === cat.name ? 'rgba(16, 185, 129, 0.1)' : '#0f172a',
                      minWidth: '45%'
                    }}
                  >
                    <View style={{ width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e293b' }}>
                      {getCategoryIcon(cat.name, 18, '#fff')}
                    </View>
                    <Text style={{ fontWeight: '600', fontSize: 13, color: formData.category === cat.name ? '#10b981' : '#f8fafc', flex: 1 }}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </LinearGradient>
  );
};

export default ReviewExpense;
