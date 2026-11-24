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
        className={`flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-dashed border-[#D6CFC5] text-[#78716C] ${className}`}
      >
        <Hand className="w-8 h-8 mb-2 text-[#0D9488]" />
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
      ? 'w-20 h-20'
      : size === 'lg'
      ? 'w-36 h-36'
      : size === 'hero'
      ? 'w-44 h-44'
      : 'w-28 h-28';

  return (
    <div
      className={`relative flex flex-col items-center bg-white rounded-2xl border border-[#E8E2D9] p-5 ${className}`}
    >
      {/* Header */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
            {sign.category}
          </span>
          <span className="text-[#D6CFC5]">·</span>
          {isValidated ? (
            <span className="inline-flex items-center gap-1 text-[#0F766E] font-bold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Validado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[#B45309] font-bold text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5" />
              Em revisão
            </span>
          )}
        </div>

        {showParameters && (
          <div className="flex items-center gap-1 bg-[#F3F0EA] p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('visual')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'visual' ? 'bg-white text-[#1C1917] shadow-xs' : 'text-[#57534E]'
              }`}
            >
              Resumo
            </button>
            <button
              onClick={() => setActiveTab('params')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'params' ? 'bg-white text-[#1C1917] shadow-xs' : 'text-[#57534E]'
              }`}
            >
              5 Parâmetros
            </button>
          </div>
        )}
      </div>

      {activeTab === 'visual' ? (
        <div className="w-full flex flex-col items-center text-center space-y-4">
          {sign.realImageUrl ? (
            <div className={`rounded-2xl overflow-hidden border border-[#E8E2D9] ${dimensionClasses}`}>
              <img
                src={sign.realImageUrl}
                alt={sign.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className={`flex items-center justify-center rounded-2xl bg-[#F0FDFA] border border-[#99F6E4] text-[#0D9488] ${dimensionClasses}`}
            >
              <Hand className="w-12 h-12" />
            </div>
          )}

          <div>
            <h4 className="font-display font-bold text-[#1C1917] text-2xl">{sign.name}</h4>
            <p className="text-xs text-[#57534E] font-medium mt-1 max-w-md">{sign.meaning}</p>
          </div>

          <dl className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-left text-xs pt-1">
            <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E8E2D9]">
              <dt className="font-bold text-[#0F766E] text-[11px] uppercase">Configuração (CM)</dt>
              <dd className="font-semibold text-[#1C1917] mt-0.5">{sign.handshapeName}</dd>
            </div>
            <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E8E2D9]">
              <dt className="font-bold text-[#0F766E] text-[11px] uppercase">Articulação (PA)</dt>
              <dd className="font-semibold text-[#1C1917] mt-0.5">{sign.bodyLocation}</dd>
            </div>
          </dl>

          <a
            href={refUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tactile-btn inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#DC4F06] text-white font-bold text-xs border-b-[3px] border-[#9A3412]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Ver demonstração no Spread the Sign</span>
          </a>
        </div>
      ) : (
        <div className="w-full space-y-2.5 text-xs">
          <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E8E2D9]">
            <div className="font-bold text-[#0F766E] flex items-center gap-1.5">
              <Hand className="w-3.5 h-3.5" />
              <span>1. Configuração de Mão (CM)</span>
            </div>
            <p className="text-[#1C1917] font-semibold mt-0.5">
              {spec?.handshapeName || sign.handshapeName}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E8E2D9]">
            <div className="font-bold text-[#0F766E] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>2. Ponto de Articulação (PA)</span>
            </div>
            <p className="text-[#1C1917] font-semibold mt-0.5">
              {spec?.articulationLocationLabel || sign.bodyLocation}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E8E2D9]">
            <div className="font-bold text-[#0F766E] flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5" />
              <span>3. Movimento e Orientação (M / O)</span>
            </div>
            <p className="text-[#1C1917] font-semibold mt-0.5">
              {spec
                ? `${spec.palmOrientationLabel} — ${spec.trajectoryDescription}`
                : sign.movementType}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E8E2D9]">
            <div className="font-bold text-[#0F766E] flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5" />
              <span>4. Expressão Não-Manual (NMF)</span>
            </div>
            <p className="text-[#1C1917] font-semibold mt-0.5">
              {spec?.facialExpressionLabel || sign.facialExpression}
            </p>
          </div>
        </div>
      )}

      {showDetails && (
        <div className="w-full mt-4 pt-3 border-t border-[#E8E2D9] flex items-start gap-2 text-[#57534E] text-xs">
          <Info className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
          <span>{sign.description}</span>
        </div>
      )}
    </div>
  );
};
