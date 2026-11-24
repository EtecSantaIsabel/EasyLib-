import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Clock, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  getActivePushSubscription,
  getNotificationPermissionState,
  isPushSupported,
  loadPushReminderSettings,
  PushReminderSettings,
  savePushReminderSettings,
  sendBackgroundPushTest,
  subscribeToBackgroundPush,
  unsubscribeFromBackgroundPush
} from '../services/pushNotificationService';
import { soundService } from '../services/soundService';

interface PushNotificationPanelProps {
  uid?: string | null;
}

export const PushNotificationPanel: React.FC<PushNotificationPanelProps> = ({ uid }) => {
  const [supported] = useState(() => isPushSupported());
  const [permission, setPermission] = useState(() => getNotificationPermissionState());
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [settings, setSettings] = useState<PushReminderSettings>(() => loadPushReminderSettings());
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!supported) return;
    getActivePushSubscription().then((sub) => {
      setIsSubscribed(Boolean(sub));
      setPermission(getNotificationPermissionState());
    });
  }, [supported]);

  const timeString = `${String(settings.reminderHour).padStart(2, '0')}:${String(
    settings.reminderMinute
  ).padStart(2, '0')}`;

  const handleEnableOrSyncPush = async (nextSettings = settings) => {
    soundService.playTap();
    setBusy(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const { permission: perm } = await subscribeToBackgroundPush(nextSettings, uid);
      setPermission(perm);
      setIsSubscribed(true);
      soundService.playCorrect();
      setStatusMsg('Notificações push em segundo plano ativadas neste dispositivo.');
    } catch (err) {
      soundService.playIncorrect();
      setPermission(getNotificationPermissionState());
      setErrorMsg(err instanceof Error ? err.message : 'Não foi possível ativar as notificações.');
    } finally {
      setBusy(false);
    }
  };

  const handleDisablePush = async () => {
    soundService.playTap();
    setBusy(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      await unsubscribeFromBackgroundPush();
      setIsSubscribed(false);
      setStatusMsg('Notificações push desativadas neste dispositivo.');
    } finally {
      setBusy(false);
    }
  };

  const handleTimeChange = async (value: string) => {
    const [hStr, mStr] = value.split(':');
    const hour = Math.max(0, Math.min(23, Number(hStr) || 19));
    const minute = Math.max(0, Math.min(59, Number(mStr) || 0));
    const next: PushReminderSettings = {
      ...settings,
      reminderEnabled: true,
      reminderHour: hour,
      reminderMinute: minute
    };
    setSettings(next);
    savePushReminderSettings(next);
    if (isSubscribed) {
      await handleEnableOrSyncPush(next);
    }
  };

  const handleTestPush = async (delaySeconds: number) => {
    soundService.playTap();
    setBusy(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const result = await sendBackgroundPushTest(delaySeconds);
      soundService.playCorrect();
      setStatusMsg(result.message);
    } catch (err) {
      soundService.playIncorrect();
      setErrorMsg(err instanceof Error ? err.message : 'Falha ao disparar notificação.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3.5 min-w-0">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              isSubscribed ? 'bg-[#F0FDFA] text-[#0D9488]' : 'bg-[#FFF1E6] text-[#EA580C]'
            }`}
          >
            {isSubscribed ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-bold text-base text-[#1C1917]">
              Notificações push em segundo plano
            </h3>
            <p className="text-xs text-[#57534E] font-medium">
              Receba lembretes de estudo mesmo com o aplicativo fechado ou em outro app.
            </p>
          </div>
        </div>

        {supported && (
          isSubscribed ? (
            <button
              type="button"
              disabled={busy}
              onClick={handleDisablePush}
              className="tactile-btn px-4 py-2 rounded-xl bg-[#F3F0EA] hover:bg-[#E8E2D9] text-[#1C1917] font-bold text-xs border-b-[3px] border-[#D6CFC5] cursor-pointer shrink-0"
            >
              Desativar
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => handleEnableOrSyncPush()}
              className="tactile-btn px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-60 text-white font-bold text-xs uppercase border-b-[3px] border-[#115E59] cursor-pointer shrink-0"
            >
              {busy ? 'Ativando...' : 'Ativar push'}
            </button>
          )
        )}
      </div>

      {!supported && (
        <p className="text-xs font-medium text-[#78716C] bg-[#FAF9F6] p-3 rounded-xl border border-[#E8E2D9]">
          Seu navegador atual não disponibiliza Push API em segundo plano. Instale o EasyLib na tela inicial (Chrome, Edge ou Safari iOS 16.4+) para receber notificações com o app fechado.
        </p>
      )}

      {supported && permission === 'denied' && (
        <div className="p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs font-semibold flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            As notificações estão bloqueadas para esta janela. Se estiver no painel de pré-visualização, abra o app em uma aba própria ou instale como aplicativo e autorize as notificações.
          </span>
        </div>
      )}

      {statusMsg && (
        <div className="p-3 rounded-xl bg-[#F0FDFA] border border-[#99F6E4] text-[#0F766E] text-xs font-semibold flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs font-semibold flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isSubscribed && (
        <div className="pt-3 border-t border-[#E8E2D9] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs font-bold text-[#1C1917]">
              <Clock className="w-4 h-4 text-[#0D9488]" />
              <span>Horário do lembrete diário:</span>
            </label>
            <input
              type="time"
              value={timeString}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#FAF9F6] border border-[#E8E2D9] text-xs font-bold text-[#1C1917] focus:outline-none focus:border-[#0D9488]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={busy}
              onClick={() => handleTestPush(0)}
              className="tactile-btn py-2.5 px-3 rounded-xl bg-[#FAF9F6] hover:bg-[#F3F0EA] border border-[#E8E2D9] border-b-[3px] border-b-[#D6CFC5] text-[#1C1917] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-[#0D9488]" />
              <span>Enviar push agora</span>
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => handleTestPush(10)}
              className="tactile-btn py-2.5 px-3 rounded-xl bg-[#FFF1E6] hover:bg-[#FFEDD5] border border-[#FED7AA] border-b-[3px] border-b-[#EA580C] text-[#9A3412] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-[#EA580C]" />
              <span>Testar em segundo plano (10s)</span>
            </button>
          </div>
          <p className="text-[11px] text-[#78716C] font-medium">
            Dica: toque em "Testar em segundo plano (10s)" e feche ou minimize esta aba — a notificação chega pelo Service Worker mesmo com o app fechado.
          </p>
        </div>
      )}
    </div>
  );
};
