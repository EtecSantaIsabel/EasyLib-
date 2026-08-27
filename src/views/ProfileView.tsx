import React, { useState } from 'react';
import { 
  Flame, 
  Zap, 
  Trophy, 
  Medal, 
  ShieldCheck, 
  RotateCcw, 
  CheckCheck, 
  Copy,
  Edit2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { UserProfile } from '../types';
import { DuoOwl } from '../components/DuoOwl';
import { soundService } from '../services/soundService';

interface ProfileViewProps {
  userProfile: UserProfile;
  onUpdateName: (name: string, username: string) => void;
  onResetData: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userProfile,
  onUpdateName,
  onResetData
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userProfile.name);
  const [username, setUsername] = useState(userProfile.username);
  const [copiedId, setCopiedId] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSaveProfile = () => {
    soundService.playCorrect();
    onUpdateName(name, username);
    setIsEditing(false);
  };

  const handleCopyUserId = () => {
    navigator.clipboard.writeText(userProfile.userId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-8 select-none animate-fade-in">
      
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl border-2 border-[#F1EAE2] border-b-6 border-[#FED7AA] p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        
        {/* Duo Avatar */}
        <div className="relative">
          <DuoOwl 
            mood="happy" 
            outfit={userProfile.duoOutfit} 
            size="lg" 
            showSpeechBubble={true}
            speechText="Olá! Vamos praticar?"
          />
          <div className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-full bg-[#EA580C] text-white font-black text-[10px] uppercase shadow-sm">
            {userProfile.duoOutfit}
          </div>
        </div>

        {/* User Details */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border-2 border-[#FF6B00] font-black text-base text-[#292524] focus:outline-none"
                placeholder="Seu nome"
              />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border-2 border-[#F1EAE2] font-bold text-xs text-[#78716C] focus:outline-none"
                placeholder="@username"
              />
              <button
                onClick={handleSaveProfile}
                className="py-2 px-4 rounded-xl bg-[#FF6B00] text-white font-black text-xs uppercase border-b-4 border-[#9A3412] cursor-pointer"
              >
                Salvar
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-black text-[#292524]">{userProfile.name}</h2>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 rounded-lg text-[#A8A29E] hover:text-[#EA580C] cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs font-bold text-[#A8A29E]">@{userProfile.username}</p>
            </div>
          )}

          {/* User ID Badge */}
          <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
            <button
              onClick={handleCopyUserId}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FFFDF9] hover:bg-[#FFF7ED] border border-[#F1EAE2] text-xs font-mono font-bold text-[#78716C] cursor-pointer transition-colors"
            >
              <span>ID: {userProfile.userId}</span>
              {copiedId ? (
                <CheckCheck className="w-3.5 h-3.5 text-[#EA580C]" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-[#A8A29E]" />
              )}
            </button>
            {copiedId && <span className="text-xs font-black text-[#EA580C]">Copiado!</span>}
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-[#A8A29E] font-bold">
            <Calendar className="w-3.5 h-3.5" />
            <span>Membro EasyLib</span>
          </div>
        </div>

      </div>

      {/* Statistics 2x2 Grid */}
      <div className="space-y-3">
        <h3 className="text-lg font-black text-[#292524]">Estatísticas</h3>

        <div className="grid grid-cols-2 gap-3">
          
          {/* Streak */}
          <div className="p-4 rounded-3xl bg-white border-2 border-[#F1EAE2] border-b-6 border-[#FED7AA] flex items-center gap-3.5 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#FFEDD5] text-[#EA580C] flex items-center justify-center text-2xl shrink-0">
              <Flame className="w-7 h-7 fill-[#EA580C]" />
            </div>
            <div>
              <div className="text-xl font-black text-[#292524]">{userProfile.streakDays} dias</div>
              <div className="text-xs font-bold text-[#A8A29E]">Ofensiva Atual</div>
            </div>
          </div>

          {/* Total XP */}
          <div className="p-4 rounded-3xl bg-white border-2 border-[#F1EAE2] border-b-6 border-[#FED7AA] flex items-center gap-3.5 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center text-2xl shrink-0">
              <Zap className="w-7 h-7 fill-[#D97706]" />
            </div>
            <div>
              <div className="text-xl font-black text-[#292524]">{userProfile.xp} XP</div>
              <div className="text-xs font-bold text-[#A8A29E]">Total de XP</div>
            </div>
          </div>

          {/* Current League */}
          <div className="p-4 rounded-3xl bg-white border-2 border-[#F1EAE2] border-b-6 border-[#FED7AA] flex items-center gap-3.5 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#FFEDD5] text-[#EA580C] flex items-center justify-center text-2xl shrink-0">
              <Trophy className="w-7 h-7 fill-[#EA580C]" />
            </div>
            <div>
              <div className="text-xl font-black text-[#292524]">{userProfile.currentLeague}</div>
              <div className="text-xs font-bold text-[#A8A29E]">Liga Atual</div>
            </div>
          </div>

          {/* Top 3 Finishes */}
          <div className="p-4 rounded-3xl bg-white border-2 border-[#F1EAE2] border-b-6 border-[#FED7AA] flex items-center gap-3.5 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center text-2xl shrink-0">
              <Medal className="w-7 h-7 fill-[#D97706]" />
            </div>
            <div>
              <div className="text-xl font-black text-[#292524]">3 vezes</div>
              <div className="text-xs font-bold text-[#A8A29E]">Vitórias no Top 3</div>
            </div>
          </div>

        </div>
      </div>

      {/* Achievements Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-black text-[#292524]">Conquistas</h3>

        <div className="space-y-3">
          {userProfile.achievements.map((ach) => (
            <div
              key={ach.id}
              className="bg-white rounded-3xl border-2 border-[#F1EAE2] border-b-6 border-[#FED7AA] p-4 flex items-center gap-4 shadow-sm"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#FFEDD5] border border-[#FDBA74] flex items-center justify-center text-3xl shrink-0">
                {ach.icon}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm text-[#292524]">{ach.title}</h4>
                  <span className="text-xs font-black text-[#EA580C]">Nível {ach.tier}/{ach.maxTier}</span>
                </div>
                <p className="text-xs text-[#78716C] font-semibold">{ach.description}</p>
                
                {/* Progress bar */}
                <div className="w-full h-3 bg-[#F1EAE2] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#FF6B00] rounded-full"
                    style={{ width: `${Math.min(100, (ach.currentProgress / ach.targetProgress) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings / Reset Section */}
      <div className="pt-4 border-t-2 border-[#F1EAE2] flex items-center justify-between">
        <button
          onClick={() => setShowResetConfirm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-rose-50 text-[#E11D48] border-2 border-[#FECDD3] font-black text-xs cursor-pointer transition-colors shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reiniciar Todos os Dados</span>
        </button>
      </div>

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border-2 border-[#F1EAE2] border-b-8 border-[#FED7AA] p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center mx-auto text-2xl">
              ⚠️
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-[#292524]">Zerar progresso?</h3>
              <p className="text-xs text-[#78716C] font-semibold">
                Isso reiniciará suas lições, ofensiva, gemas e níveis para o estado original.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="py-3 rounded-2xl bg-[#E7E5E4] hover:bg-[#D6D3D1] text-[#292524] font-black text-xs border-b-4 border-[#A8A29E] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  soundService.playCorrect();
                  onResetData();
                  setShowResetConfirm(false);
                }}
                className="py-3 rounded-2xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-black text-xs border-b-4 border-[#9F1239] cursor-pointer shadow-md"
              >
                Sim, Zerar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
