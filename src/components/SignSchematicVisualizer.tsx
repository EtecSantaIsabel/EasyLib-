import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, PictureInPicture2 } from 'lucide-react';
import {
  CatalogSign,
  TargetArticulationZone,
  TargetHandshapeId,
  TargetLandmarks
} from '../data/librasCatalog255';
import { soundService } from '../services/soundService';

export type FacialExpressionMode =
  | 'neutral'
  | 'interrogative_brows_up'
  | 'wh_brows_furrowed'
  | 'positive_smile';

interface SignSchematicVisualizerProps {
  sign: CatalogSign;
  speed?: 1 | 0.5;
  compact?: boolean;
  mini?: boolean;
  hideControls?: boolean;
  replayNonce?: number;
  facialExpression?: FacialExpressionMode;
  className?: string;
}

const ZONE_COORDS: Record<TargetArticulationZone, { x: number; y: number }> = {
  forehead: { x: 110, y: 46 },
  eye_cheek: { x: 132, y: 68 },
  ear: { x: 147, y: 66 },
  nose_mouth: { x: 110, y: 80 },
  chin: { x: 110, y: 96 },
  shoulder: { x: 158, y: 116 },
  chest: { x: 110, y: 148 },
  neutral_space: { x: 150, y: 148 }
};

function inferExpressionMode(
  sign: CatalogSign,
  explicit?: FacialExpressionMode
): FacialExpressionMode {
  if (explicit) return explicit;
  if (sign.targetLandmarks.expectedNmf && sign.targetLandmarks.expectedNmf !== 'neutral') {
    return sign.targetLandmarks.expectedNmf;
  }
  return 'neutral';
}

export function renderHandVector(handshapeId: TargetHandshapeId) {
  const isThumbUp =
    handshapeId === 'open_5' ||
    handshapeId === 'thumb_a' ||
    handshapeId === 'l_shape' ||
    handshapeId === 'y_shape' ||
    handshapeId === 'ily_love' ||
    handshapeId === 'three_3' ||
    handshapeId === 'c_shape';

  const isIndexUp =
    handshapeId === 'open_5' ||
    handshapeId === 'flat_b' ||
    handshapeId === 'point_1' ||
    handshapeId === 'v_2' ||
    handshapeId === 'u_2' ||
    handshapeId === 'l_shape' ||
    handshapeId === 'ily_love' ||
    handshapeId === 'three_3' ||
    handshapeId === 'four_4' ||
    handshapeId === 'k_shape' ||
    handshapeId === 'r_shape';

  const isMiddleUp =
    handshapeId === 'open_5' ||
    handshapeId === 'flat_b' ||
    handshapeId === 'v_2' ||
    handshapeId === 'u_2' ||
    handshapeId === 'f_shape' ||
    handshapeId === 'three_3' ||
    handshapeId === 'four_4' ||
    handshapeId === 'k_shape' ||
    handshapeId === 'r_shape';

  const isRingUp =
    handshapeId === 'open_5' ||
    handshapeId === 'flat_b' ||
    handshapeId === 'f_shape' ||
    handshapeId === 'four_4';

  const isPinkyUp =
    handshapeId === 'open_5' ||
    handshapeId === 'flat_b' ||
    handshapeId === 'f_shape' ||
    handshapeId === 'y_shape' ||
    handshapeId === 'ily_love' ||
    handshapeId === 'pinky_i' ||
    handshapeId === 'four_4';

  const isSpread = handshapeId === 'open_5' || handshapeId === 'v_2' || handshapeId === 'four_4';
  const isPinchCircle = handshapeId === 'o_pinch' || handshapeId === 'f_shape';
  const isC = handshapeId === 'c_shape';

  const idxSpread = isSpread ? -4 : handshapeId === 'r_shape' ? 2 : 0;
  const midSpread = isSpread ? 3 : 0;

  return (
    <g>
      <rect
        x="-12"
        y="-2"
        width="24"
        height="22"
        rx="8"
        fill="#EA580C"
        stroke="#FFFFFF"
        strokeWidth="2"
      />
      <rect
        x="-7"
        y="18"
        width="14"
        height="8"
        rx="3"
        fill="#C2410C"
        stroke="#FFFFFF"
        strokeWidth="1.5"
      />

      {isThumbUp && (
        <>
          <path
            d="M -11 6 C -21 4, -24 -4, -20 -10"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="6.5"
            strokeLinecap="round"
          />
          <path
            d="M -11 6 C -21 4, -24 -4, -20 -10"
            fill="none"
            stroke="#EA580C"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      )}

      {isC ? (
        <path
          d="M 8 -14 C -8 -16, -12 8, 8 8"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeLinecap="round"
        />
      ) : (
        <>
          {isIndexUp && (
            <>
              <line
                x1="-8"
                y1="0"
                x2={-8 + idxSpread}
                y2="-24"
                stroke="#FFFFFF"
                strokeWidth="6.5"
                strokeLinecap="round"
              />
              <line
                x1="-8"
                y1="0"
                x2={-8 + idxSpread}
                y2="-24"
                stroke="#EA580C"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </>
          )}

          {isMiddleUp && (
            <>
              <line
                x1="-2"
                y1="0"
                x2={-2 + midSpread}
                y2="-27"
                stroke="#FFFFFF"
                strokeWidth="6.5"
                strokeLinecap="round"
              />
              <line
                x1="-2"
                y1="0"
                x2={-2 + midSpread}
                y2="-27"
                stroke="#EA580C"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </>
          )}

          {isRingUp && (
            <>
              <line
                x1="4"
                y1="0"
                x2={isSpread ? 8 : 4}
                y2="-24"
                stroke="#FFFFFF"
                strokeWidth="6.5"
                strokeLinecap="round"
              />
              <line
                x1="4"
                y1="0"
                x2={isSpread ? 8 : 4}
                y2="-24"
                stroke="#EA580C"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </>
          )}

          {isPinkyUp && (
            <>
              <line
                x1="10"
                y1="2"
                x2={isSpread ? 16 : 11}
                y2="-18"
                stroke="#FFFFFF"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <line
                x1="10"
                y1="2"
                x2={isSpread ? 16 : 11}
                y2="-18"
                stroke="#EA580C"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </>
          )}
        </>
      )}

      {isPinchCircle && (
        <circle cx="-8" cy="-9" r="6" fill="none" stroke="#FFFFFF" strokeWidth="3.5" />
      )}
    </g>
  );
}

