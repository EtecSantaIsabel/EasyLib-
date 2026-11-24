import React from 'react';
import { Target, Zap, Gem, Award } from 'lucide-react';
import { UserProfile } from '../types';
import { LibiMascot } from '../components/LibiMascot';
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
  const completedCount = quests.filter((q) => q.completed).length;

  return (
    <div className="max-w-xl mx-auto px-2 sm:px-4 py-2 space-y-6 select-none animate-fade-in">
      {/* Monthly Challenge */}
      <div className="bg-[#0D9488] rounded-2xl p-5 sm:p-6 text-white border-b-4 border-[#0F766E] flex items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#CCFBF1]">
            Desafio mensal
          </span>
          <h2 className="font-display text-2xl font-bold">Distintivo do Mês</h2>
          <p className="text-xs text-white/90 font-medium">
            Conclua 20 missões diárias este mês para conquistar o distintivo.
          </p>

          <div className="pt-1 space-y-1">
            <div className="flex justify-between text-xs font-bold">
              <span>Progresso</span>
              <span>12 / 20 missões</span>
            </div>
            <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden">
              <div className="h-full bg-[#F59E0B] rounded-full w-[60%]" />
            </div>
          </div>
        </div>

        <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
          <Award className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* Daily Quests Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-[#EA580C]" />
          <h3 className="font-display text-xl font-bold text-[#1C1917]">Missões diárias</h3>
        </div>
        <span className="text-xs font-bold text-[#57534E]">
          {completedCount} de {quests.length} concluídas
        </span>
      </div>

      {/* Quests List */}
      <div className="bg-white rounded-2xl border border-[#E8E2D9] divide-y divide-[#E8E2D9]">
        {quests.map((quest) => {
          const pct = Math.min(100, Math.round((quest.current / quest.target) * 100));

          return (
            <div key={quest.id} className="p-4 sm:p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5 min-w-0">
                  <h4 className="font-bold text-base text-[#1C1917]">{quest.title}</h4>
                  <p className="text-xs text-[#57534E] font-medium">{quest.description}</p>
                </div>

                <div className="flex items-center gap-3 text-xs font-bold shrink-0">
                  <span className="text-[#B45309] flex items-center gap-1">
                    <Gem className="w-3.5 h-3.5 fill-[#F59E0B]" />
                    <span>+{quest.rewardGems}</span>
                  </span>
                  <span className="text-[#EA580C] flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>+{quest.rewardXp}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <div className="flex-1 space-y-1">
                  <div className="w-full h-2.5 bg-[#F3F0EA] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        quest.completed ? 'bg-[#0D9488]' : 'bg-[#EA580C]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-semibold text-[#78716C]">
                    <span>{pct}%</span>
                    <span>
                      {quest.current} / {quest.target}
                    </span>
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
                      tactile-btn px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider border-b-[3px] shrink-0
                      ${quest.claimed
                        ? 'bg-[#E8E2D9] text-[#78716C] border-[#D6CFC5] cursor-not-allowed'
                        : 'bg-[#EA580C] hover:bg-[#DC4F06] text-white border-[#9A3412] cursor-pointer'}
                    `}
                  >
                    {quest.claimed ? 'Resgatado' : 'Resgatar'}
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-[#78716C] shrink-0">
                    Em progresso
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mascot Footer Tip */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#F0FDFA] border border-[#99F6E4]">
        <LibiMascot mood="incentivando" size="xs" />
        <p className="text-xs font-medium text-[#115E59] leading-relaxed">
          Complete lições curtas ou treine um sinal na câmera para avançar nas missões de hoje.
        </p>
      </div>
    </div>
  );
};
