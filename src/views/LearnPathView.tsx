import React, { useState } from 'react';
import { 
  BookOpen, 
  Star, 
  Check, 
  Lock, 
  Gift, 
  Trophy, 
  Zap, 
  Play, 
  BookMarked, 
  X,
  Sparkles,
  Info,
  ChevronLeft,
  ChevronRight,
  Layers
} from 'lucide-react';
import { Section, Unit, PathNode, UserProfile } from '../types';
import { LIBRAS_SECTIONS, ALL_50_UNITS } from '../data/librasData';
import { LibiMascot } from '../components/LibiMascot';
import { soundService } from '../services/soundService';

interface LearnPathViewProps {
  userProfile: UserProfile;
  onStartNode: (node: PathNode, unit: Unit) => void;
}

export const LearnPathView: React.FC<LearnPathViewProps> = ({
  userProfile,
  onStartNode
}) => {
  const [activeSectionNumber, setActiveSectionNumber] = useState<number>(1);
  const [selectedNode, setSelectedNode] = useState<{ node: PathNode; unit: Unit } | null>(null);
  const [guidebookUnit, setGuidebookUnit] = useState<Unit | null>(null);

  const sections: Section[] = LIBRAS_SECTIONS;
  const currentSection = sections.find(s => s.sectionNumber === activeSectionNumber) || sections[0];

  const handleNodeClick = (node: PathNode, unit: Unit, isUnlocked: boolean) => {
    soundService.playTap();
    if (!isUnlocked) return;
    setSelectedNode({ node, unit });
  };

  const handleOpenGuidebook = (unit: Unit) => {
    soundService.playTap();
    setGuidebookUnit(unit);
  };

  // Zigzag offsets for the path stepping stones
  const getOffsetClass = (index: number) => {
    const offsets = [
      'translate-x-0',
      'translate-x-8 sm:translate-x-14',
      'translate-x-14 sm:translate-x-24',
      'translate-x-8 sm:translate-x-14',
      'translate-x-0',
      '-translate-x-8 sm:-translate-x-14',
      '-translate-x-14 sm:-translate-x-24',
      '-translate-x-8 sm:-translate-x-14'
    ];
    return offsets[index % offsets.length];
  };

  const unitColorThemes: Record<string, { bg: string; border: string; light: string; text: string }> = {
    green: { bg: 'bg-[#FF6B00]', border: 'border-[#C2410C]', light: 'bg-[#FFEDD5]', text: 'text-[#EA580C]' },
    blue: { bg: 'bg-[#F97316]', border: 'border-[#C2410C]', light: 'bg-[#FFEDD5]', text: 'text-[#EA580C]' },
    purple: { bg: 'bg-[#E11D48]', border: 'border-[#9F1239]', light: 'bg-[#FFE4E6]', text: 'text-[#E11D48]' },
    orange: { bg: 'bg-[#FF7A00]', border: 'border-[#C2410C]', light: 'bg-[#FFE8D6]', text: 'text-[#EA580C]' },
    red: { bg: 'bg-[#DC2626]', border: 'border-[#991B1B]', light: 'bg-[#FEE2E2]', text: 'text-[#DC2626]' },
    yellow: { bg: 'bg-[#F59E0B]', border: 'border-[#B45309]', light: 'bg-[#FEF3C7]', text: 'text-[#B45309]' },
    teal: { bg: 'bg-[#EA580C]', border: 'border-[#9A3412]', light: 'bg-[#FFEDD5]', text: 'text-[#EA580C]' }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-8 select-none">
      
      {/* 50 Units Quick Navigator Header */}
      <div className="bg-white rounded-3xl p-4 border-2 border-[#F1EAE2] shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#EA580C]" />
            <h3 className="font-black text-sm text-[#292524]">
              Trilha Completa de Libras • 50 Unidades
            </h3>
          </div>
          <span className="text-xs font-black text-[#EA580C] bg-[#FFEDD5] px-2.5 py-1 rounded-xl">
            Seção {activeSectionNumber} de 10
          </span>
        </div>

        {/* Section Tabs Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {sections.map((sec) => (
            <button
              key={sec.sectionNumber}
              onClick={() => {
                soundService.playTap();
                setActiveSectionNumber(sec.sectionNumber);
              }}
              className={`px-3.5 py-2 rounded-2xl text-xs font-black shrink-0 transition-all cursor-pointer ${
                activeSectionNumber === sec.sectionNumber
                  ? 'bg-[#FF6B00] text-white shadow-md scale-105 border-b-3 border-[#C2410C]'
                  : 'bg-[#FFF7ED] text-[#78716C] hover:text-[#292524] hover:bg-[#FED7AA]/50'
              }`}
            >
              Seção {sec.sectionNumber}
            </button>
          ))}
        </div>
      </div>

      {/* Active Section Header (Sunset Gradient Card) */}
      <div className="bg-gradient-to-r from-[#FF6B00] via-[#F97316] to-[#EA580C] text-white p-5 rounded-3xl border-b-6 border-[#9A3412] shadow-lg flex items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-black uppercase tracking-widest text-[#FEF3C7] flex items-center gap-1.5">
            <span>🤟</span>
            <span>{currentSection.title}</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-black">{currentSection.description}</h2>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl shrink-0 shadow-inner">
          🇧🇷
        </div>
      </div>

      {/* Units in Current Section */}
      <div className="space-y-12">
        {currentSection.units.map((unit) => {
          const theme = unitColorThemes[unit.themeColor] || unitColorThemes.orange;

          return (
            <div key={unit.id} className="space-y-6">
              
              {/* Unit Banner Header with Guidebook icon */}
              <div className={`${theme.bg} text-white p-4 sm:p-5 rounded-3xl border-b-6 ${theme.border} shadow-md flex items-center justify-between gap-4`}>
                <div className="space-y-1">
                  <span className="text-xs font-black uppercase tracking-widest text-[#FEF3C7]">
                    {unit.title} • 12 Atividades
                  </span>
                  <p className="text-xs text-white/95 font-medium line-clamp-1">{unit.description}</p>
                </div>

                {/* Guidebook Button */}
                <button
                  onClick={() => handleOpenGuidebook(unit)}
                  className="p-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-transform active:scale-95 shadow-inner"
                  title="Abrir Guia de Sinais da Unidade"
                >
                  <BookOpen className="w-5 h-5" />
                  <span className="hidden sm:inline font-bold">Guia de Sinais</span>
                </button>
              </div>

              {/* Path Nodes Stepping Stones (Zigzag) */}
              <div className="py-6 flex flex-col items-center space-y-6 sm:space-y-8 relative">
                
                {unit.nodes.map((node, nIdx) => {
                  const isCompleted = userProfile.completedNodeIds.includes(node.id);
                  const prevNode = nIdx > 0 ? unit.nodes[nIdx - 1] : null;
                  const isUnlocked = nIdx === 0 || (prevNode && userProfile.completedNodeIds.includes(prevNode.id)) || isCompleted;
                  const isActive = isUnlocked && !isCompleted;
                  const offsetClass = getOffsetClass(nIdx);

                  return (
                    <div 
                      key={node.id} 
                      className={`relative flex flex-col items-center ${offsetClass} transition-transform duration-300`}
                    >
                      
                      {/* Libi Mascot standing near Active node */}
                      {isActive && (
                        <div className="absolute -top-20 -left-20 sm:-left-28 z-20 pointer-events-none animate-bounce">
                          <LibiMascot 
                            mood="happy" 
                            outfit={userProfile.duoOutfit} 
                            size="sm" 
                            showSpeechBubble={true} 
                            speechText="Sinalizar! 🤟" 
                          />
                        </div>
                      )}

                      {/* Node Stepping Button */}
                      <div className="relative group">
                        
                        {/* Pulsing Aura if active */}
                        {isActive && (
                          <div className="absolute -inset-2 rounded-full bg-[#FF6B00]/30 animate-ping pointer-events-none" />
                        )}

                        <button
                          onClick={() => handleNodeClick(node, unit, isUnlocked)}
                          className={`
                            w-18 h-18 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer select-none active:translate-y-2
                            ${isCompleted
                              ? 'bg-gradient-to-b from-[#F59E0B] to-[#D97706] border-b-8 border-[#92400E] text-white shadow-lg'
                              : isActive
                              ? `${theme.bg} border-b-8 ${theme.border} text-white shadow-xl scale-105`
                              : 'bg-[#E7E5E4] border-b-8 border-[#A8A29E] text-[#A8A29E] cursor-not-allowed'}
                          `}
                        >
                          {isCompleted ? (
                            <Check className="w-9 h-9 stroke-[3.5]" />
                          ) : !isUnlocked ? (
                            <Lock className="w-7 h-7" />
                          ) : node.type === 'story' ? (
                            <BookMarked className="w-8 h-8" />
                          ) : node.type === 'chest' ? (
                            <Gift className="w-8 h-8" />
                          ) : node.type === 'trophy' ? (
                            <Trophy className="w-8 h-8" />
                          ) : (
                            <Star className="w-9 h-9 fill-current" />
                          )}
                        </button>

                        {/* Level Crown / Reward Star Badge */}
                        {isCompleted && (
                          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#EA580C] border-2 border-white flex items-center justify-center text-xs shadow-md">
                            🤟
                          </div>
                        )}

                      </div>

                      {/* Node Title pill */}
                      <span className="mt-2 text-xs font-black text-[#292524] text-center max-w-[160px] truncate">
                        {node.title}
                      </span>

                    </div>
                  );
                })}

              </div>

            </div>
          );
        })}
      </div>

      {/* Pagination Footer between sections */}
      <div className="flex items-center justify-between pt-4 pb-12">
        <button
          disabled={activeSectionNumber <= 1}
          onClick={() => {
            soundService.playTap();
            setActiveSectionNumber(prev => Math.max(1, prev - 1));
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border-2 border-[#F1EAE2] font-black text-xs text-[#292524] hover:bg-[#FFF7ED] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs transition-all active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Seção Anterior</span>
        </button>

        <span className="text-xs font-bold text-[#78716C]">
          Unidades {(activeSectionNumber - 1) * 5 + 1} a {activeSectionNumber * 5}
        </span>

        <button
          disabled={activeSectionNumber >= 10}
          onClick={() => {
            soundService.playTap();
            setActiveSectionNumber(prev => Math.min(10, prev + 1));
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#FF6B00] text-white font-black text-xs hover:bg-[#EA580C] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md transition-all active:scale-95"
        >
          <span>Próxima Seção</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Interactive Node Start Modal Popover */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border-2 border-[#F1EAE2] border-b-8 border-[#FED7AA] p-6 max-w-sm w-full space-y-5 shadow-2xl animate-scale-in text-center relative">
            
            <button
              onClick={() => setSelectedNode(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#A8A29E] hover:text-[#292524] hover:bg-[#FFF7ED] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Mascot Icon & Title */}
            <div className="space-y-2 pt-2">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-[#FFEDD5] text-[#EA580C] flex items-center justify-center text-3xl shadow-inner border-2 border-[#FDBA74]">
                {selectedNode.node.type === 'story' ? '📖' : selectedNode.node.type === 'chest' ? '🎁' : selectedNode.node.type === 'trophy' ? '🏆' : '🤟'}
              </div>
              <h3 className="text-xl font-black text-[#292524]">{selectedNode.node.title}</h3>
              <p className="text-xs text-[#78716C] font-semibold">{selectedNode.node.description}</p>
              <div className="text-[11px] font-bold text-[#EA580C]">
                {selectedNode.node.exercises.length} Exercícios Práticos
              </div>
            </div>

            {/* Rewards info */}
            <div className="flex items-center justify-center gap-4 py-2 px-4 rounded-2xl bg-[#FFFDF9] border border-[#F1EAE2] text-xs font-black">
              <span className="text-[#EA580C] flex items-center gap-1">
                <Zap className="w-4 h-4 fill-current" />
                <span>+{selectedNode.node.xpReward} XP</span>
              </span>
              <span className="text-[#D97706] flex items-center gap-1">
                <span>💎</span>
                <span>+{selectedNode.node.gemsReward} Gemas</span>
              </span>
            </div>

            {/* Start Button */}
            <button
              onClick={() => {
                const nodeToStart = selectedNode.node;
                const unitToStart = selectedNode.unit;
                setSelectedNode(null);
                onStartNode(nodeToStart, unitToStart);
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#FF6B00] to-[#EA580C] hover:opacity-95 text-white font-black text-sm uppercase tracking-wider border-b-6 border-[#9A3412] cursor-pointer shadow-lg transition-all active:translate-y-1 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Começar no EasyLib</span>
            </button>

          </div>
        </div>
      )}

      {/* Guidebook Modal (5 Parameters & Cultural Notes) */}
      {guidebookUnit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border-2 border-[#F1EAE2] p-6 max-w-lg w-full space-y-5 shadow-2xl animate-scale-in max-h-[85vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-[#F1EAE2] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center text-2xl shadow-xs">
                  🤟
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#292524]">{guidebookUnit.title}</h3>
                  <p className="text-xs text-[#78716C] font-semibold">{guidebookUnit.description}</p>
                </div>
              </div>
              <button
                onClick={() => setGuidebookUnit(null)}
                className="p-1.5 rounded-full text-[#A8A29E] hover:text-[#292524] hover:bg-[#FFF7ED] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Signs with 5 Parameters Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#A8A29E] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#EA580C]" />
                <span>Sinais em Destaque & Parâmetros</span>
              </h4>

              <div className="space-y-2.5">
                {guidebookUnit.guidebook.signsOverview.map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#F1EAE2] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-[#C2410C]">{item.sign}</span>
                      <span className="text-xs text-[#78716C] font-bold bg-white px-2 py-0.5 rounded-md border border-[#F1EAE2]">{item.meaning}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      <div className="bg-white p-1.5 rounded-lg border border-[#F1EAE2]">
                        <span className="font-extrabold text-[#44403C]">CM: </span>
                        <span className="text-[#292524]">{item.cm}</span>
                      </div>
                      <div className="bg-white p-1.5 rounded-lg border border-[#F1EAE2]">
                        <span className="font-extrabold text-[#44403C]">PA: </span>
                        <span className="text-[#292524]">{item.pa}</span>
                      </div>
                      <div className="bg-white p-1.5 rounded-lg border border-[#F1EAE2]">
                        <span className="font-extrabold text-[#44403C]">Movimento: </span>
                        <span className="text-[#292524]">{item.mov}</span>
                      </div>
                      <div className="bg-white p-1.5 rounded-lg border border-[#F1EAE2]">
                        <span className="font-extrabold text-[#44403C]">NMF: </span>
                        <span className="text-[#292524]">{item.nmf}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grammar Rule */}
            <div className="space-y-2 p-4 rounded-2xl bg-amber-50 text-[#292524] border-2 border-amber-300">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                <span>{guidebookUnit.guidebook.grammarRule.title}</span>
              </h4>
              <p className="text-xs font-medium leading-relaxed">{guidebookUnit.guidebook.grammarRule.explanation}</p>
              <div className="mt-2 pt-2 border-t border-amber-200/60 text-xs">
                <div className="font-black text-amber-900">Exemplo Gloss: <span className="font-mono bg-white px-1.5 py-0.5 rounded">{guidebookUnit.guidebook.grammarRule.exampleGloss}</span></div>
                <div className="text-[#78716C] mt-0.5">Tradução: {guidebookUnit.guidebook.grammarRule.examplePortuguese}</div>
              </div>
            </div>

            {/* Cultural Tip */}
            <div className="p-3.5 rounded-2xl bg-orange-50 text-orange-950 border-2 border-orange-200 text-xs space-y-1">
              <div className="font-black uppercase tracking-wider text-orange-800 flex items-center gap-1.5">
                <span>🧡 Cultura Surda</span>
              </div>
              <p className="font-medium leading-relaxed">{guidebookUnit.guidebook.culturalTip}</p>
            </div>

            <button
              onClick={() => setGuidebookUnit(null)}
              className="w-full py-3 rounded-2xl bg-[#FF6B00] hover:bg-[#EA580C] text-white font-black text-xs uppercase tracking-wider border-b-4 border-[#9A3412] cursor-pointer shadow-md"
            >
              Entendido! Praticar Sinais
            </button>

          </div>
        </div>
      )}

    </div>
  );
};
