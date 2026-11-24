export interface PushReminderSettings {
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
}

const PUSH_SETTINGS_KEY = 'easylib_push_settings_v1';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function loadPushReminderSettings(): PushReminderSettings {
  try {
    const raw = localStorage.getItem(PUSH_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        reminderEnabled: Boolean(parsed.reminderEnabled),
        reminderHour:
          typeof parsed.reminderHour === 'number'
            ? Math.max(0, Math.min(23, Math.trunc(parsed.reminderHour)))
            : 19,
        reminderMinute:
          typeof parsed.reminderMinute === 'number'
            ? Math.max(0, Math.min(59, Math.trunc(parsed.reminderMinute)))
            : 0,
      };
    }
  } catch {
    // Use defaults
  }
  return { reminderEnabled: true, reminderHour: 19, reminderMinute: 0 };
}

export function savePushReminderSettings(settings: PushReminderSettings): void {
  try {
    localStorage.setItem(PUSH_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota issues
  }
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

export function getNotificationPermissionState(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

async function getReadyServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration();
  if (!existing) {
    // VitePWA injects SW at /sw.js (or /dev-sw.js?dev-sw in dev mode)
    const swUrl = import.meta.env.DEV ? '/dev-sw.js?dev-sw' : '/sw.js';
    try {
      await navigator.serviceWorker.register(swUrl, {
        type: import.meta.env.DEV ? 'module' : 'classic',
        scope: '/',
      });
    } catch {
      // Fallback: let navigator.serviceWorker.ready resolve if already registered
    }
  }
  return navigator.serviceWorker.ready;
}

export async function getActivePushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const reg = await getReadyServiceWorkerRegistration();
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export async function subscribeToBackgroundPush(
  settings: PushReminderSettings,
  uid?: string | null
): Promise<{ subscription: PushSubscription; permission: NotificationPermission }> {
  if (!isPushSupported()) {
    throw new Error('Este navegador não suporta notificações push em segundo plano.');
  }

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  if (permission !== 'granted') {
    throw new Error(
      'Permissão de notificação negada ou bloqueada. Autorize as notificações no navegador ou abra o app instalado.'
    );
  }

  const keyRes = await fetch('/api/push/vapid-public-key');
  if (!keyRes.ok) {
    throw new Error('Não foi possível obter a chave pública push do servidor.');
  }
  const { publicKey } = (await keyRes.json()) as { publicKey: string };

  const reg = await getReadyServiceWorkerRegistration();
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const jsonSub = sub.toJSON();
  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscription: jsonSub,
      uid: uid || null,
      reminderEnabled: settings.reminderEnabled,
      reminderHour: settings.reminderHour,
      reminderMinute: settings.reminderMinute,
      timezoneOffsetMinutes: new Date().getTimezoneOffset(),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao salvar assinatura push no servidor.');
  }

  savePushReminderSettings(settings);
  return { subscription: sub, permission };
}

export async function unsubscribeFromBackgroundPush(): Promise<void> {
  const sub = await getActivePushSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  await sub.unsubscribe().catch(() => undefined);
  await fetch('/api/push/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint }),
  }).catch(() => undefined);
}

export async function sendBackgroundPushTest(
  delaySeconds = 0,
  customMessage?: { title?: string; body?: string }
): Promise<{ message: string }> {
  const sub = await getActivePushSubscription();
  if (!sub) {
    throw new Error('Ative as notificações push primeiro.');
  }

  const res = await fetch('/api/push/send-test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: sub.endpoint,
      delaySeconds,
      title: customMessage?.title || 'EasyLib — Treino de Libras',
      body:
        customMessage?.body ||
        'Hora de praticar mais um sinal em Libras! Toque para abrir sua lição.',
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Não foi possível enviar a notificação push.');
  }

  return {
    message:
      data.message ||
      (delaySeconds > 0
        ? `Push agendado para ${delaySeconds}s! Você pode minimizar ou fechar esta aba.`
        : 'Notificação push enviada!'),
  };
}
