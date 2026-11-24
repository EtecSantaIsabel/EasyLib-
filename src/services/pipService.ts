import { CatalogSign } from '../data/librasCatalog255';

interface DocumentPictureInPictureAPI {
  requestWindow(options?: { width?: number; height?: number }): Promise<Window>;
  window?: Window | null;
}

declare global {
  interface Window {
    documentPictureInPicture?: DocumentPictureInPictureAPI;
  }
}

export interface PipControllerState {
  isOpen: boolean;
  mode: 'document' | 'video' | null;
  signId: string | null;
}

let activePipWindow: Window | null = null;
let activeFallbackVideo: HTMLVideoElement | null = null;
let activeFallbackRaf = 0;

export function isPictureInPictureSupported(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  return Boolean(
    window.documentPictureInPicture ||
      ('pictureInPictureEnabled' in document && document.pictureInPictureEnabled)
  );
}

export async function closeActivePictureInPicture(): Promise<void> {
  if (activeFallbackRaf) {
    cancelAnimationFrame(activeFallbackRaf);
    activeFallbackRaf = 0;
  }
  if (activePipWindow && !activePipWindow.closed) {
    activePipWindow.close();
  }
  activePipWindow = null;

  if (document.pictureInPictureElement) {
    await document.exitPictureInPicture().catch(() => undefined);
  }
  if (activeFallbackVideo) {
    activeFallbackVideo.srcObject = null;
    activeFallbackVideo.remove();
    activeFallbackVideo = null;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderDocumentPipContent(
  pipWin: Window,
  signsList: CatalogSign[],
  initialIndex: number,
  onCloseCallback?: () => void
) {
  let idx = Math.max(0, Math.min(signsList.length - 1, initialIndex));
  let speed: 1 | 0.5 = 1;

  const doc = pipWin.document;
  doc.title = 'EasyLib — Janela Flutuante';
  doc.body.innerHTML = '';

  const style = doc.createElement('style');
  style.textContent = `
    * { box-sizing: border-box; font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }
    body {
      margin: 0;
      padding: 12px;
      background: #FAF9F6;
      color: #1C1917;
      display: flex;
      flex-direction: column;
      height: 100vh;
      gap: 10px;
      user-select: none;
    }
    .hdr {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .brand {
      font-size: 12px;
      font-weight: 800;
      color: #0F766E;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .cat {
      font-size: 11px;
      font-weight: 700;
      color: #78716C;
    }
    .stage {
      position: relative;
      flex: 1;
      min-height: 160px;
      background: #1C1917;
      border-radius: 14px;
      overflow: hidden;
      border: 1px solid #E8E2D9;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    video {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .fallback {
      position: absolute;
      inset: 0;
      background: #F0FDFA;
      color: #0F766E;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 14px;
      gap: 6px;
    }
    .fallback-word {
      font-size: 24px;
      font-weight: 800;
      color: #1C1917;
    }
    .fallback-hint {
      font-size: 12px;
      font-weight: 600;
      color: #115E59;
    }
    .meta {
      background: #FFFFFF;
      border: 1px solid #E8E2D9;
      border-radius: 12px;
      padding: 10px 12px;
    }
    .title {
      font-size: 18px;
      font-weight: 800;
      margin: 0;
      color: #1C1917;
    }
    .meaning {
      font-size: 12px;
      font-weight: 500;
      margin: 2px 0 0;
      color: #57534E;
    }
    .controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }
    button {
      border: 1px solid #E8E2D9;
      background: #FFFFFF;
      color: #1C1917;
      font-weight: 700;
      font-size: 12px;
      padding: 8px 10px;
      border-radius: 10px;
      cursor: pointer;
    }
    button.active {
      background: #EA580C;
      color: #FFFFFF;
      border-color: #9A3412;
    }
    button.teal {
      background: #0D9488;
      color: #FFFFFF;
      border-color: #0F766E;
    }
  `;
  doc.head.appendChild(style);

  const root = doc.createElement('div');
  root.style.display = 'flex';
  root.style.flexDirection = 'column';
  root.style.height = '100%';
  root.style.gap = '10px';
  doc.body.appendChild(root);

  const renderCurrent = () => {
    const sign = signsList[idx];
    if (!sign) return;
    const hasNav = signsList.length > 1;

    root.innerHTML = `
      <div class="hdr">
        <span class="brand">EasyLib PiP</span>
        <span class="cat">${escapeHtml(sign.categoria)}</span>
      </div>
      <div class="stage">
        <div class="fallback" id="pip-fallback">
          <div class="fallback-word">${escapeHtml(sign.palavra)}</div>
          <div class="fallback-hint">${escapeHtml(sign.significado)}</div>
        </div>
        ${
          sign.videoUrl
            ? `<video id="pip-video" src="${escapeHtml(sign.videoUrl)}" autoplay loop muted playsinline style="opacity:0;transition:opacity .2s"></video>`
            : ''
        }
      </div>
      <div class="meta">
        <p class="title">${escapeHtml(sign.palavra)}</p>
        <p class="meaning">${escapeHtml(sign.significado)}</p>
      </div>
      <div class="controls">
        <div style="display:flex;gap:6px;">
          ${hasNav ? `<button id="pip-prev">Anterior</button>` : ''}
          ${hasNav ? `<button id="pip-next" class="teal">Próximo</button>` : ''}
        </div>
        <button id="pip-speed" class="${speed === 0.5 ? 'active' : ''}">🐢 0.5x</button>
      </div>
    `;

    const videoEl = doc.getElementById('pip-video') as HTMLVideoElement | null;
    const fallbackEl = doc.getElementById('pip-fallback') as HTMLElement | null;

    if (videoEl) {
      videoEl.playbackRate = speed;
      videoEl.addEventListener('loadeddata', () => {
        videoEl.style.opacity = '1';
        videoEl.playbackRate = speed;
        if (fallbackEl) fallbackEl.style.display = 'none';
      });
      videoEl.addEventListener('error', () => {
        videoEl.style.display = 'none';
        if (fallbackEl) fallbackEl.style.display = 'flex';
      });
    }

    doc.getElementById('pip-prev')?.addEventListener('click', () => {
      idx = (idx - 1 + signsList.length) % signsList.length;
      renderCurrent();
    });
    doc.getElementById('pip-next')?.addEventListener('click', () => {
      idx = (idx + 1) % signsList.length;
      renderCurrent();
    });
    doc.getElementById('pip-speed')?.addEventListener('click', () => {
      speed = speed === 1 ? 0.5 : 1;
      const v = doc.getElementById('pip-video') as HTMLVideoElement | null;
      if (v) v.playbackRate = speed;
      doc.getElementById('pip-speed')?.classList.toggle('active', speed === 0.5);
    });
  };

  renderCurrent();
  pipWin.addEventListener('pagehide', () => {
    activePipWindow = null;
    onCloseCallback?.();
  });
}

async function openCanvasFallbackPip(
  sign: CatalogSign,
  onCloseCallback?: () => void
): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas indisponível para Picture-in-Picture.');
  }

  let phase = 0;
  const drawFrame = () => {
    phase += 0.06;
    ctx.fillStyle = '#0D9488';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FAF9F6';
    ctx.beginPath();
    ctx.roundRect(20, 20, canvas.width - 40, canvas.height - 40, 24);
    ctx.fill();

    // Header tag
    ctx.fillStyle = '#0F766E';
    ctx.font = '700 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`EasyLib · ${sign.categoria}`, canvas.width / 2, 62);

    // Animated hand pulse circle
    const pulse = 36 + Math.sin(phase) * 7;
    ctx.fillStyle = 'rgba(234, 88, 12, 0.16)';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 165, pulse + 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#EA580C';
    ctx.beginPath();
    ctx.arc(canvas.width / 2 + Math.sin(phase) * 14, 165, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 22px sans-serif';
    ctx.fillText('LIBRAS', canvas.width / 2 + Math.sin(phase) * 14, 173);

    // Word + meaning
    ctx.fillStyle = '#1C1917';
    ctx.font = '800 32px sans-serif';
    ctx.fillText(sign.palavra, canvas.width / 2, 255);

    ctx.fillStyle = '#57534E';
    ctx.font = '600 18px sans-serif';
    ctx.fillText(sign.significado.slice(0, 44), canvas.width / 2, 292);

    activeFallbackRaf = requestAnimationFrame(drawFrame);
  };
  drawFrame();

  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.style.position = 'fixed';
  video.style.width = '1px';
  video.style.height = '1px';
  video.style.opacity = '0';
  video.style.pointerEvents = 'none';
  document.body.appendChild(video);
  activeFallbackVideo = video;

  const stream = canvas.captureStream(24);
  video.srcObject = stream;
  await video.play();

  if (typeof video.requestPictureInPicture !== 'function') {
    await closeActivePictureInPicture();
    throw new Error('Este navegador não permite Picture-in-Picture neste contexto.');
  }

  video.addEventListener(
    'leavepictureinpicture',
    () => {
      closeActivePictureInPicture();
      onCloseCallback?.();
    },
    { once: true }
  );

  await video.requestPictureInPicture();
}

export async function openSignPictureInPicture(
  sign: CatalogSign,
  catalogList: CatalogSign[] = [sign],
  existingVideoEl?: HTMLVideoElement | null,
  onCloseCallback?: () => void
): Promise<'document' | 'video'> {
  await closeActivePictureInPicture();

  // 1. Prefer Document Picture-in-Picture API (rich floating interactive window over other apps)
  if (window.documentPictureInPicture?.requestWindow) {
    const pipWin = await window.documentPictureInPicture.requestWindow({
      width: 340,
      height: 430,
    });
    activePipWindow = pipWin;
    const initialIdx = Math.max(0, catalogList.findIndex((s) => s.id === sign.id));
    renderDocumentPipContent(pipWin, catalogList, initialIdx, onCloseCallback);
    return 'document';
  }

  // 2. Fallback: native <video>.requestPictureInPicture() if a loaded video element is present
  if (
    existingVideoEl &&
    existingVideoEl.readyState >= 2 &&
    typeof existingVideoEl.requestPictureInPicture === 'function'
  ) {
    existingVideoEl.addEventListener(
      'leavepictureinpicture',
      () => {
        onCloseCallback?.();
      },
      { once: true }
    );
    await existingVideoEl.requestPictureInPicture();
    return 'video';
  }

  // 3. Universal fallback: animated canvas stream -> <video>.requestPictureInPicture()
  await openCanvasFallbackPip(sign, onCloseCallback);
  return 'video';
}
