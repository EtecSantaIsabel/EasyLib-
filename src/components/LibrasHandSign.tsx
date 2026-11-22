import React, { useState } from 'react';
import { Info, ExternalLink, Hand, MapPin, Move, Smile, CheckCircle2, AlertTriangle } from 'lucide-react';
import { SignData } from '../types';
import { LIBRAS_SIGN_DATABASE } from '../data/librasSignDatabase';

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
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'params'>('visual');

  if (!sign) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-6 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 text-slate-400 ${className}`}
      >
        <span className="text-4xl mb-2">🤟</span>
        <span className="text-sm font-semibold">Sinal em Libras</span>
      </div>
    );
  }

  const cleanId = sign.id.replace(/^sign_/, '');
  const spec = LIBRAS_SIGN_DATABASE.find(
    (s) => s.id === cleanId || s.id === sign.id || s.name.toLowerCase() === sign.name.toLowerCase()
  );

  const isValidated = (sign.validationStatus || spec?.validationStatus) === 'validated';
  const refUrl =
    sign.videoReferenceUrl ||
    spec?.videoReference?.externalUrl ||
    `https://www.spreadthesign.com/pt.br/search/?q=${encodeURIComponent(sign.name.split('/')[0].trim())}`;

  const dimensionClasses =
    size === 'sm'
      ? 'w-24 h-24 text-3xl'
      : size === 'lg'
      ? 'w-44 h-44 text-6xl'
      : size === 'hero'
      ? 'w-56 h-56 text-7xl'
      : 'w-32 h-32 text-5xl';

  return (
    <div
      className={`relative flex flex-col items-center bg-white rounded-3xl border-2 border-[#F1EAE2] shadow-sm p-5 ${className}`}
    >
      {/* Header */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="bg-[#FFF7ED] text-[#EA580C] font-black text-xs px-3 py-1 rounded-full border border-[#FED7AA]">
            {sign.category}
          </span>
          {isValidated ? (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 font-black text-[10px] px-2.5 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" />
              CÂMERA VALIDADA
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 font-black text-[10px] px-2.5 py-1 rounded-full border border-amber-200">
              <AlertTriangle className="w-3 h-3" />
              EM VALIDAÇÃO
            </span>
          )}
        </div>

        {showParameters && (
          <div className="flex items-center gap-1 bg-[#FFF7ED] p-1 rounded-xl text-xs font-black border border-[#FED7AA]">
            <button
              onClick={() => setActiveTab('visual')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'visual' ? 'bg-[#FF6B00] text-white shadow-xs' : 'text-[#78716C]'
              }`}
            >
              Resumo
            </button>
            <button
              onClick={() => setActiveTab('params')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'params' ? 'bg-[#FF6B00] text-white shadow-xs' : 'text-[#78716C]'
              }`}
            >
              5 Parâmetros
            </button>
          </div>
        )}
      </div>

      {activeTab === 'visual' ? (
        <div className="w-full flex flex-col items-center text-center my-2 space-y-3">
          {sign.realImageUrl ? (
            <div
              className={`rounded-2xl overflow-hidden border-2 border-[#FED7AA] ${dimensionClasses}`}
            >
              <img
                src={sign.realImageUrl}
                alt={sign.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className={`flex flex-col items-center justify-center rounded-3xl bg-gradient-to-b from-[#FFF7ED] to-[#FFEDD5] border-2 border-[#FED7AA] ${dimensionClasses}`}
            >
              <span className="select-none">{sign.visualGlyph || '🤟'}</span>
            </div>
          )}

          <div>
            <h4 className="font-black text-[#292524] text-xl tracking-tight">{sign.name}</h4>
            <p className="text-xs text-[#78716C] font-medium mt-1 max-w-md">{sign.meaning}</p>
          </div>

          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 text-left text-xs">
            <div className="p-2.5 rounded-2xl bg-[#FFFDF9] border border-[#F1EAE2]">
              <div className="font-black text-[#EA580C] text-[10px] uppercase">Configuração (CM)</div>
              <div className="font-semibold text-[#292524] mt-0.5">{sign.handshapeName}</div>
            </div>
            <div className="p-2.5 rounded-2xl bg-[#FFFDF9] border border-[#F1EAE2]">
              <div className="font-black text-[#EA580C] text-[10px] uppercase">Articulação (PA)</div>
              <div className="font-semibold text-[#292524] mt-0.5">{sign.bodyLocation}</div>
            </div>
          </div>

          <a
            href={refUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#EA580C] text-white font-black text-xs shadow-xs transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Ver demonstração real (Spread the Sign)</span>
          </a>
        </div>
      ) : (
        <div className="w-full my-2 space-y-2 text-xs">
          <div className="p-3 rounded-2xl bg-[#FFF7ED] border border-[#FED7AA]">
            <div className="font-black text-[#EA580C] flex items-center gap-1.5">
              <Hand className="w-3.5 h-3.5" />
              <span>1. Configuração de Mão (CM)</span>
            </div>
            <p className="text-[#292524] font-semibold mt-0.5">
              {spec?.handshapeName || sign.handshapeName}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-[#FFF7ED] border border-[#FED7AA]">
            <div className="font-black text-[#EA580C] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>2. Ponto de Articulação (PA)</span>
            </div>
            <p className="text-[#292524] font-semibold mt-0.5">
              {spec?.articulationLocationLabel || sign.bodyLocation}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-[#FFF7ED] border border-[#FED7AA]">
            <div className="font-black text-[#EA580C] flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5" />
              <span>3. Movimento & Orientação (M / O)</span>
            </div>
            <p className="text-[#292524] font-semibold mt-0.5">
              {spec
                ? `${spec.palmOrientationLabel} — ${spec.trajectoryDescription}`
                : sign.movementType}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-[#FFF7ED] border border-[#FED7AA]">
            <div className="font-black text-[#EA580C] flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5" />
              <span>4. Expressão Não-Manual (NMF)</span>
            </div>
            <p className="text-[#292524] font-semibold mt-0.5">
              {spec?.facialExpressionLabel || sign.facialExpression}
            </p>
          </div>
        </div>
      )}

      {showDetails && (
        <div className="w-full mt-3 pt-3 border-t border-[#F1EAE2] flex items-start gap-2 text-[#78716C] text-xs">
          <Info className="w-4 h-4 text-[#FF6B00] shrink-0 mt-0.5" />
          <span>{sign.description}</span>
        </div>
      )}
    </div>
  );
};
