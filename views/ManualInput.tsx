
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { parseExpenseInput } from '../services/geminiService';

const ManualInput: React.FC = () => {
  const router = useRouter();
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcess = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      const result = await parseExpenseInput(text);
      if (result) {
        router.push({ pathname: '/review', params: { parsedData: JSON.stringify(result), originalText: text } });
      } else {
        alert("Sorry, I couldn't understand that. Try being more specific!");
        setIsProcessing(false);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header matching screenshot */}
      <div className="flex items-center px-6 py-12 justify-between sticky top-0 bg-white/80 backdrop-blur-md z-30">
        <button onClick={() => router.push('/')} className="p-2 -ml-2 text-text-main hover:bg-gray-100 rounded-full transition-colors">
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <h2 className="text-lg font-bold text-text-main">Assistant</h2>
        <button className="p-2 -mr-2 text-text-main hover:bg-gray-100 rounded-full">
          <span className="material-symbols-outlined">more_horiz</span>
        </button>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col px-6 gap-6 overflow-y-auto hide-scrollbar pb-32">
        {/* Date Divider */}
        <div className="flex justify-center my-2">
          <span className="bg-[#f1f5f9] text-[#94a3b8] text-[10px] font-bold px-2.5 py-1 rounded-md tracking-widest uppercase">Today</span>
        </div>

        {/* Assistant Block */}
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-full bg-[#10b981] flex items-center justify-center shrink-0 shadow-glow text-white">
            <span className="material-symbols-outlined text-[20px]">smart_toy</span>
          </div>
          
          <div className="flex flex-col gap-3 max-w-[85%]">
            <span className="text-[11px] font-medium text-gray-400 ml-1">EchoSpend Co-pilot</span>
            
            {/* Bubble 1: Greeting */}
            <div className="p-4 rounded-[22px] rounded-tl-sm bg-white shadow-soft border border-gray-100/60 text-[15px] leading-relaxed text-text-main">
              Hi there! 👋 How can I help you log an expense today?
            </div>

            {/* Bubble 2: Suggestion */}
            <div className="p-4 rounded-[22px] bg-white shadow-soft border border-gray-100/60 text-[15px] leading-relaxed">
              <p className="text-gray-400 mb-2">You can say something like:</p>
              <div className="border-l-[3px] border-[#10b981]/30 pl-3">
                <p className="italic text-[#10b981] font-medium">
                  "I spent $50 on groceries at Whole Foods"
                </p>
              </div>
            </div>

            <span className="text-[10px] text-gray-300 font-medium ml-1">Just now</span>
          </div>
        </div>

        {isProcessing && (
          <div className="flex items-center gap-2 ml-14">
            <div className="size-1.5 bg-primary rounded-full animate-bounce"></div>
            <div className="size-1.5 bg-primary rounded-full animate-bounce delay-75"></div>
            <div className="size-1.5 bg-primary rounded-full animate-bounce delay-150"></div>
          </div>
        )}
      </div>

      {/* Bottom Input Bar matching screenshot */}
      <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-white via-white to-transparent z-40">
        <form onSubmit={handleProcess} className="flex items-center gap-3">
          <div className="flex-1 bg-white rounded-full shadow-float border border-gray-100 p-1 pl-4 flex items-center gap-2 focus-within:ring-4 focus-within:ring-[#10b981]/5 transition-all">
            <span className="material-symbols-outlined text-gray-400 text-[20px]">keyboard</span>
            <input 
              autoFocus
              className="flex-1 bg-transparent border-none p-0 py-3 text-sm font-medium placeholder-gray-400 focus:ring-0" 
              placeholder="Add details manually..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isProcessing}
            />
          </div>
          <button 
            type="submit"
            disabled={!text.trim() || isProcessing}
            className="size-12 rounded-full bg-[#111827] text-white flex items-center justify-center shadow-lg active:scale-90 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ManualInput;
