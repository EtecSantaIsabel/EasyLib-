import React, { useEffect, useState } from 'react';
import { RotateCcw, Play, Pause } from 'lucide-react';
import { TargetHandshapeId } from '../data/librasCatalog255';
import { renderHandVector } from './SignSchematicVisualizer';
import { soundService } from '../services/soundService';

interface DactylologyStep {
  baseLetter: string;
  diacritic?: 'tilde' | 'acute' | 'circumflex' | 'cedilla';
  handshapeId: TargetHandshapeId;
  motionCue?: 'shake_tilde' | 'arc_j' | 'flick_accent' | 'draw_z' | 'rotate_h';
  labelHint: string;
}

const LETTER_SPEC: Record<string, { hs: TargetHandshapeId; motionCue?: DactylologyStep['motionCue'] }> = {
  A: { hs: 'thumb_a' },
  B: { hs: 'flat_b' },
  C: { hs: 'c_shape' },
  Ç: { hs: 'c_shape', motionCue: 'shake_tilde' },
  D: { hs: 'point_1' },
  E: { hs: 'fist_s' },
  F: { hs: 'f_shape' },
  G: { hs: 'point_1' },
  H: { hs: 'k_shape', motionCue: 'rotate_h' },
  I: { hs: 'pinky_i' },
  J: { hs: 'pinky_i', motionCue: 'arc_j' },
  K: { hs: 'k_shape' },
  L: { hs: 'l_shape' },
  M: { hs: 'three_3' },
  N: { hs: 'u_2' },
  O: { hs: 'o_pinch' },
  P: { hs: 'k_shape' },
  Q: { hs: 'point_1' },
  R: { hs: 'r_shape' },
  S: { hs: 'fist_s' },
  T: { hs: 'f_shape' },
  U: { hs: 'u_2' },
  V: { hs: 'v_2' },
  W: { hs: 'three_3' },
  X: { hs: 'point_1', motionCue: 'flick_accent' },
  Y: { hs: 'y_shape' },
  Z: { hs: 'point_1', motionCue: 'draw_z' }
};

function parseDactylologyWord(word: string): DactylologyStep[] {
  const chars = word.trim().toUpperCase().split('');
  return chars
    .filter((ch) => /[A-ZÇÁÉÍÓÚÂÊÔÃÕ]/.test(ch))
    .map((ch) => {
      let base = ch;
      let diacritic: DactylologyStep['diacritic'];
      if (ch === 'Ç') {
        base = 'Ç';
        diacritic = 'cedilla';
      } else if ('ÃÕ'.includes(ch)) {
        base = ch === 'Ã' ? 'A' : 'O';
        diacritic = 'tilde';
      } else if ('ÁÉÍÓÚ'.includes(ch)) {
        base = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        diacritic = 'acute';
      } else if ('ÂÊÔ'.includes(ch)) {
        base = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        diacritic = 'circumflex';
      }
      const spec = LETTER_SPEC[base] || { hs: 'open_5' as TargetHandshapeId };
      return {
        baseLetter: base,
        diacritic,
        handshapeId: spec.hs,
        motionCue: spec.motionCue ?? (diacritic === 'tilde' ? 'shake_tilde' : diacritic ? 'flick_accent' : undefined),
        labelHint:
          diacritic === 'cedilla'
            ? 'Vibração / tremor lateral (Ç)'
            : diacritic === 'tilde'
            ? 'Oscilação ondulada (til ~)'
            : diacritic === 'acute'
            ? 'Movimento rápido para cima (acento agudo)'
            : diacritic === 'circumflex'
            ? 'Movimento em arco fechado (circunflexo)'
            : spec.motionCue === 'arc_j'
            ? 'Curva descendente no ar'
            : spec.motionCue === 'draw_z'
            ? 'Traço em zigue-zague no espaço'
            : spec.motionCue === 'rotate_h'
            ? 'Rotação suave do punho'
            : 'Configuração manual estática'
      };
    });
}

