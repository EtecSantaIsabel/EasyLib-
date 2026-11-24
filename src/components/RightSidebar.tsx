import React from 'react';
import {
  Trophy,
  Target,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { User } from 'firebase/auth';
import { UserProfile, MainTabType } from '../types';
import { LibiMascot } from './LibiMascot';
import { soundService } from '../services/soundService';

interface RightSidebarProps {
  userProfile: UserProfile;
  onNavigateTab: (tab: MainTabType) => void;
  firebaseUser?: User | null;
  authBusy?: boolean;
  onOpenAuthModal?: () => void;
}

export const RightSidebar = ({
  userProfile,
  onNavigateTab,
  firebaseUser,
  authBusy = false,
  onOpenAuthModal
}: RightSidebarProps) => {
  const handleOpen = (tab: MainTabType) => {
    soundService.playTap();
    onNavigateTab(tab);
  };

  return (
    <aside className="hidden xl:flex flex-col gap-4 w-80 sticky top-16 h-fit py-4 pr-4 select-none shrink-0">
      {/* 1. Shortcut: Biblioteca de Sinais (255 sinais) */}
      <div className="bg-[#F0FDFA] rounded-2xl border border-[#99F6E4] p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <h3 className="font-display text-lg font-bold text-[#0F766E] leading-snug">
              Biblioteca de Sinais
            </h3>
            <p className="text-xs text-[#115E59] font-medium leading-relaxed">
              Consulte 255 sinais em Libras com demonstração em vídeo e câmera lenta.
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#0D9488] text-white flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleOpen('dictionary')}
          className="tactile-btn w-full py-2.5 px-4 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs uppercase tracking-wider border-b-4 border-[#115E59] cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Explorar 255 sinais</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Missões Diárias */}
      <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Target className="w-4 h-4 text-[#EA580C] shrink-0" />
            <h4 className="font-display font-bold text-base text-[#1C1917] truncate">
              Missões Diárias
            </h4>
          </div>
          <button
            type="button"
            onClick={() => handleOpen('quests')}
            className="text-xs font-bold text-[#EA580C] hover:underline flex items-center cursor-pointer shrink-0"
          >
            <span>Ver todas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {userProfile.quests.slice(0, 2).map((quest) => {
            const pct = Math.min(100, Math.round((quest.current / quest.target) * 100));
            return (
              <div key={quest.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#1C1917] gap-2">
                  <span className="truncate">{quest.title}</span>
                  <span className="text-[11px] font-bold text-[#78716C] shrink-0">
                    {quest.current}/{quest.target}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#F3F0EA] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      quest.completed ? 'bg-[#0D9488]' : 'bg-[#EA580C]'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Salvar Progresso / Ranking */}
      {!firebaseUser ? (
        <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 space-y-3.5">
          <div className="flex items-center gap-3">
            <LibiMascot mood="acenando" size="xs" />
            <div className="space-y-0.5 min-w-0">
              <h4 className="font-display font-bold text-base text-[#1C1917] leading-tight">
                Salve seu progresso
              </h4>
              <p className="text-xs text-[#57534E] leading-snug">
                Entre com Google, Apple, E-mail ou Celular para guardar seus pontos e ranking.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {onOpenAuthModal && (
              <button
                type="button"
                onClick={() => {
                  soundService.playTap();
                  onOpenAuthModal();
                }}
                disabled={authBusy}
                className="tactile-btn w-full py-2.5 px-4 rounded-xl bg-[#EA580C] hover:bg-[#DC4F06] disabled:opacity-60 text-white font-bold text-xs uppercase tracking-wider border-b-4 border-[#9A3412] cursor-pointer"
              >
                {authBusy ? 'Conectando...' : 'Entrar ou criar conta'}
              </button>
            )}
            <button
              type="button"
              onClick={() => handleOpen('leaderboards')}
              className="w-full py-2 px-3 rounded-xl text-[#0F766E] hover:bg-[#F0FDFA] font-bold text-xs cursor-pointer transition-colors"
            >
              Entrar em sala de ranking
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Trophy className="w-4 h-4 text-[#EA580C] shrink-0" />
              <h4 className="font-display font-bold text-base text-[#1C1917] truncate">
                Ranking por sala
              </h4>
            </div>
            <button
              type="button"
              onClick={() => handleOpen('leaderboards')}
              className="text-xs font-bold text-[#EA580C] hover:underline flex items-center cursor-pointer shrink-0"
            >
              <span>Abrir</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between pt-1 text-sm gap-2">
            <span className="font-semibold text-[#57534E] truncate">{userProfile.name}</span>
            <span className="font-bold text-[#0F766E] shrink-0 tabular-nums">{userProfile.xp} XP</span>
          </div>
        </div>
      )}
    </aside>
  );
};
