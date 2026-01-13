
import React from 'react';
import { useRouter, usePathname } from 'expo-router';

const BottomNav: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-md border-t border-gray-100 pb-8 pt-3 px-12 flex justify-between items-center z-50">
      <button 
        onClick={() => router.push('/')}
        className={`flex flex-col items-center gap-1 transition-colors ${isActive('/') ? 'text-primary' : 'text-gray-400'}`}
      >
        <span className={`material-symbols-outlined text-2xl ${isActive('/') ? 'fill-current' : ''}`}>home</span>
        <span className="text-[10px] font-medium">Home</span>
      </button>

      <button 
        onClick={() => router.push('/voice')}
        className="relative -mt-12 flex items-center justify-center size-14 rounded-full bg-primary text-white shadow-lg active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined text-3xl">mic</span>
      </button>

      <button 
        onClick={() => router.push('/settings')}
        className={`flex flex-col items-center gap-1 transition-colors ${isActive('/settings') ? 'text-primary' : 'text-gray-400'}`}
      >
        <span className={`material-symbols-outlined text-2xl ${isActive('/settings') ? 'fill-current' : ''}`}>settings</span>
        <span className="text-[10px] font-medium">Settings</span>
      </button>
    </div>
  );
};

export default BottomNav;
