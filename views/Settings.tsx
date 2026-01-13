
import React from 'react';
import { useRouter } from 'expo-router';
import BottomNav from '../components/BottomNav';
import { db } from '../services/supabaseService';

const Settings: React.FC = () => {
  const router = useRouter();
  const isCloudEnabled = db.isConnected();

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Header */}
      <div className="sticky top-0 z-50 grid grid-cols-[3rem_1fr_3rem] items-center bg-surface/90 backdrop-blur-md px-4 py-3 border-b border-gray-100">
        <button onClick={() => router.push('/')} className="flex items-center justify-start text-text-main hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <h2 className="text-lg font-bold text-center">Settings</h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 flex flex-col p-4 gap-6 overflow-y-auto pb-32 hide-scrollbar">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="relative size-16 rounded-full border-2 border-primary overflow-hidden">
               <img src="https://picsum.photos/seed/alex/120/120" alt="Avatar" className="size-full object-cover" />
               <div className="absolute bottom-0 right-0 size-4 bg-primary rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold">Alex Doe</p>
                <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Pro</span>
              </div>
              <p className="text-text-sub text-sm">alex.doe@echospend.com</p>
            </div>
            <button className="text-gray-300">
              <span className="material-symbols-outlined">edit</span>
            </button>
          </div>
        </div>

        {/* Sync Status */}
        <div className={`rounded-2xl p-4 border flex items-center justify-between transition-all ${isCloudEnabled ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`size-10 rounded-xl flex items-center justify-center ${isCloudEnabled ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}`}>
              <span className="material-symbols-outlined">{isCloudEnabled ? 'cloud_done' : 'cloud_off'}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-text-main">{isCloudEnabled ? 'Cloud Sync Active' : 'Offline Mode'}</p>
              <p className="text-[11px] text-text-sub">{isCloudEnabled ? 'Your data is secured in Supabase' : 'Data is saved only on this device'}</p>
            </div>
          </div>
          {isCloudEnabled && (
            <div className="size-2 bg-green-500 rounded-full animate-pulse"></div>
          )}
        </div>

        {/* Preferences */}
        <div>
          <h3 className="text-text-sub text-xs font-bold uppercase tracking-wider px-2 pb-2">Preferences</h3>
          <div className="flex flex-col bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden divide-y divide-gray-100">
            <button className="flex items-center gap-4 px-4 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary">
                <span className="material-symbols-outlined">graphic_eq</span>
              </div>
              <p className="flex-1 text-left font-medium">Voice Language</p>
              <div className="flex items-center gap-1 text-text-sub">
                <span className="text-sm">English (US)</span>
                <span className="material-symbols-outlined text-xl">chevron_right</span>
              </div>
            </button>
            <button className="flex items-center gap-4 px-4 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary">
                <span className="material-symbols-outlined">currency_exchange</span>
              </div>
              <p className="flex-1 text-left font-medium">Currency</p>
              <div className="flex items-center gap-1 text-text-sub">
                <span className="text-sm">USD ($)</span>
                <span className="material-symbols-outlined text-xl">chevron_right</span>
              </div>
            </button>
            <div className="flex items-center gap-4 px-4 py-4">
              <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary">
                <span className="material-symbols-outlined">mic</span>
              </div>
              <p className="flex-1 text-left font-medium">Listen for "Echo"</p>
              <div className="relative inline-block w-11 h-6 align-middle select-none transition duration-200 ease-in">
                <input type="checkbox" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 checked:right-0 checked:border-primary right-5 transition-all outline-none" defaultChecked />
                <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-200 cursor-pointer"></label>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="pt-2 pb-4 flex flex-col items-center gap-4">
           <button className="w-full py-4 bg-white border border-red-50 text-red-500 font-semibold rounded-2xl shadow-soft flex items-center justify-center gap-2 hover:bg-red-50">
              <span className="material-symbols-outlined text-[20px]">logout</span>
              Log Out
           </button>
           <p className="text-[10px] text-text-sub font-medium">EchoSpend v2.4.0 (Build 394)</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Settings;
