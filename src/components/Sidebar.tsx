import React from 'react';
import {
  Compass,
  BookOpen,
  Trophy,
  User,
  Hand
} from 'lucide-react';
import { MainTabType, UserProfile } from '../types';
import { soundService } from '../services/soundService';
import { PWAInstallButton } from './PWAInstallButton';

interface SidebarProps {
  activeTab: MainTabType;
  setActiveTab: (tab: MainTabType) => void;
  userProfile: UserProfile;
}

export const Sidebar = ({
  activeTab,
  setActiveTab
}: SidebarProps) => {
  const navItems: {
    id: MainTabType;
    label: string;
    mobileLabel: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'learn', label: 'Caminho', mobileLabel: 'Caminho', icon: Compass },
    { id: 'dictionary', label: 'Biblioteca de Sinais', mobileLabel: 'Biblioteca', icon: BookOpen },
    { id: 'leaderboards', label: 'Ranking', mobileLabel: 'Ranking', icon: Trophy },
    { id: 'profile', label: 'Perfil', mobileLabel: 'Perfil', icon: User }
  ];

  const handleNav = (tab: MainTabType) => {
    soundService.playTap();
    setActiveTab(tab);
  };

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside className="hidden md:flex flex-col justify-between w-64 h-screen sticky top-0 bg-[#FAF9F6] border-r border-[#E8E2D9] px-4 py-6 z-30 select-none shrink-0">
        <div className="space-y-8">
          {/* Brand Mark */}
          <button
            type="button"
            onClick={() => handleNav('learn')}
            className="flex items-center gap-3 px-2.5 cursor-pointer group text-left w-full"
          >
            <div className="w-10 h-10 rounded-xl bg-[#0D9488] border-b-[3px] border-[#0F766E] flex items-center justify-center text-white transition-transform group-hover:scale-[1.03] shrink-0">
              <Hand className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-2xl font-bold tracking-tight text-[#1C1917] leading-none">
                Easy<span className="text-[#EA580C]">Lib</span>
              </div>
              <div className="text-[11px] font-bold tracking-widest text-[#0F766E] uppercase mt-0.5">
                Libras
              </div>
            </div>
          </button>

          {/* Primary Nav Links (Only 4 items: Caminho, Biblioteca de Sinais, Ranking, Perfil) */}
          <nav className="space-y-1.5" aria-label="Navegação principal">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  className={`
                    tactile-btn w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm tracking-tight cursor-pointer text-left
                    ${isActive
                      ? 'bg-[#F0FDFA] text-[#0F766E] border border-[#99F6E4] border-b-[3px] border-b-[#0D9488]'
                      : 'text-[#57534E] hover:bg-[#F3F0EA] hover:text-[#1C1917] border border-transparent'}
                  `}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      isActive ? 'stroke-[2.5] text-[#0D9488]' : 'stroke-2 text-[#78716C]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quiet Footer + PWA Install */}
        <div className="space-y-3">
          <PWAInstallButton compact={true} />
          <div className="px-3 py-1 text-xs font-semibold text-[#78716C]">
            EasyLib • Ensino de Libras
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Navegação móvel"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md border-t border-[#E8E2D9] px-2 py-1.5 flex items-center justify-around gap-1"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className={`
                flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-colors cursor-pointer flex-1 min-w-0
                ${isActive
                  ? 'text-[#0F766E] bg-[#F0FDFA] font-bold'
                  : 'text-[#78716C] hover:text-[#1C1917] font-semibold'}
              `}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'stroke-[2.5] text-[#0D9488]' : 'stroke-2'}`} />
              <span className="text-[11px] mt-0.5 truncate max-w-full">{item.mobileLabel}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
