import React, { useState } from 'react';
import { 
  Trophy, 
  Flame, 
  ChevronUp, 
  ChevronDown, 
  Minus, 
  Sparkles, 
  Clock,
  ShieldCheck,
  Medal
} from 'lucide-react';
import { LeagueTier, UserProfile } from '../types';
import { LEADERBOARD_NAMES } from '../data/librasData';
import { soundService } from '../services/soundService';

interface LeaderboardViewProps {
  userProfile: UserProfile;
}

const ALL_LEAGUES: LeagueTier[] = [
  'Bronze',
  'Prata',
  'Ouro',
  'Safira',
  'Rubi',
  'Esmeralda',
  'Ametista',
  'Pérola',
  'Obsidiana',
  'Diamante'
];

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  userProfile
}) => {
  const [selectedLeague, setSelectedLeague] = useState<LeagueTier>(userProfile.currentLeague);

  // Generate 30 leaderboard players with user inserted
  const rawPlayers = LEADERBOARD_NAMES.map((p, idx) => ({
    id: `user_${idx}`,
    name: p.name,
    username: p.username,
    avatar: p.avatar,
    xp: p.xp,
    streak: Math.floor(Math.random() * 20) + 1,
    flag: p.flag,
    isCurrentUser: false
  }));

  // Insert current user
  const currentUserEntry = {
    id: 'current_user',
    name: userProfile.name,
    username: userProfile.username,
    avatar: userProfile.avatar,
    xp: userProfile.xp,
    streak: userProfile.streakDays,
    flag: '🇧🇷',
    isCurrentUser: true
  };

  const allPlayers = [...rawPlayers, currentUserEntry].sort((a, b) => b.xp - a.xp);

  const leagueBadgeColors: Record<LeagueTier, string> = {
    Bronze: 'bg-[#CD7F32] text-white',
    Prata: 'bg-[#C0C0C0] text-gray-900',
    Ouro: 'bg-[#FFD700] text-amber-950',
    Safira: 'bg-[#0F52BA] text-white',
    Rubi: 'bg-[#E0115F] text-white',
    Esmeralda: 'bg-[#50C878] text-white',
    Ametista: 'bg-[#9966CC] text-white',
    Pérola: 'bg-[#EAE0D5] text-amber-900',
    Obsidiana: 'bg-[#333333] text-white',
    Diamante: 'bg-gradient-to-r from-[#1CB0F6] via-[#CE82FF] to-[#00E5FF] text-white'
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-6 select-none animate-fade-in">
      
      {/* Header Banner (Warm Sunset Card) */}
      <div className="bg-gradient-to-r from-[#FF6B00] via-[#F97316] to-[#EA580C] rounded-3xl p-6 text-white border-b-6 border-[#9A3412] shadow-lg flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-[#FEF3C7]" />
            <span className="text-xs font-black uppercase tracking-widest text-[#FEF3C7]">
              Divisão Semanal • EasyLib
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">Liga {selectedLeague}</h2>
          <p className="text-xs text-white/95 font-bold flex items-center gap-1.5 pt-1">
            <Clock className="w-4 h-4" />
            <span>Termina em 2 dias e 14 horas</span>
          </p>
        </div>

        <div className="w-16 h-16 rounded-3xl bg-white/20 flex items-center justify-center text-3xl shadow-inner shrink-0">
          🏆
        </div>
      </div>

      {/* League Selection Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {ALL_LEAGUES.map((tier) => {
          const isSelected = selectedLeague === tier;
          return (
            <button
              key={tier}
              onClick={() => {
                soundService.playTap();
                setSelectedLeague(tier);
              }}
              className={`
                px-4 py-2 rounded-2xl font-black text-xs shrink-0 cursor-pointer transition-all active:translate-y-0.5 border-b-4
                ${isSelected
                  ? `${leagueBadgeColors[tier]} border-black/20 shadow-md scale-105`
                  : 'bg-white text-[#78716C] border-[#F1EAE2] hover:bg-[#FFF7ED]'}
              `}
            >
              {tier}
            </button>
          );
        })}
      </div>

      {/* Promotion & Relegation Guide */}
      <div className="grid grid-cols-2 gap-3 text-center text-xs font-black">
        <div className="p-3 rounded-2xl bg-[#FFEDD5] text-[#C2410C] border border-[#FDBA74] flex items-center justify-center gap-1.5">
          <ChevronUp className="w-4 h-4 stroke-[3]" />
          <span>Top 7: Sobem para a próxima liga</span>
        </div>
        <div className="p-3 rounded-2xl bg-[#FFE4E6] text-[#E11D48] border border-[#FECDD3] flex items-center justify-center gap-1.5">
          <ChevronDown className="w-4 h-4 stroke-[3]" />
          <span>Últimos 5: Caem de divisão</span>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-3xl border-2 border-[#F1EAE2] overflow-hidden shadow-sm divide-y-2 divide-[#F1EAE2]">
        {allPlayers.map((player, idx) => {
          const rank = idx + 1;
          const isTop3 = rank <= 3;
          const isPromotionZone = rank <= 7;
          const isDemotionZone = rank > allPlayers.length - 5;

          return (
            <div
              key={player.id}
              className={`
                px-4 py-3.5 flex items-center justify-between gap-3 transition-colors
                ${player.isCurrentUser ? 'bg-[#FFF7ED] border-y-2 border-[#FDBA74]' : 'hover:bg-[#FFFDF9]'}
              `}
            >
              {/* Rank number */}
              <div className="flex items-center gap-3 w-10 shrink-0">
                {rank === 1 ? (
                  <span className="text-xl">🥇</span>
                ) : rank === 2 ? (
                  <span className="text-xl">🥈</span>
                ) : rank === 3 ? (
                  <span className="text-xl">🥉</span>
                ) : (
                  <span className={`font-black text-sm ${isPromotionZone ? 'text-[#EA580C]' : isDemotionZone ? 'text-[#E11D48]' : 'text-[#A8A29E]'}`}>
                    {rank}
                  </span>
                )}
              </div>

              {/* Avatar & Name */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-[#FFF7ED] border border-[#FED7AA] flex items-center justify-center text-xl shrink-0">
                  {player.avatar}
                </div>
                <div className="min-w-0">
                  <div className="font-black text-sm text-[#292524] truncate flex items-center gap-1.5">
                    <span>{player.name}</span>
                    {player.isCurrentUser && (
                      <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-[#EA580C] text-white">
                        Você
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-bold text-[#A8A29E] flex items-center gap-1">
                    <span>{player.flag}</span>
                    <span>{player.streak} dias 🔥</span>
                  </div>
                </div>
              </div>

              {/* XP Count */}
              <div className="text-right shrink-0">
                <div className="font-black text-sm text-[#292524]">{player.xp} XP</div>
                <div className="text-[10px] font-bold text-[#A8A29E]">
                  {isPromotionZone ? '▲ Subindo' : isDemotionZone ? '▼ Caindo' : '— Mantém'}
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
