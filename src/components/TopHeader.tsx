import React, { useState } from 'react';
import {
  Flame,
  Gem,
  Heart,
  Volume2,
  VolumeX,
  Infinity as InfinityIcon,
  BookmarkCheck,
  Bell
} from 'lucide-react';
import { User } from 'firebase/auth';
import { LibrasTrack, UserProfile } from '../types';
import { soundService } from '../services/soundService';

interface TopHeaderProps {
  userProfile: UserProfile;
  onSelectTrack: (track: LibrasTrack) => void;
  onRefillHearts: () => void;
  onToggleSuper: () => void;
  onOpenShop: () => void;
  onResetData: () => void;
  firebaseUser?: User | null;
  authBusy?: boolean;
  onOpenAuthModal?: () => void;
  onOpenProfile?: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'V';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export const TopHeader = ({
  userProfile,
  onRefillHearts,
  onToggleSuper,
  onOpenShop,
  firebaseUser,
  authBusy = false,
  onOpenAuthModal,
  onOpenProfile
}: TopHeaderProps) => {
  const [isStreakMenuOpen, setIsStreakMenuOpen] = useState(false);
  const [isHeartsMenuOpen, setIsHeartsMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(soundService.getMuted());
  const [avatarImgError, setAvatarImgError] = useState(false);

  const hasLocalProgress = userProfile.xp > 0 || userProfile.completedNodeIds.length > 0;
  const rawName = (
    firebaseUser?.displayName ||
    userProfile.name ||
    firebaseUser?.phoneNumber ||
    'Visitante'
  ).trim();
  const isDefaultGuestName =
    !firebaseUser && (rawName === 'Aprendiz de Libras' || rawName === 'Visitante' || rawName === '');
  const displayFirstName = isDefaultGuestName ? 'Visitante' : rawName.split(/\s+/)[0];
  const avatarInitials = getInitials(isDefaultGuestName ? 'Visitante' : rawName);
  const photoUrl = firebaseUser?.photoURL && !avatarImgError ? firebaseUser.photoURL : null;

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
    <header className="sticky top-0 z-30 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#E8E2D9] px-3 sm:px-6 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-3 min-w-0">
        {/* Left: User Account Chip (Avatar + Greeting, opens Profile/Login) */}
        <button
          type="button"
          onClick={() => {
            soundService.playTap();
            setIsStreakMenuOpen(false);
            setIsHeartsMenuOpen(false);
            onOpenProfile?.();
          }}
          title="Abrir conta e perfil"
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-2xl bg-white hover:bg-[#F3F0EA] border border-[#E8E2D9] border-b-[3px] border-b-[#D6CFC5] cursor-pointer transition-colors min-w-0 max-w-[175px] sm:max-w-[260px]"
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={rawName}
              onError={() => setAvatarImgError(true)}
              className="w-8 h-8 rounded-full object-cover border border-[#99F6E4] shrink-0"
            />
          ) : (
            <span className="w-8 h-8 rounded-full bg-[#0D9488] text-white flex items-center justify-center font-display font-bold text-xs shrink-0">
              {avatarInitials}
            </span>
          )}
          <div className="text-left min-w-0">
            <div className="font-bold text-xs sm:text-sm text-[#1C1917] truncate">
              Olá, {displayFirstName}
            </div>
            <div className="text-[10px] font-semibold text-[#57534E] truncate hidden sm:block">
              {firebaseUser ? 'Conta conectada' : 'Toque para editar ou entrar'}
            </div>
          </div>
        </button>

        {/* Right: Sound, Notifications, Streak, Gems, Hearts & Auth */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Notification Settings Shortcut */}
          <button
            type="button"
            onClick={() => {
              soundService.playTap();
              setIsStreakMenuOpen(false);
              setIsHeartsMenuOpen(false);
              onOpenProfile?.();
            }}
            className="p-2 rounded-xl text-[#78716C] hover:text-[#0D9488] hover:bg-[#F0FDFA] cursor-pointer transition-colors"
            title="Configurar notificações push"
            aria-label="Configurar notificações push"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            className="p-2 rounded-xl text-[#78716C] hover:text-[#1C1917] hover:bg-[#F3F0EA] cursor-pointer transition-colors"
            title={isMuted ? 'Ativar áudio' : 'Desativar áudio'}
            aria-label={isMuted ? 'Ativar áudio' : 'Desativar áudio'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-[#E11D48]" />
            ) : (
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>

          {/* Streak */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                soundService.playTap();
                setIsStreakMenuOpen(!isStreakMenuOpen);
                setIsHeartsMenuOpen(false);
              }}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl hover:bg-[#FFF1E6] text-[#EA580C] font-bold text-xs sm:text-sm cursor-pointer select-none transition-colors"
              title="Ofensiva diária"
            >
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 fill-[#EA580C] text-[#EA580C]" />
              <span>{userProfile.streakDays}</span>
            </button>

            {isStreakMenuOpen && (
              <div className="absolute top-12 right-0 w-72 bg-white rounded-2xl border border-[#E8E2D9] shadow-lg p-4 z-50 animate-fade-in space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-[#1C1917]">
                      {userProfile.streakDays} dias seguidos
                    </h4>
                    <p className="text-xs text-[#57534E]">
                      Pratique um pouco por dia para manter o ritmo.
                    </p>
                  </div>
                  <Flame className="w-7 h-7 fill-[#EA580C] text-[#EA580C] shrink-0" />
                </div>

                <div className="grid grid-cols-7 gap-1 text-center">
                  {daysOfWeek.map((d, i) => (
                    <div key={i} className="space-y-1">
                      <span className="text-[10px] font-bold text-[#78716C]">{d.label}</span>
                      <div
                        className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center font-bold text-xs ${
                          d.done
                            ? 'bg-[#EA580C] text-white'
                            : d.isToday
                            ? 'border-2 border-dashed border-[#EA580C] text-[#EA580C]'
                            : 'bg-[#F3F0EA] text-[#78716C]'
                        }`}
                      >
                        {d.done ? '✓' : ''}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2.5 border-t border-[#E8E2D9] flex items-center justify-between text-xs font-semibold text-[#57534E]">
                  <span>Bloqueio de ofensiva</span>
                  <span className="font-bold text-[#0F766E]">
                    {userProfile.streakFreezeCount > 0
                      ? `${userProfile.streakFreezeCount} ativo`
                      : 'Nenhum'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Gems */}
          <button
            type="button"
            onClick={() => {
              soundService.playTap();
              setIsStreakMenuOpen(false);
              setIsHeartsMenuOpen(false);
              onOpenShop();
            }}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl hover:bg-[#FEF3C7]/60 text-[#B45309] font-bold text-xs sm:text-sm cursor-pointer select-none transition-colors"
            title="Gemas disponíveis"
          >
            <Gem className="w-4 h-4 sm:w-5 sm:h-5 fill-[#F59E0B] text-[#B45309]" />
            <span>{userProfile.gems}</span>
          </button>

          {/* Hearts */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                soundService.playTap();
                setIsHeartsMenuOpen(!isHeartsMenuOpen);
                setIsStreakMenuOpen(false);
              }}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl hover:bg-rose-50 text-[#E11D48] font-bold text-xs sm:text-sm cursor-pointer select-none transition-colors"
              title="Vidas"
            >
              {userProfile.isSuperDuolingo ? (
                <div className="flex items-center gap-1 text-[#0F766E]">
                  <InfinityIcon className="w-5 h-5 stroke-[2.5]" />
                  <span className="text-xs font-bold uppercase">Plus</span>
                </div>
              ) : (
                <>
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-[#E11D48] text-[#E11D48]" />
                  <span>{userProfile.hearts}</span>
                </>
              )}
            </button>

            {isHeartsMenuOpen && (
              <div className="absolute top-12 right-0 w-72 bg-white rounded-2xl border border-[#E8E2D9] shadow-lg p-4 z-50 animate-fade-in space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <h4 className="text-base font-bold text-[#1C1917]">
                      {userProfile.isSuperDuolingo
                        ? 'Vidas ilimitadas'
                        : `${userProfile.hearts} vidas restantes`}
                    </h4>
                    <p className="text-xs text-[#57534E]">
                      {userProfile.isSuperDuolingo
                        ? 'Você pode errar sem perder vidas durante os treinos.'
                        : 'Cada erro em uma lição consome uma vida.'}
                    </p>
                  </div>
                  <Heart className="w-7 h-7 fill-[#E11D48] text-[#E11D48] shrink-0" />
                </div>

                {!userProfile.isSuperDuolingo && (
                  <button
                    type="button"
                    onClick={() => {
                      soundService.playCorrect();
                      onRefillHearts();
                      setIsHeartsMenuOpen(false);
                    }}
                    className="tactile-btn w-full py-2.5 px-3 rounded-xl bg-[#EA580C] hover:bg-[#DC4F06] text-white font-bold text-xs uppercase tracking-wider border-b-4 border-[#9A3412] cursor-pointer"
                  >
                    Recarregar vidas
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    soundService.playCorrect();
                    onToggleSuper();
                    setIsHeartsMenuOpen(false);
                  }}
                  className="tactile-btn w-full py-2.5 px-3 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs uppercase tracking-wider border-b-4 border-[#115E59] cursor-pointer"
                >
                  {userProfile.isSuperDuolingo ? 'Desativar Plus' : 'Ativar EasyLib Plus'}
                </button>
              </div>
            )}
          </div>

          {/* Auth CTA */}
          {onOpenAuthModal && !firebaseUser && (
            <button
              type="button"
              onClick={() => {
                soundService.playTap();
                onOpenAuthModal();
              }}
              disabled={authBusy}
              className="tactile-btn hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#EA580C] hover:bg-[#DC4F06] disabled:opacity-60 text-white font-bold text-xs border-b-[3px] border-[#9A3412] cursor-pointer whitespace-nowrap"
            >
              <BookmarkCheck className="w-3.5 h-3.5 shrink-0" />
              <span>
                {authBusy ? 'Conectando...' : hasLocalProgress ? 'Entrar' : 'Entrar'}
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
