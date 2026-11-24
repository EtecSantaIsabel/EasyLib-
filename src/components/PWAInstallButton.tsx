import React, { useState } from 'react';
import { Download, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { soundService } from '../services/soundService';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;
  if (!canInstall && !isIOS) return null;

  if (isIOS) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => {
            soundService.playTap();
            setShowIOSGuide((v) => !v);
          }}
          className={`tactile-btn w-full flex items-center justify-center gap-2 rounded-xl bg-[#F0FDFA] hover:bg-[#CCFBF1] text-[#0F766E] border border-[#99F6E4] border-b-[3px] border-b-[#0D9488] font-bold text-xs cursor-pointer ${
            compact ? 'px-3 py-2' : 'px-4 py-2.5'
          }`}
        >
          <Share className="w-4 h-4 shrink-0" />
          <span>Instalar App</span>
        </button>

        {showIOSGuide && (
          <div className="p-2.5 rounded-xl bg-white border border-[#E8E2D9] text-[11px] text-[#57534E] font-medium leading-snug">
            No Safari, toque em <strong>Compartilhar</strong> e depois em{' '}
            <strong>Adicionar à Tela de Início</strong>.
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        soundService.playTap();
        promptInstall();
      }}
      className={`tactile-btn w-full flex items-center justify-center gap-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white border-b-[3px] border-[#115E59] font-bold text-xs cursor-pointer ${
        compact ? 'px-3 py-2' : 'px-4 py-2.5'
      }`}
    >
      <Download className="w-4 h-4 shrink-0" />
      <span>Instalar EasyLib</span>
    </button>
  );
};
