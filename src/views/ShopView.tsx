import React, { useState } from 'react';
import { 
  Sparkles, 
  Heart, 
  Flame, 
  Gem, 
  Check, 
  ShieldCheck, 
  Zap,
  ShoppingBag
} from 'lucide-react';
import { UserProfile, DuoOutfit } from '../types';
import { DUO_OUTFITS } from '../data/librasData';
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
      showToast('Gemas insuficientes! Complete lições para ganhar mais.');
      return;
    }
    soundService.playCorrect();
    onBuyItem(type, cost);
    showToast('Compra realizada com sucesso!');
  };

  const handleOutfitAction = (outfit: DuoOutfit) => {
    const isUnlocked = userProfile.unlockedOutfits.includes(outfit.id);
    if (isUnlocked) {
      soundService.playTap();
      onEquipOutfit(outfit.id);
      showToast(`${outfit.name} equipado!`);
    } else {
      if (userProfile.gems < outfit.price) {
        soundService.playIncorrect();
        showToast('Gemas insuficientes para este traje.');
        return;
      }
      soundService.playLessonComplete();
      onBuyItem(outfit.id, outfit.price);
      onEquipOutfit(outfit.id);
      showToast(`${outfit.name} desbloqueado e equipado!`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-8 select-none animate-fade-in">
      
      {/* Toast message */}
      {feedbackMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#1E1E1E] text-white font-black text-xs px-5 py-3 rounded-2xl shadow-2xl border border-white/20 animate-fade-in">
          {feedbackMsg}
        </div>
      )}

      {/* EasyLib Plus Feature Promo Card (Warm Sunset Card) */}
      <div className="bg-gradient-to-r from-[#FF6B00] via-[#F97316] to-[#EA580C] rounded-3xl p-6 text-white border-b-6 border-[#9A3412] shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-300" />
            <span className="text-xs font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full text-[#FEF3C7]">
              EasyLib Plus
            </span>
          </div>
          <span className="text-2xl">🦉✨</span>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black">Vidas Ilimitadas & Prática Sem Limites</h2>
          <p className="text-xs text-white/95 font-medium">
            Aprenda no seu ritmo sem interrupções, com revisões personalizadas de parâmetros e expressões.
          </p>
        </div>

        <button
          onClick={() => {
            soundService.playLessonComplete();
            onToggleSuper();
            showToast(userProfile.isSuperDuolingo ? 'EasyLib Plus desativado.' : 'EasyLib Plus ativado gratuitamente!');
          }}
          className="w-full py-3.5 px-4 rounded-2xl bg-white text-[#EA580C] hover:bg-orange-50 font-black text-sm uppercase tracking-wider border-b-4 border-[#FED7AA] cursor-pointer shadow-md transition-all active:translate-y-0.5"
        >
          {userProfile.isSuperDuolingo ? 'Desativar EasyLib Plus' : 'Ativar EasyLib Plus Grátis'}
        </button>
      </div>

      {/* Power-ups Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#EA580C]" />
          <h3 className="text-xl font-black text-[#292524]">Itens e Poderes</h3>
        </div>

        <div className="space-y-3">
          
          {/* Refill Hearts */}
          <div className="bg-white rounded-3xl border-2 border-[#F1EAE2] border-b-6 border-[#FED7AA] p-5 flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center text-2xl border border-[#FECDD3] shrink-0">
                ❤️
              </div>
              <div className="space-y-0.5">
                <h4 className="font-black text-base text-[#292524]">Recarga de Vidas</h4>
                <p className="text-xs text-[#78716C] font-semibold">Restaura todas as suas 5 vidas instantaneamente.</p>
              </div>
            </div>

            <button
              disabled={userProfile.hearts >= userProfile.maxHearts || userProfile.isSuperDuolingo}
              onClick={() => handleBuyPowerup('hearts', 350)}
              className={`
                px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider border-b-4 shrink-0 transition-all
                ${userProfile.hearts >= userProfile.maxHearts || userProfile.isSuperDuolingo
                  ? 'bg-[#E7E5E4] text-[#A8A29E] border-[#D6D3D1] cursor-not-allowed'
                  : 'bg-[#FF6B00] hover:bg-[#EA580C] text-white border-[#9A3412] cursor-pointer active:translate-y-0.5 shadow-md'}
              `}
            >
              350 💎
            </button>
          </div>

          {/* Streak Freeze */}
          <div className="bg-white rounded-3xl border-2 border-[#F1EAE2] border-b-6 border-[#FED7AA] p-5 flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FFEDD5] text-[#EA580C] flex items-center justify-center text-2xl border border-[#FDBA74] shrink-0">
                🧊
              </div>
              <div className="space-y-0.5">
                <h4 className="font-black text-base text-[#292524]">Bloqueio de Ofensiva</h4>
                <p className="text-xs text-[#78716C] font-semibold">Protege sua chama de ofensiva se você esquecer de praticar 1 dia.</p>
              </div>
            </div>

            <button
              onClick={() => handleBuyPowerup('freeze', 200)}
              className="px-4 py-2.5 rounded-2xl bg-[#F59E0B] hover:bg-[#D97706] text-white font-black text-xs uppercase tracking-wider border-b-4 border-[#92400E] shrink-0 cursor-pointer active:translate-y-0.5 shadow-md transition-all"
            >
              200 💎
            </button>
          </div>

          {/* Double or Nothing */}
          <div className="bg-white rounded-3xl border-2 border-[#F1EAE2] border-b-6 border-[#FED7AA] p-5 flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FFEDD5] text-[#EA580C] flex items-center justify-center text-2xl border border-[#FDBA74] shrink-0">
                🎰
              </div>
              <div className="space-y-0.5">
                <h4 className="font-black text-base text-[#292524]">Dobre ou Nada</h4>
                <p className="text-xs text-[#78716C] font-semibold">Aposte 50 gemas. Mantenha 7 dias de ofensiva e ganhe 100 gemas!</p>
              </div>
            </div>

            <button
              disabled={userProfile.wagerActive}
              onClick={() => handleBuyPowerup('wager', 50)}
              className={`
                px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider border-b-4 shrink-0 transition-all
                ${userProfile.wagerActive
                  ? 'bg-[#E7E5E4] text-[#A8A29E] border-[#D6D3D1] cursor-not-allowed'
                  : 'bg-[#EA580C] hover:bg-[#C2410C] text-white border-[#9A3412] cursor-pointer active:translate-y-0.5 shadow-md'}
              `}
            >
              {userProfile.wagerActive ? 'Ativo' : '50 💎'}
            </button>
          </div>

        </div>
      </div>

      {/* Duo Mascot Outfits Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-[#EA580C]" />
          <h3 className="text-xl font-black text-[#292524]">Trajes do Mascote EasyLib</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DUO_OUTFITS.map((outfit) => {
            const isUnlocked = userProfile.unlockedOutfits.includes(outfit.id);
            const isEquipped = userProfile.duoOutfit === outfit.id;

            return (
              <div
                key={outfit.id}
                className={`
                  p-5 rounded-3xl border-2 border-b-6 transition-all duration-150 flex flex-col justify-between space-y-4 shadow-sm
                  ${isEquipped ? 'bg-[#FFF7ED] border-[#F97316] border-b-[#C2410C]' : 'bg-white border-[#F1EAE2] border-b-[#FED7AA]'}
                `}
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-[#FFFDF9] border border-[#F1EAE2] flex items-center justify-center text-3xl shrink-0">
                    {outfit.icon}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-black text-base text-[#292524]">{outfit.name}</h4>
                    <p className="text-xs text-[#78716C] font-semibold">{outfit.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleOutfitAction(outfit)}
                  className={`
                    w-full py-2.5 px-4 rounded-2xl font-black text-xs uppercase tracking-wider border-b-4 transition-all cursor-pointer active:translate-y-0.5
                    ${isEquipped
                      ? 'bg-[#FF6B00] text-white border-[#9A3412]'
                      : isUnlocked
                      ? 'bg-[#EA580C] hover:bg-[#C2410C] text-white border-[#7C2D12]'
                      : 'bg-[#F59E0B] hover:bg-[#D97706] text-amber-950 border-[#92400E]'}
                  `}
                >
                  {isEquipped ? 'Equipado ✓' : isUnlocked ? 'Equipar' : `Comprar por ${outfit.price} 💎`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
