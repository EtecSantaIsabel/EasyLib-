import React from 'react';
import { 
  Sparkles, 
  Trophy, 
  Target, 
  ChevronRight, 
  BookOpen
} from 'lucide-react';
import { UserProfile, MainTabType } from '../types';
import { LIBRAS_DICTIONARY } from '../data/librasData';
import { soundService } from '../services/soundService';

interface RightSidebarProps {
  userProfile: UserProfile;
  onNavigateTab: (tab: MainTabType) => void;
  onPreviewSign?: (signId: string) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  userProfile,
  onNavigateTab,
  onPreviewSign
}) => {
  const handleOpen = (tab: MainTabType) => {
    soundService.playTap();
    onNavigateTab(tab);
  };

  const dailySign = LIBRAS_DICTIONARY[0]; // Oi / Tudo bem

  return (
    <aside className="hidden xl:flex flex-col gap-5 w-80 sticky top-20 h-fit p-4 select-none">
      
      {/* 1. EasyLib Plus Card (Warm Sunset Gradient) */}
      {!userProfile.isSuperDuolingo ? (
        <div className="bg-gradient-to-br from-[#FF6B00] via-[#F97316] to-[#E11D48] rounded-3xl p-5 text-white shadow-xl space-y-3 relative overflow-hidden border-b-4 border-[#9F1239]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm text-[#FEF3C7]">
              EasyLib Plus
            </span>
            <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-black leading-snug">Vidas infinitas e treinos de sinais!</h3>
            <p className="text-xs text-white/95 font-semibold mt-1">Acelere sua fluência em Libras sem limite de erros.</p>
          </div>
          <button
            onClick={() => handleOpen('shop')}
            className="w-full py-2.5 px-4 rounded-2xl bg-white text-[#C2410C] hover:bg-[#FFF7ED] font-black text-xs uppercase tracking-wider border-b-4 border-[#FED7AA] transition-all cursor-pointer active:translate-y-0.5 shadow-md"
          >
            Experimente Grátis
          </button>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-[#FF6B00] to-[#EA580C] rounded-3xl p-4 text-white shadow-md flex items-center gap-3 border-b-4 border-[#C2410C]">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl">
            🤟
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-amber-200">EasyLib Plus Ativo</div>
            <div className="text-sm font-black">Vidas Ilimitadas</div>
          </div>
        </div>
      )}

      {/* 2. Sinal do Dia (Daily Sign Feature) */}
      <div className="bg-white rounded-3xl border-2 border-[#F1EAE2] p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🤟</span>
            <h4 className="font-black text-xs uppercase tracking-wider text-[#292524]">Sinal do Dia</h4>
          </div>
          <button
            onClick={() => handleOpen('dictionary')}
            className="text-[11px] font-black text-[#EA580C] hover:underline flex items-center cursor-pointer"
          >
            <span>Dicionário</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#FFF7ED] border border-[#FED7AA]">
          <div className="w-12 h-12 rounded-2xl bg-white border-2 border-[#FDBA74] flex items-center justify-center text-2xl shadow-xs shrink-0">
            {dailySign.visualGlyph}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-sm text-[#292524] truncate">{dailySign.name}</div>
            <div className="text-xs text-[#C2410C] font-bold truncate">{dailySign.handshapeName.split('(')[0]}</div>
          </div>
        </div>
      </div>

      {/* 3. League Rank Widget */}
      <div className="bg-white rounded-3xl border-2 border-[#F1EAE2] p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#F59E0B]" />
            <h4 className="font-black text-sm text-[#292524]">Divisão {userProfile.currentLeague}</h4>
          </div>
          <button
            onClick={() => handleOpen('leaderboards')}
            className="text-xs font-black text-[#EA580C] hover:underline flex items-center cursor-pointer"
          >
            <span>Ver todas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#FFFDF9] border border-[#F1EAE2]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-white flex items-center justify-center font-black text-xs shadow-xs">
            #4
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-xs text-[#292524] truncate">{userProfile.name}</div>
            <div className="text-[11px] font-bold text-[#78716C]">{userProfile.xp} XP nesta semana</div>
          </div>
          <div className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309]">
            Zona de Subida
          </div>
        </div>
      </div>

      {/* 4. Daily Quests Widget */}
      <div className="bg-white rounded-3xl border-2 border-[#F1EAE2] p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-[#EA580C]" />
            <h4 className="font-black text-sm text-[#292524]">Missões do Dia</h4>
          </div>
          <button
            onClick={() => handleOpen('quests')}
            className="text-xs font-black text-[#EA580C] hover:underline flex items-center cursor-pointer"
          >
            <span>Ver tudo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {userProfile.quests.slice(0, 2).map((quest) => {
            const pct = Math.min(100, Math.round((quest.current / quest.target) * 100));
            return (
              <div key={quest.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-[#292524]">
                  <div className="flex items-center gap-1.5 truncate">
                    <span>{quest.icon}</span>
                    <span className="truncate">{quest.title}</span>
                  </div>
                  <span className="text-[11px] font-black text-[#78716C] shrink-0">
                    {quest.current}/{quest.target}
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full h-2.5 bg-[#F5F5F4] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#FF6B00] to-[#F59E0B] rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </aside>
  );
};
