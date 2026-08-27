import React, { useState } from 'react';
import { soundService } from '../services/soundService';

export type LibiMood = 
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
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSpeechBubble?: boolean;
  speechText?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * Libi - A simpática capivara mascote do EasyLib
 * Inclui animações de respiração (idle), piscada, orelhas balançando,
 * aceno de braço (greeting), e estado de celebração (state-happy / palmas visuais).
 */
export const LibiMascot: React.FC<LibiMascotProps> = ({
  mood = 'idle',
  outfit = 'classic',
  size = 'md',
  showSpeechBubble = false,
  speechText,
  onClick,
  className = ''
}) => {
  const [isWiggling, setIsWiggling] = useState(false);

  const sizeStyles = {
    sm: 'w-16 h-16',
    md: 'w-28 h-28',
    lg: 'w-40 h-40',
    xl: 'w-56 h-56'
  };

  const handleInteraction = () => {
    soundService.playTap();
    setIsWiggling(true);
    setTimeout(() => setIsWiggling(false), 900);
    if (onClick) onClick();
  };

  const isHappy = mood === 'happy' || mood === 'visual_applause' || mood === 'cheering' || mood === 'super';

  return (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
      
      {/* Speech Bubble */}
      {showSpeechBubble && speechText && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap bg-white text-[#292524] font-black text-xs px-3.5 py-1.5 rounded-2xl shadow-xl border-2 border-[#FED7AA] animate-bounce flex items-center gap-1.5">
          <span>{speechText}</span>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r-2 border-b-2 border-[#FED7AA] rotate-45" />
        </div>
      )}

      {/* Visual Applause Waves (Cultura Surda: mãos para cima) */}
      {(mood === 'visual_applause' || mood === 'cheering') && (
        <div className="absolute -top-6 inset-x-0 flex justify-between px-2 pointer-events-none animate-pulse">
          <span className="text-amber-500 text-lg animate-spin">✨</span>
          <span className="text-orange-500 text-lg animate-bounce">👐</span>
          <span className="text-amber-500 text-lg animate-spin">✨</span>
        </div>
      )}

      {/* Libi Capybara SVG */}
      <div 
        onClick={handleInteraction}
        className={`cursor-pointer transition-transform duration-300 ${sizeStyles[size]} ${isWiggling ? 'scale-110' : 'hover:scale-105 active:scale-95'}`}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 500 500" 
          width="100%" 
          height="100%"
          className={`${isHappy ? 'state-happy' : ''} drop-shadow-md`}
        >
          <defs>
            <style>{`
              :root {
                --capy-body: #8D5B4C;
                --capy-dark: #633A31;
                --capy-light: #A67363;
                --capy-snout: #4A2821;
                --capy-eye: #2B1713;
                --capy-belly: #9E6B5C;
                --capy-accent: #331A14;
              }

              /* ANIMAÇÃO: IDLE (Bouncing Respiratório) */
              .anim-idle {
                transform-origin: bottom center;
                animation: duoIdle 1.8s ease-in-out infinite;
              }

              @keyframes duoIdle {
                0%, 100% { transform: translateY(0) scale(1, 1); }
                50% { transform: translateY(-8px) scale(1.02, 0.98); }
              }

              /* ANIMAÇÃO: PISCADA DE OLHOS (Blink) */
              .anim-blink {
                transform-origin: center;
                animation: duoBlink 4s infinite;
              }

              @keyframes duoBlink {
                0%, 94%, 98%, 100% { transform: scaleY(1); }
                96% { transform: scaleY(0.05); }
              }

              /* ANIMAÇÃO: ORELHAS (Mexendo alegremente) */
              .anim-ear-left {
                transform-origin: 180px 175px;
                animation: earWiggleLeft 3s infinite ease-in-out;
              }

              .anim-ear-right {
                transform-origin: 320px 175px;
                animation: earWiggleRight 3s infinite ease-in-out;
              }

              @keyframes earWiggleLeft {
                0%, 85%, 100% { transform: rotate(0deg); }
                90% { transform: rotate(-12deg); }
                95% { transform: rotate(5deg); }
              }

              @keyframes earWiggleRight {
                0%, 85%, 100% { transform: rotate(0deg); }
                90% { transform: rotate(12deg); }
                95% { transform: rotate(-5deg); }
              }

              /* ANIMAÇÃO: BRAÇOS EACENAÇÃO (Greeting) */
              .anim-arm-wave {
                transform-origin: 345px 285px;
                animation: duoWave 2.5s infinite ease-in-out;
              }

              @keyframes duoWave {
                0%, 60%, 100% { transform: rotate(0deg); }
                70% { transform: rotate(-25deg); }
                80% { transform: rotate(10deg); }
                90% { transform: rotate(-20deg); }
              }

              /* ESTADO DE CELEBRAÇÃO / SUCESSO (HAPPY) */
              .state-happy .anim-idle {
                animation: duoHappy 0.6s ease-in-out infinite alternate;
              }

              @keyframes duoHappy {
                0% { transform: translateY(0) scale(1, 1); }
                100% { transform: translateY(-35px) scale(0.95, 1.05); }
              }

              /* Sombra sincronizada */
              .anim-shadow {
                transform-origin: center;
                animation: duoShadow 1.8s ease-in-out infinite;
              }

              @keyframes duoShadow {
                0%, 100% { transform: scale(1); opacity: 0.25; }
                50% { transform: scale(0.85); opacity: 0.15; }
              }
            `}</style>
          </defs>

          {/* Sombra */}
          <ellipse className="anim-shadow" cx="250" cy="450" rx="110" ry="18" fill="#000" opacity="0.25" />

          {/* Grupo com animação Idle / Happy */}
          <g className="anim-idle">

            {/* Pés */}
            <path d="M 180 390 Q 180 430 160 435 Q 200 440 210 430 Q 210 390 180 390 Z" fill="var(--capy-snout)" />
            <path d="M 320 390 Q 320 430 340 435 Q 300 440 290 430 Q 290 390 320 390 Z" fill="var(--capy-snout)" />

            {/* Corpo */}
            <path 
              d="M 150 240 
                 C 120 280, 120 370, 160 410 
                 C 200 430, 300 430, 340 410 
                 C 380 370, 380 280, 350 240 
                 C 330 200, 170 200, 150 240 Z" 
              fill="var(--capy-body)" 
            />

            {/* Barriga */}
            <path 
              d="M 180 270 
                 C 160 300, 160 360, 190 395 
                 C 220 410, 280 410, 310 395 
                 C 340 360, 340 300, 320 270 
                 C 290 250, 210 250, 180 270 Z" 
              fill="var(--capy-belly)" 
            />

            {/* Braço Esquerdo */}
            <path d="M 155 280 C 130 290, 135 330, 165 335 C 175 335, 180 310, 170 285 Z" fill="var(--capy-dark)" />

            {/* Braço Direito com Aceno */}
            <g className="anim-arm-wave">
              <path d="M 345 280 C 370 290, 380 325, 350 335 C 335 335, 330 310, 335 285 Z" fill="var(--capy-dark)" />
              {/* Crachá EasyLib / Sinalização 🤟 */}
              <circle cx="360" cy="330" r="14" fill="#EA580C" stroke="#FED7AA" strokeWidth="2" />
              <text x="360" y="335" fontSize="12" textAnchor="middle" fill="#FFFFFF">🤟</text>
            </g>

            {/* Cabeça */}
            <path 
              d="M 150 140 
                 C 130 180, 130 220, 150 245 
                 C 180 265, 320 265, 350 245 
                 C 370 220, 370 180, 350 140 
                 C 320 100, 180 100, 150 140 Z" 
              fill="var(--capy-body)" 
            />

            {/* Orelha Esquerda */}
            <g className="anim-ear-left">
              <ellipse cx="170" cy="135" rx="20" ry="14" transform="rotate(-20 170 135)" fill="var(--capy-dark)" />
              <ellipse cx="170" cy="135" rx="12" ry="8" transform="rotate(-20 170 135)" fill="var(--capy-light)" />
            </g>

            {/* Orelha Direita */}
            <g className="anim-ear-right">
              <ellipse cx="330" cy="135" rx="20" ry="14" transform="rotate(20 330 135)" fill="var(--capy-dark)" />
              <ellipse cx="330" cy="135" rx="12" ry="8" transform="rotate(20 330 135)" fill="var(--capy-light)" />
            </g>

            {/* Focinho */}
            <path 
              d="M 200 175 
                 C 200 155, 300 155, 300 175 
                 C 310 215, 310 240, 290 248 
                 C 270 255, 230 255, 210 248 
                 C 190 240, 190 215, 200 175 Z" 
              fill="var(--capy-snout)" 
            />

            {/* Nariz */}
            <path d="M 235 180 L 265 180 C 270 180, 270 188, 260 193 L 254 205 C 252 208, 248 208, 246 205 L 240 193 C 230 188, 230 180, 235 180 Z" fill="var(--capy-accent)" />
            <line x1="250" y1="205" x2="250" y2="222" stroke="var(--capy-accent)" strokeWidth="4" strokeLinecap="round" />

            {/* Bochechas Rosadas */}
            <ellipse cx="185" cy="205" rx="16" ry="10" fill="#FF8A8A" opacity="0.4" />
            <ellipse cx="315" cy="205" rx="16" ry="10" fill="#FF8A8A" opacity="0.4" />

            {/* Olhos com Piscada */}
            <g className="anim-blink">
              <ellipse cx="200" cy="165" rx="15" ry="18" fill="var(--capy-eye)" />
              <circle cx="195" cy="158" r="6" fill="#FFFFFF" />
              <circle cx="204" cy="172" r="2.5" fill="#FFFFFF" />

              <ellipse cx="300" cy="165" rx="15" ry="18" fill="var(--capy-eye)" />
              <circle cx="295" cy="158" r="6" fill="#FFFFFF" />
              <circle cx="304" cy="172" r="2.5" fill="#FFFFFF" />
            </g>

            {/* Sobrancelhas */}
            <path d="M 185 140 Q 200 132 215 142" stroke="var(--capy-accent)" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M 315 140 Q 300 132 285 142" stroke="var(--capy-accent)" strokeWidth="4" strokeLinecap="round" fill="none" />

            {/* Sorriso */}
            <path d="M 238 222 Q 250 230 262 222" stroke="var(--capy-accent)" strokeWidth="3.5" strokeLinecap="round" fill="none" />

          </g>
        </svg>
      </div>

    </div>
  );
};
