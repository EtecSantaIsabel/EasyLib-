import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Video,
  Gauge,
  ExternalLink,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Hand,
  Smile
} from 'lucide-react';
import { SignData } from '../types';
import { LIBRAS_SIGN_DATABASE } from '../data/librasSignDatabase';
import { soundService } from '../services/soundService';

interface SignDemonstrationVisualProps {
  sign?: SignData;
  customVideoUrl?: string;
  customImageUrl?: string;
  autoPlay?: boolean;
  className?: string;
}

export const SignDemonstrationVisual: React.FC<SignDemonstrationVisualProps> = ({
  sign,
  customVideoUrl,
  autoPlay = true,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'demo' | 'params' | 'sources'>('demo');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const videoElementRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedStepIndex(0);
    setPlaybackSpeed(1);
  }, [sign?.id]);

  useEffect(() => {
    return () => {
      if (uploadedVideoUrl) {
        URL.revokeObjectURL(uploadedVideoUrl);
      }
    };
  }, [uploadedVideoUrl]);

  if (!sign) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[#FFFDF9] rounded-3xl border-2 border-dashed border-[#FED7AA] text-[#A8A29E]">
        <span className="text-4xl mb-2">🤟</span>
        <span className="text-xs font-black">Demonstração de Libras</span>
      </div>
    );
  }

  // Match structured linguistic spec when available
  const cleanId = sign.id.replace(/^sign_/, '');
  const structuredSpec = LIBRAS_SIGN_DATABASE.find(
    (s) =>
      s.id === cleanId ||
      s.id === sign.id ||
      s.name.toLowerCase() === sign.name.toLowerCase()
  );

  // Only play a video if a genuine sign-specific video or user-loaded clip exists
  const activeVideoUrl = uploadedVideoUrl || customVideoUrl || sign.realVideoUrl || null;
  const externalVideoRefUrl =
    sign.videoReferenceUrl ||
    structuredSpec?.videoReference?.externalUrl ||
    `https://www.spreadthesign.com/pt.br/search/?q=${encodeURIComponent(sign.name.split('/')[0].trim())}`;
  const externalSourceName =
    sign.linguisticSourceName ||
    structuredSpec?.linguisticSource?.name ||
    'Spread the Sign (PT-BR) / SignBank UFSC';
  const externalSourceUrl =
    sign.linguisticSourceUrl ||
    structuredSpec?.linguisticSource?.url ||
    'https://signbank.libras.ufsc.br/';

  const isValidated =
    (sign.validationStatus || structuredSpec?.validationStatus) === 'validated';

  const executionSteps = [
    {
      title: '1. Configuração de Mão (CM)',
      desc: structuredSpec?.handshapeName || sign.handshapeName,
      badge: 'Mão'
    },
    {
      title: '2. Ponto de Articulação (PA)',
      desc: structuredSpec?.articulationLocationLabel || sign.bodyLocation,
      badge: 'Local'
    },
    {
      title: '3. Orientação & Movimento (O / M)',
      desc: structuredSpec
        ? `${structuredSpec.palmOrientationLabel}. ${structuredSpec.trajectoryDescription}`
        : sign.movementType,
      badge: 'Trajetória'
    },
    {
      title: '4. Expressão Não-Manual (NMF)',
      desc: structuredSpec?.facialExpressionLabel || sign.facialExpression,
      badge: 'Rosto'
    }
  ];

  const handleTogglePlay = () => {
    soundService.playTap();
    if (!videoElementRef.current) return;
    if (videoElementRef.current.paused) {
      videoElementRef.current.play();
      setIsPlaying(true);
    } else {
      videoElementRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSelectSpeed = (speed: number) => {
    soundService.playTap();
    setPlaybackSpeed(speed);
    if (videoElementRef.current) {
      videoElementRef.current.playbackRate = speed;
    }
  };

  const handleReplay = () => {
    soundService.playTap();
    if (videoElementRef.current) {
      videoElementRef.current.currentTime = 0;
      videoElementRef.current.playbackRate = playbackSpeed;
      videoElementRef.current.play();
      setIsPlaying(true);
    } else {
      // Cycle step-by-step trajectory highlight
      setSelectedStepIndex((prev) => (prev + 1) % executionSteps.length);
    }
  };

  const handleUploadLocalVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (uploadedVideoUrl) URL.revokeObjectURL(uploadedVideoUrl);
    const objectUrl = URL.createObjectURL(file);
    setUploadedVideoUrl(objectUrl);
    setIsPlaying(true);
  };

  return (
    <div
      className={`flex flex-col bg-white rounded-3xl border-2 border-[#F1EAE2] border-b-6 border-[#FED7AA] overflow-hidden shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="bg-[#FFF7ED] px-4 py-3 border-b border-[#FED7AA] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-[#FF6B00] text-white flex items-center justify-center text-base font-black shadow-xs">
            {sign.visualGlyph || '🤟'}
          </span>
          <div>
            <h4 className="font-black text-sm text-[#292524] flex flex-wrap items-center gap-1.5">
              <span>{sign.name}</span>
              {isValidated ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3" />
                  VALIDADO
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300">
                  <AlertTriangle className="w-3 h-3" />
                  REVISÃO LINGUÍSTICA
                </span>
              )}
            </h4>
            <span className="text-[11px] font-bold text-[#EA580C] uppercase tracking-wider">
              {sign.category}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-[#FED7AA]/50 p-1 rounded-xl gap-1 text-[11px] font-black">
          <button
            onClick={() => {
              soundService.playTap();
              setActiveTab('demo');
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'demo'
                ? 'bg-[#FF6B00] text-white shadow-xs'
                : 'text-[#78716C] hover:text-[#292524]'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Demonstração</span>
          </button>

          <button
            onClick={() => {
              soundService.playTap();
              setActiveTab('params');
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'params'
                ? 'bg-[#FF6B00] text-white shadow-xs'
                : 'text-[#78716C] hover:text-[#292524]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>5 Parâmetros</span>
          </button>

          <button
            onClick={() => {
              soundService.playTap();
              setActiveTab('sources');
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'sources'
                ? 'bg-[#FF6B00] text-white shadow-xs'
                : 'text-[#78716C] hover:text-[#292524]'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Referência</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DEMONSTRATION (Real sign-specific video if available, otherwise honest structured steps + verified video links) */}
      {activeTab === 'demo' && (
        <div className="bg-[#FFFDF9]">
          {activeVideoUrl ? (
            <div className="relative aspect-video bg-stone-950 flex items-center justify-center overflow-hidden">
              <video
                ref={videoElementRef}
                src={activeVideoUrl}
                autoPlay={autoPlay}
                loop
                muted
                playsInline
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="w-full h-full object-contain"
              />

              <div className="absolute bottom-2 inset-x-2 sm:inset-x-3 p-2 rounded-2xl bg-black/85 backdrop-blur-md border border-white/15 flex flex-wrap items-center justify-between gap-2 text-white text-xs z-20">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleTogglePlay}
                    className="p-1.5 rounded-xl bg-[#FF6B00] hover:bg-[#EA580C] text-white cursor-pointer"
                    title={isPlaying ? 'Pausar' : 'Reproduzir'}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current" />
                    )}
                  </button>

                  <button
                    onClick={handleReplay}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                    title="Repetir"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Speed selectors 1x / 0.5x / 0.25x */}
                <div className="flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-amber-400 mr-0.5" />
                  {[1, 0.5, 0.25].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => handleSelectSpeed(spd)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-black cursor-pointer ${
                        playbackSpeed === spd
                          ? 'bg-[#FF6B00] text-white'
                          : 'bg-white/10 text-stone-200 hover:bg-white/20'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-3.5">
              {/* Honest media notice */}
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-black text-amber-900 uppercase tracking-wide">
                    Guia Técnico de Execução + Vídeo Oficial Externo
                  </p>
                  <p className="text-[11px] text-amber-800 leading-snug">
                    Este módulo não exibe fotos genéricas ou vídeos aleatórios. Consulte a execução linguística abaixo ou abra o vídeo real de um sinalizador no dicionário oficial.
                  </p>
                </div>
                <span className="text-3xl shrink-0">{sign.visualGlyph}</span>
              </div>

              {/* Step-by-step interactive movement breakdown */}
              <div className="p-3.5 rounded-2xl bg-white border-2 border-[#FED7AA] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#EA580C]">
                    Etapa {selectedStepIndex + 1} de {executionSteps.length} •{' '}
                    {executionSteps[selectedStepIndex].badge}
                  </span>
                  <button
                    onClick={handleReplay}
                    className="inline-flex items-center gap-1 text-[11px] font-black text-[#EA580C] hover:underline cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Próxima etapa</span>
                  </button>
                </div>

                <h5 className="font-black text-sm text-[#292524]">
                  {executionSteps[selectedStepIndex].title}
                </h5>
                <p className="text-xs text-[#57534E] font-medium leading-relaxed">
                  {executionSteps[selectedStepIndex].desc}
                </p>

                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {executionSteps.map((st, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        soundService.playTap();
                        setSelectedStepIndex(idx);
                      }}
                      className={`py-1.5 px-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer truncate ${
                        selectedStepIndex === idx
                          ? 'bg-[#FF6B00] text-white border-[#C2410C]'
                          : 'bg-[#FFF7ED] text-[#78716C] border-[#FED7AA] hover:text-[#292524]'
                      }`}
                    >
                      {idx + 1}. {st.badge}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action links: Open real dictionary video + optional local clip upload for slow-motion study */}
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={externalVideoRefUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[180px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#EA580C] text-white font-black text-xs shadow-xs transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ver sinal real no Spread the Sign</span>
                </a>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white hover:bg-[#FFF7ED] text-[#292524] border border-[#FED7AA] font-black text-xs cursor-pointer"
                  title="Carregar vídeo .mp4/.webm para estudar em câmera lenta (0.5x / 0.25x)"
                >
                  <Upload className="w-3.5 h-3.5 text-[#EA580C]" />
                  <span>Carregar clipe (0.25x)</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/*"
                  onChange={handleUploadLocalVideo}
                  className="hidden"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: 5 PARAMETERS */}
      {activeTab === 'params' && (
        <div className="p-4 space-y-2.5 bg-[#FFFDF9]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {executionSteps.map((step, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-[#FFF7ED] border border-[#FED7AA] space-y-1"
              >
                <div className="text-[11px] font-black text-[#EA580C] uppercase tracking-wider flex items-center gap-1">
                  {idx === 0 && <Hand className="w-3 h-3" />}
                  {idx === 3 && <Smile className="w-3 h-3" />}
                  <span>{step.title}</span>
                </div>
                <div className="text-xs font-bold text-[#292524]">{step.desc}</div>
              </div>
            ))}
          </div>

          {structuredSpec && (
            <div className="p-3 rounded-2xl bg-white border border-[#F1EAE2] text-xs text-[#57534E] space-y-1">
              <div>
                <span className="font-black text-[#292524]">Posição inicial → final: </span>
                {structuredSpec.initialPosition} → {structuredSpec.finalPosition}
              </div>
              <div>
                <span className="font-black text-[#292524]">Mãos: </span>
                {structuredSpec.twoHanded === 2
                  ? 'Duas mãos'
                  : structuredSpec.twoHanded === '1_or_2'
                  ? 'Uma ou duas mãos'
                  : 'Uma mão dominante'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: VERIFIABLE ACADEMIC & DICTIONARY SOURCES */}
      {activeTab === 'sources' && (
        <div className="p-4 space-y-3 bg-[#FFFDF9] text-xs">
          <div className="p-3.5 rounded-2xl bg-white border border-[#FED7AA] space-y-2">
            <div className="font-black text-[#292524]">Fonte linguística de referência</div>
            <p className="text-[#57534E]">{externalSourceName}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href={externalSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FFF7ED] border border-[#FED7AA] text-[#EA580C] font-black hover:bg-[#FFEDD5]"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Abrir fonte linguística</span>
              </a>
              <a
                href="https://signbank.libras.ufsc.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FFF7ED] border border-[#FED7AA] text-[#EA580C] font-black hover:bg-[#FFEDD5]"
              >
                <ExternalLink className="w-3 h-3" />
                <span>SignBank UFSC</span>
              </a>
              <a
                href="https://www.ines.gov.br/dicionario-de-libras/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FFF7ED] border border-[#FED7AA] text-[#EA580C] font-black hover:bg-[#FFEDD5]"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Dicionário INES</span>
              </a>
            </div>
          </div>
          {structuredSpec?.validationNotes && (
            <div className="p-3 rounded-2xl bg-[#FFF7ED] border border-[#FED7AA] text-[#57534E]">
              <span className="font-black text-[#292524]">Critério de validação: </span>
              {structuredSpec.validationNotes}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
