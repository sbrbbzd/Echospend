
import React, { useState } from 'react';
/* Fix: Corrected syntax error in import (added missing closing quote) */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS } from '../constants';

interface ReviewExpenseProps {
  onConfirm: (expense: any) => void;
}

const ReviewExpense: React.FC<ReviewExpenseProps> = ({ onConfirm }) => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const parsedData = params.parsedData ? JSON.parse(params.parsedData as string) : null;
  const originalText = params.originalText as string;

  const [formData, setFormData] = useState(parsedData || {
    amount: 0,
    category: 'Other',
    description: '',
    date: new Date().toISOString().split('T')[0],
    isIncome: false
  });

  const [isSelectingCategory, setIsSelectingCategory] = useState(false);

  const handleSave = () => {
    onConfirm({
      ...formData,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    router.push('/');
  };

  if (!parsedData) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 text-center">
        <p className="text-text-sub mb-4 font-medium">No data found to review.</p>
        <button 
          onClick={() => router.push('/')}
          className="px-6 py-2 bg-primary text-white rounded-full font-bold shadow-glow"
        >
          Return Home
        </button>
      </div>
    );
  }

  // Highlight specific parts for the "Detected Voice" display
  const getHighlightedText = (text: string) => {
    const parts = text.split(/(\b\d+\.?\d*\s?(?:dollars|bucks|\$|usd|cents)?\b|\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b)/g);
    return parts.map((part, i) => {
      if (part.match(/\b\d/)) {
        return <span key={i} className="bg-[#E9FBF3] text-[#10b981] px-1.5 py-0.5 rounded-lg border border-[#D1F7E5] mx-0.5 font-semibold">{part}</span>;
      }
      if (part.match(/\b[A-Z]/)) {
        return <span key={i} className="bg-[#F1F5F9] text-[#475569] px-1.5 py-0.5 rounded-lg border border-[#E2E8F0] mx-0.5 font-semibold">{part}</span>;
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] relative">
      {/* Header */}
      <div className="flex items-center px-6 py-12 justify-between sticky top-0 bg-[#F8FAFC]/80 backdrop-blur-md z-30">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-text-main hover:bg-gray-200 rounded-full transition-colors">
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <h2 className="text-lg font-bold text-text-main">Processing</h2>
        <button className="p-2 -mr-2 text-text-main hover:bg-gray-200 rounded-full">
          <span className="material-symbols-outlined">more_horiz</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24 hide-scrollbar">
        {/* Section: Detected Voice */}
        <div className="flex items-center gap-2 mb-4 px-2">
          <span className="material-symbols-outlined text-[#10b981] text-[20px] font-variation-settings-fill-0">graphic_eq</span>
          <span className="text-[11px] font-bold text-[#10b981] uppercase tracking-widest">Detected Voice</span>
        </div>

        <div className="bg-white rounded-[28px] p-8 shadow-soft border border-gray-100 relative mb-4">
          <p className="text-[20px] font-medium leading-relaxed text-text-main">
            "{getHighlightedText(originalText)}"
          </p>
          <p className="text-[10px] text-gray-300 font-bold text-right mt-6 uppercase tracking-wider">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Connecting Line */}
        <div className="flex justify-center h-8 -my-2 relative z-0">
          <div className="w-[1px] h-full border-l-2 border-dashed border-gray-200"></div>
        </div>

        {/* Section: Extraction */}
        <div className="flex items-center gap-2 mb-4 px-2">
          <span className="material-symbols-outlined text-[#8B5CF6] text-[20px] font-variation-settings-fill-1">smart_toy</span>
          <span className="text-[11px] font-bold text-[#8B5CF6] uppercase tracking-widest">Extraction</span>
        </div>

        <div className="bg-white rounded-[32px] p-8 shadow-float border border-white relative overflow-hidden">
          {/* Subtle gradient overlay to match screenshot */}
          <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-[#F0FFF4] opacity-50"></div>
          
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
                  <span className="text-[26px] font-bold text-gray-300 mr-2 leading-none">$</span>
                  <span className="text-[52px] font-bold leading-none tracking-tighter">{formData.amount.toFixed(2)}</span>
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
            <span className="material-symbols-outlined text-gray-400 text-[20px]">keyboard</span>
            <input 
              className="flex-1 bg-transparent border-none p-0 py-3 text-sm font-medium placeholder-gray-400 focus:ring-0" 
              placeholder="Add details manually..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <button 
            onClick={handleSave}
            className="size-12 rounded-full bg-[#111827] text-white flex items-center justify-center shadow-lg active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
          </button>
        </div>
      </div>

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
                  onClick={() => { setFormData({ ...formData, category: cat }); setIsSelectingCategory(false); }}
                  className={`flex items-center gap-3 p-4 rounded-3xl border-2 transition-all ${formData.category === cat ? 'border-[#10b981] bg-[#F0FFF4]' : 'border-transparent bg-gray-50'}`}
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

export default ReviewExpense;
