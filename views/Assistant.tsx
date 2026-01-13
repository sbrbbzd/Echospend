
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { processAssistantMessage, sendToolResponse } from '../services/geminiService';
import { Expense } from '../types';

interface AssistantProps {
  expenses: Expense[];
  budget: number;
  onUpdateBudget: (newBudget: number) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isSuggestion?: boolean;
}

const Assistant: React.FC<AssistantProps> = ({ expenses, budget, onUpdateBudget }) => {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi there! 👋 How can I help you log an expense today?' },
    { role: 'assistant', content: 'You can say something like:\n"I spent $50 on groceries at Whole Foods"', isSuggestion: true }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleToolCalls = async (modelParts: any[], toolCalls: any[], originalMessage: string) => {
    const results = [];
    
    for (const call of toolCalls) {
      let result: any = "Unknown function";
      
      if (call.name === 'getFinancialSummary') {
        const spent = expenses.filter(e => !e.isIncome).reduce((a, b) => a + b.amount, 0);
        const income = expenses.filter(e => e.isIncome).reduce((a, b) => a + b.amount, 0);
        result = { 
          totalSpent: spent, 
          totalIncome: income, 
          remainingBudget: budget - spent,
          currentBudgetLimit: budget 
        };
      } else if (call.name === 'searchTransactions') {
        const q = call.args.query?.toLowerCase() || "";
        const cat = call.args.category?.toLowerCase() || "";
        const found = expenses.filter(e => 
          e.description.toLowerCase().includes(q) || 
          e.category.toLowerCase().includes(cat)
        );
        result = { count: found.length, transactions: found.slice(0, 5) };
      } else if (call.name === 'updateBudget') {
        onUpdateBudget(call.args.newAmount);
        result = { success: true, newBudget: call.args.newAmount };
      }
      
      results.push({ id: call.id, name: call.name, result });
    }

    try {
      const finalResponse = await sendToolResponse(modelParts, results, originalMessage);
      return finalResponse?.text || "I've processed your request.";
    } catch (e) {
      console.error("Error sending tool response:", e);
      return "I processed the request, but had trouble reporting back.";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg = inputValue;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await processAssistantMessage(userMsg, messages, { expenses, budget });
      
      if (response && response.functionCalls && response.functionCalls.length > 0) {
        const modelParts = response.candidates?.[0]?.content?.parts || [];
        const finalContent = await handleToolCalls(modelParts, response.functionCalls, userMsg);
        setMessages(prev => [...prev, { role: 'assistant', content: finalContent }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: response?.text || "I'm not sure how to help with that." }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error processing your request." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="flex items-center px-6 py-12 justify-between sticky top-0 bg-white/80 backdrop-blur-md z-30">
        <button onClick={() => router.push('/')} className="p-2 -ml-2 text-text-main hover:bg-gray-100 rounded-full transition-colors">
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <h2 className="text-lg font-bold text-text-main">Assistant</h2>
        <button className="p-2 -mr-2 text-text-main hover:bg-gray-100 rounded-full">
          <span className="material-symbols-outlined">more_horiz</span>
        </button>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 flex flex-col px-6 gap-8 overflow-y-auto hide-scrollbar pb-36"
      >
        {/* Date Divider */}
        <div className="flex justify-center">
          <span className="bg-[#f1f5f9] text-[#94a3b8] text-[10px] font-bold px-2.5 py-1 rounded-md tracking-widest uppercase">Today</span>
        </div>

        {messages.map((msg, i) => (
          <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Fix: Corrected logic to show avatar only for first assistant message in a block, avoiding type mismatch error. */}
            {msg.role === 'assistant' && (i === 0 || messages[i-1]?.role !== 'assistant') ? (
              <div className="size-10 rounded-full bg-[#10b981] flex items-center justify-center shrink-0 shadow-glow text-white">
                <span className="material-symbols-outlined text-[20px]">smart_toy</span>
              </div>
            ) : (
              <div className="size-10 shrink-0"></div>
            )}
            
            <div className={`flex flex-col gap-1 max-w-[80%] ${msg.role === 'user' ? 'items-end' : ''}`}>
              {msg.role === 'assistant' && (i === 0 || messages[i-1].role === 'user') && (
                <span className="text-[11px] font-medium text-gray-400 ml-1 mb-1">EchoSpend Co-pilot</span>
              )}
              
              <div className={`p-4 rounded-[22px] shadow-sm border border-gray-100/60 text-[15px] leading-relaxed transition-all ${
                msg.role === 'assistant' 
                  ? (msg.isSuggestion ? 'bg-white border-dashed border-[#10b981]/30' : 'bg-white rounded-tl-sm') 
                  : 'bg-[#111827] text-white rounded-tr-sm'
              }`}>
                {msg.isSuggestion ? (
                  <div className="space-y-2">
                    <p className="text-gray-400">You can say something like:</p>
                    <p className="italic text-[#10b981] font-medium">
                      "{msg.content.split('\n')[1].replace(/"/g, '')}"
                    </p>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
              
              {i === messages.length - 1 && (
                <span className="text-[10px] text-gray-300 font-medium mt-1 mr-1">
                  {msg.role === 'assistant' ? 'Just now' : 'Seen'}
                </span>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 ml-14">
            <div className="size-1.5 bg-gray-300 rounded-full animate-bounce"></div>
            <div className="size-1.5 bg-gray-300 rounded-full animate-bounce delay-75"></div>
            <div className="size-1.5 bg-gray-300 rounded-full animate-bounce delay-150"></div>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-white via-white to-transparent z-40">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <div className="flex-1 bg-white rounded-full shadow-float border border-gray-100 p-1 pl-4 flex items-center gap-2 focus-within:ring-4 focus-within:ring-[#10b981]/5">
            <span className="material-symbols-outlined text-gray-400 text-[20px]">keyboard</span>
            <input 
              className="flex-1 bg-transparent border-none p-0 py-3 text-sm font-medium placeholder-gray-400 focus:ring-0" 
              placeholder="Add details manually..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isTyping}
            />
          </div>
          <button 
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="size-12 rounded-full bg-[#111827] text-white flex items-center justify-center shadow-lg active:scale-90 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Assistant;
