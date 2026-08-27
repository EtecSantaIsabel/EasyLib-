import React from 'react';
import { Target, Gift, Sparkles, CheckCircle2, Zap, Gem } from 'lucide-react';
import { UserProfile, Quest } from '../types';
import { DuoOwl } from '../components/DuoOwl';
import { soundService } from '../services/soundService';

interface QuestsViewProps {
  userProfile: UserProfile;
  onClaimQuest: (questId: string) => void;
}

export const QuestsView: React.FC<QuestsViewProps> = ({
  userProfile,
  onClaimQuest
}) => {
  const quests = userProfile.quests;
  const completedCount = quests.filter(q => q.completed).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-6 select-none animate-fade-in">
      
      {/* Monthly Challenge Banner (Warm Sunset Card) */}
      <div className="bg-gradient-to-r from-[#FF6B00] via-[#F97316] to-[#EA580C] rounded-3xl p-6 text-white border-b-6 border-[#9A3412] shadow-lg flex items-center justify-between gap-4">
        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full text-[#FEF3C7]">
            Desafio Mensal EasyLib
          </span>
          <h2 className="text-2xl sm:text-3xl font-black">Medalha de Mestre em Libras</h2>
          <p className="text-xs text-white/95 font-bold">
            Complete 20 missões diárias este mês para desbloquear o distintivo exclusivo!
          </p>

          {/* Monthly progress */}
          <div className="pt-2 space-y-1">
            <div className="flex justify-between text-xs font-black">
              <span>Progresso Geral</span>
              <span>12 / 20 Missões</span>
            </div>
            <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-300 rounded-full w-[60%]" />
            </div>
          </div>
        </div>

        <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center text-4xl shadow-inner shrink-0 animate-bounce">
          🎖️
        </div>
      </div>

      {/* Daily Quests Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <Target className="w-6 h-6 text-[#EA580C]" />
          <h3 className="text-xl font-black text-[#292524]">Missões Diárias</h3>
        </div>
        <span className="text-xs font-black text-[#78716C]">
          {completedCount} de {quests.length} concluídas
        </span>
      </div>

      {/* Daily Quests Cards */}
      <div className="space-y-4">
        {quests.map((quest) => {
          const pct = Math.min(100, Math.round((quest.current / quest.target) * 100));

          return (
            <div
              key={quest.id}
              className="bg-white rounded-3xl border-2 border-[#F1EAE2] border-b-6 border-[#FED7AA] p-5 space-y-3 shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFEDD5] text-[#EA580C] flex items-center justify-center text-2xl border-2 border-[#FDBA74] shrink-0">
                    {quest.icon}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-black text-base text-[#292524]">{quest.title}</h4>
                    <p className="text-xs text-[#78716C] font-semibold">{quest.description}</p>
                  </div>
                </div>

                {/* Rewards preview */}
                <div className="flex items-center gap-2 text-xs font-black shrink-0">
                  <span className="text-[#D97706] flex items-center gap-1">
                    <Gem className="w-3.5 h-3.5 fill-current" />
                    <span>+{quest.rewardGems}</span>
                  </span>
                  <span className="text-[#EA580C] flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>+{quest.rewardXp}</span>
                  </span>
                </div>
              </div>

              {/* Progress Bar & Claim Button */}
              <div className="flex items-center gap-4 pt-2 border-t border-[#F1EAE2]">
                <div className="flex-1 space-y-1">
                  <div className="w-full h-3.5 bg-[#F1EAE2] rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${quest.completed ? 'bg-[#FF6B00]' : 'bg-[#F59E0B]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-black text-[#A8A29E]">
                    <span>{pct}%</span>
                    <span>{quest.current} / {quest.target}</span>
                  </div>
                </div>

                {quest.completed ? (
                  <button
                    disabled={quest.claimed}
                    onClick={() => {
                      soundService.playCorrect();
                      onClaimQuest(quest.id);
                    }}
                    className={`
                      px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider border-b-4 transition-all
                      ${quest.claimed
                        ? 'bg-[#E7E5E4] text-[#A8A29E] border-[#D6D3D1] cursor-not-allowed'
                        : 'bg-[#FF6B00] hover:bg-[#EA580C] text-white border-[#9A3412] cursor-pointer shadow-md active:translate-y-0.5'}
                    `}
                  >
                    {quest.claimed ? 'Resgatado' : 'Resgatar!'}
                  </button>
                ) : (
                  <div className="px-3 py-1.5 rounded-xl bg-[#FFFDF9] border border-[#F1EAE2] text-[#A8A29E] font-black text-xs">
                    Em andamento
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
