
import React, { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Expense } from '../../types';
import { CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS } from '../../constants';
import { useAppContext } from '@/contexts/AppContext';

const EditExpense: React.FC = () => {
  const { expenses, updateExpense, deleteExpense, currencySymbol } = useAppContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [formData, setFormData] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSelectingCategory, setIsSelectingCategory] = useState(false);

  useEffect(() => {
    const expenseToEdit = expenses.find(e => e.id === id);
    if (expenseToEdit) {
      setFormData(expenseToEdit);
    }
  }, [id, expenses]);

  const handleUpdate = () => {
    if (formData) {
      updateExpense(formData);
      router.back();
    }
  };

  const handleDelete = () => {
    if (formData) {
      deleteExpense(formData.id);
      router.replace('/');
    }
  };

  if (!formData) {
    return <div className="p-10 text-center text-text-sub">Expense not found.</div>;
  }

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] relative">
      {/* Header */}
      <div className="flex items-center px-6 py-12 justify-between sticky top-0 bg-[#F8FAFC]/80 backdrop-blur-md z-30">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-text-main hover:bg-gray-200 rounded-full transition-colors">
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <h2 className="text-lg font-bold text-text-main">Edit Transaction</h2>
        <button
          onClick={() => setIsDeleting(true)}
          className="p-2 -mr-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
        >
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24 hide-scrollbar">
        <div className="bg-white rounded-[32px] p-8 shadow-float border border-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-10">
              <div className="flex items-center gap-5">
                <div className={`size-16 rounded-[24px] flex items-center justify-center shadow-sm ${CATEGORY_COLORS[formData.category] || CATEGORY_COLORS['Other']}`}>
                  <span className="material-symbols-outlined text-[32px]">{CATEGORY_ICONS[formData.category] || CATEGORY_ICONS['Other']}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-[0.15em] mb-1">Category</span>
                  <span className="text-[20px] font-bold text-text-main leading-tight">{formData.category === 'Food' ? 'Dining Out' : formData.category}</span>
                </div>
              </div>
              <button
                onClick={() => setIsSelectingCategory(true)}
                className="size-10 rounded-full bg-white shadow-sm border border-gray-50 flex items-center justify-center text-gray-400 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">edit</span>
              </button>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-[0.15em] mb-2">Date</span>
                <div className="flex items-center gap-2 bg-[#F8FAFC] px-4 py-2.5 rounded-xl border border-gray-100/50 relative overflow-hidden active:bg-gray-100 transition-colors">
                  <span className="material-symbols-outlined text-[16px] text-gray-400">calendar_today</span>
                  <span className="text-sm font-bold text-text-main">
                    {new Date(formData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <input
                    type="date"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-[0.15em] mb-1">Total</span>
                <div className="flex items-center justify-end text-text-main">
                  <span className="text-[26px] font-bold text-gray-300 mr-2 leading-none">{currencySymbol}</span>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="text-[52px] font-bold leading-none tracking-tighter bg-transparent w-full text-right focus:outline-none focus:ring-0 border-none p-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Confirmation Bar */}
      <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC] to-transparent z-40">
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white rounded-full shadow-soft border border-gray-100 p-1 pl-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-gray-400 text-[20px]">notes</span>
            <input
              className="flex-1 bg-transparent border-none p-0 py-3 text-sm font-medium placeholder-gray-400 focus:ring-0"
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <button
            onClick={handleUpdate}
            className="size-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">check</span>
          </button>
        </div>
      </div>

      {/* Deletion Confirmation */}
      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[40px] w-full max-w-sm p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center">
              <div className="size-16 bg-red-50 text-red-500 rounded-full mx-auto flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl">delete</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Delete Transaction?</h3>
              <p className="text-text-sub text-sm">This will permanently remove the record. This action cannot be undone.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-8">
              <button
                onClick={() => setIsDeleting(false)}
                className="px-6 py-4 bg-gray-100 text-text-main font-bold rounded-2xl active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-4 bg-red-500 text-white font-bold rounded-2xl active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Selection Sheet */}
      {isSelectingCategory && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm transition-all p-4">
          <div className="bg-white rounded-[40px] w-full max-w-md p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Change Category</h3>
              <button onClick={() => setIsSelectingCategory(false)} className="p-2 text-gray-400"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto hide-scrollbar">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => { if (formData) setFormData({ ...formData, category: cat }); setIsSelectingCategory(false); }}
                  className={`flex items-center gap-3 p-4 rounded-3xl border-2 transition-all ${formData.category === cat ? 'border-primary bg-primary-light' : 'border-transparent bg-gray-50'}`}
                >
                  <div className={`size-10 rounded-full flex items-center justify-center shadow-sm ${CATEGORY_COLORS[cat]}`}>
                    <span className="material-symbols-outlined text-[20px]">{CATEGORY_ICONS[cat]}</span>
                  </div>
                  <span className="font-bold text-sm text-text-main">{cat}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditExpense;
