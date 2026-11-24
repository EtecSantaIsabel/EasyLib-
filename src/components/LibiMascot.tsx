import React, { useState } from 'react';
import { soundService } from '../services/soundService';

export type LibiPose =
  | 'acenando'
  | 'ensinando'
  | 'comemorando'
  | 'pensando'
  | 'incentivando';

export type LibiMood =
  | LibiPose
  | 'idle'
  | 'happy'
  | 'dancing'
  | 'crying'
  | 'cheering'
  | 'thinking'
  | 'shocked'
  | 'super'
  | 'winking'
  | 'signing_ily'
  | 'visual_applause';

interface LibiMascotProps {
  mood?: LibiMood;
  outfit?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showSpeechBubble?: boolean;
  speechText?: string;
  bubblePosition?: 'top' | 'side';
  onClick?: () => void;
  className?: string;
}

const POSE_ASSETS: Record<LibiPose, { src: string; alt: string }> = {
  acenando: {
    src: '/mascote/acenando.png',
    alt: 'Libi acenando com boas-vindas'
  },
  ensinando: {
    src: '/mascote/ensinando.png',
    alt: 'Libi fazendo um sinal em Libras'
  },
  comemorando: {
    src: '/mascote/comemorando.png',
    alt: 'Libi comemorando seu acerto'
  },
  pensando: {
    src: '/mascote/pensando.png',
    alt: 'Libi pensando na melhor dica'
  },
  incentivando: {
    src: '/mascote/incentivando.png',
    alt: 'Libi incentivando você a continuar'
  }
};

function resolvePose(mood: LibiMood): LibiPose {
  switch (mood) {
    case 'acenando':
    case 'idle':
    case 'happy':
    case 'winking':
      return 'acenando';
    case 'ensinando':
    case 'signing_ily':
      return 'ensinando';
    case 'comemorando':
    case 'visual_applause':
    case 'cheering':
    case 'super':
    case 'dancing':
      return 'comemorando';
    case 'pensando':
    case 'thinking':
      return 'pensando';
    case 'incentivando':
    case 'crying':
    case 'shocked':
      return 'incentivando';
    default:
      return 'acenando';
  }
}

export const LibiMascot = ({
  mood = 'acenando',
  size = 'md',
  showSpeechBubble = false,
  speechText,
  bubblePosition = 'top',
  onClick,
  className = ''
}: LibiMascotProps) => {
  const [imgFailed, setImgFailed] = useState(false);

  const pose = resolvePose(mood);
  const asset = POSE_ASSETS[pose];

  const sizeStyles: Record<NonNullable<LibiMascotProps['size']>, string> = {
    xs: 'w-14 h-14',
    sm: 'w-20 h-20',
    md: 'w-28 h-28',
    lg: 'w-36 h-36',
    xl: 'w-44 h-44'
  };

  const handleInteraction = () => {
    if (!onClick) return;
    soundService.playTap();
    onClick();
  };

  return (
    <div
      className={`relative inline-flex ${
        bubblePosition === 'side' ? 'flex-row items-center gap-3' : 'flex-col items-center'
      } select-none ${className}`}
    >
      {showSpeechBubble && speechText && bubblePosition === 'top' && (
        <div className="mb-1.5 z-20 whitespace-nowrap bg-white text-[#1C1917] font-bold text-xs px-3 py-1.5 rounded-xl border border-[#E8E2D9] shadow-sm relative">
          <span>{speechText}</span>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-r border-b border-[#E8E2D9] rotate-45" />
        </div>
      )}

      <div
        onClick={handleInteraction}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleInteraction();
                }
              }
            : undefined
        }
        className={`relative flex items-center justify-center shrink-0 transition-transform duration-150 ${sizeStyles[size]} ${
          onClick ? 'cursor-pointer hover:scale-[1.03] active:scale-95' : ''
        }`}
      >
        {!imgFailed ? (
          <img
            src={asset.src}
            alt={asset.alt}
            onError={() => setImgFailed(true)}
            className="w-full h-full object-contain pointer-events-none"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full rounded-2xl bg-[#F0FDFA] border border-[#99F6E4] flex items-center justify-center text-[#0F766E] font-display font-bold text-sm">
            Libi
          </div>
        )}
      </div>

      {showSpeechBubble && speechText && bubblePosition === 'side' && (
        <div className="bg-white text-[#1C1917] font-semibold text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-[#E8E2D9] relative leading-snug">
          <div className="hidden sm:block absolute top-1/2 -left-1.5 -translate-y-1/2 w-2.5 h-2.5 bg-white border-l border-b border-[#E8E2D9] rotate-45" />
          <span>{speechText}</span>
        </div>
      )}
    </div>
  );
};
