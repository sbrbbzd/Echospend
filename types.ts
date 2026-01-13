
export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  time: string;
  isIncome?: boolean;
  type?: 'manual' | 'voice' | 'scan';
  predictionSource?: string;
}

export type Category =
  | 'Food'
  | 'Transport'
  | 'Utilities'
  | 'Entertainment'
  | 'Groceries'
  | 'Shopping'
  | 'Income'
  | 'Other';

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  currency: string;
  isPro: boolean;
}

export interface AppState {
  expenses: Expense[];
  budget: number;
}

export interface User {
  id: string;
  email?: string;
  phone?: string;
  full_name?: string;
  date_of_birth?: string;
  avatar?: string;
  is_admin?: boolean;
  created_at: string;
}
export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault?: boolean; // logic helper
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string | Date; // DB returns string, app uses Date
  data?: any; // Expense data if extracted
  is_deleted?: boolean;
}
