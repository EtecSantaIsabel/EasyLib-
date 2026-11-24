import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  Flame,
  Zap,
  Trophy,
  Medal,
  RotateCcw,
  CheckCheck,
  Copy,
  Edit2,
  Calendar,
  LogIn,
  LogOut,
  Cloud,
  Volume2,
  Trash2,
  AlertTriangle,
  Mail,
  Phone,
  RefreshCw
} from 'lucide-react';
import { UserProfile } from '../types';
import { SavedTranslationRecord } from '../services/firebaseSync';
import { speakPortugueseText } from '../services/librasTranslatorService';
import { LibiMascot } from '../components/LibiMascot';
import { PushNotificationPanel } from '../components/PushNotificationPanel';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { soundService } from '../services/soundService';

interface ProfileViewProps {
  userProfile: UserProfile;
  onUpdateName: (name: string, username: string) => void;
  onResetData: () => void;
  firebaseUser?: User | null;
  canSyncCloud?: boolean;
  authBusy?: boolean;
  authError?: string | null;
  onOpenAuthModal?: (initialTab?: 'options' | 'email' | 'phone') => void;
  onResendVerification?: () => void;
  onRefreshVerification?: () => void;
  onSignOut?: () => void;
  savedTranslations?: SavedTranslationRecord[];
  onDeleteTranslation?: (translationId: string) => Promise<void>;
}

