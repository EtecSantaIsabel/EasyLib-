import React, { useState } from 'react';
import { 
  Search, 
  Heart, 
  Sparkles, 
  BookOpen, 
  Filter, 
  Info, 
  Play, 
  BookmarkCheck,
  CheckCircle2
} from 'lucide-react';
import { SignData, UserProfile } from '../types';
import { LIBRAS_DICTIONARY } from '../data/librasData';
import { LibrasHandSign } from '../components/LibrasHandSign';
import { soundService } from '../services/soundService';

interface DictionaryViewProps {
  userProfile: UserProfile;
  onToggleFavorite: (signId: string) => void;
  onStartSignPractice?: (sign: SignData) => void;
}

export const DictionaryView: React.FC<DictionaryViewProps> = ({
  userProfile,
  onToggleFavorite,
  onStartSignPractice
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedSign, setSelectedSign] = useState<SignData | null>(LIBRAS_DICTIONARY[0]);

  const categories = ['Todas', 'Saudações', 'Família', 'Verbos', 'Verbos Direcionais', 'Identidade', 'Cortesia', 'Expressões'];

  const filteredSigns = LIBRAS_DICTIONARY.filter(sign => {
    const matchesSearch = sign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sign.meaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sign.handshapeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'Todas' || sign.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 select-none">
      
      {/* Header (Warm Sunset Card) */}
      <div className="bg-gradient-to-r from-[#FF6B00] via-[#F97316] to-[#EA580C] rounded-3xl p-6 text-white shadow-lg border-b-6 border-[#9A3412] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-xs text-[#FEF3C7]">
            <span>🤟</span>
            <span>Glossário & Sinalário EasyLib</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">Dicionário Visual de Libras</h1>
          <p className="text-xs sm:text-sm text-white/95 font-semibold max-w-xl">
            Explore sinais, assista à demonstração dos movimentos e estude os 5 parâmetros fonológicos.
          </p>
        </div>
        <div className="w-16 h-16 rounded-3xl bg-white/15 border-2 border-white/30 flex items-center justify-center text-3xl shadow-inner shrink-0">
          📖
        </div>
      </div>

      {/* Search & Categories Bar */}
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#A8A29E]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar sinal por palavra, significado ou configuração de mão..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border-2 border-[#F1EAE2] text-[#292524] placeholder-[#A8A29E] font-bold text-sm focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FFEDD5] shadow-xs"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  soundService.playTap();
                  setSelectedCategory(cat);
                }}
                className={`
                  px-4 py-2 rounded-2xl font-black text-xs whitespace-nowrap transition-all cursor-pointer border-2
                  ${isSelected
                    ? 'bg-[#FF6B00] text-white border-[#C2410C] shadow-xs'
                    : 'bg-white text-[#78716C] border-[#F1EAE2] hover:bg-[#FFF7ED] hover:text-[#C2410C]'}
                `}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left Sign List, Right Sign Detail */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Sign List */}
        <div className="md:col-span-5 space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
          <div className="text-xs font-black uppercase tracking-wider text-[#A8A29E] px-1">
            {filteredSigns.length} sinais encontrados
          </div>

          {filteredSigns.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border-2 border-[#F1EAE2] text-[#A8A29E] space-y-2">
              <span className="text-4xl">🔍</span>
              <p className="font-bold text-sm">Nenhum sinal encontrado para sua busca.</p>
            </div>
          ) : (
            filteredSigns.map((sign) => {
              const isSelected = selectedSign?.id === sign.id;
              const isFavorite = userProfile.favoriteSignIds?.includes(sign.id);

              return (
                <div
                  key={sign.id}
                  onClick={() => {
                    soundService.playTap();
                    setSelectedSign(sign);
                  }}
                  className={`
                    p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3
                    ${isSelected
                      ? 'bg-[#FFF7ED] border-[#F97316] shadow-sm ring-1 ring-[#FDBA74]'
                      : 'bg-white border-[#F1EAE2] hover:border-[#FED7AA] hover:bg-[#FFFDF9]'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#FFF7ED] border border-[#FED7AA] flex items-center justify-center text-2xl shrink-0">
                      {sign.visualGlyph}
                    </div>
                    <div>
                      <div className="font-black text-sm text-[#292524]">{sign.name}</div>
                      <div className="text-xs text-[#78716C] line-clamp-1">{sign.meaning}</div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      soundService.playTap();
                      onToggleFavorite(sign.id);
                    }}
                    className="p-2 rounded-xl text-[#A8A29E] hover:text-[#E11D48] hover:bg-rose-50 transition-colors"
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-[#E11D48] text-[#E11D48]' : ''}`} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Full Sign Detail & 5 Parameters */}
        <div className="md:col-span-7 space-y-4">
          {selectedSign ? (
            <div className="space-y-4">
              <LibrasHandSign
                sign={selectedSign}
                size="lg"
                showDetails={true}
                showParameters={true}
                className="w-full"
              />

              {/* Cultural Context / Extra Tip */}
              <div className="p-4 rounded-3xl bg-amber-50 border-2 border-amber-300 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-800 font-extrabold text-xs uppercase tracking-wider">
                  <Info className="w-4 h-4" />
                  <span>Dica de Sinalização:</span>
                </div>
                <p className="text-xs text-[#44403C] font-medium leading-relaxed">
                  Lembre-se de manter o rosto relaxado e expressivo, com as mãos no espaço neutro à frente do tronco para garantir máxima clareza aos interlocutores surdos.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-[#F1EAE2] text-[#A8A29E] space-y-2">
              <span className="text-4xl">🤟</span>
              <p className="font-bold text-sm">Selecione um sinal da lista para ver os detalhes.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
