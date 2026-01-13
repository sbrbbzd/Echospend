
import React from 'react';

export const CATEGORIES = [
  'Food',
  'Transport',
  'Utilities',
  'Entertainment',
  'Groceries',
  'Shopping',
  'Other'
];

export const CATEGORY_ICONS: Record<string, string> = {
  'Food': 'restaurant',
  'Transport': 'local_taxi',
  'Utilities': 'bolt',
  'Entertainment': 'movie',
  'Groceries': 'shopping_basket',
  'Shopping': 'shopping_bag',
  'Income': 'account_balance_wallet',
  'Other': 'receipt_long'
};

export const CATEGORY_COLORS: Record<string, string> = {
  'Food': 'text-orange-500 bg-orange-50',
  'Transport': 'text-blue-500 bg-blue-50',
  'Utilities': 'text-yellow-600 bg-yellow-50',
  'Entertainment': 'text-purple-500 bg-purple-50',
  'Groceries': 'text-emerald-600 bg-emerald-50',
  'Shopping': 'text-pink-500 bg-pink-50',
  'Income': 'text-primary bg-primary-light',
  'Other': 'text-gray-500 bg-gray-50'
};
