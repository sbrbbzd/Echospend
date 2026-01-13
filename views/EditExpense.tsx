
import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Expense } from '../types';
import { CATEGORIES, CATEGORY_ICONS } from '../constants';

interface EditExpenseProps {
  expenses: Expense[];
  onUpdate: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

const EditExpense: React.FC<EditExpenseProps> = ({ expenses, onUpdate, onDelete }) => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const existing = expenses.find(e => e.id === id);

  const [formData, setFormData] = useState<Expense | null>(existing || null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!formData) return <div className="p-10">Expense not found</div>;

  const handleSave = () => {
    onUpdate(formData);
    router.push('/');
  };

  const handleDelete = () => {
    onDelete(formData.id);
    router.push('/');
  };

  return (
    <div className="flex flex-col h-full bg-white animate-slide-up relative">
      <div className="flex items-center p-4 justify-between border-b border-gray-50">
        <h2 className="text-xl font-bold">Edit Expense</h2>
        <button onClick={() => router.push('/')} className="p-2 text-text-sub hover:bg-gray-100 rounded-full">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-8 space-y-8 hide-scrollbar">
        {/* Amount Input */}
        <div className="flex flex-col items-center">
          <label className="text-xs font-bold uppercase tracking-widest text-text-sub mb-2">Amount</label>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-300">$</span>
            <input 
              type="number"
              className="w-full text-5xl font-extrabold text-center border-none p-0 focus:ring-0 placeholder-gray-200"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>

        {/* Category Select */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">Category</label>
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-primary">
                <span className="material-symbols-outlined">{CATEGORY_ICONS[formData.category] || 'receipt_long'}</span>
             </div>
             <select 
               className="w-full appearance-none rounded-xl border-none bg-surface py-4 pl-12 pr-10 text-base font-medium focus:ring-2 focus:ring-primary/20"
               value={formData.category}
               onChange={(e) => setFormData({ ...formData, category: e.target.value })}
             >
               {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
             <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-text-sub">
                <span className="material-symbols-outlined">expand_more</span>
             </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">Description</label>
          <textarea 
            className="w-full rounded-xl border-none bg-surface p-4 text-base focus:ring-2 focus:ring-primary/20 min-h-[100px] resize-none"
            placeholder="What was this for?"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        {/* Date/Time Placeholder */}
        <div className="flex gap-3">
          <div className="flex-1 p-3 rounded-lg border border-dashed border-gray-200 flex items-center justify-center gap-2 text-sm text-text-sub">
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            <span>{formData.date}</span>
          </div>
          <div className="flex-1 p-3 rounded-lg border border-dashed border-gray-200 flex items-center justify-center gap-2 text-sm text-text-sub">
            <span className="material-symbols-outlined text-[18px]">schedule</span>
            <span>{formData.time}</span>
          </div>
        </div>
      </div>

      <div className="p-6 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 p-2 text-sm font-medium text-danger hover:bg-red-50 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
            Delete
          </button>
          <div className="flex gap-3">
            <button 
              onClick={() => router.push('/')}
              className="px-6 py-3 rounded-xl bg-gray-100 text-sm font-semibold"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="px-6 py-3 rounded-xl bg-primary-light text-primary-dark font-bold text-sm flex items-center gap-2"
            >
              Save Changes
              <span className="material-symbols-outlined text-[18px]">check</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-center mb-2">Confirm Deletion</h3>
            <p className="text-text-sub text-center mb-8 leading-relaxed">
              Are you sure you want to delete this expense? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 font-semibold"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 py-3 rounded-xl bg-red-100 text-red-600 font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditExpense;
