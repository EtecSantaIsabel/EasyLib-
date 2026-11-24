import React, { useMemo, useState } from 'react';
import {
  Search,
  Heart,
  BookOpen,
  Hand,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { UserProfile } from '../types';
import {
  CatalogSign,
  LIBRAS_CATALOG_255,
  LIBRAS_CATALOG_CATEGORIES
} from '../data/librasCatalog255';
import { LibiMascot } from '../components/LibiMascot';
import { SignDetailView } from './SignDetailView';
import { soundService } from '../services/soundService';

interface DictionaryViewProps {
  userProfile: UserProfile;
  onToggleFavorite: (signId: string) => void;
}

const ITEMS_PER_PAGE = 24;

export const DictionaryView = ({
  userProfile,
  onToggleFavorite
}: DictionaryViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeDetailSign, setActiveDetailSign] = useState<CatalogSign | null>(null);

  const categories = useMemo(
    () => ['Todas', ...LIBRAS_CATALOG_CATEGORIES],
    []
  );

  const filteredSigns = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return LIBRAS_CATALOG_255.filter((sign) => {
      const matchesCategory =
        selectedCategory === 'Todas' || sign.categoria === selectedCategory;
      if (!matchesCategory) return false;
      if (!query) return true;
      return (
        sign.palavra.toLowerCase().includes(query) ||
        sign.slug.toLowerCase().includes(query) ||
        sign.significado.toLowerCase().includes(query) ||
        sign.categoria.toLowerCase().includes(query)
      );
    });
  }, [searchTerm, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredSigns.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedSigns = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredSigns.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredSigns, safePage]);

  const scrollTopSmooth = () => {
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenSignDetail = (sign: CatalogSign) => {
    soundService.playTap();
    setActiveDetailSign(sign);
    scrollTopSmooth();
  };

  const handleCategoryChange = (cat: string) => {
    soundService.playTap();
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  if (activeDetailSign) {
    return (
      <SignDetailView
        sign={activeDetailSign}
        isFavorite={Boolean(userProfile.favoriteSignIds?.includes(activeDetailSign.id))}
        onBack={() => {
          setActiveDetailSign(null);
          scrollTopSmooth();
        }}
        onToggleFavorite={onToggleFavorite}
        onSelectSign={(nextSign) => {
          setActiveDetailSign(nextSign);
          scrollTopSmooth();
        }}
        onBrowseCategory={(category) => {
          setSelectedCategory(category);
          setSearchTerm('');
          setCurrentPage(1);
          setActiveDetailSign(null);
          scrollTopSmooth();
        }}
        onBrowseAll={() => {
          setSelectedCategory('Todas');
          setSearchTerm('');
          setCurrentPage(1);
          setActiveDetailSign(null);
          scrollTopSmooth();
        }}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-2 space-y-5 select-none">
      {/* Library Header */}
      <div className="bg-[#0D9488] rounded-2xl p-5 text-white border-b-4 border-[#0F766E] flex items-center justify-between gap-4 min-w-0">
        <div className="space-y-1 min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#CCFBF1] block">
            {LIBRAS_CATALOG_255.length} sinais em Libras
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold truncate">
            Biblioteca de Sinais
          </h1>
          <p className="text-xs sm:text-sm text-white/90 font-medium max-w-xl">
            Toque em qualquer sinal para abrir a página completa com espaço de vídeo, como fazer, definição e exemplos de uso.
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#78716C]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar sinal (ex: Abelha, Oi, Mãe, Cachorro, Água, Escola)..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-[#E8E2D9] text-[#1C1917] placeholder-[#78716C] font-semibold text-sm focus:outline-none focus:border-[#0D9488]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryChange(cat)}
                className={`
                  px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-colors cursor-pointer shrink-0
                  ${isSelected
                    ? 'bg-[#EA580C] text-white border-b-2 border-[#9A3412]'
                    : 'bg-[#F3F0EA] text-[#57534E] hover:bg-[#E8E2D9] hover:text-[#1C1917]'}
                `}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count + Page Indicator */}
      <div className="flex items-center justify-between gap-2 px-1 text-[11px] font-bold uppercase tracking-wider text-[#78716C] tabular-nums">
        <span>{filteredSigns.length} sinais encontrados</span>
        <span>
          Página {safePage} de {totalPages}
        </span>
      </div>

      {/* Full-Width Sign Bubble Cards */}
      {paginatedSigns.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-[#E8E2D9] flex flex-col items-center gap-3">
          <LibiMascot mood="pensando" size="sm" />
          <p className="font-semibold text-sm text-[#57534E]">
            Nenhum sinal encontrado para essa busca.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {paginatedSigns.map((sign) => {
            const isFavorite = userProfile.favoriteSignIds?.includes(sign.id);

            return (
              <div
                key={sign.id}
                onClick={() => handleOpenSignDetail(sign)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenSignDetail(sign);
                  }
                }}
                className="bg-white rounded-2xl border border-[#E8E2D9] hover:border-[#0D9488] p-4 transition-colors cursor-pointer flex items-center justify-between gap-3 min-w-0 group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] text-[#0F766E] group-hover:bg-[#0D9488] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                    <Hand className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-[#1C1917] group-hover:text-[#0F766E] truncate">
                      <span className="text-[#78716C] font-semibold mr-1.5 tabular-nums">
                        #{sign.numericId}
                      </span>
                      {sign.palavra}
                    </div>
                    <div className="text-xs text-[#57534E] font-medium truncate">
                      {sign.categoria}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      soundService.playTap();
                      onToggleFavorite(sign.id);
                    }}
                    aria-label={`Favoritar ${sign.palavra}`}
                    className="p-1.5 rounded-lg text-[#78716C] hover:text-[#E11D48] hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Heart
                      className={`w-4 h-4 ${isFavorite ? 'fill-[#E11D48] text-[#E11D48]' : ''}`}
                    />
                  </button>
                  <ChevronRight className="w-4 h-4 text-[#78716C] group-hover:text-[#0F766E]" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 pt-2">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => {
              soundService.playTap();
              setCurrentPage((p) => Math.max(1, p - 1));
              scrollTopSmooth();
            }}
            className="tactile-btn flex items-center gap-1 px-3.5 py-2 rounded-xl bg-white border border-[#E8E2D9] border-b-[3px] border-b-[#D6CFC5] text-xs font-bold text-[#1C1917] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>

          <span className="text-xs font-bold text-[#57534E] tabular-nums">
            {safePage} / {totalPages}
          </span>

          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => {
              soundService.playTap();
              setCurrentPage((p) => Math.min(totalPages, p + 1));
              scrollTopSmooth();
            }}
            className="tactile-btn flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#0D9488] text-white border-b-[3px] border-[#0F766E] text-xs font-bold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <span>Próxima</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
