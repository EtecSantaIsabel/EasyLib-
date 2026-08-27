import React, { useState, useRef } from 'react';
import { Play, Pause, RotateCcw, Video, Eye, Sparkles, Volume2, Info, ChevronRight, Gauge } from 'lucide-react';
import { SignData } from '../types';
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
  customImageUrl,
  autoPlay = true,
  className = ''
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'video' | 'anatomy'>('video');
  const [currentStep, setCurrentStep] = useState<number>(0);

  if (!sign) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[#FFFDF9] rounded-3xl border-2 border-dashed border-[#FED7AA] text-[#A8A29E]">
        <span className="text-4xl mb-2">🤟</span>
        <span className="text-xs font-black">Demonstração de Libras</span>
      </div>
    );
  }

  // Demonstration breakdown steps
  const steps = [
    { label: '1. Configuração de Mão (CM)', desc: sign.handshapeName },
    { label: '2. Ponto de Articulação (PA)', desc: sign.bodyLocation },
    { label: '3. Movimento (M)', desc: sign.movementType },
    { label: '4. Expressão Facial (NMF)', desc: sign.facialExpression }
  ];

  const handleTogglePlay = () => {
    soundService.playTap();
    setIsPlaying(!isPlaying);
  };

  const handleToggleSpeed = () => {
    soundService.playTap();
    setPlaybackSpeed(prev => (prev === 1 ? 0.5 : prev === 0.5 ? 0.25 : 1));
  };

  return (
    <div className={`flex flex-col bg-white rounded-3xl border-2 border-[#F1EAE2] border-b-6 border-[#FED7AA] overflow-hidden shadow-sm ${className}`}>
      
      {/* Top Header Controls */}
      <div className="bg-[#FFF7ED] px-4 py-2.5 border-b border-[#FED7AA] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-[#FFEDD5] text-[#EA580C] flex items-center justify-center text-sm font-black border border-[#FDBA74]">
            🤟
          </span>
          <div>
            <h4 className="font-black text-xs text-[#292524]">{sign.name}</h4>
            <span className="text-[10px] font-bold text-[#EA580C] uppercase tracking-wider">{sign.category}</span>
          </div>
        </div>

        {/* View Mode Toggle: Video / Anatomia dos 5 Parâmetros */}
        <div className="flex items-center bg-[#FED7AA]/60 p-1 rounded-xl gap-1 text-[11px] font-black">
          <button
            onClick={() => { soundService.playTap(); setViewMode('video'); }}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${viewMode === 'video' ? 'bg-white text-[#C2410C] shadow-xs' : 'text-[#78716C]'}`}
          >
            Vídeo
          </button>
          <button
            onClick={() => { soundService.playTap(); setViewMode('anatomy'); }}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${viewMode === 'anatomy' ? 'bg-white text-[#C2410C] shadow-xs' : 'text-[#78716C]'}`}
          >
            Parâmetros
          </button>
        </div>
      </div>

      {/* Main Visual Display Stage */}
      {viewMode === 'video' ? (
        <div className="relative aspect-video sm:aspect-[16/10] bg-gradient-to-b from-[#1C1917] via-[#292524] to-[#0C0A09] flex items-center justify-center overflow-hidden group">
          
          {/* Visual Signer Animation Demonstration Stage */}
          <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
            
            {/* Background Grid Accent */}
            <div className="absolute inset-0 bg-[radial-gradient(#EA580C_1px,transparent_1px)] [background-size:20px_20px] opacity-15" />

            {/* Visual Signer SVG / Animated Graphic */}
            <div className={`relative flex flex-col items-center transition-transform duration-700 ${isPlaying ? 'scale-105' : 'scale-100'}`}>
              
              {/* Dynamic Sign Demonstration Avatar */}
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
                
                {/* Glow ring */}
                <div className={`absolute inset-0 rounded-full bg-[#FF6B00]/20 blur-xl ${isPlaying ? 'animate-pulse' : ''}`} />

                {/* Animated Graphic Canvas */}
                <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-2xl">
                  {/* Signer Torso */}
                  <path d="M 40 140 C 44 110, 56 102, 80 102 C 104 102, 116 110, 120 140 Z" fill="#334155" />
                  
                  {/* Head */}
                  <ellipse cx="80" cy="65" rx="22" ry="24" fill="#FBBF24" />
                  
                  {/* Hair */}
                  <path d="M 58 56 C 58 38, 102 38, 102 56 C 102 44, 92 36, 80 36 C 68 36, 58 44, 58 56 Z" fill="#1E293B" />
                  
                  {/* Dynamic Non-Manual Facial Expression (NMF) */}
                  {sign.facialExpression.toLowerCase().includes('pergunta') || sign.facialExpression.toLowerCase().includes('interrogativa') ? (
                    <g>
                      {/* Eyebrows raised for questions */}
                      <path d="M 66 50 Q 72 45 78 50" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                      <path d="M 82 50 Q 88 45 94 50" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                      <circle cx="72" cy="60" r="3.5" fill="#0F172A" />
                      <circle cx="88" cy="60" r="3.5" fill="#0F172A" />
                      <path d="M 76 74 Q 80 78 84 74" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" fill="none" />
                    </g>
                  ) : sign.facialExpression.toLowerCase().includes('dúvida') || sign.facialExpression.toLowerCase().includes('franzida') ? (
                    <g>
                      {/* Eyebrows furrowed for WH-questions */}
                      <path d="M 68 52 L 78 55" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
                      <path d="M 92 52 L 82 55" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="72" cy="60" r="3" fill="#0F172A" />
                      <circle cx="88" cy="60" r="3" fill="#0F172A" />
                      <path d="M 76 74 L 84 74" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
                    </g>
                  ) : (
                    <g>
                      {/* Friendly Smile */}
                      <path d="M 66 52 Q 72 49 76 52" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" fill="none" />
                      <path d="M 84 52 Q 88 49 94 52" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" fill="none" />
                      <circle cx="72" cy="60" r="3" fill="#0F172A" />
                      <circle cx="88" cy="60" r="3" fill="#0F172A" />
                      <path d="M 74 72 Q 80 79 86 72" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                    </g>
                  )}

                  {/* Sign Movement Arc Trails */}
                  {isPlaying && (
                    <path
                      d="M 40 85 C 40 50, 120 50, 120 85"
                      stroke="#FF6B00"
                      strokeWidth="3"
                      strokeDasharray="6 4"
                      fill="none"
                      className="animate-pulse"
                    />
                  )}

                  {/* Active Hands Signing */}
                  <g className={isPlaying ? 'animate-bounce' : ''}>
                    {/* Hand 1 */}
                    <circle cx="56" cy="95" r="11" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
                    {/* Hand 2 */}
                    <circle cx="104" cy="95" r="11" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
                  </g>
                </svg>

                {/* Big Visual Sign Glyph Overlay */}
                <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-[#FF6B00] border-2 border-white text-white flex items-center justify-center text-2xl shadow-xl animate-bounce">
                  {sign.visualGlyph || '🤟'}
                </div>
              </div>

              {/* Subtitle / Meaning Gloss */}
              <div className="mt-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white font-mono text-xs font-bold">
                {sign.name.toUpperCase()}
              </div>

            </div>

          </div>

          {/* Video Controls Bar Floating on Bottom */}
          <div className="absolute bottom-2 inset-x-2 sm:inset-x-4 p-2 rounded-2xl bg-black/75 backdrop-blur-md border border-white/10 flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={handleTogglePlay}
                className="p-1.5 rounded-xl bg-[#FF6B00] hover:bg-[#EA580C] text-white cursor-pointer transition-all active:scale-95 shadow-sm"
                title={isPlaying ? 'Pausar' : 'Reproduzir'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <button
                onClick={handleToggleSpeed}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 font-black text-[11px] cursor-pointer"
                title="Velocidade de reprodução do sinal"
              >
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                <span>{playbackSpeed}x {playbackSpeed < 1 ? '(Câmera Lenta)' : ''}</span>
              </button>
            </div>

            {/* Non-manual marker pill */}
            <div className="text-[10px] text-amber-300 font-bold hidden sm:flex items-center gap-1">
              <span>🎭 {sign.facialExpression}</span>
            </div>
          </div>

        </div>
      ) : (
        /* Anatomia dos 5 Parâmetros da Libras */
        <div className="p-4 space-y-3 bg-[#FFFDF9]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {steps.map((step, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-[#FFF7ED] border border-[#FED7AA] space-y-1">
                <div className="text-[11px] font-black text-[#EA580C] uppercase tracking-wider">{step.label}</div>
                <div className="text-xs font-bold text-[#292524]">{step.desc}</div>
              </div>
            ))}
          </div>

          {/* Description Guide */}
          <div className="p-3 rounded-2xl bg-white border border-[#F1EAE2] text-xs text-[#78716C] leading-relaxed">
            <span className="font-black text-[#292524]">Como executar: </span>
            {sign.description}
          </div>
        </div>
      )}

    </div>
  );
};