function getProviderLabel(user: User): string {
  const providerIds = user.providerData.map((p) => p.providerId);
  if (providerIds.includes('google.com')) return 'Google';
  if (providerIds.includes('apple.com')) return 'Apple';
  if (providerIds.includes('phone')) return 'Celular (SMS)';
  if (providerIds.includes('password')) return 'E-mail e senha';
  return 'Conta conectada';
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userProfile,
  onUpdateName,
  onResetData,
  firebaseUser,
  canSyncCloud = false,
  authBusy = false,
  authError = null,
  onOpenAuthModal,
  onResendVerification,
  onRefreshVerification,
  onSignOut,
  savedTranslations = [],
  onDeleteTranslation
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userProfile.name);
  const [username, setUsername] = useState(userProfile.username);
  const [copiedId, setCopiedId] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setName(userProfile.name);
    setUsername(userProfile.username);
  }, [userProfile.name, userProfile.username]);

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
    <div className="max-w-xl mx-auto px-2 sm:px-4 py-2 space-y-6 select-none animate-fade-in">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-5">
        <LibiMascot
          mood="acenando"
          size="md"
          showSpeechBubble={true}
          speechText="Oi! Vamos treinar?"
        />

        <div className="flex-1 text-center sm:text-left space-y-2 min-w-0 w-full">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#EA580C] font-bold text-base text-[#1C1917] focus:outline-none"
                placeholder="Seu nome"
              />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] font-medium text-xs text-[#57534E] focus:outline-none"
                placeholder="usuario"
              />
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <button
                  onClick={handleSaveProfile}
                  className="tactile-btn py-2 px-4 rounded-xl bg-[#EA580C] hover:bg-[#DC4F06] text-white font-bold text-xs uppercase border-b-[3px] border-[#9A3412] cursor-pointer"
                >
                  Salvar
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="py-2 px-3 rounded-xl text-[#57534E] hover:bg-[#F3F0EA] font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-0.5">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="font-display text-2xl font-bold text-[#1C1917] truncate">
                  {userProfile.name}
                </h2>
                <button
                  onClick={() => setIsEditing(true)}
                  aria-label="Editar perfil"
                  className="p-1.5 rounded-lg text-[#78716C] hover:text-[#EA580C] hover:bg-[#FFF1E6] cursor-pointer transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs font-semibold text-[#78716C]">@{userProfile.username}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1">
            <button
              onClick={handleCopyUserId}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF9F6] hover:bg-[#F3F0EA] border border-[#E8E2D9] text-xs font-mono font-semibold text-[#57534E] cursor-pointer transition-colors"
            >
              <span>ID: {userProfile.userId}</span>
              {copiedId ? (
                <CheckCheck className="w-3.5 h-3.5 text-[#0D9488]" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-[#78716C]" />
              )}
            </button>
            <span className="inline-flex items-center gap-1 text-xs text-[#78716C] font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>Conta EasyLib</span>
            </span>
          </div>
        </div>
      </div>

      {/* Firebase Account & Multi-Provider Auth */}
      <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                firebaseUser && canSyncCloud
                  ? 'bg-[#F0FDFA] text-[#0D9488]'
                  : 'bg-[#FFF1E6] text-[#EA580C]'
              }`}
            >
              <Cloud className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-base text-[#1C1917]">
                {firebaseUser
                  ? canSyncCloud
                    ? 'Progresso sincronizado'
                    : 'Confirme seu e-mail'
                  : 'Entrar ou salvar progresso'}
              </h3>
              <p className="text-xs text-[#57534E] font-medium break-words">
                {firebaseUser
                  ? `${getProviderLabel(firebaseUser)} · ${
                      firebaseUser.email || firebaseUser.phoneNumber || firebaseUser.displayName || 'Ativo'
                    }`
                  : 'Conecte com Google, Apple, E-mail e senha ou número de celular.'}
              </p>
              {authError && (
                <p className="text-xs text-[#BE123C] font-semibold mt-1">{authError}</p>
              )}
            </div>
          </div>

          {firebaseUser ? (
            onSignOut && (
              <button
                onClick={onSignOut}
                disabled={authBusy}
                className="tactile-btn flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F3F0EA] hover:bg-[#E8E2D9] text-[#1C1917] font-bold text-xs border-b-[3px] border-[#D6CFC5] cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
                <span>{authBusy ? 'Saindo...' : 'Sair'}</span>
              </button>
            )
          ) : (
            onOpenAuthModal && (
              <button
                onClick={() => onOpenAuthModal('options')}
                disabled={authBusy}
                className="tactile-btn flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#DC4F06] disabled:opacity-60 text-white font-bold text-xs uppercase border-b-4 border-[#9A3412] cursor-pointer shrink-0"
              >
                <LogIn className="w-4 h-4" />
                <span>{authBusy ? 'Conectando...' : 'Entrar'}</span>
              </button>
            )
          )}
        </div>

        {/* Email verification helper banner for newly registered Email/Password users */}
        {firebaseUser && !canSyncCloud && (
          <div className="p-3.5 rounded-xl bg-[#FFF1E6] border border-[#FED7AA] space-y-2.5">
            <p className="text-xs font-semibold text-[#9A3412]">
              Abra o link de confirmação enviado ao seu e-mail para liberar a sincronização na nuvem.
            </p>
            <div className="flex flex-wrap gap-2">
              {onResendVerification && (
                <button
                  type="button"
                  disabled={authBusy}
                  onClick={onResendVerification}
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#FED7AA] text-[#9A3412] font-bold text-xs cursor-pointer hover:bg-[#FFEDD5]"
                >
                  Reenviar e-mail
                </button>
              )}
              {onRefreshVerification && (
                <button
                  type="button"
                  disabled={authBusy}
                  onClick={onRefreshVerification}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EA580C] text-white font-bold text-xs cursor-pointer hover:bg-[#DC4F06]"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Já confirmei</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quick 4-Method Shortcuts when signed out */}
        {!firebaseUser && onOpenAuthModal && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-[#E8E2D9]">
            <button
              type="button"
              onClick={() => onOpenAuthModal('options')}
              className="py-2 px-2.5 rounded-xl bg-[#FAF9F6] hover:bg-[#F3F0EA] border border-[#E8E2D9] text-xs font-bold text-[#1C1917] cursor-pointer"
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => onOpenAuthModal('options')}
              className="py-2 px-2.5 rounded-xl bg-[#FAF9F6] hover:bg-[#F3F0EA] border border-[#E8E2D9] text-xs font-bold text-[#1C1917] cursor-pointer"
            >
              Apple
            </button>
            <button
              type="button"
              onClick={() => onOpenAuthModal('email')}
              className="py-2 px-2.5 rounded-xl bg-[#FAF9F6] hover:bg-[#F3F0EA] border border-[#E8E2D9] text-xs font-bold text-[#1C1917] cursor-pointer inline-flex items-center justify-center gap-1"
            >
              <Mail className="w-3.5 h-3.5 text-[#EA580C]" />
              <span>E-mail</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenAuthModal('phone')}
              className="py-2 px-2.5 rounded-xl bg-[#FAF9F6] hover:bg-[#F3F0EA] border border-[#E8E2D9] text-xs font-bold text-[#1C1917] cursor-pointer inline-flex items-center justify-center gap-1"
            >
              <Phone className="w-3.5 h-3.5 text-[#0D9488]" />
              <span>Celular</span>
            </button>
          </div>
        )}
      </div>

      {/* Background Web Push Notifications & Reminders */}
      <PushNotificationPanel uid={firebaseUser?.uid} />

      {/* Mobile / Desktop PWA Install Prompt */}
      <PWAInstallButton />

      {/* Statistics 2x2 Grid */}
      <div className="space-y-3">
        <h3 className="font-display text-lg font-bold text-[#1C1917]">Estatísticas</h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-[#E8E2D9] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF1E6] text-[#EA580C] flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 fill-[#EA580C]" />
            </div>
            <div>
              <div className="font-display text-lg font-bold text-[#1C1917]">
                {userProfile.streakDays} dias
              </div>
              <div className="text-xs font-medium text-[#57534E]">Ofensiva</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E8E2D9] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] text-[#0D9488] flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 fill-[#0D9488]" />
            </div>
            <div>
              <div className="font-display text-lg font-bold text-[#1C1917]">
                {userProfile.xp} XP
              </div>
              <div className="text-xs font-medium text-[#57534E]">Total acumulado</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E8E2D9] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF1E6] text-[#EA580C] flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="font-display text-lg font-bold text-[#1C1917]">
                {userProfile.currentLeague}
              </div>
              <div className="text-xs font-medium text-[#57534E]">Liga atual</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E8E2D9] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center shrink-0">
              <Medal className="w-5 h-5" />
            </div>
            <div>
              <div className="font-display text-lg font-bold text-[#1C1917]">
                {userProfile.completedNodeIds.length}
              </div>
              <div className="text-xs font-medium text-[#57534E]">Lições feitas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements List */}
      <div className="space-y-3">
        <h3 className="font-display text-lg font-bold text-[#1C1917]">Conquistas</h3>

        <div className="bg-white rounded-2xl border border-[#E8E2D9] divide-y divide-[#E8E2D9]">
          {userProfile.achievements.map((ach) => {
            const pct = Math.min(100, (ach.currentProgress / ach.targetProgress) * 100);
            return (
              <div key={ach.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-sm text-[#1C1917]">{ach.title}</h4>
                  <span className="text-xs font-bold text-[#0F766E] shrink-0">
                    Nível {ach.tier}/{ach.maxTier}
                  </span>
                </div>
                <p className="text-xs text-[#57534E]">{ach.description}</p>
                <div className="w-full h-2.5 bg-[#F3F0EA] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#EA580C] rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Saved Camera Translations (Firestore) */}
      {firebaseUser && canSyncCloud && (
        <div className="space-y-3">
          <h3 className="font-display text-lg font-bold text-[#1C1917]">
            Traduções salvas da câmera
          </h3>
          {savedTranslations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E8E2D9] p-6 flex flex-col items-center text-center gap-3">
              <LibiMascot mood="pensando" size="sm" />
              <p className="text-xs font-medium text-[#57534E] max-w-xs">
                Nenhuma tradução salva ainda. Ao traduzir sinais na câmera, toque em Salvar para guardar aqui.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E8E2D9] divide-y divide-[#E8E2D9]">
              {savedTranslations.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="text-xs font-bold text-[#0F766E] truncate">
                      {item.glosses.join(' · ')}
                    </div>
                    <div className="text-sm font-bold text-[#1C1917] break-words">
                      "{item.portugueseText}"
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => speakPortugueseText(item.portugueseText)}
                      title="Ouvir"
                      className="p-2 rounded-xl bg-[#FFF1E6] text-[#EA580C] hover:bg-[#FFEDD5] cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    {onDeleteTranslation && (
                      <button
                        onClick={() => onDeleteTranslation(item.id)}
                        title="Excluir"
                        className="p-2 rounded-xl bg-rose-50 text-[#E11D48] hover:bg-rose-100 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reset Section */}
      <div className="pt-4 border-t border-[#E8E2D9] flex items-center justify-between">
        <button
          onClick={() => setShowResetConfirm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-[#BE123C] border border-[#FECDD3] font-bold text-xs cursor-pointer transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reiniciar progresso</span>
        </button>
      </div>

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FAF9F6] rounded-3xl border border-[#E8E2D9] p-6 max-w-sm w-full space-y-4 shadow-xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-lg font-bold text-[#1C1917]">Zerar progresso?</h3>
              <p className="text-xs text-[#57534E] font-medium">
                Suas lições, ofensiva, gemas e níveis voltarão para o início.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="tactile-btn py-2.5 rounded-xl bg-white hover:bg-[#F3F0EA] text-[#1C1917] font-bold text-xs border border-[#E8E2D9] border-b-[3px] border-b-[#D6CFC5] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  soundService.playCorrect();
                  onResetData();
                  setShowResetConfirm(false);
                }}
                className="tactile-btn py-2.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-xs border-b-[3px] border-[#9F1239] cursor-pointer"
              >
                Zerar dados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