interface DactylologyPlayerProps {
  word: string;
  className?: string;
}

export const DactylologyPlayer = ({ word, className = '' }: DactylologyPlayerProps) => {
  const steps = parseDactylologyWord(word);
  const [stepIdx, setStepIdx] = useState(0);
  const [speed, setSpeed] = useState<1 | 0.5>(1);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setStepIdx(0);
    setPaused(false);
  }, [word]);

  useEffect(() => {
    if (paused || steps.length <= 1) return;
    const intervalMs = speed === 0.5 ? 1700 : 950;
    const timer = window.setInterval(() => {
      setStepIdx((prev) => (prev + 1) % steps.length);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [paused, speed, steps.length]);

  const currentStep = steps[stepIdx] || steps[0];
  if (!currentStep) return null;

  const isRotatedDown =
    currentStep.baseLetter === 'M' ||
    currentStep.baseLetter === 'N' ||
    currentStep.baseLetter === 'P' ||
    currentStep.baseLetter === 'Q';

  const motionOffset =
    currentStep.motionCue === 'shake_tilde'
      ? 'animate-bounce'
      : currentStep.motionCue === 'draw_z' || currentStep.motionCue === 'rotate_h'
      ? 'animate-pulse'
      : '';

  return (
    <div className={`rounded-2xl bg-[#F0FDFA] border border-[#99F6E4] p-4 space-y-3 ${className}`}>
      <div className="flex items-center justify-between gap-2 text-xs font-bold text-[#0F766E]">
        <span>
          Soletração manual · Letra {stepIdx + 1} de {steps.length}
        </span>
      </div>

      {/* Sequential Handshape Stage */}
      <div className="relative flex flex-col items-center justify-center bg-white rounded-2xl border border-[#CCFBF1] py-4 px-3">
        <svg
          viewBox="-45 -45 90 85"
          className={`w-32 h-28 select-none ${motionOffset}`}
          role="img"
          aria-label={`Sinal da letra ${stepIdx + 1} da datilologia`}
        >
          <g transform={isRotatedDown ? 'rotate(180)' : undefined}>
            {renderHandVector(currentStep.handshapeId)}
          </g>
        </svg>

        {/* Sequence Step Dots (Click any step to inspect) */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
          {steps.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                soundService.playTap();
                setStepIdx(idx);
              }}
              aria-label={`Ver letra ${idx + 1}`}
              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                idx === stepIdx
                  ? 'w-7 bg-[#EA580C]'
                  : idx < stepIdx
                  ? 'w-2.5 bg-[#0D9488]'
                  : 'w-2.5 bg-[#D6CFC5]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Playback Controls: Repetir, Pausar, 1x / 0.5x */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              soundService.playTap();
              setStepIdx(0);
              setPaused(false);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#99F6E4] text-[#0F766E] hover:bg-[#CCFBF1] font-bold text-xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Repetir</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundService.playTap();
              setPaused((p) => !p);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#99F6E4] text-[#0F766E] hover:bg-[#CCFBF1] font-bold text-xs cursor-pointer"
          >
            {paused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
            <span>{paused ? 'Continuar' : 'Pausar'}</span>
          </button>
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#99F6E4]">
          <button
            type="button"
            onClick={() => {
              soundService.playTap();
              setSpeed(1);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
              speed === 1 ? 'bg-[#0D9488] text-white' : 'text-[#57534E] hover:text-[#1C1917]'
            }`}
          >
            1x
          </button>
          <button
            type="button"
            onClick={() => {
              soundService.playTap();
              setSpeed(speed === 0.5 ? 1 : 0.5);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors inline-flex items-center gap-1 ${
              speed === 0.5 ? 'bg-[#EA580C] text-white' : 'text-[#57534E] hover:text-[#1C1917]'
            }`}
          >
            <span aria-hidden="true">🐢</span>
            <span>0.5x</span>
          </button>
        </div>
      </div>
    </div>
  );
};
