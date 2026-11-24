import React, { useMemo } from 'react';
import { ArrowLeft, ChevronRight, Heart } from 'lucide-react';
import { CatalogSign, LIBRAS_CATALOG_255 } from '../data/librasCatalog255';
import { getSignEditorialDetail } from '../data/signEditorialDetails';
import { SignMediaPlayer, SignSchematicVisualizer } from '../components/SignSchematicVisualizer';
import { soundService } from '../services/soundService';

interface SignDetailViewProps {
  sign: CatalogSign;
  isFavorite: boolean;
  onBack: () => void;
  onToggleFavorite: (signId: string) => void;
  onSelectSign: (nextSign: CatalogSign) => void;
  onBrowseCategory: (category: string) => void;
  onBrowseAll: () => void;
}

const SectionHeading: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex items-center gap-3">
    <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#0F766E] whitespace-nowrap">
      {title}
    </h2>
    <div className="h-px flex-1 bg-[#E8E2D9]" />
  </div>
);

export const SignDetailView: React.FC<SignDetailViewProps> = ({
  sign,
  isFavorite,
  onBack,
  onToggleFavorite,
  onSelectSign,
  onBrowseCategory,
  onBrowseAll
}) => {
  const detail = useMemo(() => getSignEditorialDetail(sign), [sign]);

  return (
    <article className="max-w-3xl mx-auto px-1 sm:px-3 py-2 space-y-6 select-none animate-fade-in">
      {/* Top Teal Editorial Hero + Reserved Video Area */}
      <header className="bg-[#0F5C5B] rounded-2xl p-5 sm:p-6 text-white space-y-5 border-b-4 border-[#0B4342]">
        {/* Navigation Row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => {
              soundService.playTap();
              onBack();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer transition-colors whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar à Biblioteca</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundService.playTap();
              onToggleFavorite(sign.id);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
              isFavorite
                ? 'bg-white text-[#BE123C]'
                : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-[#E11D48] text-[#E11D48]' : ''}`} />
            <span>{isFavorite ? 'Favoritado' : 'Favoritar'}</span>
          </button>
        </div>

        {/* Clean Unboxed Breadcrumb */}
        <nav aria-label="Navegação da biblioteca" className="flex items-center gap-1.5 text-xs text-[#CCFBF1] flex-wrap">
          <button
            type="button"
            onClick={onBack}
            className="hover:underline cursor-pointer font-medium"
          >
            Biblioteca
          </button>
          <ChevronRight className="w-3.5 h-3.5 opacity-70 shrink-0" />
          <button
            type="button"
            onClick={() => onBrowseCategory(sign.categoria)}
            className="hover:underline cursor-pointer font-medium"
          >
            {sign.categoria}
          </button>
          <ChevronRight className="w-3.5 h-3.5 opacity-70 shrink-0" />
          <span className="font-bold text-white">{sign.palavra}</span>
        </nav>

        {/* Title Block */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#99F6E4] block">
            {sign.categoria} · Sinal #{sign.numericId}
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white leading-tight break-words">
            {sign.palavra}
          </h1>
          <p className="text-sm sm:text-base font-medium text-[#CCFBF1]">
            em Libras · {detail.grammaticalClass}
          </p>
        </div>

        {/* Reserved Top Video Area (Works with real video later & interactive fallback now) */}
        <div className="bg-white/10 rounded-2xl p-3 sm:p-4 border border-white/15">
          <SignMediaPlayer
            sign={sign}
            heroMode={true}
            pipSignList={LIBRAS_CATALOG_255}
          />
        </div>

        {/* Short Editorial Meaning Callout */}
        <p className="pt-2 border-t border-white/15 text-sm sm:text-base text-white/95 leading-relaxed font-medium">
          {detail.heroSummary}
        </p>
      </header>

      {/* Block 1: Como fazer o sinal */}
      <section className="space-y-3">
        <SectionHeading title="Como fazer o sinal" />
        <div className="bg-white rounded-2xl border border-[#E8E2D9] p-4 sm:p-5 space-y-4">
          {sign.videoUrl ? (
            <video
              src={sign.videoUrl}
              controls
              autoPlay
              loop
              muted
              playsInline
              className="max-w-md mx-auto w-full rounded-xl bg-black"
            />
          ) : (
            <>
              <SignSchematicVisualizer
                sign={sign}
                speed={1}
                className="max-w-md mx-auto"
              />
              <p className="text-center text-xs font-medium text-[#78716C]">
                Ilustração: as setas indicam a direção do movimento e a expressão não-manual.
              </p>
            </>
          )}
        </div>


          <div className="space-y-2.5 pt-2 border-t border-[#F3F0EA]">
            <h3 className="font-display text-lg sm:text-xl font-bold text-[#1C1917]">
              Como é o sinal de {sign.palavra} em Libras
            </h3>
            <p className="text-sm text-[#57534E] leading-relaxed">
              {detail.howToMake.intro}
            </p>
            <ul className="space-y-1.5 text-sm text-[#1C1917] pt-1">
              <li className="leading-relaxed">• {detail.howToMake.handshapeText}</li>
              <li className="leading-relaxed">• {detail.howToMake.locationText}</li>
              <li className="leading-relaxed">• {detail.howToMake.movementText}</li>
              <li className="leading-relaxed">• {detail.howToMake.expressionText}</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Block 2: Definição */}
      <section className="space-y-3">
        <SectionHeading title="Definição" />
        <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 divide-y divide-[#F3F0EA]">
          <div className="flex items-start gap-3.5 pb-4">
            <span className="font-display font-bold text-lg text-[#0D9488] tabular-nums shrink-0 leading-snug">
              1.
            </span>
            <p className="text-sm sm:text-base text-[#1C1917] leading-relaxed font-medium">
              {detail.definitions[0]}
            </p>
          </div>
          <div className="flex items-start gap-3.5 pt-4">
            <span className="font-display font-bold text-lg text-[#0D9488] tabular-nums shrink-0 leading-snug">
              2.
            </span>
            <p className="text-sm sm:text-base text-[#57534E] leading-relaxed">
              {detail.definitions[1]}
            </p>
          </div>
        </div>
      </section>

      {/* Block 3: Dados do sinal */}
      <section className="space-y-3">
        <SectionHeading title="Dados do sinal" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-[#E8E2D9] p-4 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E] block">
              Categoria
            </span>
            <p className="text-sm sm:text-base font-bold text-[#1C1917]">
              {sign.categoria}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8E2D9] p-4 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E] block">
              Classe gramatical
            </span>
            <p className="text-sm sm:text-base font-bold text-[#1C1917]">
              {detail.grammaticalClass}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8E2D9] p-4 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E] block">
              Contexto de uso
            </span>
            <p className="text-sm sm:text-base font-bold text-[#1C1917]">
              {detail.usageContext}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8E2D9] p-4 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E] block">
              Variação regional
            </span>
            <p className="text-sm sm:text-base font-bold text-[#1C1917]">
              {detail.regionalVariation}
            </p>
          </div>
        </div>
      </section>

      {/* Block 4: Exemplos de uso */}
      <section className="space-y-3">
        <SectionHeading title="Exemplos de uso" />
        <div className="space-y-2.5">
          {detail.examples.map((sentence, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-[#E8E2D9] px-4 py-3.5 flex items-start gap-3"
            >
              <span className="font-display font-bold text-base text-[#0D9488] tabular-nums shrink-0 leading-snug">
                {idx + 1}.
              </span>
              <p className="text-sm sm:text-base text-[#1C1917] leading-relaxed">
                {sentence}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Block 5: Atenção ao contexto */}
      <section className="space-y-3">
        <SectionHeading title="Atenção ao contexto" />
        <div className="bg-[#F0FDFA] rounded-2xl border border-[#99F6E4] p-5 space-y-3">
          <p className="text-sm text-[#1C1917] leading-relaxed">
            <strong className="font-bold text-[#0F766E]">Na frase: </strong>
            {detail.contextNote.inPhrase}
          </p>
          <p className="text-sm text-[#1C1917] leading-relaxed">
            <strong className="font-bold text-[#0F766E]">Variações regionais: </strong>
            {detail.contextNote.regionalNote}
          </p>
        </div>
      </section>

      {/* Block 6: Outros sinais em Libras */}
      <section className="space-y-3 pb-4">
        <SectionHeading title="Outros sinais em Libras" />
        <div className="grid grid-cols-2 gap-3">
          {detail.relatedSigns.map((related) => (
            <button
              key={related.id}
              type="button"
              onClick={() => {
                soundService.playTap();
                onSelectSign(related);
              }}
              className="bg-white rounded-2xl border border-[#E8E2D9] hover:border-[#0D9488] p-3 text-left transition-colors cursor-pointer space-y-2.5 group"
            >
              <SignSchematicVisualizer
                sign={related}
                mini={true}
                hideControls={true}
              />
              <div className="px-1 flex items-center justify-between gap-2 min-w-0">
                <div className="min-w-0">
                  <div className="font-bold text-sm text-[#1C1917] group-hover:text-[#0F766E] truncate">
                    {related.palavra}
                  </div>
                  <div className="text-[11px] font-medium text-[#78716C] truncate">
                    {related.categoria}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#78716C] group-hover:text-[#0F766E] shrink-0" />
              </div>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2 px-1">
          <button
            type="button"
            onClick={() => {
              soundService.playTap();
              onBrowseCategory(sign.categoria);
            }}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#0F766E] hover:underline cursor-pointer"
          >
            <span>Ver todos: {sign.categoria}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              soundService.playTap();
              onBrowseAll();
            }}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#0F766E] hover:underline cursor-pointer"
          >
            <span>Ver todos os sinais</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    </article>
  );
};
