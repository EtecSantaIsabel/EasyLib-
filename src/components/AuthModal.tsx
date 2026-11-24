import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Mail,
  Phone,
  Lock,
  User as UserIcon,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RefreshCw
} from 'lucide-react';
import {
  appleProvider,
  auth,
  ConfirmationResult,
  createUserWithEmailAndPassword,
  formatFirebaseAuthError,
  googleProvider,
  RecaptchaVerifier,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  updateProfile
} from '../firebase';
import { soundService } from '../services/soundService';

type AuthMethodTab = 'options' | 'email' | 'phone';
type EmailSubMode = 'login' | 'register' | 'reset';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: AuthMethodTab;
  onAuthSuccess?: () => void;
}

function normalizePhoneToE164(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('+')) {
    return `+${trimmed.slice(1).replace(/\D/g, '')}`;
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) {
    return `+${digits}`;
  }
  return `+55${digits}`;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'options',
  onAuthSuccess
}) => {
  const [tab, setTab] = useState<AuthMethodTab>(initialTab);
  const [emailMode, setEmailMode] = useState<EmailSubMode>('login');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Email/Password state
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Phone Auth state
  const [phoneInput, setPhoneInput] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setErrorMsg(null);
      setInfoMsg(null);
    } else {
      if (recaptchaRef.current) {
        recaptchaRef.current.clear();
        recaptchaRef.current = null;
      }
      setConfirmationResult(null);
      setOtpCode('');
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    return () => {
      if (recaptchaRef.current) {
        recaptchaRef.current.clear();
        recaptchaRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  const handlePopupProvider = async (providerName: 'google' | 'apple') => {
    soundService.playTap();
    setErrorMsg(null);
    setInfoMsg(null);
    setBusy(true);
    try {
      const provider = providerName === 'google' ? googleProvider : appleProvider;
      await signInWithPopup(auth, provider);
      soundService.playCorrect();
      onAuthSuccess?.();
      onClose();
    } catch (err) {
      soundService.playIncorrect();
      setErrorMsg(formatFirebaseAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundService.playTap();
    setErrorMsg(null);
    setInfoMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Informe seu endereço de e-mail.');
      return;
    }

    setBusy(true);
    try {
      if (emailMode === 'reset') {
        await sendPasswordResetEmail(auth, cleanEmail);
        soundService.playCorrect();
        setInfoMsg('Enviamos um link de redefinição para o seu e-mail.');
        setEmailMode('login');
        return;
      }

      if (password.length < 6) {
        setErrorMsg('A senha precisa ter pelo menos 6 caracteres.');
        return;
      }

      if (emailMode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        if (displayName.trim()) {
          await updateProfile(cred.user, { displayName: displayName.trim().slice(0, 80) });
        }
        await sendEmailVerification(cred.user).catch(() => undefined);
        soundService.playCorrect();
        setInfoMsg('Conta criada! Enviamos um link de confirmação para o seu e-mail.');
        onAuthSuccess?.();
        setTimeout(() => onClose(), 1200);
      } else {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
        soundService.playCorrect();
        if (!cred.user.emailVerified) {
          setInfoMsg('Login realizado! Confirme seu e-mail no perfil para sincronizar na nuvem.');
        }
        onAuthSuccess?.();
        onClose();
      }
    } catch (err) {
      soundService.playIncorrect();
      setErrorMsg(formatFirebaseAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSendSmsCode = async (e: React.FormEvent) => {
    e.preventDefault();
    soundService.playTap();
    setErrorMsg(null);
    setInfoMsg(null);

    const formattedPhone = normalizePhoneToE164(phoneInput);
    if (formattedPhone.length < 10) {
      setErrorMsg('Informe o número com DDD (ex: 11 99999-9999).');
      return;
    }

    if (!recaptchaContainerRef.current) {
      setErrorMsg('Contêiner de verificação não pronto. Tente novamente.');
      return;
    }

    setBusy(true);
    try {
      if (recaptchaRef.current) {
        recaptchaRef.current.clear();
        recaptchaRef.current = null;
      }
      const verifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
        size: 'invisible'
      });
      recaptchaRef.current = verifier;
      const result = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      setConfirmationResult(result);
      soundService.playCorrect();
      setInfoMsg(`Código SMS enviado para ${formattedPhone}.`);
    } catch (err) {
      soundService.playIncorrect();
      if (recaptchaRef.current) {
        recaptchaRef.current.clear();
        recaptchaRef.current = null;
      }
      setErrorMsg(formatFirebaseAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    soundService.playTap();
    setErrorMsg(null);

    const cleanCode = otpCode.replace(/\D/g, '');
    if (cleanCode.length < 6) {
      setErrorMsg('Digite os 6 dígitos do código SMS.');
      return;
    }

    setBusy(true);
    try {
      await confirmationResult.confirm(cleanCode);
      soundService.playCorrect();
      onAuthSuccess?.();
      onClose();
    } catch (err) {
      soundService.playIncorrect();
      setErrorMsg(formatFirebaseAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#FAF9F6] rounded-3xl border border-[#E8E2D9] p-6 max-w-md w-full space-y-5 shadow-2xl relative animate-scale-in max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar janela de login"
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#78716C] hover:text-[#1C1917] hover:bg-[#E8E2D9]/60 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1 pr-8">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E]">
            Conta EasyLib
          </span>
          <h2 className="font-display text-2xl font-bold text-[#1C1917]">
            Entre ou crie sua conta
          </h2>
          <p className="text-xs text-[#57534E] font-medium">
            Salve sua ofensiva, sinais aprendidos, ranking e lembretes em qualquer dispositivo.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1.5 bg-[#F3F0EA] p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              soundService.playTap();
              setTab('options');
              setErrorMsg(null);
            }}
            className={`py-2 px-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              tab === 'options'
                ? 'bg-white text-[#1C1917] shadow-xs'
                : 'text-[#57534E] hover:text-[#1C1917]'
            }`}
          >
            Rápido
          </button>
          <button
            type="button"
            onClick={() => {
              soundService.playTap();
              setTab('email');
              setErrorMsg(null);
            }}
            className={`py-2 px-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              tab === 'email'
                ? 'bg-white text-[#1C1917] shadow-xs'
                : 'text-[#57534E] hover:text-[#1C1917]'
            }`}
          >
            E-mail
          </button>
          <button
            type="button"
            onClick={() => {
              soundService.playTap();
              setTab('phone');
              setErrorMsg(null);
            }}
            className={`py-2 px-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              tab === 'phone'
                ? 'bg-white text-[#1C1917] shadow-xs'
                : 'text-[#57534E] hover:text-[#1C1917]'
            }`}
          >
            Celular
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs font-semibold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="p-3 rounded-xl bg-[#F0FDFA] border border-[#99F6E4] text-[#0F766E] text-xs font-semibold flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* TAB 1: GOOGLE & APPLE + SHORTCUTS */}
        {tab === 'options' && (
          <div className="space-y-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => handlePopupProvider('google')}
              className="tactile-btn w-full py-3 px-4 rounded-2xl bg-white hover:bg-[#FAF9F6] border border-[#E8E2D9] border-b-4 border-b-[#D6CFC5] text-[#1C1917] font-bold text-sm flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.9-5.4 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12s4.3 9.5 9.5 9.5c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.6H12z" />
              </svg>
              <span>{busy ? 'Conectando...' : 'Continuar com Google'}</span>
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => handlePopupProvider('apple')}
              className="tactile-btn w-full py-3 px-4 rounded-2xl bg-[#1C1917] hover:bg-[#292524] border border-[#1C1917] border-b-4 border-b-black text-white font-bold text-sm flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
            >
              <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M16.37 1.63c0 1.14-.42 2.2-1.15 3-.79.88-1.99 1.55-3.19 1.46-.14-1.1.4-2.25 1.13-3.03.78-.84 2.09-1.46 3.21-1.43zm4.18 15.17c-.45 1.04-.67 1.51-1.26 2.43-.82 1.29-1.98 2.89-3.41 2.91-1.27.02-1.6-.83-3.33-.82-1.73.01-2.09.84-3.36.82-1.43-.02-2.52-1.46-3.34-2.75-2.3-3.61-2.54-7.84-1.12-10.02 1.01-1.55 2.6-2.46 4.1-2.46 1.52 0 2.48.84 3.74.84 1.22 0 1.97-.84 3.73-.84 1.33 0 2.74.73 3.75 1.99-3.29 1.81-2.76 6.51.5 7.7z" />
              </svg>
              <span>Continuar com Apple</span>
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E8E2D9]" />
              </div>
              <div className="relative flex justify-center text-[11px] font-bold uppercase tracking-wider">
                <span className="bg-[#FAF9F6] px-3 text-[#78716C]">ou escolha</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setTab('email')}
                className="tactile-btn py-2.5 px-3 rounded-xl bg-white hover:bg-[#F3F0EA] border border-[#E8E2D9] border-b-[3px] border-b-[#D6CFC5] text-[#1C1917] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mail className="w-4 h-4 text-[#EA580C]" />
                <span>E-mail e senha</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('phone')}
                className="tactile-btn py-2.5 px-3 rounded-xl bg-white hover:bg-[#F3F0EA] border border-[#E8E2D9] border-b-[3px] border-b-[#D6CFC5] text-[#1C1917] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Phone className="w-4 h-4 text-[#0D9488]" />
                <span>Celular (SMS)</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: EMAIL & PASSWORD */}
        {tab === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-3.5">
            {emailMode === 'register' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#57534E]">Seu nome</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Como você quer ser chamado"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D9] text-sm font-semibold text-[#1C1917] focus:outline-none focus:border-[#0D9488]"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#57534E]">E-mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D9] text-sm font-semibold text-[#1C1917] focus:outline-none focus:border-[#0D9488]"
                />
              </div>
            </div>

            {emailMode !== 'reset' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#57534E]">Senha</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo de 6 caracteres"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D9] text-sm font-semibold text-[#1C1917] focus:outline-none focus:border-[#0D9488]"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="tactile-btn w-full py-3 px-4 rounded-xl bg-[#EA580C] hover:bg-[#DC4F06] disabled:opacity-60 text-white font-bold text-xs uppercase tracking-wider border-b-4 border-[#9A3412] cursor-pointer flex items-center justify-center gap-2"
            >
              <span>
                {busy
                  ? 'Aguarde...'
                  : emailMode === 'register'
                  ? 'Criar conta'
                  : emailMode === 'reset'
                  ? 'Enviar link de recuperação'
                  : 'Entrar com e-mail'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs font-bold">
              {emailMode === 'login' ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailMode('register');
                      setErrorMsg(null);
                    }}
                    className="text-[#0F766E] hover:underline cursor-pointer"
                  >
                    Criar nova conta
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailMode('reset');
                      setErrorMsg(null);
                    }}
                    className="text-[#78716C] hover:text-[#1C1917] cursor-pointer"
                  >
                    Esqueci a senha
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEmailMode('login');
                    setErrorMsg(null);
                  }}
                  className="text-[#0F766E] hover:underline cursor-pointer"
                >
                  Já tenho conta · Entrar
                </button>
              )}
            </div>
          </form>
        )}

        {/* TAB 3: PHONE NUMBER (SMS OTP) */}
        {tab === 'phone' && (
          <div className="space-y-3.5">
            {!confirmationResult ? (
              <form onSubmit={handleSendSmsCode} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#57534E]">
                    Número de celular com DDD
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="+55 11 99999-9999"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D9] text-sm font-semibold text-[#1C1917] focus:outline-none focus:border-[#0D9488]"
                    />
                  </div>
                  <p className="text-[11px] text-[#78716C] font-medium">
                    Se não informar o DDI (+55), adicionamos automaticamente o código do Brasil.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="tactile-btn w-full py-3 px-4 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-60 text-white font-bold text-xs uppercase tracking-wider border-b-4 border-[#115E59] cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{busy ? 'Enviando SMS...' : 'Enviar código SMS'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#57534E]">
                    Código SMS de 6 dígitos
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D9] text-base tracking-[0.28em] font-bold text-[#1C1917] focus:outline-none focus:border-[#0D9488]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="tactile-btn w-full py-3 px-4 rounded-xl bg-[#EA580C] hover:bg-[#DC4F06] disabled:opacity-60 text-white font-bold text-xs uppercase tracking-wider border-b-4 border-[#9A3412] cursor-pointer"
                >
                  {busy ? 'Validando...' : 'Confirmar e entrar'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setConfirmationResult(null);
                    setOtpCode('');
                    setErrorMsg(null);
                  }}
                  className="w-full py-2 text-xs font-bold text-[#57534E] hover:text-[#1C1917] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Trocar número ou reenviar SMS</span>
                </button>
              </form>
            )}
          </div>
        )}

        <div ref={recaptchaContainerRef} />
      </div>
    </div>
  );
};
