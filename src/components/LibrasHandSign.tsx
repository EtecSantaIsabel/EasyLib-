import React, { useState } from 'react';
import { Play, RotateCcw, Info, Eye, Sparkles } from 'lucide-react';
import { SignData } from '../types';

interface LibrasHandSignProps {
  sign?: SignData;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showDetails?: boolean;
  showParameters?: boolean;
  isAnimated?: boolean;
  className?: string;
  onPlaySign?: () => void;
}

export const LibrasHandSign: React.FC<LibrasHandSignProps> = ({
  sign,
  size = 'md',
  showDetails = false,
  showParameters = false,
  isAnimated = true,
  className = '',
  onPlaySign
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'visual' | 'params'>('visual');

  if (!sign) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 text-slate-400 ${className}`}>
        <span className="text-4xl mb-2">🤟</span>
        <span className="text-sm font-semibold">Sinal em Libras</span>
      </div>
    );
  }

  const triggerAnimation = () => {
    setIsPlaying(true);
    if (onPlaySign) onPlaySign();
    setTimeout(() => {
      setIsPlaying(false);
    }, 1800);
  };

  const getDimensionClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-24 h-24 text-3xl';
      case 'md':
        return 'w-40 h-40 text-5xl';
      case 'lg':
        return 'w-56 h-56 text-7xl';
      case 'hero':
        return 'w-72 h-72 text-8xl';
      default:
        return 'w-40 h-40 text-5xl';
    }
  };

  return (
    <div className={`relative flex flex-col items-center bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-4 ${className}`}>
      {/* Header Badge */}
      <div className="w-full flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 font-bold text-xs px-2.5 py-1 rounded-full border border-emerald-200">
          <span className="text-sm">🤟</span>
          <span>{sign.category}</span>
        </div>

        {showParameters && (
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('visual')}
              className={`px-2 py-0.5 rounded-md transition-colors ${activeTab === 'visual' ? 'bg-white shadow-xs text-slate-800' : 'text-slate-500'}`}
            >
              Visual
            </button>
            <button
              onClick={() => setActiveTab('params')}
              className={`px-2 py-0.5 rounded-md transition-colors ${activeTab === 'params' ? 'bg-white shadow-xs text-slate-800' : 'text-slate-500'}`}
            >
              5 Parâmetros
            </button>
          </div>
        )}
      </div>

      {activeTab === 'visual' ? (
        <div className="relative flex flex-col items-center justify-center my-2">
          {/* Main Visual Stage */}
          <div
            onClick={triggerAnimation}
            className={`cursor-pointer group relative flex items-center justify-center rounded-2xl bg-gradient-to-b from-sky-50 to-emerald-50 border-2 border-emerald-100 overflow-hidden transition-all duration-300 ${getDimensionClasses()} ${
              isPlaying ? 'scale-105 ring-4 ring-emerald-300 ring-offset-2 shadow-lg' : 'hover:border-emerald-300'
            }`}
          >
            {/* Background motion trails */}
            <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />

            {/* Glowing active wave */}
            {isPlaying && (
              <div className="absolute inset-0 bg-emerald-400/10 animate-pulse rounded-2xl pointer-events-none" />
            )}

            {/* Core Graphic Glyph & Motion Representation */}
            <div
              className={`relative z-10 select-none flex flex-col items-center justify-center transition-transform duration-500 ${
                isPlaying ? 'animate-bounce' : 'group-hover:scale-110'
              }`}
            >
              <span>{sign.visualGlyph || '🤟'}</span>
            </div>

            {/* Motion Arrow Indicator Overlay */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full border border-slate-200 text-[10px] font-bold text-slate-600 shadow-xs">
              {isPlaying ? (
                <RotateCcw className="w-3 h-3 animate-spin text-emerald-600" />
              ) : (
                <Play className="w-3 h-3 text-emerald-600 fill-emerald-600" />
              )}
              <span>{isPlaying ? 'Sinalizando...' : 'Tocar Sinal'}</span>
            </div>

            {/* Location Tag */}
            <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
              {sign.bodyLocation.split(' ')[0]}
            </div>
          </div>

          {/* Sign Title */}
          <h4 className="font-black text-slate-800 text-lg sm:text-xl mt-3 text-center tracking-tight">
            {sign.name}
          </h4>
          <p className="text-xs text-slate-500 text-center font-medium mt-0.5 max-w-xs line-clamp-2">
            {sign.meaning}
          </p>

          {/* Action Button */}
          <button
            onClick={triggerAnimation}
            className="mt-3 flex items-center gap-2 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:translate-y-0.5 text-white font-bold text-xs shadow-[0_3px_0_#059669] transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Repetir Demonstração</span>
          </button>
        </div>
      ) : (
        /* 5 Parameters Detail Tab */
        <div className="w-full my-2 space-y-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="font-extrabold text-emerald-700 flex items-center gap-1">
              <span>1. Configuração de Mão (CM):</span>
            </div>
            <p className="text-slate-700 font-semibold mt-0.5">{sign.handshapeName}</p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="font-extrabold text-sky-700 flex items-center gap-1">
              <span>2. Ponto de Articulação (PA):</span>
            </div>
            <p className="text-slate-700 font-semibold mt-0.5">{sign.bodyLocation}</p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="font-extrabold text-purple-700 flex items-center gap-1">
              <span>3. Movimento (M):</span>
            </div>
            <p className="text-slate-700 font-semibold mt-0.5">{sign.movementType}</p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="font-extrabold text-amber-700 flex items-center gap-1">
              <span>4. Expressão Não-Manual (NMF):</span>
            </div>
            <p className="text-slate-700 font-semibold mt-0.5">{sign.facialExpression}</p>
          </div>
        </div>
      )}

      {/* Description Tooltip Footer */}
      {showDetails && (
        <div className="w-full mt-2 pt-2 border-t border-slate-100 flex items-start gap-1.5 text-slate-500 text-xs">
          <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <span>{sign.description}</span>
        </div>
      )}
    </div>
  );
};
