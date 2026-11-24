import React, { useState } from 'react';
import {
  Heart,
  Flame,
  Gem,
  ShieldCheck,
  Zap,
  ShoppingBag
} from 'lucide-react';
import { UserProfile, DuoOutfit } from '../types';
import { DUO_OUTFITS } from '../data/librasData';
import { LibiMascot } from '../components/LibiMascot';
import { soundService } from '../services/soundService';

interface ShopViewProps {
  userProfile: UserProfile;
  onBuyItem: (itemId: string, cost: number) => void;
  onEquipOutfit: (outfitId: string) => void;
  onToggleSuper: () => void;
}

export const ShopView: React.FC<ShopViewProps> = ({
  userProfile,
  onBuyItem,
  onEquipOutfit,
  onToggleSuper
}) => {
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleBuyPowerup = (type: 'hearts' | 'freeze' | 'wager', cost: number) => {
    if (userProfile.gems < cost) {
      soundService.playIncorrect();
      showToast('Gemas insuficientes. Conclua lições para ganhar mais.');
      return;
    }
    soundService.playCorrect();
    onBuyItem(type, cost);
    showToast('Item adquirido com sucesso.');
  };

  const handleOutfitAction = (outfit: DuoOutfit) => {
    const isUnlocked = userProfile.unlockedOutfits.includes(outfit.id);
    if (isUnlocked) {
      soundService.playTap();
      onEquipOutfit(outfit.id);
      showToast(`${outfit.name} equipado.`);
    } else {
      if (userProfile.gems < outfit.price) {
        soundService.playIncorrect();
        showToast('Gemas insuficientes para este item.');
        return;
      }
      soundService.playLessonComplete();
      onBuyItem(outfit.id, outfit.price);
      onEquipOutfit(outfit.id);
      showToast(`${outfit.name} liberado e equipado.`);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-2 sm:px-4 py-2 space-y-6 select-none animate-fade-in">
      {feedbackMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#1C1917] text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg animate-fade-in">
          {feedbackMsg}
        </div>
      )}

      {/* EasyLib Plus Banner */}
      <div className="bg-[#0D9488] rounded-2xl p-5 sm:p-6 text-white border-b-4 border-[#0F766E] space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#CCFBF1]">
              EasyLib Plus
            </span>
            <h2 className="font-display text-2xl font-bold">
              Vidas ilimitadas nos treinos
            </h2>
            <p className="text-xs text-white/90 font-medium">
              Pratique quantas vezes quiser sem perder vidas ao errar um sinal.
            </p>
          </div>
          <LibiMascot mood="comemorando" size="sm" />
        </div>

        <button
          onClick={() => {
            soundService.playLessonComplete();
            onToggleSuper();
            showToast(
              userProfile.isSuperDuolingo
                ? 'EasyLib Plus desativado.'
                : 'EasyLib Plus ativado!'
            );
          }}
          className="tactile-btn w-full py-3 px-4 rounded-xl bg-white text-[#0F766E] hover:bg-[#F0FDFA] font-bold text-xs uppercase tracking-wider border-b-4 border-[#99F6E4] cursor-pointer"
        >
          {userProfile.isSuperDuolingo ? 'Desativar Plus' : 'Ativar EasyLib Plus'}
        </button>
      </div>

      {/* Power-ups */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#EA580C]" />
          <h3 className="font-display text-lg font-bold text-[#1C1917]">Itens</h3>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E2D9] divide-y divide-[#E8E2D9]">
          {/* Refill Hearts */}
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#FFF1F2] text-[#E11D48] flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <h4 className="font-bold text-sm text-[#1C1917]">Recarga de vidas</h4>
                <p className="text-xs text-[#57534E]">
                  Restaura todas as 5 vidas agora mesmo.
                </p>
              </div>
            </div>

            <button
              disabled={userProfile.hearts >= userProfile.maxHearts || userProfile.isSuperDuolingo}
              onClick={() => handleBuyPowerup('hearts', 350)}
              className={`
                tactile-btn px-3.5 py-2 rounded-xl font-bold text-xs border-b-[3px] shrink-0 flex items-center gap-1
                ${userProfile.hearts >= userProfile.maxHearts || userProfile.isSuperDuolingo
                  ? 'bg-[#E8E2D9] text-[#78716C] border-[#D6CFC5] cursor-not-allowed'
                  : 'bg-[#EA580C] hover:bg-[#DC4F06] text-white border-[#9A3412] cursor-pointer'}
              `}
            >
              <span>350</span>
              <Gem className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>

          {/* Streak Freeze */}
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#F0FDFA] text-[#0D9488] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <h4 className="font-bold text-sm text-[#1C1917]">Bloqueio de ofensiva</h4>
                <p className="text-xs text-[#57534E]">
                  Protege sua sequência caso você falte 1 dia.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleBuyPowerup('freeze', 200)}
              className="tactile-btn px-3.5 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs border-b-[3px] border-[#115E59] shrink-0 cursor-pointer flex items-center gap-1"
            >
              <span>200</span>
              <Gem className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>

          {/* Double or Nothing */}
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#FFF1E6] text-[#EA580C] flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <h4 className="font-bold text-sm text-[#1C1917]">Desafio 7 dias</h4>
                <p className="text-xs text-[#57534E]">
                  Aposte 50 gemas. Complete 7 dias seguidos para ganhar 100.
                </p>
              </div>
            </div>

            <button
              disabled={userProfile.wagerActive}
              onClick={() => handleBuyPowerup('wager', 50)}
              className={`
                tactile-btn px-3.5 py-2 rounded-xl font-bold text-xs border-b-[3px] shrink-0 flex items-center gap-1
                ${userProfile.wagerActive
                  ? 'bg-[#E8E2D9] text-[#78716C] border-[#D6CFC5] cursor-not-allowed'
                  : 'bg-[#EA580C] hover:bg-[#DC4F06] text-white border-[#9A3412] cursor-pointer'}
              `}
            >
              {userProfile.wagerActive ? (
                <span>Ativo</span>
              ) : (
                <>
                  <span>50</span>
                  <Gem className="w-3.5 h-3.5 fill-current" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mascot Outfits */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-[#0D9488]" />
          <h3 className="font-display text-lg font-bold text-[#1C1917]">Estilos da Libi</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DUO_OUTFITS.map((outfit) => {
            const isUnlocked = userProfile.unlockedOutfits.includes(outfit.id);
            const isEquipped = userProfile.duoOutfit === outfit.id;

            return (
              <div
                key={outfit.id}
                className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
                  isEquipped
                    ? 'bg-[#F0FDFA] border-[#0D9488]'
                    : 'bg-white border-[#E8E2D9]'
                }`}
              >
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-[#1C1917]">{outfit.name}</h4>
                  <p className="text-xs text-[#57534E]">{outfit.description}</p>
                </div>

                <button
                  onClick={() => handleOutfitAction(outfit)}
                  className={`
                    tactile-btn w-full py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider border-b-[3px] cursor-pointer flex items-center justify-center gap-1
                    ${isEquipped
                      ? 'bg-[#0D9488] text-white border-[#0F766E]'
                      : isUnlocked
                      ? 'bg-[#EA580C] hover:bg-[#DC4F06] text-white border-[#9A3412]'
                      : 'bg-[#F3F0EA] hover:bg-[#E8E2D9] text-[#1C1917] border-[#D6CFC5]'}
                  `}
                >
                  {isEquipped ? (
                    <span>Equipado</span>
                  ) : isUnlocked ? (
                    <span>Equipar</span>
                  ) : (
                    <>
                      <span>{outfit.price}</span>
                      <Gem className="w-3.5 h-3.5 fill-[#F59E0B] text-[#B45309]" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
