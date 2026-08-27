import React from 'react';
import { 
  Home, 
  Trophy, 
  User, 
  Camera
} from 'lucide-react';
import { MainTabType, UserProfile } from '../types';
import { soundService } from '../services/soundService';

interface SidebarProps {
  activeTab: MainTabType;
  setActiveTab: (tab: MainTabType) => void;
  userProfile: UserProfile;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userProfile
}) => {
  const navItems: { id: MainTabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'learn', label: 'CAMINHO', icon: Home },
    { id: 'camera', label: 'CÂMERA', icon: Camera },
    { id: 'leaderboards', label: 'RANKING', icon: Trophy },
    { id: 'profile', label: 'PERFIL', icon: User }
  ];

  const handleNav = (tab: MainTabType) => {
    soundService.playTap();
    setActiveTab(tab);
  };

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside className="hidden md:flex flex-col justify-between w-64 h-screen sticky top-0 bg-[#FFFDF9] border-r-2 border-[#F1EAE2] px-4 py-6 z-30 select-none">
        
        {/* Brand Logo */}
        <div className="space-y-6">
          <div 
            onClick={() => handleNav('learn')}
            className="flex items-center gap-3 px-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FF6B00] to-[#EA580C] border-b-4 border-[#C2410C] flex items-center justify-center text-white font-black text-2xl shadow-md group-hover:scale-105 transition-transform">
              <span>🤟</span>
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight text-[#EA580C] leading-none flex items-center gap-1">
                <span>EasyLib</span>
              </div>
              <div className="text-[10px] font-black tracking-widest text-[#B45309] uppercase mt-1 flex items-center gap-1">
                <span>LIBRAS</span>
                <span className="text-xs">🇧🇷</span>
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`
                    w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-black text-xs tracking-wider transition-all duration-150 cursor-pointer
                    ${isActive
                      ? 'bg-[#FFEDD5] text-[#C2410C] border-2 border-[#FDBA74] shadow-xs'
                      : 'text-[#78716C] hover:bg-[#FFF7ED] hover:text-[#C2410C] border-2 border-transparent'}
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.8] text-[#EA580C]' : 'stroke-2'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="px-3 py-2 text-center text-[11px] font-bold text-[#A8A29E]">
          EasyLib Libras • Prática com Câmera
        </div>

      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFDF9]/95 backdrop-blur-md border-t-2 border-[#F1EAE2] px-2 py-2 flex items-center justify-around shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`
                flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer flex-1
                ${isActive
                  ? 'text-[#EA580C] scale-105 font-black'
                  : 'text-[#A8A29E] hover:text-[#78716C]'}
              `}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.8]' : 'stroke-2'}`} />
              <span className="text-[10px] font-black tracking-tight mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
