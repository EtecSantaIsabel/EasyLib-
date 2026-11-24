import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Star,
  Check,
  Lock,
  Gift,
  Trophy,
  Zap,
  Gem,
  Play,
  BookMarked,
  X,
  Info,
  ChevronLeft,
  ChevronRight,
  HeartHandshake
} from 'lucide-react';
import { Unit, PathNode, UserProfile } from '../types';
import {
  LIBRAS_SECTIONS_META,
  TRACK_STRUCTURE,
  getSectionByNumber,
  getTrackUnlockState
} from '../data/librasData';
import { findCatalogSign } from '../data/librasCatalog255';
import { SignSchematicVisualizer } from '../components/SignSchematicVisualizer';
import { LibiMascot } from '../components/LibiMascot';
import { soundService } from '../services/soundService';

interface LearnPathViewProps {
  userProfile: UserProfile;
  onStartNode: (node: PathNode, unit: Unit) => void;
}

export const LearnPathView = ({
  userProfile,
  onStartNode
}: LearnPathViewProps) => {
  const unlockState = useMemo(
    () => getTrackUnlockState(userProfile.completedNodeIds),
    [userProfile.completedNodeIds]
  );

  const [activeSectionNumber, setActiveSectionNumber] = useState<number>(
    unlockState.currentSectionNumber
  );
  const [activeStageNumber, setActiveStageNumber] = useState<number>(
    unlockState.currentStageNumber
  );
  const [selectedNode, setSelectedNode] = useState<{ node: PathNode; unit: Unit } | null>(null);
  const [guidebookUnit, setGuidebookUnit] = useState<Unit | null>(null);
  const sectionTabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!unlockState.isSectionUnlocked(activeSectionNumber)) {
      setActiveSectionNumber(unlockState.currentSectionNumber);
    }
  }, [activeSectionNumber, unlockState]);

  useEffect(() => {
    if (!unlockState.isStageUnlocked(activeSectionNumber, activeStageNumber)) {
      setActiveStageNumber(
        activeSectionNumber === unlockState.currentSectionNumber
          ? unlockState.currentStageNumber
          : 1
      );
    }
  }, [activeSectionNumber, activeStageNumber, unlockState]);

  const currentSection = useMemo(
    () => getSectionByNumber(activeSectionNumber),
    [activeSectionNumber]
  );
  const sectionUnits = currentSection.units;
  const activeUnit =
    sectionUnits.find((u) => u.unitNumber === activeStageNumber) || sectionUnits[0];

  const handleSelectSection = (sectionNumber: number) => {
    soundService.playTap();
    if (!unlockState.isSectionUnlocked(sectionNumber)) return;
    setActiveSectionNumber(sectionNumber);
    setActiveStageNumber(
      sectionNumber === unlockState.currentSectionNumber
        ? unlockState.currentStageNumber
        : 1
    );
  };

  const handleSelectStage = (stageNumber: number) => {
    soundService.playTap();
    if (!unlockState.isStageUnlocked(activeSectionNumber, stageNumber)) return;
    setActiveStageNumber(stageNumber);
  };

  const handleNodeClick = (node: PathNode, unit: Unit, isUnlocked: boolean) => {
    soundService.playTap();
    if (!isUnlocked) return;
    setSelectedNode({ node, unit });
  };

  const handleOpenGuidebook = (unit: Unit) => {
    soundService.playTap();
    setGuidebookUnit(unit);
  };

  const scrollSectionStrip = (direction: 'left' | 'right') => {
    if (!sectionTabsRef.current) return;
    soundService.playTap();
    sectionTabsRef.current.scrollBy({
      left: direction === 'left' ? -220 : 220,
      behavior: 'smooth'
    });
  };

  const getOffsetClass = (index: number) => {
    const offsets = [
      'translate-x-0',
      'translate-x-4 sm:translate-x-8',
      'translate-x-7 sm:translate-x-12',
      'translate-x-4 sm:translate-x-8',
      'translate-x-0',
      '-translate-x-4 sm:-translate-x-8',
      '-translate-x-7 sm:-translate-x-12',
      '-translate-x-4 sm:-translate-x-8'
    ];
    return offsets[index % offsets.length];
  };

  const renderNodeTypeIcon = (node: PathNode) => {
    switch (node.type) {
      case 'story':
        return <BookMarked className="w-7 h-7" />;
      case 'chest':
        return <Gift className="w-7 h-7" />;
      case 'trophy':
        return <Trophy className="w-7 h-7" />;
      default:
        return <Star className="w-8 h-8 fill-current" />;
    }
  };

  return (
    <div className="max-w-xl mx-auto px-2 sm:px-4 space-y-5 select-none">
      {/* 1. Top Bar: 10 Sections Scrollable with Strict Sequential Unlocking */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            type="button"
            onClick={() => scrollSectionStrip('left')}
            aria-label="Rolar seções para a esquerda"
            className="p-1.5 rounded-xl bg-white border border-[#E8E2D9] text-[#57534E] hover:text-[#1C1917] hover:bg-[#F3F0EA] cursor-pointer shrink-0 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={sectionTabsRef}
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0 py-0.5"
          >
            {LIBRAS_SECTIONS_META.map((sec) => {
              const isSelected = activeSectionNumber === sec.sectionNumber;
              const isUnlocked = unlockState.isSectionUnlocked(sec.sectionNumber);
              const isDone = unlockState.isSectionCompleted(sec.sectionNumber);

              return (
                <button
                  key={sec.sectionNumber}
                  type="button"
                  disabled={!isUnlocked}
                  onClick={() => handleSelectSection(sec.sectionNumber)}
                  className={`
                    inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors whitespace-nowrap
                    ${isSelected
                      ? 'bg-[#0D9488] text-white border-b-2 border-[#0F766E] cursor-pointer'
                      : isUnlocked
                      ? 'bg-[#F3F0EA] text-[#1C1917] hover:bg-[#E8E2D9] cursor-pointer'
                      : 'bg-[#F3F0EA]/60 text-[#78716C] cursor-not-allowed opacity-70'}
                  `}
                >
                  {!isUnlocked ? (
                    <Lock className="w-3 h-3 shrink-0" />
                  ) : isDone ? (
                    <Check className="w-3 h-3 shrink-0" />
                  ) : null}
                  <span>Seção {sec.sectionNumber}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => scrollSectionStrip('right')}
            aria-label="Rolar seções para a direita"
            className="p-1.5 rounded-xl bg-white border border-[#E8E2D9] text-[#57534E] hover:text-[#1C1917] hover:bg-[#F3F0EA] cursor-pointer shrink-0 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Section Heading */}
        <div className="px-1 min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E] block truncate tabular-nums">
            Seção {currentSection.sectionNumber} de {TRACK_STRUCTURE.sections} · {currentSection.title}
          </span>
          <p className="text-xs text-[#57534E] font-medium line-clamp-1 mt-0.5">
            {currentSection.description}
          </p>
        </div>
      </div>

      {/* 2. 20 Etapas Grid Selector inside Active Section */}
      <div className="bg-white rounded-2xl border border-[#E8E2D9] p-3.5 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#57534E]">
          <span>Etapas da Seção {activeSectionNumber}</span>
          <span className="tabular-nums">
            Etapa {activeStageNumber} de {TRACK_STRUCTURE.stagesPerSection}
          </span>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 tabular-nums">
          {sectionUnits.map((u) => {
            const stageNum = u.unitNumber;
            const isUnlocked = unlockState.isStageUnlocked(activeSectionNumber, stageNum);
            const isCompleted = unlockState.isStageCompleted(activeSectionNumber, stageNum);
            const isSelected = activeStageNumber === stageNum;

            return (
              <button
                key={u.id}
                type="button"
                disabled={!isUnlocked}
                onClick={() => handleSelectStage(stageNum)}
                title={`Etapa ${stageNum}`}
                className={`
                  h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors
                  ${isSelected
                    ? 'bg-[#EA580C] text-white border-b-2 border-[#9A3412] cursor-pointer'
                    : isCompleted
                    ? 'bg-[#F0FDFA] text-[#0F766E] border border-[#99F6E4] hover:bg-[#CCFBF1] cursor-pointer'
                    : isUnlocked
                    ? 'bg-[#FAF9F6] text-[#1C1917] border border-[#E8E2D9] hover:bg-[#F3F0EA] cursor-pointer'
                    : 'bg-[#F3F0EA]/70 text-[#78716C] cursor-not-allowed opacity-70'}
                `}
              >
                {!isUnlocked ? (
                  <Lock className="w-3 h-3" />
                ) : isCompleted && !isSelected ? (
                  <Check className="w-3.5 h-3.5 stroke-[2.8]" />
                ) : (
                  <span>{stageNum}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Active Etapa Banner + 12 Sequential Activities */}
      {activeUnit && (
        <section className="space-y-5">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#EA580C] text-white border-b-4 border-[#9A3412] flex items-center justify-between gap-4 min-w-0">
            <div className="space-y-0.5 min-w-0 flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FFEDD5] block tabular-nums">
                Seção {activeSectionNumber} · Etapa {activeUnit.unitNumber} · {TRACK_STRUCTURE.activitiesPerStage} atividades
              </span>
              <h2 className="font-display text-lg sm:text-xl font-bold leading-snug truncate">
                {activeUnit.title}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => handleOpenGuidebook(activeUnit)}
              className="tactile-btn px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer shrink-0 bg-[#C2410C] hover:bg-[#9A3412] text-white border border-white/25 border-b-[3px] border-b-[#7C2D12]"
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">Guia de sinais</span>
            </button>
          </div>

          {/* 12 Path Nodes */}
          <div className="py-3 flex flex-col items-center gap-6">
            {activeUnit.nodes.map((node, nIdx) => {
              const activityNumber = nIdx + 1;
              const isCompleted = unlockState.isActivityCompleted(
                activeSectionNumber,
                activeUnit.unitNumber,
                activityNumber
              );
              const isUnlocked = unlockState.isActivityUnlocked(
                activeSectionNumber,
                activeUnit.unitNumber,
                activityNumber
              );
              const isActive = isUnlocked && !isCompleted;
              const offsetClass = isActive ? 'translate-x-0' : getOffsetClass(nIdx);

              return (
                <div
                  key={node.id}
                  className={`w-full flex items-center justify-center gap-4 ${offsetClass}`}
                >
                  {isActive && (
                    <div className="hidden sm:flex shrink-0">
                      <LibiMascot
                        mood="ensinando"
                        size="sm"
                        showSpeechBubble={true}
                        speechText="Começar"
                      />
                    </div>
                  )}

                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => handleNodeClick(node, activeUnit, isUnlocked)}
                      disabled={!isUnlocked}
                      aria-label={`${node.title}${isCompleted ? ' (concluída)' : !isUnlocked ? ' (bloqueada)' : ''}`}
                      className={`
                        w-[72px] h-[72px] sm:w-[76px] sm:h-[76px] rounded-full flex items-center justify-center transition-all duration-150 select-none
                        ${isCompleted
                          ? 'bg-[#0D9488] hover:bg-[#0F766E] border-b-[6px] border-[#0F766E] text-white cursor-pointer active:translate-y-[4px] active:border-b-2'
                          : isActive
                          ? 'bg-[#EA580C] hover:bg-[#DC4F06] border-b-[6px] border-[#9A3412] text-white cursor-pointer active:translate-y-[4px] active:border-b-2 ring-4 ring-[#EA580C]/20'
                          : 'bg-[#E8E2D9] border-b-[6px] border-[#C7BFB3] text-[#78716C] cursor-not-allowed'}
                      `}
                    >
                      {isCompleted ? (
                        <Check className="w-8 h-8 stroke-[3.2]" />
                      ) : !isUnlocked ? (
                        <Lock className="w-6 h-6" />
                      ) : (
                        renderNodeTypeIcon(node)
                      )}
                    </button>

                    <span
                      className={`mt-2 text-xs font-bold text-center max-w-[200px] leading-snug ${
                        isUnlocked ? 'text-[#1C1917]' : 'text-[#78716C]'
                      }`}
                    >
                      {node.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Footer Navigation between Unlocked Sections */}
      <div className="flex items-center justify-between pt-3 pb-10 border-t border-[#E8E2D9]">
        <button
          type="button"
          disabled={activeSectionNumber <= 1}
          onClick={() => handleSelectSection(Math.max(1, activeSectionNumber - 1))}
          className="tactile-btn flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-[#E8E2D9] border-b-[3px] border-b-[#D6CFC5] font-bold text-xs text-[#1C1917] hover:bg-[#F3F0EA] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Seção anterior</span>
        </button>

        <span className="text-xs font-semibold text-[#57534E] tabular-nums">
          Seção {activeSectionNumber} de {TRACK_STRUCTURE.sections}
        </span>

        <button
          type="button"
          disabled={
            activeSectionNumber >= TRACK_STRUCTURE.sections ||
            !unlockState.isSectionUnlocked(activeSectionNumber + 1)
          }
          onClick={() =>
            handleSelectSection(Math.min(TRACK_STRUCTURE.sections, activeSectionNumber + 1))
          }
          className="tactile-btn flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs border-b-[3px] border-[#115E59] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <span>Próxima seção</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Interactive Node Start Modal */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FAF9F6] rounded-3xl border border-[#E8E2D9] p-6 max-w-sm w-full space-y-5 shadow-xl animate-scale-in text-center relative">
            <button
              type="button"
              onClick={() => setSelectedNode(null)}
              aria-label="Fechar"
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#78716C] hover:text-[#1C1917] hover:bg-[#E8E2D9]/60 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center space-y-2 pt-1">
              <LibiMascot mood="ensinando" size="md" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E]">
                {selectedNode.unit.title}
              </span>
              <h3 className="font-display text-xl font-bold text-[#1C1917]">
                {selectedNode.node.title}
              </h3>
              <p className="text-xs text-[#57534E] font-medium leading-relaxed">
                {selectedNode.node.description}
              </p>
            </div>

            <div className="flex items-center justify-center gap-5 py-2.5 px-4 rounded-2xl bg-white border border-[#E8E2D9] text-xs font-bold tabular-nums">
              <span className="text-[#EA580C] flex items-center gap-1">
                <Zap className="w-4 h-4 fill-current" />
                <span>+{selectedNode.node.xpReward} XP</span>
              </span>
              <span className="text-[#B45309] flex items-center gap-1">
                <Gem className="w-4 h-4 fill-[#F59E0B] text-[#B45309]" />
                <span>+{selectedNode.node.gemsReward} gemas</span>
              </span>
              <span className="text-[#57534E]">
                {selectedNode.node.exercises.length} exercícios
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                const nodeToStart = selectedNode.node;
                const unitToStart = selectedNode.unit;
                setSelectedNode(null);
                onStartNode(nodeToStart, unitToStart);
              }}
              className="tactile-btn w-full py-3.5 px-6 rounded-2xl bg-[#EA580C] hover:bg-[#DC4F06] text-white font-bold text-sm uppercase tracking-wider border-b-4 border-[#9A3412] cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Iniciar atividade</span>
            </button>
          </div>
        </div>
      )}

      {/* Clean Guidebook Modal (Signs + Meanings only) */}
      {guidebookUnit && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FAF9F6] rounded-3xl border border-[#E8E2D9] p-6 max-w-lg w-full space-y-5 shadow-xl animate-scale-in max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-4 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <LibiMascot mood="ensinando" size="xs" />
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E]">
                    Guia de sinais · Etapa {guidebookUnit.unitNumber}
                  </span>
                  <h3 className="font-display text-lg font-bold text-[#1C1917] truncate">
                    {guidebookUnit.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGuidebookUnit(null)}
                aria-label="Fechar guia"
                className="p-1.5 rounded-full text-[#78716C] hover:text-[#1C1917] hover:bg-[#E8E2D9]/60 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#57534E]">
                Sinais desta etapa
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {guidebookUnit.guidebook.signsOverview.map((item, idx) => {
                  const signObj = findCatalogSign(item.slug || item.sign);
                  return (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-2xl border border-[#E8E2D9] space-y-2"
                    >
                      <SignSchematicVisualizer
                        sign={signObj}
                        compact={true}
                        hideControls={true}
                      />
                      <div>
                        <div className="font-display font-bold text-base text-[#1C1917]">
                          {item.sign}
                        </div>
                        <div className="text-xs text-[#57534E] font-medium">
                          {item.meaning}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5 p-4 rounded-2xl bg-[#F0FDFA] text-[#1C1917] border border-[#99F6E4]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F766E] flex items-center gap-1.5">
                <Info className="w-4 h-4 shrink-0" />
                <span>{guidebookUnit.guidebook.grammarRule.title}</span>
              </h4>
              <p className="text-xs text-[#115E59] leading-relaxed">
                {guidebookUnit.guidebook.grammarRule.explanation}
              </p>
              <div className="pt-2 border-t border-[#99F6E4]/60 text-xs space-y-0.5">
                <div className="font-bold text-[#0F766E]">
                  {guidebookUnit.guidebook.grammarRule.exampleGloss}
                </div>
                <div className="text-[#115E59]">
                  {guidebookUnit.guidebook.grammarRule.examplePortuguese}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFF1E6] text-[#1C1917] border border-[#FED7AA] text-xs space-y-1">
              <div className="font-bold uppercase tracking-wider text-[#9A3412] flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 shrink-0" />
                <span>Cultura surda</span>
              </div>
              <p className="text-[#431407] leading-relaxed">{guidebookUnit.guidebook.culturalTip}</p>
            </div>

            <button
              type="button"
              onClick={() => setGuidebookUnit(null)}
              className="tactile-btn w-full py-3 rounded-2xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs uppercase tracking-wider border-b-4 border-[#115E59] cursor-pointer"
            >
              Voltar à trilha
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
