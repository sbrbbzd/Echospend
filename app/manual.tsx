import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';

import { parseExpenseInput } from '../services/geminiService';
import { useAppContext } from '@/contexts/AppContext';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, MoreHorizontal, Bot, Keyboard, ArrowUp, Edit2, Calendar, Clock } from 'lucide-react-native';
import EditExpenseModal from '../components/EditExpenseModal';
import { getCategoryIcon } from './utils/categoryIcons';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  data?: any; // Expense data if extracted
}

const ManualInput: React.FC = () => {
  const { categories, addExpense, getChatHistory, saveChatMessage, clearChatHistory, formatAmount } = useAppContext();
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hi there! 👋 How can I help you log an expense today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load chat history
  useEffect(() => {
    const loadHistory = async () => {
      console.log("ManualInput: Loading history...");
      try {
        const history = await getChatHistory();
        console.log("ManualInput: History fetched:", history ? history.length : 'null');
        if (history && history.length > 0) {
          const parsed = history.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          console.log("ManualInput: Setting messages from DB");
          setMessages(parsed);
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: false }), 200);
        } else {
          console.log("ManualInput: No history found, keeping default greeting.");
        }
      } catch (e) {
        console.error("ManualInput: Failed to load chat history", e);
      }
    };
    loadHistory();
  }, []);

  const handleClearChat = () => {
    Alert.alert(
      "Clear Chat History",
      "Are you sure you want to delete all messages?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await clearChatHistory();
            setMessages([{
              id: Date.now().toString(),
              text: 'Hi there! 👋 How can I help you log an expense today?',
              sender: 'bot',
              timestamp: new Date()
            }]);
          }
        }
      ]
    );
  };

  const handleProcess = async () => {
    if (!text.trim() || isProcessing) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: text,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setText('');
    setIsProcessing(true);

    // Save user message to DB
    saveChatMessage(userMsg.text, 'user').catch(err => console.error("Failed to save user msg", err));

    // Scroll to bottom
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const availableCategories = categories.map(c => c.name);
      const result = await parseExpenseInput(userMsg.text, availableCategories);

      let botMsg: Message;
      let botText = '';
      if (result) {
        botText = 'I\'ve extracted the following details:';
        // Create extraction card message
        botMsg = {
          id: (Date.now() + 1).toString(),
          text: botText,
          sender: 'bot',
          timestamp: new Date(),
          data: { ...result, saved: false } // Add saved flag
        };
      } else {
        botText = "Sorry, I couldn't understand that. Try being more specific!";
        botMsg = {
          id: (Date.now() + 1).toString(),
          text: botText,
          sender: 'bot',
          timestamp: new Date()
        };
      }
      setMessages(prev => [...prev, botMsg]);
      saveChatMessage(botText, 'bot', botMsg.data).catch(err => console.error("Failed to save bot msg", err));

      setIsProcessing(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    } catch (err: any) {
      console.error(err);
      const errorText = "Something went wrong. Please try again.";
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
      saveChatMessage(errorText, 'bot').catch(err => console.error("Failed to save error msg", err));

      // Diagnostic Alert
      if (err.message?.includes('security policy')) {
        import('../services/authService').then(async (auth) => {
          const user = await auth.getCurrentUser();
          const { data } = await import('../services/supabaseClient').then(m => m.supabase!.auth.getSession());
          alert(`Auth Error Diagnostics:\nApp User: ${user?.id}\nDB Session: ${data.session?.user?.id}\nToken: ${data.session?.access_token ? 'Present' : 'Missing'}`);
        });
      }

      setIsProcessing(false);
    }
  };

  const handleEditExpense = (expense: any) => {
    setCurrentExpense(expense);
    setModalVisible(true);
  };

  const handleSaveExpense = (updatedExpense: any) => {
    // ...
    setMessages(prev => prev.map(msg => {
      if (msg.data && msg.data === currentExpense) {
        return { ...msg, data: { ...updatedExpense, saved: false } };
      }
      return msg;
    }));
    setModalVisible(false);
  };

  const handleDeleteExpense = () => {
    Alert.alert(
      "Discard Extraction",
      "Are you sure you want to discard these extracted details?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            setModalVisible(false);
            setCurrentExpense(null);
          }
        }
      ]
    );
  };

  const handleConfirmSave = async (expenseData: any, messageId: string) => {
    try {
      const expense = await addExpense({
        amount: expenseData.amount,
        category: expenseData.category,
        description: expenseData.item || expenseData.description || 'Manual Entry',
        date: new Date().toISOString(), // Use current date or extracted date if available
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isIncome: expenseData.category === 'Income',
        type: 'manual'
      });

      if (expense) {
        // Mark as saved in UI
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            return { ...msg, data: { ...msg.data, saved: true } };
          }
          return msg;
        }));

        // Add success confirmation message
        const successMsg: Message = {
          id: Date.now().toString(),
          text: "Saved successfully! ✅",
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, successMsg]);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (err) {
      console.error("Failed to save expense:", err);
      // Show error
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0E14' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(11, 14, 20, 0.8)' }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 }}
        >
          <ChevronLeft size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff', letterSpacing: 0.5 }}>Assistant</Text>
        <TouchableOpacity
          onPress={handleClearChat}
          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 }}
        >
          <MoreHorizontal size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Chat Area */}
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 140, paddingTop: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Divider */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <View style={{ backgroundColor: '#151b26', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
            <Text style={{ fontSize: 10, fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1.5 }}>Today</Text>
          </View>
        </View>

        {messages.map((msg, index) => (
          <View key={msg.id} style={{ marginBottom: 24 }}>
            {msg.sender === 'bot' ? (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <LinearGradient
                  colors={['#10b981', '#34d399']}
                  style={{ width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 4, shadowColor: '#10b981', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5 }}
                >
                  <Bot size={18} color="#0B0E14" />
                </LinearGradient>

                <View style={{ flex: 1, maxWidth: '85%', gap: 4 }}>
                  <Text style={{ fontSize: 10, fontWeight: '500', color: '#6b7280', marginLeft: 4 }}>EchoSpend Co-pilot</Text>

                  {/* Text Bubble */}
                  {msg.text && !msg.data && (
                    <View style={{ backgroundColor: '#151b26', padding: 16, borderRadius: 20, borderTopLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                      <Text style={{ fontSize: 15, lineHeight: 24, color: '#f3f4f6' }}>{msg.text}</Text>
                    </View>
                  )}

                  {/* Extraction Card */}
                  {msg.data && (
                    <View style={{ backgroundColor: '#151b26', padding: 20, borderRadius: 24, borderTopLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                        <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                          {getCategoryIcon(msg.data.category, 24, msg.data.category === 'Income' ? '#10b981' : '#f87171')}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>CATEGORY</Text>
                          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 2 }}>{msg.data.category}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleEditExpense(msg.data)}
                          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' }}
                        >
                          <Edit2 size={18} color="#94a3b8" />
                        </TouchableOpacity>
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' }}>
                        <View>
                          <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>DATE</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                            <Calendar size={12} color="#64748b" style={{ marginRight: 6 }} />
                            <Text style={{ color: '#cbd5e1', fontSize: 12, fontWeight: '500' }}>Oct 24, 2023</Text>
                          </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>TOTAL</Text>
                          <Text style={{ color: '#fff', fontSize: 32, fontWeight: '700' }}>{formatAmount(msg.data.amount || 0)}</Text>
                        </View>
                      </View>

                      {/* Save Action */}
                      {!msg.data.saved && (
                        <TouchableOpacity
                          onPress={() => handleConfirmSave(msg.data, msg.id)}
                          style={{ marginTop: 20, backgroundColor: '#10b981', paddingVertical: 14, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}
                        >
                          <Text style={{ color: '#000', fontWeight: '700', fontSize: 15 }}>Save Expense</Text>
                        </TouchableOpacity>
                      )}
                      {msg.data.saved && (
                        <View style={{ marginTop: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={{ color: '#10b981', fontWeight: '600' }}>Saved to Dashboard</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            ) : (
              <View style={{ alignSelf: 'flex-end', maxWidth: '85%', flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                <View style={{ backgroundColor: '#1e293b', padding: 16, borderRadius: 20, borderTopRightRadius: 4, borderWidth: 1, borderColor: '#334155' }}>
                  <Text style={{ fontSize: 15, lineHeight: 24, color: '#f3f4f6' }}>{msg.text}</Text>
                </View>
              </View>
            )}
          </View>
        ))}

        {/* Loading Indicator */}
        {isProcessing && (
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 0 }}>
            <LinearGradient
              colors={['#10b981', '#34d399']}
              style={{ width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 4 }}
            >
              <Bot size={18} color="#0B0E14" />
            </LinearGradient>
            <View style={{ backgroundColor: '#151b26', padding: 16, borderRadius: 20, borderTopLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator size="small" color="#10b981" />
              <Text style={{ color: '#9ca3af', fontSize: 14 }}>Thinking...</Text>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={{ position: 'absolute', bottom: 0, width: '100%', zIndex: 50 }}
      >
        <LinearGradient
          colors={['transparent', 'rgba(11, 14, 20, 0.95)', '#0B0E14']}
          locations={[0, 0.2, 0.4]}
          style={{ paddingTop: 32, paddingBottom: 40, paddingHorizontal: 16 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#151b26', borderRadius: 32, padding: 6, paddingLeft: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 30, elevation: 10 }}>
            <Keyboard size={20} color="#6b7280" />
            <TextInput
              style={{ flex: 1, color: '#fff', fontSize: 14, fontWeight: '500', paddingHorizontal: 12, paddingVertical: 12 }}
              placeholder="Add details manually..."
              placeholderTextColor="#6b7280"
              value={text}
              onChangeText={setText}
              editable={!isProcessing}
            />
            <TouchableOpacity
              onPress={handleProcess}
              disabled={!text.trim() || isProcessing}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: text.trim() ? '#10b981' : '#1f2937', justifyContent: 'center', alignItems: 'center', shadowColor: text.trim() ? '#10b981' : 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 }}
            >
              <ArrowUp size={20} color={text.trim() ? '#0B0E14' : '#4b5563'} strokeWidth={3} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>

      <EditExpenseModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveExpense}
        onDelete={handleDeleteExpense}
        initialData={currentExpense}
      />

    </View>
  );
};

export default ManualInput;