function getMotionOffsets(motionType: TargetLandmarks['motionType'], phase: number) {
  switch (motionType) {
    case 'wave':
      return { dx: Math.sin(phase) * 14, dy: 0, scale: 1 };
    case 'forward':
      return {
        dx: Math.sin(phase * 0.5) * 8,
        dy: Math.sin(phase * 0.5) * 10,
        scale: 1 + Math.max(0, Math.sin(phase * 0.5)) * 0.16
      };
    case 'circular':
      return { dx: Math.cos(phase) * 11, dy: Math.sin(phase) * 9, scale: 1 };
    case 'vertical':
      return { dx: 0, dy: Math.sin(phase) * 11, scale: 1 };
    case 'downward':
      return {
        dx: -Math.sin(phase * 0.5) * 5,
        dy: ((phase % (Math.PI * 2)) / (Math.PI * 2)) * 16 - 4,
        scale: 1
      };
    case 'tap':
      return { dx: Math.sin(phase) * 3, dy: Math.abs(Math.sin(phase)) * -6, scale: 1 };
    case 'static':
    default:
      return { dx: 0, dy: Math.sin(phase * 0.5) * 2, scale: 1 };
  }
}

export const SignSchematicVisualizer = ({
  sign,
  speed = 1,
  compact = false,
  mini = false,
  hideControls = false,
  replayNonce = 0,
  facialExpression,
  className = ''
}: SignSchematicVisualizerProps) => {
  const [phase, setPhase] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setPhase(0);
    setPaused(false);
  }, [sign.id, replayNonce]);

  useEffect(() => {
    if (paused) return;
    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      const angularSpeed = speed === 0.5 ? 1.8 : 3.6;
      setPhase((prev) => (prev + dt * angularSpeed) % (Math.PI * 2));
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [paused, speed]);

  const zone = ZONE_COORDS[sign.schematicHint.zone] || ZONE_COORDS.neutral_space;
  const motion = getMotionOffsets(sign.schematicHint.motionType, phase);
  const handX = zone.x + motion.dx;
  const handY = zone.y + motion.dy;
  const pulseRadius = 11 + Math.sin(phase) * 3;
  const nmfMode = inferExpressionMode(sign, facialExpression);

  return (
    <div
      className={`relative rounded-2xl bg-[#F0FDFA] border border-[#99F6E4] overflow-hidden flex flex-col items-center justify-center ${
        mini ? 'p-1.5' : compact ? 'p-3' : 'p-4'
      } ${className}`}
    >
      <svg
        viewBox="0 0 220 190"
        className={`w-full ${mini ? 'max-h-24' : compact ? 'max-h-44' : 'max-h-56'} select-none`}
        role="img"
        aria-label={`Demonstração visual do sinal ${sign.palavra}`}
      >
        <defs>
          <pattern id={`grid-${sign.id}-${mini ? 'm' : 'f'}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#CCFBF1" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="220" height="190" fill={`url(#grid-${sign.id}-${mini ? 'm' : 'f'})`} />

        {/* Upper-body Signer Silhouette */}
        <path
          d="M 48 188 C 50 132, 72 114, 110 114 C 148 114, 170 132, 172 188 Z"
          fill="#E2E8F0"
          stroke="#94A3B8"
          strokeWidth="2"
        />
        <rect x="97" y="96" width="26" height="24" rx="8" fill="#CBD5E1" />
        <ellipse cx="73" cy="68" rx="6" ry="10" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1.5" />
        <ellipse cx="147" cy="68" rx="6" ry="10" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1.5" />
        <ellipse cx="110" cy="65" rx="34" ry="40" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="2" />

        {/* Eyebrows (ENM Grammar Indicator) */}
        {nmfMode === 'interrogative_brows_up' ? (
          <>
            <path d="M 88 50 Q 96 43 104 49" fill="none" stroke="#0F766E" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M 116 49 Q 124 43 132 50" fill="none" stroke="#0F766E" strokeWidth="2.6" strokeLinecap="round" />
          </>
        ) : nmfMode === 'wh_brows_furrowed' ? (
          <>
            <path d="M 88 50 L 104 55" fill="none" stroke="#EA580C" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M 132 50 L 116 55" fill="none" stroke="#EA580C" strokeWidth="2.8" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M 89 53 Q 96 51 103 53" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
            <path d="M 117 53 Q 124 51 131 53" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
          </>
        )}

        {/* Eyes & Nose */}
        <circle cx="96" cy="61" r="2.5" fill="#475569" />
        <circle cx="124" cy="61" r="2.5" fill="#475569" />
        <path d="M 110 63 L 110 73" stroke="#94A3B8" strokeWidth="1.6" strokeLinecap="round" />

        {/* Mouth (ENM expression) */}
        {nmfMode === 'positive_smile' ? (
          <path d="M 97 80 Q 110 90 123 80" fill="none" stroke="#0F766E" strokeWidth="2.3" strokeLinecap="round" />
        ) : nmfMode === 'wh_brows_furrowed' ? (
          <path d="M 101 84 Q 110 80 119 84" fill="none" stroke="#64748B" strokeWidth="2.1" strokeLinecap="round" />
        ) : (
          <path d="M 100 82 Q 110 87 120 82" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
        )}

        {/* Target Articulation Zone Pulse */}
        <circle
          cx={zone.x}
          cy={zone.y}
          r={pulseRadius}
          fill="#0D9488"
          fillOpacity="0.14"
          stroke="#0D9488"
          strokeWidth="1.8"
          strokeDasharray="3 2"
        />

        {/* Directional Motion Arrow Guide */}
        {sign.schematicHint.arrowDirection === 'left_right' && (
          <path
            d={`M ${zone.x - 22} ${zone.y} L ${zone.x + 22} ${zone.y}`}
            stroke="#0F766E"
            strokeWidth="2.5"
            strokeDasharray="4 3"
          />
        )}
        {sign.schematicHint.arrowDirection === 'up_down' && (
          <path
            d={`M ${zone.x} ${zone.y - 18} L ${zone.x} ${zone.y + 18}`}
            stroke="#0F766E"
            strokeWidth="2.5"
            strokeDasharray="4 3"
          />
        )}
        {sign.schematicHint.arrowDirection === 'circle' && (
          <circle
            cx={zone.x}
            cy={zone.y}
            r="16"
            fill="none"
            stroke="#0F766E"
            strokeWidth="2"
            strokeDasharray="5 3"
          />
        )}
        {sign.schematicHint.arrowDirection === 'forward' && (
          <path
            d={`M ${zone.x} ${zone.y} L ${zone.x + 18} ${zone.y + 18}`}
            stroke="#0F766E"
            strokeWidth="2.5"
            strokeDasharray="4 3"
          />
        )}

        {/* Animated Articulated Hand */}
        <g transform={`translate(${handX}, ${handY}) scale(${motion.scale * (mini ? 0.8 : compact ? 0.85 : 0.95)})`}>
          {renderHandVector(sign.schematicHint.handshapeId)}
        </g>

        {/* Second Hand for 2-handed signs */}
        {sign.targetLandmarks.twoHanded === 2 && (
          <g transform={`translate(${220 - handX}, ${handY + 6}) scale(${mini ? 0.72 : compact ? 0.78 : 0.88})`} opacity="0.82">
            {renderHandVector(sign.schematicHint.handshapeId)}
          </g>
        )}
      </svg>

      {!hideControls && !mini && (
        <button
          type="button"
          onClick={() => {
            soundService.playTap();
            setPaused((p) => !p);
          }}
          className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 border border-[#99F6E4] text-[11px] font-bold text-[#0F766E] hover:bg-[#CCFBF1] cursor-pointer"
        >
          {paused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
          <span>{paused ? 'Animar' : 'Pausar'}</span>
        </button>
      )}
    </div>
  );
};

interface SignMediaPlayerProps {
  sign: CatalogSign;
  compact?: boolean;
  turtleLabel?: boolean;
  showVideoStatus?: boolean;
  enablePip?: boolean;
  pipSignList?: CatalogSign[];
  facialExpression?: FacialExpressionMode;
  heroMode?: boolean;
  className?: string;
}

export const SignMediaPlayer = ({
  sign,
  compact = false,
  turtleLabel = true,
  showVideoStatus = false,
  enablePip = true,
  pipSignList,
  facialExpression,
  heroMode = false,
  className = ''
}: SignMediaPlayerProps) => {
  const [speed, setSpeed] = useState<1 | 0.5>(1);
  const [replayNonce, setReplayNonce] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [videoStatus, setVideoStatus] = useState<'loading' | 'loaded' | 'unavailable'>(
    sign.videoUrl ? 'loading' : 'unavailable'
  );
  const [pipOpen, setPipOpen] = useState(false);
  const [pipError, setPipError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setVideoStatus(sign.videoUrl ? 'loading' : 'unavailable');
    setSpeed(1);
    setReplayNonce(0);
    setIsPaused(false);
    setPipError(null);
  }, [sign.id, sign.videoUrl]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed]);

  const handleSpeedChange = (nextSpeed: 1 | 0.5) => {
    soundService.playTap();
    setSpeed(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };

  const handleReplay = () => {
    soundService.playTap();
    setIsPaused(false);
    setReplayNonce((n) => n + 1);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleTogglePlayPause = () => {
    soundService.playTap();
    if (videoRef.current && videoStatus === 'loaded') {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
        setIsPaused(false);
      } else {
        videoRef.current.pause();
        setIsPaused(true);
      }
      return;
    }
    setIsPaused((prev) => !prev);
  };

  const handleTogglePip = async () => {
    soundService.playTap();
    setPipError(null);
    const {
      closeActivePictureInPicture,
      openSignPictureInPicture
    } = await import('../services/pipService');

    if (pipOpen) {
      await closeActivePictureInPicture();
      setPipOpen(false);
      return;
    }

    try {
      await openSignPictureInPicture(
        sign,
        pipSignList && pipSignList.length > 0 ? pipSignList : [sign],
        videoRef.current,
        () => setPipOpen(false)
      );
      setPipOpen(true);
    } catch (err) {
      setPipOpen(false);
      setPipError(
        err instanceof Error
          ? err.message
          : 'Picture-in-Picture indisponível neste navegador ou janela.'
      );
    }
  };

  const showVideoElement = Boolean(sign.videoUrl) && videoStatus !== 'unavailable';

  return (
    <div className={`space-y-3 ${className}`}>
      {showVideoElement ? (
        <div
          className={`relative aspect-video rounded-2xl overflow-hidden ${
            heroMode ? 'bg-white border border-white/25' : 'bg-stone-950 border border-[#E8E2D9]'
          }`}
        >
          {videoStatus === 'loading' && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#F0FDFA]">
              <SignSchematicVisualizer
                sign={sign}
                speed={isPaused ? 1 : speed}
                compact={compact}
                hideControls={true}
                replayNonce={replayNonce}
                facialExpression={facialExpression}
                className="w-full h-full border-0 rounded-none"
              />
            </div>
          )}
          <video
            ref={videoRef}
            src={sign.videoUrl}
            autoPlay
            loop
            muted
            playsInline
            onLoadedData={() => {
              setVideoStatus('loaded');
              if (videoRef.current) {
                videoRef.current.playbackRate = speed;
              }
            }}
            onError={() => setVideoStatus('unavailable')}
            className={`w-full h-full object-contain relative z-20 transition-opacity duration-200 ${
              videoStatus === 'loaded' ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>
      ) : heroMode ? (
        <div className="bg-white rounded-2xl border border-white/20 p-3 sm:p-4 space-y-2">
          <div className="relative aspect-video rounded-xl overflow-hidden bg-[#F0FDFA] border border-[#CCFBF1] flex items-center justify-center">
            {!isPaused ? (
              <SignSchematicVisualizer
                sign={sign}
                speed={speed}
                hideControls={true}
                replayNonce={replayNonce}
                facialExpression={facialExpression}
                className="w-full h-full border-0 rounded-none"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#0F766E] p-4 text-center">
                <Play className="w-8 h-8" />
                <span className="text-xs font-bold">Demonstração pausada</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-[#57534E] px-1">
            <span>Espaço reservado para o vídeo do sinal ({sign.palavra})</span>
            <span className="tabular-nums text-[#0F766E] font-bold">
              {speed === 0.5 ? '0.5x lento' : '1.0x normal'}
            </span>
          </div>
        </div>
      ) : (
        <SignSchematicVisualizer
          sign={sign}
          speed={speed}
          compact={compact}
          hideControls={true}
          replayNonce={replayNonce}
          facialExpression={facialExpression}
        />
      )}

      {/* Replay + Pause + PiP + Speed Controls: 1x / 0.5x + optional Video Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 flex-wrap">
          {heroMode && (
            <button
              type="button"
              onClick={handleTogglePlayPause}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-colors whitespace-nowrap ${
                heroMode
                  ? 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                  : 'bg-[#F3F0EA] hover:bg-[#E8E2D9] text-[#1C1917]'
              }`}
            >
              {isPaused ? (
                <Play className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Pause className="w-3.5 h-3.5 fill-current" />
              )}
              <span>{isPaused ? 'Continuar' : 'Pausar'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleReplay}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-colors whitespace-nowrap ${
              heroMode
                ? 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                : 'bg-[#F3F0EA] hover:bg-[#E8E2D9] text-[#1C1917]'
            }`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${heroMode ? 'text-[#5EEAD4]' : 'text-[#0F766E]'}`} />
            <span>Repetir</span>
          </button>

          {enablePip && (
            <button
              type="button"
              onClick={handleTogglePip}
              title="Abrir janela flutuante sobre outros apps (Picture-in-Picture)"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-colors whitespace-nowrap ${
                pipOpen
                  ? 'bg-[#EA580C] text-white'
                  : heroMode
                  ? 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                  : 'bg-[#F0FDFA] hover:bg-[#CCFBF1] text-[#0F766E] border border-[#99F6E4]'
              }`}
            >
              <PictureInPicture2 className="w-3.5 h-3.5" />
              <span>{pipOpen ? 'Fechar PiP' : 'Sobrepor (PiP)'}</span>
            </button>
          )}

          {showVideoStatus && !heroMode && (
            <span
              className={`text-xs font-bold ${
                videoStatus === 'loaded' ? 'text-[#0F766E]' : 'text-[#78716C]'
              }`}
            >
              {videoStatus === 'loaded'
                ? 'Carregado'
                : videoStatus === 'unavailable'
                ? 'Visual esquemático ativo'
                : 'Carregando'}
            </span>
          )}
        </div>

        <div
          className={`flex items-center gap-1 p-1 rounded-xl ${
            heroMode ? 'bg-white/15 border border-white/20' : 'bg-[#F3F0EA]'
          }`}
        >
          <button
            type="button"
            onClick={() => handleSpeedChange(1)}
            className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
              speed === 1
                ? 'bg-[#0D9488] text-white'
                : heroMode
                ? 'text-white/80 hover:text-white'
                : 'text-[#57534E] hover:text-[#1C1917]'
            }`}
          >
            1x
          </button>
          <button
            type="button"
            onClick={() => handleSpeedChange(speed === 0.5 ? 1 : 0.5)}
            className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors inline-flex items-center gap-1 whitespace-nowrap ${
              speed === 0.5
                ? 'bg-[#EA580C] text-white'
                : heroMode
                ? 'text-white/80 hover:text-white'
                : 'text-[#57534E] hover:text-[#1C1917]'
            }`}
          >
            <span aria-hidden="true">🐢</span>
            <span>{turtleLabel ? 'Câmera lenta 0.5x' : '0.5x'}</span>
          </button>
        </div>
      </div>

      {pipError && (
        <p className={`text-[11px] font-semibold px-1 ${heroMode ? 'text-rose-200' : 'text-[#BE123C]'}`}>
          {pipError}
        </p>
      )}
    </div>
  );
};
