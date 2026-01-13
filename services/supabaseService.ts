
import { supabase } from './supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense, CategoryItem } from '../types';
import { getCurrentUser } from './authService';

const LOCAL_EXPENSES_KEY = 'echospend_expenses';
const LOCAL_BUDGET_KEY = 'echospend_budget';

// Helper to get local data key per user (if we wanted multi-user local support, 
// but currently local is device-based. We'll stick to simple keys for fallback)

const getLocalExpenses = async (): Promise<Expense[]> => {
  try {
    const data = await AsyncStorage.getItem(LOCAL_EXPENSES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalExpenses = async (expenses: Expense[]) => {
  try {
    await AsyncStorage.setItem(LOCAL_EXPENSES_KEY, JSON.stringify(expenses));
  } catch (e) {
    console.error("Failed to save expenses locally:", e);
  }
};

/**
 * Generates a unique ID for local-first operations.
 */
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'local-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
};

export const db = {
  /**
   * Check if Supabase connection is available
   */
  isConnected() {
    return !!supabase;
  },

  /**
   * Fetches expenses with improved error logging.
   */
  async getExpenses(): Promise<Expense[]> {
    if (!supabase) return getLocalExpenses();

    const user = await getCurrentUser();
    if (!user) {
      // If not logged in remotely, fallback to local or return empty?
      // For now, return local as fallback
      return getLocalExpenses();
    }

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('time', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          console.error("CRITICAL ERROR: Table 'expenses' is missing in Supabase.");
        } else if (error.code === '42703') {
          console.error("CRITICAL ERROR: Column 'user_id' is missing. Run the migration.");
        }
        throw error;
      }

      const mapped = (data || []).map((e: any) => ({
        ...e,
        isIncome: e.is_income,
        type: e.entry_type,
        predictionSource: e.prediction_source
      })) as Expense[];

      await saveLocalExpenses(mapped);
      return mapped;
    } catch (err: any) {
      console.warn("Supabase fetch failed:", err.message || err);
      return getLocalExpenses();
    }
  },

  /**
   * Inserts an expense, falling back to local storage on any error.
   */
  async insertExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
    const tempId = generateId();
    const user = await getCurrentUser();

    if (!supabase || !user) {
      const expenses = await getLocalExpenses();
      const newExpense = { ...expense, id: tempId } as Expense;
      await saveLocalExpenses([newExpense, ...expenses]);
      return newExpense;
    }

    try {
      // Convert time to 24-hour HH:MM:SS format for PostgreSQL
      const formatTimeForDB = (timeStr: string): string => {
        try {
          // If already in HH:MM:SS format, return as is
          if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) return timeStr;

          // Regex to parse 12-hour format "HH:MM AM/PM" handling various whitespace
          // Matches: "8:30 PM", "08:30 PM", "8:30PM", "8:30 PM" (with thin space)
          const match = timeStr.match(/(\d{1,2}):(\d{2})\s*([AaPp][Mm])?/);

          if (!match) {
            // Fallback: try Date parsing if regex fails (though regex covers most standard cases)
            const date = new Date(`1970-01-01 ${timeStr.replace(/[^a-zA-Z0-9:]/g, ' ')}`);
            if (isNaN(date.getTime())) return timeStr;
            const h = date.getHours().toString().padStart(2, '0');
            const m = date.getMinutes().toString().padStart(2, '0');
            const s = date.getSeconds().toString().padStart(2, '0');
            return `${h}:${m}:${s}`;
          }

          let [_, hoursStr, minutesStr, meridiem] = match;
          let hours = parseInt(hoursStr, 10);
          const minutes = parseInt(minutesStr, 10);

          if (meridiem) {
            meridiem = meridiem.toUpperCase();
            if (meridiem === 'PM' && hours < 12) hours += 12;
            if (meridiem === 'AM' && hours === 12) hours = 0;
          }

          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
        } catch {
          return timeStr; // Return original on error
        }
      };

      const { data, error } = await supabase
        .from('expenses')
        .insert([{
          amount: expense.amount,
          category: expense.category,
          description: expense.description,
          date: expense.date,
          time: formatTimeForDB(expense.time), // Convert time format
          is_income: expense.isIncome,
          entry_type: expense.type,
          prediction_source: expense.predictionSource || 'manual',
          user_id: user.id
        }])
        .select()
        .limit(1); // Changed from .single() to avoid 406 errors

      if (error) throw error;

      const result = { ...data[0], isIncome: data[0].is_income, type: data[0].entry_type, predictionSource: data[0].prediction_source } as Expense;
      const expenses = await getLocalExpenses();
      await saveLocalExpenses([result, ...expenses]);

      return result;
    } catch (err: any) {
      console.error("Supabase insert failed:", err.message);
      // Local fallback
      const expenses = await getLocalExpenses();
      const newExpense = { ...expense, id: tempId } as Expense;
      await saveLocalExpenses([newExpense, ...expenses]);
      return newExpense;
    }
  },

  async updateExpense(expense: Expense): Promise<void> {
    const expenses = await getLocalExpenses();
    await saveLocalExpenses(expenses.map(e => e.id === expense.id ? expense : e));

    if (!supabase) return;
    const user = await getCurrentUser();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          amount: expense.amount,
          category: expense.category,
          description: expense.description,
          date: expense.date,
          time: expense.time,
          is_income: expense.isIncome,
          entry_type: expense.type
          // usually we don't update user_id, but we ensure we only update OUR record
        })
        .eq('id', expense.id)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (err: any) {
      console.error("Supabase update failed:", err.message);
    }
  },

  async deleteExpense(id: string): Promise<void> {
    const expenses = await getLocalExpenses();
    await saveLocalExpenses(expenses.filter(e => e.id !== id));

    if (!supabase) return;
    const user = await getCurrentUser();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (err: any) {
      console.error("Supabase delete failed:", err.message);
    }
  },

  async getBudget(): Promise<number> {
    return 0; // Legacy
  },

  async updateBudget(amount: number): Promise<void> {
    await this.updateSetting('monthly_budget', amount.toString());
  },

  async getSetting(key: string, defaultValue: string): Promise<string> {
    const localKey = `echospend_setting_${key}`;

    if (!supabase) {
      const val = await AsyncStorage.getItem(localKey);
      return val || defaultValue;
    }

    const user = await getCurrentUser();
    if (!user) {
      const val = await AsyncStorage.getItem(localKey);
      return val || defaultValue;
    }

    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', key)
        .eq('user_id', user.id)
        .limit(1); // Changed from .single() to avoid 406 errors

      if (error) {
        throw error;
      }

      // Handle array response - take first item if exists
      const val = (data && data.length > 0) ? data[0].value : defaultValue;
      await AsyncStorage.setItem(localKey, val);
      return val;
    } catch (err: any) {
      const val = await AsyncStorage.getItem(localKey);
      return val || defaultValue;
    }
  },

  async updateSetting(key: string, value: string): Promise<void> {
    const localKey = `echospend_setting_${key}`;
    await AsyncStorage.setItem(localKey, value);

    if (!supabase) return;
    const user = await getCurrentUser();
    if (!user) return;

    try {
      // We must explicitly select user_id/key for conflict if we added unique constraint
      // or just match row. 'upsert' works best if (user_id, key) is PK.
      const { error } = await supabase
        .from('settings')
        .upsert({
          key,
          value,
          user_id: user.id
        }, {
          // If we created a composite PK (user_id, key), standard upsert works.
          // If not, we might need onConflict. "key" alone is NOT unique anymore globally.
          // But since we didn't strictly enforce composite PK in migration yet (just added column),
          // this might fail if 'key' is still PK.
          // NOTE: The migration script instructions suggested dropping PK.
          // Assuming migration is run to drop PK or add composite.
          onConflict: 'user_id,key'
        });

      if (error) throw error;
    } catch (err: any) {
      console.error(`Supabase setting update failed [${key}]:`, err.message);
    }
  },

  async signOut(): Promise<void> {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
    } catch (err: any) {
      console.error("Sign out failed:", err.message);
    }
  },

  /**
   * Categories
   */
  async getCategories(): Promise<CategoryItem[]> {
    if (!supabase) return [];
    const user = await getCurrentUser();
    const userId = user ? user.id : '00000000-0000-0000-0000-000000000000';

    try {
      if (!user) return [];

      // 1. Fetch Categories
      const { data: cats, error } = await supabase
        .from('categories')
        .select('*')
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order('name');

      if (error) throw error;

      // 2. Fetch Hidden Categories
      const hiddenJson = await this.getSetting('hidden_categories', '[]');
      const hiddenList: string[] = JSON.parse(hiddenJson);

      // 3. Filter
      return (cats as any[]).filter(c => !hiddenList.includes(c.name)).map(c => ({
        ...c,
        isDefault: !c.user_id // Mark global categories
      }));
    } catch (err: any) {
      console.error("Get categories failed:", err.message);
      return [];
    }
  },

  async createCategory(category: Omit<CategoryItem, 'id'>): Promise<CategoryItem | null> {
    if (!supabase) return null;
    const user = await getCurrentUser();
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name: category.name,
          icon: category.icon,
          color: category.color,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      return { ...data, isDefault: false } as CategoryItem;
    } catch (err: any) {
      console.error("Create category failed:", err.message);
      return null;
    }
  },

  async updateCategory(original: CategoryItem, updated: Omit<CategoryItem, 'id'>): Promise<void> {
    if (!supabase) return;
    const user = await getCurrentUser();
    if (!user) return;

    try {
      if (original.isDefault) {
        // Global Category: Hide original, Create New, Update Expenses
        await this.hideCategory(original.name);
        await this.createCategory(updated);

        // Update expenses using the old name to the new name
        if (original.name !== updated.name) {
          const { error: expError } = await supabase
            .from('expenses')
            .update({ category: updated.name })
            .eq('category', original.name)
            .eq('user_id', user.id);
          if (expError) throw expError;
        }

      } else {
        // User Category: Update directly
        const { error } = await supabase
          .from('categories')
          .update({
            name: updated.name,
            icon: updated.icon,
            color: updated.color
          })
          .eq('id', original.id)
          .eq('user_id', user.id);

        if (error) throw error;

        // Update expenses if name changed
        if (original.name !== updated.name) {
          const { error: expError } = await supabase
            .from('expenses')
            .update({ category: updated.name })
            .eq('category', original.name)
            .eq('user_id', user.id);
          if (expError) throw expError;
        }
      }
    } catch (err: any) {
      console.error("Update category failed:", err.message);
    }
  },

  async deleteCategory(category: CategoryItem): Promise<void> {
    if (!supabase) return;
    const user = await getCurrentUser();
    if (!user) return;

    try {
      if (category.isDefault) {
        // Global: Hide it
        await this.hideCategory(category.name);
      } else {
        // User: Delete it
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', category.id)
          .eq('user_id', user.id);
        if (error) throw error;
      }
    } catch (err: any) {
      console.error("Delete category failed:", err.message);
    }
  },

  async hideCategory(name: string): Promise<void> {
    const hiddenJson = await this.getSetting('hidden_categories', '[]');
    const hiddenList: string[] = JSON.parse(hiddenJson);
    if (!hiddenList.includes(name)) {
      hiddenList.push(name);
      await this.updateSetting('hidden_categories', JSON.stringify(hiddenList));
    }
  },

  async getSupportedLanguages() {
    if (!supabase) return [];
    const { data } = await supabase.from('supported_languages').select('*').order('name');
    return data || [];
  },

  async getSupportedCurrencies() {
    if (!supabase) return [];
    const { data } = await supabase.from('supported_currencies').select('*').order('name');
    return data || [];
  },

  /**
   * Chat History
   */
  async getChatMessages(): Promise<import('../types').Message[]> {
    if (!supabase) return [];
    const user = await getCurrentUser();
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true }); // Oldest first for chat timeline

      if (error) throw error;
      return data as import('../types').Message[];
    } catch (err: any) {
      console.error("Get chat failed:", err.message);
      return [];
    }
  },

  async saveChatMessage(text: string, sender: 'user' | 'bot', data?: any): Promise<import('../types').Message | null> {
    if (!supabase) return null;
    const user = await getCurrentUser();
    if (!user) return null;

    // DEBUG: Check auth state
    const { data: { session } } = await supabase.auth.getSession();
    console.log("DEBUG: Application User ID:", user.id);
    console.log("DEBUG: Supabase Auth Session User ID:", session?.user?.id);
    // console.log("DEBUG: Tokens match?", session?.access_token === (await AsyncStorage.getItem('echospend_auth_token')));

    try {
      const { data: msgData, error } = await supabase
        .from('chat_messages')
        .insert([{
          user_id: user.id,
          text,
          sender,
          data
        }])
        .select()
        .single();

      if (error) throw error;
      return { ...msgData, timestamp: msgData.created_at } as import('../types').Message;
    } catch (err: any) {
      console.error("Save chat failed:", err.message);
      return null;
    }
  },

  async clearChatMessages(): Promise<void> {
    if (!supabase) return;
    const user = await getCurrentUser();
    if (!user) return;

    try {
      // Soft delete
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_deleted: true })
        .eq('user_id', user.id)
        .eq('is_deleted', false); // Only update active ones

      if (error) throw error;
    } catch (err: any) {
      console.error("Clear chat failed:", err.message);
    }
  }
};
