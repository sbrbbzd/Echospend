
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { Expense, CategoryItem } from '../types';
import { db } from '../services/supabaseService';
import { AppProvider } from '@/contexts/AppContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from '../components/ui/sonner';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic } from 'lucide-react-native';

const RootLayoutContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [budget, setBudget] = useState<number>(200.00);
  const [currency, setCurrency] = useState<string>('USD');
  const [language, setLanguage] = useState<string>('en');
  const [loading, setLoading] = useState(true);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);
  const [supportedLanguages, setSupportedLanguages] = useState<any[]>([]);
  const [supportedCurrencies, setSupportedCurrencies] = useState<any[]>([]);

  // All hooks must be called before any conditional returns
  useEffect(() => {
    if (authLoading) return;

    const inAuthGroup = segments[0] === '(auth)' || segments[0] === 'login' || segments[0] === 'signup';
    const onSignupPage = segments[0] === 'signup';
    const inAdminGroup = segments[0] === 'admin';

    // Check if user needs to complete profile (no full_name)
    const needsProfileCompletion = user && !user.full_name;

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login');
    } else if (user && inAuthGroup) {
      // If user needs to complete profile, allow them to stay on signup
      if (needsProfileCompletion && onSignupPage) {
        // Stay on signup page to complete profile
        return;
      }
      // If user needs profile completion but is on login, redirect to signup
      if (needsProfileCompletion && !onSignupPage) {
        router.replace('/signup');
        return;
      }
      // User has complete profile, redirect to home
      router.replace('/');
    }
  }, [user, authLoading, segments, router]);

  useEffect(() => {
    // Only load data if user is authenticated
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    // Timeout to show troubleshoot message if sync is too slow
    const timer = setTimeout(() => setShowTroubleshoot(true), 4000);

    const initData = async () => {
      try {
        const [fetchedExpenses, fetchedBudget, fetchedCurrency, fetchedLanguage, fetchedCategories, fetchedLangs, fetchedCurrs] = await Promise.all([
          db.getExpenses(),
          db.getBudget(),
          db.getSetting('currency', 'USD'),
          db.getSetting('language', 'en'),
          db.getCategories(),
          db.getSupportedLanguages(),
          db.getSupportedCurrencies()
        ]);
        setExpenses(fetchedExpenses);
        setBudget(fetchedBudget);
        setCurrency(fetchedCurrency);
        setLanguage(fetchedLanguage);
        setCategories(fetchedCategories);

        // Fallback for languages if DB is empty or missing
        if (fetchedLangs && fetchedLangs.length > 0) {
          setSupportedLanguages(fetchedLangs);
        } else {
          setSupportedLanguages([
            { code: 'en', name: 'English' },
            { code: 'es', name: 'Spanish' },
            { code: 'fr', name: 'French' },
            { code: 'az', name: 'Azerbaijani' }
          ]);
        }

        // Fallback for currencies
        if (fetchedCurrs && fetchedCurrs.length > 0) {
          setSupportedCurrencies(fetchedCurrs);
        } else {
          setSupportedCurrencies([
            { code: 'USD', name: 'US Dollar', symbol: '$' },
            { code: 'EUR', name: 'Euro', symbol: '€' },
            { code: 'GBP', name: 'British Pound', symbol: '£' },
            { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
            { code: 'AZN', name: 'Azerbaijani Manat', symbol: '₼' }
          ]);
        }
      } catch (err) {
        console.error("Failed to load data from Supabase:", err);
      } finally {
        setLoading(false);
        clearTimeout(timer);
      }
    };
    initData();

    return () => clearTimeout(timer);
  }, [user, authLoading]);

  // Now we can have conditional returns after all hooks
  if (authLoading) {
    return (
      <LinearGradient
        colors={['#0f172a', '#2e1065', '#020617']}
        locations={[0, 0.4, 1]}
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={{ marginTop: 24, fontSize: 16, color: '#94a3b8', fontWeight: '500' }}>Starting EchoSpend...</Text>
      </LinearGradient>
    );
  }

  const addExpense = async (expenseData: Omit<Expense, 'id'>) => {
    try {
      const newExpense = await db.insertExpense(expenseData);
      setExpenses(prev => [newExpense, ...prev]);
      return newExpense;
    } catch (err) {
      console.error("Failed to add expense:", err);
      return null;
    }
  };

  const updateExpense = async (updated: Expense) => {
    const previous = [...expenses];
    setExpenses(prev => prev.map(e => e.id === updated.id ? updated : e));

    try {
      await db.updateExpense(updated);
    } catch (err) {
      console.error("Failed to update expense:", err);
      setExpenses(previous);
    }
  };

  const deleteExpense = async (id: string) => {
    const previous = [...expenses];
    setExpenses(prev => prev.filter(e => e.id !== id));

    try {
      await db.deleteExpense(id);
    } catch (err) {
      console.error("Failed to delete expense:", err);
      setExpenses(previous);
    }
  };

  const handleUpdateBudget = async (newBudget: number) => {
    setBudget(newBudget);
    try {
      await db.updateBudget(newBudget);
    } catch (err) {
      console.error("Failed to update budget:", err);
    }
  };

  const handleUpdateSettings = async (key: string, value: string) => {
    if (key === 'currency') setCurrency(value);
    if (key === 'language') setLanguage(value);

    try {
      await db.updateSetting(key, value);
    } catch (err) {
      console.error(`Failed to update setting ${key}:`, err);
    }
  };

  const addCategory = async (catData: Omit<CategoryItem, 'id'>) => {
    try {
      const newCat = await db.createCategory(catData);
      if (newCat) {
        setCategories(prev => [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name)));
      }
      return newCat;
    } catch (err) {
      console.error("Failed to add category:", err);
      return null;
    }
  };

  const updateCategory = async (original: CategoryItem, updated: Omit<CategoryItem, 'id'>) => {
    try {
      await db.updateCategory(original, updated);
      await refreshCategories(); // Easiest way to reflect mixed global/local state changes
    } catch (err) {
      console.error("Failed to update category:", err);
    }
  };

  const deleteCategory = async (category: CategoryItem) => {
    try {
      await db.deleteCategory(category);
      await refreshCategories();
    } catch (err) {
      console.error("Failed to delete category:", err);
    }
  };

  const refreshCategories = async () => {
    try {
      const cats = await db.getCategories();
      setCategories(cats);
    } catch (err) {
      console.error("Failed to refresh categories:", err);
    }
  };

  const saveChatMessage = async (text: string, sender: 'user' | 'bot', data?: any) => {
    return await db.saveChatMessage(text, sender, data);
  };

  const clearChatHistory = async () => {
    await db.clearChatMessages();
  };

  const getChatHistory = async () => {
    return await db.getChatMessages();
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#0f172a', '#2e1065', '#020617']}
        locations={[0, 0.4, 1]}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <View style={{
            width: 100,
            height: 100,
            backgroundColor: '#10b981',
            borderRadius: 24,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 32,
            shadowColor: '#10b981',
            shadowOpacity: 0.5,
            shadowRadius: 30,
            elevation: 10
          }}>
            <Mic size={52} color="#020617" strokeWidth={2.5} />
          </View>

          <ActivityIndicator size="small" color="#10b981" />
          <Text style={{ marginTop: 20, fontSize: 20, fontWeight: '700', color: '#fff' }}>Syncing Data</Text>
          <Text style={{ marginTop: 8, fontSize: 14, color: '#94a3b8', textAlign: 'center' }}>Securing your voice-first finance workspace...</Text>

          {showTroubleshoot && (
            <View style={{ marginTop: 48, padding: 16, backgroundColor: 'rgba(254, 243, 199, 0.1)', borderWidth: 1, borderColor: 'rgba(253, 230, 138, 0.2)', borderRadius: 16, marginHorizontal: 32 }}>
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#fde68a', textAlign: 'center' }}>
                Taking a while? Please check your connection or migrations.
              </Text>
            </View>
          )}
        </View>

        {/* Realigned Name at Bottom */}
        <View style={{ paddingBottom: 40, alignItems: 'center' }}>
          <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: '600', letterSpacing: 1 }}>
            ECHOSPEND - AI VOICE EXPENSE TRACKER
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <AppProvider value={{
      expenses,
      budget,
      currency,
      language,
      loading,
      addExpense,
      updateExpense,
      deleteExpense,
      updateBudget: handleUpdateBudget,
      updateSettings: handleUpdateSettings,
      categories,
      addCategory,
      updateCategory,
      deleteCategory,
      refreshCategories,
      saveChatMessage,
      clearChatHistory,
      getChatHistory,
      supportedLanguages,
      supportedCurrencies
    }}>
      <Slot />
      <Toaster />
    </AppProvider>
  );
};

const RootLayout: React.FC = () => {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
};

export default RootLayout;
