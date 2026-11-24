import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Heart,
  ArrowRight,
  Infinity as InfinityIcon,
  Check,
  Flame,
  Camera
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MatchPair, PathNode, Unit, UserProfile } from '../types';
import { LibiMascot } from '../components/LibiMascot';
import { SignDemonstrationVisual } from '../components/SignDemonstrationVisual';
import {
  SignMediaPlayer,
  SignSchematicVisualizer
} from '../components/SignSchematicVisualizer';
import { DactylologyPlayer } from '../components/DactylologyPlayer';
import { SingleTargetCameraExercise } from '../components/SingleTargetCameraExercise';
import { findCatalogSign } from '../data/librasCatalog255';
import { soundService } from '../services/soundService';

interface LessonPlayerModalProps {
  node: PathNode;
  unit: Unit;
  userProfile: UserProfile;
  onClose: () => void;
  onLessonCompleted: (xp: number, gems: number) => void;
  onLoseHeart: () => void;
}

function shuffleDeterministicNotIdentical(pairs: MatchPair[]): MatchPair[] {
  if (pairs.length <= 1) return pairs;
  const copy = [...pairs];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  const allSameOrder = copy.every((item, idx) => item.id === pairs[idx].id);
  if (allSameOrder) {
    const first = copy.shift()!;
    copy.push(first);
  }
  return copy;
}

