import React, { useState } from 'react';
import { 
  Flame, 
  Gem, 
  Heart, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  ChevronDown, 
  Check, 
  Infinity as InfinityIcon,
  BookOpen
} from 'lucide-react';
import { LibrasTrack, UserProfile } from '../types';
import { LIBRAS_TRACKS } from '../data/librasData';
import { soundService } from '../services/soundService';

interface TopHeaderProps {
  userProfile: UserProfile;
  onSelectTrack: (track: LibrasTrack) => void;
  onRefillHearts: () => void;
  onToggleSuper: () => void;
  onOpenShop: () => void;
  onResetData: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  userProfile,
  onSelectTrack,
  onRefillHearts,
  onToggleSuper,
  onOpenShop
}) => {
  const [isTrackMenuOpen, setIsTrackMenuOpen] = useState(false);
  const [isStreakMenuOpen, setIsStreakMenuOpen] = useState(false);
  const [isHeartsMenuOpen, setIsHeartsMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(soundService.getMuted());

  const currentTrack = LIBRAS_TRACKS.find(t => t.id === userProfile.selectedTrack) || LIBRAS_TRACKS[0];

  const toggleSound = () => {
    const muted = soundService.toggleMute();
    setIsMuted(muted);
    soundService.playTap();
  };

  const daysOfWeek = [
    { label: 'DOM', done: true },
    { label: 'SEG', done: true },
    { label: 'TER', done: true },
    { label: 'QUA', done: true },
    { label: 'QUI', done: true, isToday: true },
    { label: 'SEX', done: false },
    { label: 'SÁB', done: false }
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#FFFDF9]/95 backdrop-blur-md border-b-2 border-[#F1EAE2] px-4 sm:px-6 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        
        {/* Left: Libras Track / Level Selector */}
        <div className="relative">
          <button
            onClick={() => {
              soundService.playTap();
              setIsTrackMenuOpen(!isTrackMenuOpen);
              setIsStreakMenuOpen(false);
              setIsHeartsMenuOpen(false);
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white hover:bg-[#FFF7ED] border-2 border-[#F1EAE2] hover:border-[#FDBA74] text-[#292524] font-black text-sm cursor-pointer shadow-xs active:translate-y-0.5 transition-all"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-lg">🇧🇷</span>
              <span className="text-base">🤟</span>
            </div>
            <div className="text-left">
              <div className="text-[10px] uppercase tracking-wider text-[#EA580C] font-extrabold leading-none">
                EASYLIB LIBRAS
              </div>
              <div className="text-xs font-black text-[#292524] hidden sm:block">
                {currentTrack.title.split(':')[0]}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-[#A8A29E] ml-1" />
          </button>

          {/* Tracks Dropdown */}
          {isTrackMenuOpen && (
            <div className="absolute top-12 left-0 w-80 bg-white rounded-3xl border-2 border-[#F1EAE2] shadow-2xl p-2.5 z-50 animate-fade-in space-y-1.5">
              <div className="px-3 py-1 text-xs font-black uppercase tracking-wider text-[#A8A29E] flex items-center justify-between">
                <span>Trilhas de Libras</span>
                <span className="text-[10px] bg-orange-100 text-[#EA580C] px-2 py-0.5 rounded-full font-bold">100% Sinais</span>
              </div>
              {LIBRAS_TRACKS.map((track) => {
                const isSelected = track.id === userProfile.selectedTrack;
                return (
                  <button
                    key={track.id}
                    onClick={() => {
                      soundService.playTap();
                      onSelectTrack(track.id);
                      setIsTrackMenuOpen(false);
                    }}
                    className={`
                      w-full flex items-center justify-between p-3 rounded-2xl text-left font-bold cursor-pointer transition-all
                      ${isSelected ? 'bg-orange-50 text-orange-900 border-2 border-orange-300' : 'hover:bg-[#FFF7ED] text-[#44403C] border border-transparent'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white border border-[#F1EAE2] flex items-center justify-center text-xl shadow-xs shrink-0">
                        {track.badge}
                      </div>
                      <div>
                        <div className="font-black text-xs sm:text-sm text-[#292524]">{track.title}</div>
                        <div className="text-[11px] text-[#78716C] line-clamp-1">{track.subtitle}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-[#EA580C] stroke-[3] shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Status Counters */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl text-[#A8A29E] hover:text-[#292524] hover:bg-[#FFF7ED] cursor-pointer"
            title={isMuted ? "Ativar áudio" : "Desativar áudio"}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-[#EF4444]" /> : <Volume2 className="w-5 h-5 text-[#78716C]" />}
          </button>

          {/* Streak 🔥 (Warm Flame) */}
          <div className="relative">
            <button
              onClick={() => {
                soundService.playTap();
                setIsStreakMenuOpen(!isStreakMenuOpen);
                setIsTrackMenuOpen(false);
                setIsHeartsMenuOpen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl hover:bg-orange-50 text-[#EA580C] font-black text-sm cursor-pointer active:translate-y-0.5 select-none border border-transparent hover:border-orange-200"
            >
              <Flame className="w-5 h-5 fill-[#EA580C] text-[#EA580C] animate-pulse" />
              <span>{userProfile.streakDays}</span>
            </button>

            {/* Streak Popover */}
            {isStreakMenuOpen && (
              <div className="absolute top-12 right-0 sm:right-auto sm:-left-20 w-72 bg-white rounded-3xl border-2 border-[#F1EAE2] shadow-2xl p-5 z-50 animate-fade-in space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-black text-[#292524]">Ofensiva de {userProfile.streakDays} dias!</h4>
                    <p className="text-xs text-[#78716C]">Pratique Libras todo dia para fixar os sinais.</p>
                  </div>
                  <Flame className="w-8 h-8 fill-[#EA580C] text-[#EA580C]" />
                </div>

                {/* Days week grid */}
                <div className="grid grid-cols-7 gap-1 pt-1 text-center">
                  {daysOfWeek.map((d, i) => (
                    <div key={i} className="space-y-1">
                      <span className="text-[10px] font-black text-[#A8A29E]">{d.label}</span>
                      <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-black text-xs ${
                        d.done 
                          ? 'bg-[#EA580C] text-white shadow-xs' 
                          : d.isToday
                          ? 'border-2 border-dashed border-[#EA580C] text-[#EA580C]'
                          : 'bg-[#F5F5F4] text-[#A8A29E]'
                      }`}>
                        {d.done ? '✓' : ''}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#F1EAE2] flex items-center justify-between text-xs font-bold text-[#78716C]">
                  <span>Bloqueio de Ofensiva:</span>
                  <span className="font-black text-[#EA580C]">
                    {userProfile.streakFreezeCount > 0 ? `${userProfile.streakFreezeCount} equipado` : 'Nenhum'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Gems 💎 (Topaz Gold) */}
          <div 
            onClick={() => {
              soundService.playTap();
              onOpenShop();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl hover:bg-amber-50 text-[#D97706] font-black text-sm cursor-pointer select-none border border-transparent hover:border-amber-200"
            title="Gemas EasyLib"
          >
            <Gem className="w-5 h-5 fill-[#F59E0B] text-[#D97706]" />
            <span>{userProfile.gems}</span>
          </div>

          {/* Hearts ❤️ (Warm Ruby/Coral) */}
          <div className="relative">
            <button
              onClick={() => {
                soundService.playTap();
                setIsHeartsMenuOpen(!isHeartsMenuOpen);
                setIsTrackMenuOpen(false);
                setIsStreakMenuOpen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl hover:bg-rose-50 text-[#E11D48] font-black text-sm cursor-pointer active:translate-y-0.5 select-none border border-transparent hover:border-rose-200"
            >
              {userProfile.isSuperDuolingo ? (
                <div className="flex items-center gap-1 text-[#EA580C]">
                  <InfinityIcon className="w-5 h-5 stroke-[3]" />
                  <span className="text-xs font-black uppercase">PLUS</span>
                </div>
              ) : (
                <>
                  <Heart className="w-5 h-5 fill-[#E11D48] text-[#E11D48]" />
                  <span>{userProfile.hearts}</span>
                </>
              )}
            </button>

            {/* Hearts Popover */}
            {isHeartsMenuOpen && (
              <div className="absolute top-12 right-0 w-72 bg-white rounded-3xl border-2 border-[#F1EAE2] shadow-2xl p-5 z-50 animate-fade-in space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-base font-black text-[#292524]">
                      {userProfile.isSuperDuolingo ? 'Vidas Ilimitadas' : `Você tem ${userProfile.hearts} vidas`}
                    </h4>
                    <p className="text-xs text-[#78716C]">
                      {userProfile.isSuperDuolingo 
                        ? 'Com o EasyLib Plus seus erros de sinalização não gastam vidas!' 
                        : 'Vidas diminuem quando você erra a identificação do sinal.'}
                    </p>
                  </div>
                  <Heart className="w-8 h-8 fill-[#E11D48] text-[#E11D48]" />
                </div>

                {!userProfile.isSuperDuolingo && (
                  <button
                    onClick={() => {
                      soundService.playCorrect();
                      onRefillHearts();
                      setIsHeartsMenuOpen(false);
                    }}
                    className="w-full py-2.5 px-3 rounded-2xl bg-[#FF6B00] hover:bg-[#EA580C] text-white font-black text-xs uppercase tracking-wider border-b-4 border-[#C2410C] cursor-pointer shadow-md transition-all active:translate-y-0.5"
                  >
                    Recarregar Vidas (Cheio)
                  </button>
                )}

                <button
                  onClick={() => {
                    soundService.playCorrect();
                    onToggleSuper();
                    setIsHeartsMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-[#FF6B00] to-[#E11D48] hover:opacity-95 text-white font-black text-xs uppercase tracking-wider border-b-4 border-[#9F1239] cursor-pointer shadow-md flex items-center justify-center gap-1.5 transition-all active:translate-y-0.5"
                >
                  <Sparkles className="w-4 h-4 fill-white" />
                  <span>{userProfile.isSuperDuolingo ? 'Desativar Plus' : 'Ativar EasyLib Plus'}</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
