import React, { useState } from 'react';
import {
  Trophy,
  Flame,
  KeyRound,
  Plus,
  Copy,
  Check,
  LogOut,
  Users,
  ArrowLeft,
  AlertCircle,
  Lock
} from 'lucide-react';
import { UserProfile } from '../types';
import {
  ClosedRoom,
  RoomMemberEntry,
  isValidRoomCodeFormat,
  normalizeRoomCode
} from '../services/firebaseSync';
import { soundService } from '../services/soundService';

interface LeaderboardViewProps {
  userProfile: UserProfile;
  currentUid: string | null;
  isSignedIn: boolean;
  userEmail: string | null;
  canSyncCloud: boolean;
  authBusy: boolean;
  activeRoom: ClosedRoom | null;
  savedRooms: ClosedRoom[];
  roomMembers: RoomMemberEntry[];
  roomBusy: boolean;
  roomError: string | null;
  onJoinRoomByCode: (code: string) => Promise<void>;
  onCreateRoom: (roomName: string) => Promise<void>;
  onSwitchRoom: () => void;
  onLeaveRoom: (roomCode: string) => Promise<void>;
  onClearRoomError: () => void;
  onOpenAuthModal: () => void;
  onResendVerification: () => Promise<void>;
  onRefreshVerification: () => Promise<void>;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  userProfile,
  currentUid,
  isSignedIn,
  userEmail,
  canSyncCloud,
  authBusy,
  activeRoom,
  savedRooms,
  roomMembers,
  roomBusy,
  roomError,
  onJoinRoomByCode,
  onCreateRoom,
  onSwitchRoom,
  onLeaveRoom,
  onClearRoomError,
  onOpenAuthModal,
  onResendVerification,
  onRefreshVerification
}) => {
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [createNameInput, setCreateNameInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const visibleError = localError || roomError;

  const handleSubmitJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    soundService.playTap();
    setLocalError(null);
    onClearRoomError();

    const normalized = normalizeRoomCode(joinCodeInput);
    if (!normalized) {
      setLocalError('Digite o código único da sala para entrar.');
      return;
    }
    if (!isValidRoomCodeFormat(normalized)) {
      setLocalError('Código inválido. O código da sala tem de 6 a 12 letras ou números.');
      return;
    }

    await onJoinRoomByCode(normalized);
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    soundService.playTap();
    setLocalError(null);
    onClearRoomError();

    const trimmed = createNameInput.trim();
    if (trimmed.length < 2) {
      setLocalError('Digite um nome com pelo menos 2 caracteres para criar a sala.');
      return;
    }

    await onCreateRoom(trimmed);
    setCreateNameInput('');
  };

  const handleCopyCode = async (code: string) => {
    soundService.playTap();
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      setCopiedCode(false);
    }
  };

  if (activeRoom && canSyncCloud) {
    const sortedMembers = [...roomMembers].sort((a, b) => b.xp - a.xp);

    return (
      <div className="max-w-xl mx-auto px-2 sm:px-4 py-2 space-y-5 select-none animate-fade-in">
        {/* Closed Room Header */}
        <div className="bg-[#0D9488] rounded-2xl p-5 text-white border-b-4 border-[#0F766E] space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#CCFBF1] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Sala fechada por código</span>
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold truncate">
                {activeRoom.name}
              </h2>
              <p className="text-xs text-white/90 font-medium flex items-center gap-2 tabular-nums">
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {sortedMembers.length}{' '}
                  {sortedMembers.length === 1 ? 'participante real' : 'participantes reais'}
                </span>
              </p>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <Trophy className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Unique Room Code + Copy + Actions */}
          <div className="bg-white/10 rounded-xl p-3 border border-white/15 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#CCFBF1]">Código da sala:</span>
              <span className="font-mono font-bold text-base tracking-widest text-white">
                {activeRoom.roomCode}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopyCode(activeRoom.roomCode)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-[#0F766E] font-bold text-xs cursor-pointer hover:bg-[#F0FDFA] transition-colors whitespace-nowrap"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copiado!' : 'Copiar código'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundService.playTap();
                  onSwitchRoom();
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold text-xs cursor-pointer transition-colors whitespace-nowrap"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Trocar sala</span>
              </button>
            </div>
          </div>
        </div>

        {/* Real Participants List (Zero Bots / Zero Fake Names) */}
        <div className="bg-white rounded-2xl border border-[#E8E2D9] overflow-hidden divide-y divide-[#E8E2D9]">
          {roomBusy && sortedMembers.length === 0 ? (
            <div className="p-6 text-center text-sm font-medium text-[#57534E]">
              Carregando participantes da sala...
            </div>
          ) : sortedMembers.length === 0 ? (
            <div className="p-6 text-center text-sm font-medium text-[#57534E]">
              Nenhum participante sincronizado ainda nesta sala.
            </div>
          ) : (
            sortedMembers.map((member, idx) => {
              const rank = idx + 1;
              const isCurrentUser = currentUid !== null && member.userId === currentUid;
              const initial = (member.name?.trim()[0] || 'A').toUpperCase();

              return (
                <div
                  key={member.userId}
                  className={`px-4 py-3.5 flex items-center justify-between gap-3 transition-colors ${
                    isCurrentUser ? 'bg-[#FFF1E6]' : 'hover:bg-[#FAF9F6]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-7 flex items-center justify-center shrink-0">
                      {rank <= 3 ? (
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-display font-bold text-xs tabular-nums ${
                            rank === 1
                              ? 'bg-[#F59E0B] text-white'
                              : rank === 2
                              ? 'bg-[#94A3B8] text-white'
                              : 'bg-[#B45309] text-white'
                          }`}
                        >
                          {rank}
                        </span>
                      ) : (
                        <span className="font-bold text-sm text-[#78716C] tabular-nums">
                          {rank}
                        </span>
                      )}
                    </div>

                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        isCurrentUser
                          ? 'bg-[#EA580C] text-white'
                          : 'bg-[#F3F0EA] text-[#57534E]'
                      }`}
                    >
                      {initial}
                    </div>

                    <div className="min-w-0">
                      <div className="font-bold text-sm text-[#1C1917] truncate flex items-center gap-2">
                        <span className="truncate">{member.name}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#EA580C] text-white shrink-0">
                            Você
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-medium text-[#78716C] flex items-center gap-1 tabular-nums">
                        <Flame className="w-3 h-3 text-[#EA580C]" />
                        <span>{member.streakDays} dias seguidos</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold text-sm text-[#1C1917] tabular-nums">
                      {member.xp} XP
                    </div>
                    <div className="text-[11px] font-medium text-[#78716C]">
                      @{member.username}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Invite & Leave Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <p className="text-xs font-medium text-[#57534E]">
            Apenas quem entrou com o código <strong className="font-mono text-[#1C1917]">{activeRoom.roomCode}</strong> aparece aqui.
          </p>

          <button
            type="button"
            disabled={roomBusy}
            onClick={() => {
              soundService.playTap();
              onLeaveRoom(activeRoom.roomCode);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#BE123C] hover:underline cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair desta sala</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-2 sm:px-4 py-2 space-y-5 select-none animate-fade-in">
      {/* Header */}
      <div className="bg-[#0D9488] rounded-2xl p-5 text-white border-b-4 border-[#0F766E] flex items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#CCFBF1] flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Salas fechadas</span>
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold">
            Ranking da Sala
          </h2>
          <p className="text-xs sm:text-sm text-white/90 font-medium">
            Entre usando o código único de uma sala real ou crie a sua para competir somente com participantes verdadeiros.
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
          <Trophy className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Sign-in / Verification Prompt */}
      {!canSyncCloud ? (
        <div className="bg-white rounded-2xl border border-[#E8E2D9] p-6 space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#F0FDFA] text-[#0F766E] flex items-center justify-center mx-auto">
            <KeyRound className="w-6 h-6" />
          </div>
          {isSignedIn ? (
            <>
              <div className="space-y-1.5">
                <h3 className="font-display text-lg font-bold text-[#1C1917]">
                  Confirme seu e-mail para liberar as salas fechadas
                </h3>
                <p className="text-sm text-[#57534E] leading-relaxed">
                  Enviamos um link de confirmação para <strong>{userEmail || 'seu e-mail'}</strong>. Após confirmar, clique em &ldquo;Já confirmei&rdquo; abaixo.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  disabled={authBusy}
                  onClick={() => {
                    soundService.playTap();
                    onRefreshVerification();
                  }}
                  className="tactile-btn px-4 py-2.5 rounded-xl bg-[#0D9488] text-white border-b-[3px] border-[#0F766E] font-bold text-sm cursor-pointer disabled:opacity-60"
                >
                  {authBusy ? 'Verificando...' : 'Já confirmei · Atualizar'}
                </button>
                <button
                  type="button"
                  disabled={authBusy}
                  onClick={() => {
                    soundService.playTap();
                    onResendVerification();
                  }}
                  className="tactile-btn px-4 py-2.5 rounded-xl bg-[#F3F0EA] text-[#1C1917] border border-[#E8E2D9] border-b-[3px] border-b-[#D6CFC5] font-bold text-sm cursor-pointer disabled:opacity-60"
                >
                  Reenviar link
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <h3 className="font-display text-lg font-bold text-[#1C1917]">
                  Entre na sua conta para acessar salas fechadas
                </h3>
                <p className="text-sm text-[#57534E] leading-relaxed">
                  Para validar o código único da sala e exibir apenas participantes reais ({userProfile.xp} XP atuais), faça login com Google, Apple, e-mail ou telefone.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundService.playTap();
                  onOpenAuthModal();
                }}
                className="tactile-btn px-5 py-2.5 rounded-xl bg-[#0D9488] text-white border-b-[3px] border-[#0F766E] font-bold text-sm cursor-pointer"
              >
                Entrar ou criar conta
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          {visibleError && (
            <div className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs font-bold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{visibleError}</span>
            </div>
          )}

          {/* Join Existing Room Card */}
          <form
            onSubmit={handleSubmitJoin}
            className="bg-white rounded-2xl border border-[#E8E2D9] p-5 space-y-3.5"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#F0FDFA] text-[#0F766E] flex items-center justify-center shrink-0">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[#1C1917]">
                  Entrar com código da sala
                </h3>
                <p className="text-xs text-[#57534E] font-medium">
                  Só aceita códigos válidos de salas existentes.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={joinCodeInput}
                onChange={(e) => {
                  setJoinCodeInput(e.target.value.toUpperCase());
                  setLocalError(null);
                  onClearRoomError();
                }}
                maxLength={12}
                placeholder="Digite o código (ex: LIB7K9)"
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E2D9] text-[#1C1917] font-mono font-bold tracking-wider uppercase text-sm focus:outline-none focus:border-[#0D9488]"
              />
              <button
                type="submit"
                disabled={roomBusy}
                className="tactile-btn px-5 py-2.5 rounded-xl bg-[#0D9488] text-white border-b-[3px] border-[#0F766E] font-bold text-sm cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {roomBusy ? 'Verificando...' : 'Entrar na sala'}
              </button>
            </div>
          </form>

          {/* Create Real Room Card */}
          <form
            onSubmit={handleSubmitCreate}
            className="bg-white rounded-2xl border border-[#E8E2D9] p-5 space-y-3.5"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FFF1E6] text-[#EA580C] flex items-center justify-center shrink-0">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[#1C1917]">
                  Criar nova sala fechada
                </h3>
                <p className="text-xs text-[#57534E] font-medium">
                  Gera um código único exclusivo para sua turma ou amigos.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={createNameInput}
                onChange={(e) => {
                  setCreateNameInput(e.target.value);
                  setLocalError(null);
                  onClearRoomError();
                }}
                maxLength={60}
                placeholder="Nome da sala (ex: Turma Libras 2026)"
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E2D9] text-[#1C1917] font-semibold text-sm focus:outline-none focus:border-[#EA580C]"
              />
              <button
                type="submit"
                disabled={roomBusy}
                className="tactile-btn px-5 py-2.5 rounded-xl bg-[#EA580C] text-white border-b-[3px] border-[#9A3412] font-bold text-sm cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {roomBusy ? 'Criando...' : 'Criar sala'}
              </button>
            </div>
          </form>

          {/* Previously Joined Real Rooms */}
          {savedRooms.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
                Suas salas recentes
              </h3>
              <div className="divide-y divide-[#F3F0EA]">
                {savedRooms.map((room) => (
                  <div
                    key={room.roomCode}
                    className="py-2.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-[#1C1917] truncate">
                        {room.name}
                      </div>
                      <div className="text-xs font-mono font-semibold text-[#0F766E]">
                        Código: {room.roomCode}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={roomBusy}
                      onClick={() => {
                        soundService.playTap();
                        onJoinRoomByCode(room.roomCode);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#F0FDFA] hover:bg-[#CCFBF1] text-[#0F766E] border border-[#99F6E4] font-bold text-xs cursor-pointer whitespace-nowrap"
                    >
                      Abrir sala
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