export const LessonPlayerModal = ({
  node,
  userProfile,
  onClose,
  onLessonCompleted,
  onLoseHeart
}: LessonPlayerModalProps) => {
  const exercises = node.exercises;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  // Match pairs state
  const [shuffledRightPairs, setShuffledRightPairs] = useState<MatchPair[]>([]);
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);
  const [selectedSignItem, setSelectedSignItem] = useState<{ id: string; name: string } | null>(null);
  const [selectedWordItem, setSelectedWordItem] = useState<{ id: string; text: string } | null>(null);
  const [mismatchPair, setMismatchPair] = useState<{ wordId?: string; signId?: string } | null>(null);

  // Story dialogue state
  const [storyLineIndex, setStoryLineIndex] = useState(0);

  // Camera quality tracking
  const [cameraScores, setCameraScores] = useState<number[]>([]);

  // Status & score state
  const [status, setStatus] = useState<
    'idle' | 'correct' | 'incorrect' | 'completed' | 'out_of_hearts'
  >('idle');
  const [comboCount, setComboCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const currentExercise = exercises[currentIndex];
  const progressPercent =
    status === 'completed'
      ? 100
      : Math.round(
          ((currentIndex + (status === 'correct' ? 1 : 0)) / Math.max(1, exercises.length)) * 100
        );

  useEffect(() => {
    if (!currentExercise) return;
    setStatus('idle');
    setSelectedOptionId(null);
    setSelectedWords([]);
    setMismatchPair(null);

    if (currentExercise.wordBank) {
      setAvailableWords([...currentExercise.wordBank].sort(() => Math.random() - 0.5));
    } else {
      setAvailableWords([]);
    }

    if (currentExercise.type === 'match_sign_pairs' && currentExercise.matchPairs) {
      setMatchedPairIds([]);
      setSelectedSignItem(null);
      setSelectedWordItem(null);
      setShuffledRightPairs(shuffleDeterministicNotIdentical(currentExercise.matchPairs));
    } else {
      setShuffledRightPairs([]);
    }

    if (currentExercise.type === 'story_dialogue') {
      setStoryLineIndex(0);
    }
  }, [currentIndex, currentExercise]);

  const slowReadingSign = useMemo(() => {
    if (!currentExercise) return null;
    if (currentExercise.type !== 'slow_reading' && currentExercise.type !== 'identify_sign') {
      return null;
    }
    return findCatalogSign(
      currentExercise.targetSignId ||
        currentExercise.sign?.id ||
        currentExercise.correctAnswers[0] ||
        'oi'
    );
  }, [currentExercise]);

  const handleWordClick = (word: string, index: number) => {
    if (status !== 'idle') return;
    soundService.playTap();
    setSelectedWords((prev) => [...prev, word]);
    setAvailableWords((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleRemoveWord = (word: string, index: number) => {
    if (status !== 'idle') return;
    soundService.playPop();
    setSelectedWords((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
    setAvailableWords((prev) => [...prev, word]);
  };

  const completeMatchExerciseIfDone = (nextMatched: string[]) => {
    const total = currentExercise?.matchPairs?.length || 0;
    if (total > 0 && nextMatched.length === total && status === 'idle') {
      soundService.playCorrect();
      setStatus('correct');
      setComboCount((prev) => prev + 1);
      setCorrectCount((prev) => prev + 1);
    }
  };

  const handleSelectWordItem = (id: string, text: string) => {
    if (status !== 'idle' || matchedPairIds.includes(id)) return;
    soundService.playTap();

    if (selectedSignItem) {
      if (selectedSignItem.id === id) {
        soundService.playMatchPair();
        const nextMatched = [...matchedPairIds, id];
        setMatchedPairIds(nextMatched);
        setSelectedSignItem(null);
        setSelectedWordItem(null);
        completeMatchExerciseIfDone(nextMatched);
      } else {
        soundService.playIncorrect();
        setMismatchPair({ wordId: id, signId: selectedSignItem.id });
        setSelectedSignItem(null);
        setSelectedWordItem(null);
        window.setTimeout(() => setMismatchPair(null), 450);
      }
    } else {
      setSelectedWordItem({ id, text });
    }
  };

  const handleSelectSignItem = (id: string, name: string) => {
    if (status !== 'idle' || matchedPairIds.includes(id)) return;
    soundService.playTap();

    if (selectedWordItem) {
      if (selectedWordItem.id === id) {
        soundService.playMatchPair();
        const nextMatched = [...matchedPairIds, id];
        setMatchedPairIds(nextMatched);
        setSelectedSignItem(null);
        setSelectedWordItem(null);
        completeMatchExerciseIfDone(nextMatched);
      } else {
        soundService.playIncorrect();
        setMismatchPair({ wordId: selectedWordItem.id, signId: id });
        setSelectedSignItem(null);
        setSelectedWordItem(null);
        window.setTimeout(() => setMismatchPair(null), 450);
      }
    } else {
      setSelectedSignItem({ id, name });
    }
  };

  const canCheckCurrent = (() => {
    if (!currentExercise || status !== 'idle') return false;
    switch (currentExercise.type) {
      case 'new_sign_cards':
      case 'slow_reading':
      case 'dialogue_completion':
      case 'identify_sign':
      case 'parameter_quiz':
      case 'nmf_facial_quiz':
        return selectedOptionId !== null;
      case 'dactylology_spelling':
      case 'translate_to_libras':
      case 'fill_in_blank_sign':
        return selectedWords.length > 0;
      case 'match_sign_pairs':
        return matchedPairIds.length === (currentExercise.matchPairs?.length || 0);
      case 'story_dialogue':
        return true;
      case 'camera_practice':
        return false;
      default:
        return false;
    }
  })();

  const handleCheckAnswer = () => {
    if (status !== 'idle' || !currentExercise || !canCheckCurrent) return;

    let isCorrect = false;
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .replace(/[.,!?;:¡¿\s-]+/g, '')
        .trim();

    if (
      currentExercise.type === 'new_sign_cards' ||
      currentExercise.type === 'slow_reading' ||
      currentExercise.type === 'dialogue_completion' ||
      currentExercise.type === 'identify_sign' ||
      currentExercise.type === 'parameter_quiz' ||
      currentExercise.type === 'nmf_facial_quiz'
    ) {
      const chosenOpt = currentExercise.options?.find((o) => o.id === selectedOptionId);
      if (chosenOpt) {
        isCorrect = currentExercise.correctAnswers.some(
          (ans) => normalize(ans) === normalize(chosenOpt.text)
        );
      }
    } else if (currentExercise.type === 'dactylology_spelling') {
      const builtWord = selectedWords.join('').trim();
      isCorrect = currentExercise.correctAnswers.some(
        (ans) => normalize(ans) === normalize(builtWord)
      );
    } else if (
      currentExercise.type === 'translate_to_libras' ||
      currentExercise.type === 'fill_in_blank_sign'
    ) {
      const builtSentence = selectedWords.join(' ').trim();
      isCorrect = currentExercise.correctAnswers.some(
        (ans) => normalize(ans) === normalize(builtSentence)
      );
    } else if (currentExercise.type === 'match_sign_pairs') {
      isCorrect = matchedPairIds.length === (currentExercise.matchPairs?.length || 0);
    } else if (currentExercise.type === 'story_dialogue') {
      isCorrect = true;
    }

    if (isCorrect) {
      soundService.playCorrect();
      setStatus('correct');
      setComboCount((prev) => prev + 1);
      setCorrectCount((prev) => prev + 1);
    } else {
      soundService.playIncorrect();
      setStatus('incorrect');
      setComboCount(0);
      onLoseHeart();

      if (!userProfile.isSuperDuolingo && userProfile.hearts <= 1) {
        setStatus('out_of_hearts');
      }
    }
  };

  const handleSkipCamera = () => {
    if (status !== 'idle') return;
    soundService.playTap();
    setStatus('correct');
    setCorrectCount((prev) => prev + 1);
  };

  const handleContinue = () => {
    soundService.playTap();
    if (currentIndex + 1 < exercises.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      soundService.playLessonComplete();
      try {
        confetti({
          particleCount: 120,
          spread: 85,
          origin: { y: 0.6 }
        });
      } catch {
        // Safe visual-only fallback
      }
      setStatus('completed');
      onLessonCompleted(node.xpReward + comboCount * 2, node.gemsReward);
    }
  };

  const earnedXp = node.xpReward + comboCount * 2;
  const overallAccuracy = Math.round((correctCount / Math.max(1, exercises.length)) * 100);
  const avgCameraAccuracy =
    cameraScores.length > 0
      ? Math.round(cameraScores.reduce((sum, score) => sum + score, 0) / cameraScores.length)
      : null;

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col justify-between select-none animate-fade-in">
      {/* 1. Top Bar: Close, Progress Bar & Hearts */}
      <header className="max-w-3xl w-full mx-auto px-4 py-4 sm:py-5 flex items-center justify-between gap-4 shrink-0">
        <button
          type="button"
          onClick={onClose}
          aria-label="Sair da atividade"
          className="p-2 rounded-xl hover:bg-[#F3F0EA] text-[#78716C] hover:text-[#1C1917] cursor-pointer transition-colors"
        >
          <X className="w-6 h-6 stroke-[2.5]" />
        </button>

        <div className="flex-1 flex items-center gap-3 min-w-0">
          <div className="flex-1 h-3.5 bg-[#E8E2D9] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#EA580C] rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-bold text-[#78716C] tabular-nums shrink-0">
            {Math.min(currentIndex + 1, exercises.length)}/{exercises.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[#E11D48] font-bold text-sm tabular-nums shrink-0">
          {userProfile.isSuperDuolingo ? (
            <div className="flex items-center gap-1 text-[#0F766E]">
              <InfinityIcon className="w-5 h-5 stroke-[2.5]" />
              <span className="text-xs uppercase font-bold">Plus</span>
            </div>
          ) : (
            <>
              <Heart className="w-5 h-5 fill-[#E11D48] text-[#E11D48]" />
              <span>{userProfile.hearts}</span>
            </>
          )}
        </div>
      </header>

      {/* 2. Main Exercise Viewport */}
      <main
        className={`w-full mx-auto px-4 py-2 flex-1 flex flex-col justify-start sm:justify-center overflow-y-auto ${
          currentExercise?.type === 'camera_practice' ? 'max-w-4xl' : 'max-w-2xl'
        }`}
      >
        {/* Completion Screen */}
        {status === 'completed' && (
          <div className="text-center space-y-6 animate-scale-in py-6 my-auto">
            <div className="flex flex-col items-center justify-center">
              <LibiMascot
                mood="comemorando"
                size="lg"
                showSpeechBubble={true}
                speechText="Mandou bem!"
              />
            </div>

            <div className="space-y-1.5">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#1C1917]">
                Atividade concluída
              </h2>
              <p className="text-sm font-medium text-[#57534E]">
                Você completou todos os exercícios desta atividade.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto tabular-nums">
              <div className="p-4 rounded-2xl bg-[#EA580C] text-white space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#FFEDD5] block">
                  XP ganho
                </span>
                <div className="font-display text-2xl font-bold">+{earnedXp}</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0D9488] text-white space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#CCFBF1] flex items-center justify-center gap-1">
                  <Camera className="w-3.5 h-3.5" />
                  <span>{avgCameraAccuracy !== null ? 'Câmera' : 'Precisão'}</span>
                </span>
                <div className="font-display text-2xl font-bold">
                  {avgCameraAccuracy !== null ? `${avgCameraAccuracy}%` : `${overallAccuracy}%`}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FFF1E6] border border-[#FED7AA] text-[#9A3412] space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#C2410C] flex items-center justify-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-[#EA580C] text-[#EA580C]" />
                  <span>Ofensiva</span>
                </span>
                <div className="font-display text-2xl font-bold">
                  {userProfile.streakDays}d
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#D97706] text-white space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#FEF3C7] block">
                  Gemas
                </span>
                <div className="font-display text-2xl font-bold">+{node.gemsReward}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="tactile-btn py-3.5 px-10 rounded-2xl bg-[#EA580C] hover:bg-[#DC4F06] text-white font-bold text-sm uppercase tracking-wider border-b-4 border-[#9A3412] cursor-pointer"
            >
              Continuar na trilha
            </button>
          </div>
        )}

        {/* Out of Hearts Screen */}
        {status === 'out_of_hearts' && (
          <div className="text-center space-y-6 animate-scale-in py-6 my-auto">
            <div className="flex justify-center">
              <LibiMascot
                mood="incentivando"
                size="lg"
                showSpeechBubble={true}
                speechText="Sem problemas, tente de novo!"
              />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h2 className="font-display text-3xl font-bold text-[#1C1917]">
                Suas vidas acabaram
              </h2>
              <p className="text-sm font-medium text-[#57534E]">
                Recarregue suas vidas no topo da tela para continuar.
              </p>
            </div>

            <div className="max-w-xs mx-auto">
              <button
                type="button"
                onClick={onClose}
                className="tactile-btn w-full py-3.5 rounded-2xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs uppercase tracking-wider border-b-4 border-[#115E59] cursor-pointer"
              >
                Voltar à trilha
              </button>
            </div>
          </div>
        )}

        {/* Active Exercise */}
        {status !== 'completed' && status !== 'out_of_hearts' && currentExercise && (
          <div className="space-y-4 py-2">
            {/* Prompt Header */}
            {currentExercise.type === 'new_sign_cards' ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
                  <span className="px-2 py-0.5 rounded-md bg-[#FFF1E6] text-[#EA580C] border border-[#FED7AA]">
                    Sinal Novo
                  </span>
                  <span className="text-[#0F766E] tabular-nums">
                    Exercício {currentIndex + 1} de {exercises.length}
                  </span>
                </div>

                {/* Highlighted New Sign Name + Meaning Only */}
                <div className="p-4 rounded-2xl bg-white border border-[#E8E2D9] space-y-0.5">
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1C1917]">
                    {currentExercise.prompt}
                  </h2>
                  {currentExercise.signMeaning && (
                    <p className="text-sm font-medium text-[#57534E]">
                      {currentExercise.signMeaning}
                    </p>
                  )}
                </div>

                <p className="text-sm font-bold text-[#1C1917]">
                  Qual destes é o sinal correspondente?
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
                  <span className="text-[#0F766E] tabular-nums">
                    Exercício {currentIndex + 1} de {exercises.length}
                  </span>
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#1C1917] leading-snug">
                  {currentExercise.prompt}
                </h2>
              </div>
            )}

            {/* FORMAT 1: Sinal Novo (4 Cartões Visuais Limpos) */}
            {currentExercise.type === 'new_sign_cards' && currentExercise.options && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {currentExercise.options.map((opt, idx) => {
                  const isSelected = selectedOptionId === opt.id;
                  const cardSign = findCatalogSign(opt.catalogSignId || opt.text);
                  const letterCode = ['A', 'B', 'C', 'D'][idx] || `${idx + 1}`;
                  const showWord = status !== 'idle';

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={status !== 'idle'}
                      onClick={() => {
                        soundService.playTap();
                        setSelectedOptionId(opt.id);
                      }}
                      className={`tactile-btn p-3 rounded-2xl border border-b-4 text-left flex flex-col gap-2.5 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#FFF1E6] border-[#EA580C] border-b-[#9A3412]'
                          : 'bg-white border-[#E8E2D9] border-b-[#D6CFC5] hover:bg-[#FAF9F6]'
                      }`}
                    >
                      <SignSchematicVisualizer
                        sign={cardSign}
                        compact={true}
                        hideControls={true}
                        className="w-full pointer-events-none"
                      />

                      <div className="flex items-center justify-between gap-2 px-1">
                        <div className="text-sm font-bold text-[#1C1917] truncate">
                          {showWord ? opt.text : `Opção ${letterCode}`}
                        </div>
                        <span
                          className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-[#EA580C] text-white'
                              : 'bg-[#F3F0EA] text-[#57534E]'
                          }`}
                        >
                          {letterCode}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* FORMAT 2: Leitura de Sinal com Câmera Lenta (0.5x) */}
            {currentExercise.type === 'slow_reading' && slowReadingSign && (
              <div className="space-y-4">
                <SignMediaPlayer
                  sign={slowReadingSign}
                  compact={false}
                  turtleLabel={true}
                  className="max-w-md mx-auto"
                />

                {currentExercise.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {currentExercise.options.map((opt) => {
                      const isSelected = selectedOptionId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={status !== 'idle'}
                          onClick={() => {
                            soundService.playTap();
                            setSelectedOptionId(opt.id);
                          }}
                          className={`tactile-btn p-4 rounded-2xl border border-b-4 cursor-pointer flex items-center justify-between text-left ${
                            isSelected
                              ? 'bg-[#FFF1E6] border-[#EA580C] border-b-[#9A3412] text-[#9A3412]'
                              : 'bg-white border-[#E8E2D9] border-b-[#D6CFC5] hover:bg-[#FAF9F6] text-[#1C1917]'
                          }`}
                        >
                          <div className="font-bold text-base">{opt.text}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Legacy Identify Sign */}
            {currentExercise.type === 'identify_sign' && (
              <div className="space-y-4">
                {currentExercise.sign ? (
                  <SignDemonstrationVisual
                    sign={currentExercise.sign}
                    className="max-w-md mx-auto"
                  />
                ) : (
                  slowReadingSign && (
                    <SignMediaPlayer sign={slowReadingSign} className="max-w-md mx-auto" />
                  )
                )}

                {currentExercise.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {currentExercise.options.map((opt) => {
                      const isSelected = selectedOptionId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={status !== 'idle'}
                          onClick={() => {
                            soundService.playTap();
                            setSelectedOptionId(opt.id);
                          }}
                          className={`tactile-btn p-4 rounded-2xl border border-b-4 cursor-pointer flex items-center gap-3 text-left ${
                            isSelected
                              ? 'bg-[#FFF1E6] border-[#EA580C] border-b-[#9A3412] text-[#9A3412]'
                              : 'bg-white border-[#E8E2D9] border-b-[#D6CFC5] hover:bg-[#FAF9F6] text-[#1C1917]'
                          }`}
                        >
                          <div className="font-bold text-base">{opt.text}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* FORMAT 3: Leitura de Datilologia (Alfabeto Manual) */}
            {currentExercise.type === 'dactylology_spelling' && (
              <div className="space-y-4">
                <DactylologyPlayer
                  word={
                    currentExercise.dactylologyWord ||
                    currentExercise.correctAnswers[0] ||
                    'LIBRAS'
                  }
                />

                <div className="min-h-[64px] p-3 rounded-2xl border-b-2 border-dashed border-[#D6CFC5] bg-white flex flex-wrap items-center justify-center gap-2">
                  {selectedWords.length === 0 ? (
                    <span className="text-xs font-semibold text-[#78716C]">
                      Toque nas letras abaixo na ordem da soletração
                    </span>
                  ) : (
                    selectedWords.map((word, idx) => (
                      <button
                        key={`${word}-${idx}`}
                        type="button"
                        disabled={status !== 'idle'}
                        onClick={() => handleRemoveWord(word, idx)}
                        className="tactile-btn w-11 h-12 sm:w-12 sm:h-12 rounded-xl bg-[#FFF1E6] border border-[#FED7AA] border-b-4 border-b-[#EA580C] text-[#9A3412] font-bold text-lg hover:bg-rose-50 cursor-pointer animate-scale-in"
                      >
                        {word}
                      </button>
                    ))
                  )}
                </div>

                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  {availableWords.map((word, idx) => (
                    <button
                      key={`${word}-avail-${idx}`}
                      type="button"
                      disabled={status !== 'idle'}
                      onClick={() => handleWordClick(word, idx)}
                      className="tactile-btn w-11 h-12 sm:w-12 sm:h-12 rounded-xl bg-white border border-[#E8E2D9] border-b-4 border-b-[#D6CFC5] text-[#1C1917] font-bold text-lg hover:bg-[#FFF1E6] cursor-pointer flex items-center justify-center"
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* FORMAT 4: Combine os Pares */}
            {currentExercise.type === 'match_sign_pairs' && currentExercise.matchPairs && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold uppercase text-[#78716C] tracking-wider block">
                    Português
                  </span>
                  {currentExercise.matchPairs.map((p) => {
                    const isMatched = matchedPairIds.includes(p.id);
                    const isSelected = selectedWordItem?.id === p.id;
                    const isMismatch = mismatchPair?.wordId === p.id;

                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={isMatched || status !== 'idle'}
                        onClick={() => handleSelectWordItem(p.id, p.portugueseText)}
                        className={`tactile-btn w-full h-[108px] px-4 rounded-2xl border border-b-4 font-bold text-sm sm:text-base text-left cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                          isMatched
                            ? 'bg-[#F0FDFA] text-[#0F766E] border-[#99F6E4] border-b-[#5EEAD4] opacity-55 cursor-not-allowed'
                            : isMismatch
                            ? 'bg-[#FFF1F2] text-[#BE123C] border-[#FDA4AF] border-b-[#E11D48]'
                            : isSelected
                            ? 'bg-[#FFF1E6] text-[#9A3412] border-[#EA580C] border-b-[#9A3412]'
                            : 'bg-white text-[#1C1917] border-[#E8E2D9] border-b-[#D6CFC5] hover:bg-[#FAF9F6]'
                        }`}
                      >
                        <span className="truncate">{p.portugueseText}</span>
                        {isMatched && <Check className="w-4 h-4 text-[#0D9488] shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold uppercase text-[#78716C] tracking-wider block">
                    Sinal em Libras
                  </span>
                  {shuffledRightPairs.map((p) => {
                    const isMatched = matchedPairIds.includes(p.id);
                    const isSelected = selectedSignItem?.id === p.id;
                    const isMismatch = mismatchPair?.signId === p.id;
                    const pairSign = findCatalogSign(p.catalogSignId || p.signId);

                    return (
                      <button
                        key={`sign-${p.id}`}
                        type="button"
                        disabled={isMatched || status !== 'idle'}
                        onClick={() => handleSelectSignItem(p.id, p.signName)}
                        aria-label={`Demonstração de sinal`}
                        className={`tactile-btn w-full h-[108px] p-1.5 rounded-2xl border border-b-4 cursor-pointer flex items-center justify-center relative overflow-hidden transition-colors ${
                          isMatched
                            ? 'bg-[#F0FDFA] border-[#99F6E4] border-b-[#5EEAD4] opacity-55 cursor-not-allowed'
                            : isMismatch
                            ? 'bg-[#FFF1F2] border-[#FDA4AF] border-b-[#E11D48]'
                            : isSelected
                            ? 'bg-[#FFF1E6] border-[#EA580C] border-b-[#9A3412]'
                            : 'bg-white border-[#E8E2D9] border-b-[#D6CFC5] hover:bg-[#FAF9F6]'
                        }`}
                      >
                        <SignSchematicVisualizer
                          sign={pairSign}
                          mini={true}
                          hideControls={true}
                          className="w-full h-full pointer-events-none border-0 bg-transparent"
                        />
                        {isMatched && (
                          <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#0D9488] text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* FORMAT 5: Prática na Câmera com MediaPipe Direcionado */}
            {currentExercise.type === 'camera_practice' && (() => {
              const targetSign = findCatalogSign(currentExercise.targetSignId || 'oi');
              return (
                <SingleTargetCameraExercise
                  targetSign={targetSign}
                  onPassed={(qualityPercent) => {
                    if (status === 'idle') {
                      setCameraScores((prev) => [...prev, qualityPercent]);
                      setStatus('correct');
                      setComboCount((prev) => prev + 1);
                      setCorrectCount((prev) => prev + 1);
                    }
                  }}
                  onSkipWithoutCamera={handleSkipCamera}
                />
              );
            })()}

            {/* FORMAT 6: Monte a Frase em Glosas */}
            {(currentExercise.type === 'translate_to_libras' ||
              currentExercise.type === 'fill_in_blank_sign') && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 py-1">
                  <LibiMascot
                    mood="ensinando"
                    size="sm"
                    showSpeechBubble={true}
                    bubblePosition="side"
                    speechText={currentExercise.portugueseSentence || ''}
                  />
                </div>

                {currentExercise.glossSequence && currentExercise.glossSequence.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-[#0F766E]">
                    {currentExercise.glossSequence.map((_, sIdx) => (
                      <span
                        key={sIdx}
                        className={`px-2 py-0.5 rounded-md border tabular-nums ${
                          sIdx < selectedWords.length
                            ? 'bg-[#F0FDFA] border-[#99F6E4] text-[#0F766E]'
                            : 'bg-[#F3F0EA] border-[#E8E2D9] text-[#78716C]'
                        }`}
                      >
                        {sIdx < selectedWords.length ? selectedWords[sIdx] : `${sIdx + 1}`}
                      </span>
                    ))}
                  </div>
                )}

                <div className="min-h-[68px] p-3 rounded-2xl border-b-2 border-dashed border-[#D6CFC5] bg-white flex flex-wrap items-center gap-2">
                  {selectedWords.length === 0 ? (
                    <span className="text-xs font-semibold text-[#78716C]">
                      Selecione os sinais na ordem da Libras
                    </span>
                  ) : (
                    selectedWords.map((word, idx) => (
                      <button
                        key={`${word}-sel-${idx}`}
                        type="button"
                        disabled={status !== 'idle'}
                        onClick={() => handleRemoveWord(word, idx)}
                        className="tactile-btn px-3.5 py-2 rounded-xl bg-[#FFF1E6] border border-[#FED7AA] border-b-4 border-b-[#EA580C] text-[#9A3412] font-bold text-sm sm:text-base tracking-wide uppercase hover:bg-rose-50 cursor-pointer animate-scale-in"
                      >
                        {word}
                      </button>
                    ))
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {availableWords.map((word, idx) => (
                    <button
                      key={`${word}-bank-${idx}`}
                      type="button"
                      disabled={status !== 'idle'}
                      onClick={() => handleWordClick(word, idx)}
                      className="tactile-btn px-3.5 py-2 rounded-xl bg-white border border-[#E8E2D9] border-b-4 border-b-[#D6CFC5] text-[#1C1917] font-bold text-sm sm:text-base tracking-wide uppercase hover:bg-[#F3F0EA] cursor-pointer"
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* FORMAT 7: Complete o Diálogo em Libras */}
            {currentExercise.type === 'dialogue_completion' && currentExercise.dialoguePrompt && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-[#E8E2D9] p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#0F766E]">
                      {currentExercise.dialoguePrompt.speaker}
                    </span>
                    <span className="text-[11px] font-bold text-[#EA580C]">
                      {currentExercise.dialoguePrompt.nmfLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <SignSchematicVisualizer
                      sign={findCatalogSign(
                        currentExercise.dialoguePrompt.catalogSignId || 'tudo-bem'
                      )}
                      compact={true}
                      hideControls={true}
                      facialExpression={currentExercise.dialoguePrompt.nmfType}
                    />
                    <div className="space-y-2">
                      <div className="font-mono text-base sm:text-lg font-bold text-[#1C1917]">
                        {currentExercise.dialoguePrompt.gloss}
                      </div>
                      <div className="text-sm font-medium text-[#57534E]">
                        {currentExercise.dialoguePrompt.portuguese}
                      </div>
                    </div>
                  </div>
                </div>

                {currentExercise.options && (
                  <div className="grid grid-cols-1 gap-2.5">
                    {currentExercise.options.map((opt) => {
                      const isSelected = selectedOptionId === opt.id;
                      const optSign = findCatalogSign(opt.catalogSignId || 'oi');

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={status !== 'idle'}
                          onClick={() => {
                            soundService.playTap();
                            setSelectedOptionId(opt.id);
                          }}
                          className={`tactile-btn p-3 rounded-2xl border border-b-4 text-left cursor-pointer flex items-center gap-3 transition-colors ${
                            isSelected
                              ? 'bg-[#FFF1E6] border-[#EA580C] border-b-[#9A3412]'
                              : 'bg-white border-[#E8E2D9] border-b-[#D6CFC5] hover:bg-[#FAF9F6]'
                          }`}
                        >
                          <div className="w-20 h-16 shrink-0 rounded-xl overflow-hidden bg-[#F0FDFA] border border-[#CCFBF1]">
                            <SignSchematicVisualizer
                              sign={optSign}
                              mini={true}
                              hideControls={true}
                              className="w-full h-full border-0 bg-transparent pointer-events-none"
                            />
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            {opt.gloss && (
                              <div className="font-mono text-xs font-bold text-[#0F766E] truncate">
                                {opt.gloss}
                              </div>
                            )}
                            <div className="font-bold text-sm text-[#1C1917]">{opt.text}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Legacy Parameter & NMF Quiz */}
            {(currentExercise.type === 'parameter_quiz' ||
              currentExercise.type === 'nmf_facial_quiz') && (
              <div className="space-y-4 pt-1">
                {currentExercise.sign && (
                  <SignDemonstrationVisual
                    sign={currentExercise.sign}
                    className="max-w-md mx-auto"
                  />
                )}

                {currentExercise.options && (
                  <div className="grid grid-cols-1 gap-2.5">
                    {currentExercise.options.map((opt) => {
                      const isSelected = selectedOptionId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={status !== 'idle'}
                          onClick={() => {
                            soundService.playTap();
                            setSelectedOptionId(opt.id);
                          }}
                          className={`tactile-btn p-4 rounded-2xl border border-b-4 text-left font-bold text-sm cursor-pointer flex items-center gap-3 ${
                            isSelected
                              ? 'bg-[#FFF1E6] text-[#9A3412] border-[#EA580C] border-b-[#9A3412]'
                              : 'bg-white text-[#1C1917] border-[#E8E2D9] border-b-[#D6CFC5] hover:bg-[#FAF9F6]'
                          }`}
                        >
                          <div>{opt.text}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Legacy Story Dialogue */}
            {currentExercise.type === 'story_dialogue' && currentExercise.storyLines && (
              <div className="space-y-4 pt-2">
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {currentExercise.storyLines.slice(0, storyLineIndex + 1).map((line, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-[#E8E2D9] animate-fade-in"
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#F0FDFA] text-[#0F766E] border border-[#99F6E4] flex items-center justify-center font-bold text-xs shrink-0">
                        {line.speaker.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <div className="font-bold text-xs text-[#0F766E]">{line.speaker}</div>
                        <div className="font-bold text-base text-[#1C1917] font-mono tracking-wide">
                          {line.librasSentence}
                        </div>
                        <div className="text-xs text-[#57534E] font-medium">
                          {line.portugueseSentence}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {storyLineIndex < currentExercise.storyLines.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      soundService.playTap();
                      setStoryLineIndex((prev) => prev + 1);
                    }}
                    className="tactile-btn w-full py-3 rounded-2xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs uppercase tracking-wider border-b-4 border-[#115E59] cursor-pointer"
                  >
                    Próxima fala
                  </button>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-[#F0FDFA] text-[#0F766E] font-bold text-xs text-center border border-[#99F6E4]">
                    Diálogo concluído. Toque em verificar.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 3. Fixed Bottom Verification & Libi Feedback Sheet */}
      {status !== 'completed' && status !== 'out_of_hearts' && (
        <footer
          className={`border-t py-4 sm:py-5 px-4 transition-colors duration-200 shrink-0 ${
            status === 'correct'
              ? 'bg-[#F0FDFA] border-[#99F6E4] text-[#0F766E]'
              : status === 'incorrect'
              ? 'bg-[#FFF1F2] border-[#FECDD3] text-[#BE123C]'
              : 'bg-white border-[#E8E2D9]'
          }`}
        >
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {status === 'correct' && (
              <div className="flex items-center gap-3">
                <LibiMascot mood="comemorando" size="xs" />
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-[#0F766E]">
                    Muito bem!
                  </h3>
                  <p className="text-xs font-semibold text-[#115E59]">
                    Resposta correta.
                  </p>
                </div>
              </div>
            )}

            {status === 'incorrect' && (
              <div className="flex items-start gap-3">
                <LibiMascot mood="incentivando" size="xs" />
                <div className="space-y-0.5 min-w-0">
                  <h3 className="font-display text-base sm:text-lg font-bold text-[#BE123C]">
                    Resposta certa: {currentExercise?.correctAnswers[0]}
                  </h3>
                </div>
              </div>
            )}

            {status === 'idle' && (
              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-[#78716C]">
                <span>
                  {currentExercise?.type === 'camera_practice'
                    ? 'Alcance 80% na câmera ou pule sem perder vidas'
                    : currentExercise?.type === 'match_sign_pairs'
                    ? `Pares combinados: ${matchedPairIds.length}/${
                        currentExercise.matchPairs?.length || 4
                      }`
                    : 'Selecione sua resposta e toque em verificar'}
                </span>
              </div>
            )}

            <div className="w-full sm:w-auto flex justify-end shrink-0">
              {status === 'idle' ? (
                currentExercise?.type === 'camera_practice' ? (
                  <button
                    type="button"
                    onClick={handleSkipCamera}
                    className="tactile-btn w-full sm:w-auto py-3 px-5 rounded-2xl bg-[#F3F0EA] hover:bg-[#E8E2D9] text-[#57534E] font-bold text-xs uppercase tracking-wider border border-[#D6CFC5] border-b-4 cursor-pointer"
                  >
                    Não posso usar a câmera agora
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!canCheckCurrent}
                    onClick={handleCheckAnswer}
                    className={`tactile-btn w-full sm:w-44 py-3.5 px-6 rounded-2xl font-bold text-sm uppercase tracking-wider border-b-4 transition-colors ${
                      canCheckCurrent
                        ? 'bg-[#EA580C] hover:bg-[#DC4F06] text-white border-[#9A3412] cursor-pointer'
                        : 'bg-[#E8E2D9] text-[#78716C] border-[#D6CFC5] cursor-not-allowed'
                    }`}
                  >
                    Verificar
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={handleContinue}
                  className={`tactile-btn w-full sm:w-44 py-3.5 px-6 rounded-2xl text-white font-bold text-sm uppercase tracking-wider border-b-4 cursor-pointer flex items-center justify-center gap-2 ${
                    status === 'correct'
                      ? 'bg-[#0D9488] hover:bg-[#0F766E] border-[#115E59]'
                      : 'bg-[#E11D48] hover:bg-[#BE123C] border-[#9F1239]'
                  }`}
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};
