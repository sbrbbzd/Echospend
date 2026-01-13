
import React from 'react';
import { useRouter } from 'expo-router';
import { Expense } from '../types';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../constants';

interface DashboardProps {
  expenses: Expense[];
  budget: number;
}

const Dashboard: React.FC<DashboardProps> = ({ expenses, budget }) => {
  const router = useRouter();
  
  const totalSpent = expenses.filter(e => !e.isIncome).reduce((acc, curr) => acc + curr.amount, 0);
  const totalIncome = expenses.filter(e => e.isIncome).reduce((acc, curr) => acc + curr.amount, 0);
  const remaining = budget - totalSpent;
  const progressPercent = Math.min(100, (totalSpent / budget) * 100);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 pt-10 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="size-14 rounded-full border-2 border-gray-100 overflow-hidden bg-slate-200">
              <img 
                src="https://picsum.photos/seed/alex/120/120" 
                className="size-full object-cover"
                alt="Avatar"
              />
            </div>
            <div className="absolute bottom-1 right-0 size-3.5 bg-[#10b981] rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-[#111827] leading-tight">Hello, Alex</h1>
            <p className="text-[#6b7280] text-[13px] font-medium">Financial Co-pilot</p>
          </div>
        </div>
        <button onClick={() => router.push('/settings')} className="p-2 text-[#4b5563] hover:bg-gray-50 rounded-full transition-colors">
          <span className="material-symbols-outlined text-[26px]">settings</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-10 hide-scrollbar">
        {/* Budget Card */}
        <div className="mt-4 bg-[#f8fafc] rounded-[32px] p-8 flex flex-col items-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6b7280] mb-6">Budget</p>
          
          <div className="relative size-48 flex items-center justify-center">
            <svg className="size-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle 
                cx="50" cy="50" fill="transparent" r="42" 
                stroke="#e5e7eb" strokeWidth="6"
              ></circle>
              <circle 
                cx="50" cy="50" fill="transparent" r="42" 
                stroke={remaining < 0 ? "#ef4444" : "#10b981"} strokeWidth="6" strokeLinecap="round"
                strokeDasharray="263.89"
                strokeDashoffset={263.89 - (263.89 * progressPercent / 100)}
              ></circle>
            </svg>
            
            <div className="absolute flex flex-col items-center">
              <span className={`text-[36px] font-bold leading-none mb-2 ${remaining < 0 ? 'text-danger' : 'text-[#111827]'}`}>
                ${remaining.toFixed(2)}
              </span>
              <div className={`${remaining < 0 ? 'bg-red-50' : 'bg-[#d1fae5]'} px-3 py-1 rounded-full`}>
                <span className={`text-[11px] font-bold ${remaining < 0 ? 'text-danger' : 'text-[#10b981]'}`}>
                  {remaining < 0 ? 'Overspent' : 'Remaining'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex w-full mt-10 items-center">
            <div className="flex-1 flex flex-col items-center">
              <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider mb-1">Spent</p>
              <p className="text-[19px] font-bold text-[#111827]">${totalSpent.toFixed(2)}</p>
            </div>
            <div className="w-[1px] bg-gray-200 h-8"></div>
            <div className="flex-1 flex flex-col items-center">
              <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider mb-1">Budget</p>
              <p className="text-[19px] font-bold text-[#111827]">${budget.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Central Action Area */}
        <div className="mt-12 flex flex-col items-center gap-6">
          <button 
            onClick={() => router.push('/voice')}
            className="size-[72px] rounded-full bg-[#111827] text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[32px]">mic</span>
          </button>
          
          <p className="text-[#9ca3af] text-[15px] font-medium italic">"Add $12 for lunch"</p>
          
          <button 
            onClick={() => router.push('/manual')}
            className="flex items-center gap-2.5 px-8 py-3.5 rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[20px] text-[#4b5563]">keyboard</span>
            <span className="text-[#4b5563] font-semibold text-[15px]">Manual Entry</span>
          </button>
        </div>

        {/* Recent Activity */}
        <div className="mt-14 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[20px] font-bold text-[#111827]">Recent Activity</h2>
            <button className="text-[14px] font-semibold text-[#9ca3af]">See All</button>
          </div>
          
          <div className="space-y-3">
            {expenses.length > 0 ? (
              expenses.map(expense => (
                <div 
                  key={expense.id}
                  onClick={() => router.push(`/edit/${expense.id}`)}
                  className="flex items-center p-4 rounded-[24px] bg-[#f8fafc] hover:bg-gray-100 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <div className="size-12 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-50">
                    <span className="material-symbols-outlined text-[22px] text-[#111827]">
                      {CATEGORY_ICONS[expense.category] || CATEGORY_ICONS['Other']}
                    </span>
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="font-bold text-[#111827] text-[15px]">{expense.description}</p>
                    <p className="text-[12px] text-[#9ca3af] font-medium mt-0.5">{expense.time} • {expense.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[16px] text-[#111827]">
                      {expense.isIncome ? '+' : '-'}${expense.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-[#9ca3af] py-8 text-sm">No recent transactions</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
