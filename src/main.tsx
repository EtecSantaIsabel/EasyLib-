import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined') {
  if ('caches' in window) {
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k === 'easylib-pwa-v1' || import.meta.env.DEV)
            .map((k) => caches.delete(k))
        )
      )
      .catch(() => undefined);
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => {
        regs.forEach((reg) => {
          reg.update().catch(() => undefined);
        });
      })
      .catch(() => undefined);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
