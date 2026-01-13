import React, { createContext, useContext, ReactNode } from 'react';
import { Expense, UserProfile, CategoryItem } from '../types';
import { formatCurrency, getCurrencySymbol, CurrencyInfo } from '../utils/currency';

interface AppContextType {
    expenses: Expense[];
    categories: CategoryItem[];
    budget: number;
    currency: string;
    language: string;
    loading: boolean;
    addExpense: (expense: Omit<Expense, 'id'>) => Promise<Expense | null>;
    updateExpense: (expense: Expense) => Promise<void>;
    deleteExpense: (id: string) => Promise<void>;
    updateBudget: (amount: number) => Promise<void>;
    updateSettings: (key: string, value: string) => Promise<void>;
    addCategory: (category: Omit<CategoryItem, 'id'>) => Promise<CategoryItem | null>;
    updateCategory: (original: CategoryItem, updated: Omit<CategoryItem, 'id'>) => Promise<void>;
    deleteCategory: (category: CategoryItem) => Promise<void>;
    refreshCategories: () => Promise<void>;
    saveChatMessage: (text: string, sender: 'user' | 'bot', data?: any) => Promise<import('../types').Message | null>;
    clearChatHistory: () => Promise<void>;
    getChatHistory: () => Promise<import('../types').Message[]>;
    supportedLanguages: { code: string; name: string; icon?: string }[];
    supportedCurrencies: { code: string; name: string; symbol?: string; icon?: string }[];
    // Currency formatting helpers
    formatAmount: (amount: number, options?: { showSign?: boolean }) => string;
    currencySymbol: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within AppProvider');
    }
    return context;
};

interface AppProviderProps {
    children: ReactNode;
    value: Omit<AppContextType, 'formatAmount' | 'currencySymbol'>;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children, value }) => {
    // Create formatAmount function that uses current currency
    const formatAmount = (amount: number, options: { showSign?: boolean } = {}) => {
        return formatCurrency(amount, value.currency, value.supportedCurrencies, options);
    };

    // Get current currency symbol
    const currencySymbol = getCurrencySymbol(value.currency, value.supportedCurrencies);

    const contextValue: AppContextType = {
        ...value,
        formatAmount,
        currencySymbol,
    };

    return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};