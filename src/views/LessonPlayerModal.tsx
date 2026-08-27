import React, { useState, useEffect } from 'react';
import { 
  X, 
  Heart, 
  Sparkles, 
  Zap, 
  Flame, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Infinity as InfinityIcon,
  Trophy,
  Play,
  RotateCcw,
  BookOpen,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Exercise, PathNode, Unit, UserProfile } from '../types';
import { DuoOwl } from '../components/DuoOwl';
import { LibrasHandSign } from '../components/LibrasHandSign';
import { SignDemonstrationVisual } from '../components/SignDemonstrationVisual';
import { soundService } from '../services/soundService';

interface LessonPlayerModalProps {
  node: PathNode;
  unit: Unit;
  userProfile: UserProfile;
  onClose: () => void;
  onLessonCompleted: (xp: number, gems: number) => void;
  onLoseHeart: () => void;
}

export const LessonPlayerModal: React.FC<LessonPlayerModalProps> = ({
  node,
  unit,
  userProfile,
  onClose,
  onLessonCompleted,
  onLoseHeart
}) => {
  const exercises = node.exercises;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  // Match pairs state
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);
  const [selectedSignItem, setSelectedSignItem] = useState<{ id: string; name: string } | null>(null);
  const [selectedWordItem, setSelectedWordItem] = useState<{ id: string; text: string } | null>(null);

  // Story state
  const [storyLineIndex, setStoryLineIndex] = useState(0);

  // Status state
  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect' | 'completed' | 'out_of_hearts'>('idle');
  const [comboCount, setComboCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const currentExercise = exercises[currentIndex];
  const progressPercent = Math.round((currentIndex / exercises.length) * 100);

  // Initialize exercise state on index change
  useEffect(() => {
    if (!currentExercise) return;
    setStatus('idle');
    setSelectedOptionId(null);
    setSelectedWords([]);

    if (currentExercise.wordBank) {
      setAvailableWords([...currentExercise.wordBank].sort(() => Math.random() - 0.5));
    }

    if (currentExercise.type === 'match_sign_pairs') {
      setMatchedPairIds([]);
      setSelectedSignItem(null);
      setSelectedWordItem(null);
    }

    if (currentExercise.type === 'story_dialogue') {
      setStoryLineIndex(0);
    }
  }, [currentIndex, currentExercise]);

  // Word bank click (add to answer sentence)
  const handleWordClick = (word: string, index: number) => {
    soundService.playTap();
    setSelectedWords([...selectedWords, word]);
    const updated = [...availableWords];
    updated.splice(index, 1);
    setAvailableWords(updated);
  };

  // Selected word remove (return to bank)
  const handleRemoveWord = (word: string, index: number) => {
    soundService.playPop();
    const updatedSelected = [...selectedWords];
    updatedSelected.splice(index, 1);
    setSelectedWords(updatedSelected);
    setAvailableWords([...availableWords, word]);
  };

  // Match pairs handling
  const handleSelectSignItem = (id: string, name: string) => {
    soundService.playTap();
    if (selectedWordItem) {
      if (selectedWordItem.id === id) {
        // Match!
        soundService.playMatchPair();
        setMatchedPairIds([...matchedPairIds, id]);
        setSelectedSignItem(null);
        setSelectedWordItem(null);
      } else {
        // Mismatch
        soundService.playIncorrect();
        setSelectedSignItem(null);
        setSelectedWordItem(null);
      }
    } else {
      setSelectedSignItem({ id, name });
    }
  };

  const handleSelectWordItem = (id: string, text: string) => {
    soundService.playTap();
    if (selectedSignItem) {
      if (selectedSignItem.id === id) {
        // Match!
        soundService.playMatchPair();
        setMatchedPairIds([...matchedPairIds, id]);
        setSelectedSignItem(null);
        setSelectedWordItem(null);
      } else {
        // Mismatch
        soundService.playIncorrect();
        setSelectedSignItem(null);
        setSelectedWordItem(null);
      }
    } else {
      setSelectedWordItem({ id, text });
    }
  };

  // Check answer
  const handleCheckAnswer = () => {
    if (status !== 'idle') return;

    let isCorrect = false;
    const normalize = (s: string) => s.toLowerCase().replace(/[.,!?;:¡¿\s-]/g, '').trim();

    if (currentExercise.type === 'identify_sign' || currentExercise.type === 'parameter_quiz' || currentExercise.type === 'nmf_facial_quiz') {
      const chosenOpt = currentExercise.options?.find(o => o.id === selectedOptionId);
      if (chosenOpt) {
        isCorrect = currentExercise.correctAnswers.some(ans => normalize(ans) === normalize(chosenOpt.text));
      }
    } else if (currentExercise.type === 'translate_to_libras' || currentExercise.type === 'dactylology_spelling' || currentExercise.type === 'fill_in_blank_sign') {
      const builtSentence = selectedWords.join(' ').trim();
      isCorrect = currentExercise.correctAnswers.some(ans => normalize(ans) === normalize(builtSentence));
    } else if (currentExercise.type === 'match_sign_pairs') {
      isCorrect = (matchedPairIds.length === (currentExercise.matchPairs?.length || 0));
    } else if (currentExercise.type === 'story_dialogue') {
      isCorrect = true;
    }

    if (isCorrect) {
      soundService.playCorrect();
      setStatus('correct');
      setComboCount(prev => prev + 1);
      setCorrectCount(prev => prev + 1);
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

  // Move to next or finish
  const handleContinue = () => {
    soundService.playTap();
    if (currentIndex + 1 < exercises.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      soundService.playLessonComplete();
      try {
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Safe fallback
      }
      setStatus('completed');
      onLessonCompleted(node.xpReward + comboCount * 2, node.gemsReward);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col justify-between select-none animate-fade-in">
      
      {/* 1. Header with Close, Progress Bar & Hearts */}
      <header className="max-w-4xl w-full mx-auto px-4 py-4 sm:py-6 flex items-center justify-between gap-4">
        <button
          onClick={onClose}
          className="p-2 rounded-2xl hover:bg-[#FFF7ED] text-[#A8A29E] hover:text-[#292524] cursor-pointer"
        >
          <X className="w-6 h-6 stroke-[3]" />
        </button>

        {/* Orange Progress Bar */}
        <div className="flex-1 h-4 bg-[#F1EAE2] rounded-full overflow-hidden relative">
          <div 
            className="h-full bg-gradient-to-r from-[#FF6B00] to-[#EA580C] rounded-full transition-all duration-300 relative overflow-hidden"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute top-1 left-2 right-2 h-1 bg-white/30 rounded-full" />
          </div>
        </div>

        {/* Hearts display */}
        <div className="flex items-center gap-1 text-[#E11D48] font-black text-sm">
          {userProfile.isSuperDuolingo ? (
            <div className="flex items-center gap-1 text-[#EA580C]">
              <InfinityIcon className="w-5 h-5 stroke-[3]" />
              <span className="text-xs uppercase font-black">PLUS</span>
            </div>
          ) : (
            <>
              <Heart className="w-6 h-6 fill-[#E11D48] text-[#E11D48]" />
              <span>{userProfile.hearts}</span>
            </>
          )}
        </div>
      </header>

      {/* 2. Main Exercise Content Area */}
      <main className="max-w-2xl w-full mx-auto px-4 py-2 flex-1 flex flex-col justify-center overflow-y-auto">
        
        {/* === Completion Screen (Visual Applause 👐) === */}
        {status === 'completed' && (
          <div className="text-center space-y-6 animate-scale-in py-6">
            <div className="flex flex-col items-center justify-center">
              <DuoOwl mood="visual_applause" outfit={userProfile.duoOutfit} size="lg" />
              <div className="mt-2 text-2xl font-black text-[#EA580C] flex items-center gap-2">
                <span>👐</span>
                <span>Palmas Visuais em Libras!</span>
                <span>✨</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl font-black text-[#EA580C]">Lição Concluída!</h2>
              <p className="text-sm font-bold text-[#78716C]">Parabéns! Você praticou novos sinais e fortaleceu sua fluência no EasyLib.</p>
            </div>

            {/* Stat Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md mx-auto">
              <div className="p-4 rounded-3xl bg-[#FF6B00] text-white space-y-1 shadow-md">
                <span className="text-[11px] font-black uppercase tracking-wider">TOTAL DE XP</span>
                <div className="text-2xl font-black">+{node.xpReward + comboCount * 2}</div>
              </div>

              <div className="p-4 rounded-3xl bg-[#EA580C] text-white space-y-1 shadow-md">
                <span className="text-[11px] font-black uppercase tracking-wider">PRECISÃO</span>
                <div className="text-2xl font-black">
                  {Math.round((correctCount / Math.max(1, exercises.length)) * 100)}%
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-[#D97706] text-white space-y-1 shadow-md col-span-2 sm:col-span-1">
                <span className="text-[11px] font-black uppercase tracking-wider">GEMAS</span>
                <div className="text-2xl font-black">+{node.gemsReward} 💎</div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="py-4 px-12 rounded-2xl bg-[#FF6B00] hover:bg-[#EA580C] text-white font-black text-sm uppercase tracking-wider border-b-6 border-[#9A3412] cursor-pointer shadow-xl transition-all active:translate-y-1"
            >
              Continuar na Trilha
            </button>
          </div>
        )}

        {/* === Out of Hearts Screen === */}
        {status === 'out_of_hearts' && (
          <div className="text-center space-y-6 animate-scale-in py-6">
            <DuoOwl mood="thinking" size="lg" />
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-[#E11D48]">Suas vidas acabaram!</h2>
              <p className="text-sm font-bold text-[#78716C]">
                Pratique sinais e assista aos vídeos demonstrativos para recuperar vidas ou ative o EasyLib Plus!
              </p>
            </div>

            <div className="space-y-3 max-w-sm mx-auto">
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-[#FF6B00] hover:bg-[#EA580C] text-white font-black text-xs uppercase tracking-wider border-b-4 border-[#9A3412] cursor-pointer"
              >
                Voltar à Trilha
              </button>
            </div>
          </div>
        )}

        {/* === Interactive Libras Exercises with Video & Rich Visuals === */}
        {status !== 'completed' && status !== 'out_of_hearts' && currentExercise && (
          <div className="space-y-5">
            
            {/* Prompt Heading */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#EA580C] bg-[#FFEDD5] px-3 py-1 rounded-full border border-[#FDBA74]">
                <span>🤟</span>
                <span>Exercício Visual de Libras</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#292524]">
                {currentExercise.prompt}
              </h2>
              {currentExercise.grammarTip && (
                <p className="text-xs font-semibold text-[#78716C]">{currentExercise.grammarTip}</p>
              )}
            </div>

            {/* 1. Identify Sign with Video Demonstration & 5 Parameters Player */}
            {currentExercise.type === 'identify_sign' && (
              <div className="space-y-4">
                {currentExercise.sign && (
                  <SignDemonstrationVisual
                    sign={currentExercise.sign}
                    className="max-w-md mx-auto"
                  />
                )}

                {/* Multiple Choice Cards */}
                {currentExercise.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {currentExercise.options.map((opt) => {
                      const isSelected = selectedOptionId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            soundService.playTap();
                            setSelectedOptionId(opt.id);
                          }}
                          className={`
                            p-4 rounded-3xl border-2 border-b-6 transition-all duration-150 cursor-pointer flex items-center gap-3 text-left active:translate-y-1
                            ${isSelected
                              ? 'bg-[#FFF7ED] border-[#FF6B00] border-b-[#9A3412] scale-[1.02] shadow-md text-[#EA580C]'
                              : 'bg-white border-[#F1EAE2] border-b-[#FED7AA] hover:bg-[#FFFDF9] text-[#292524]'}
                          `}
                        >
                          {opt.glyph && <span className="text-3xl shrink-0">{opt.glyph}</span>}
                          <div>
                            <div className="font-black text-base">{opt.text}</div>
                            {opt.explanation && <div className="text-xs text-[#78716C] font-medium">{opt.explanation}</div>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 2. Dactylology / Manual Alphabet Spelling with visual hand graphics */}
            {currentExercise.type === 'dactylology_spelling' && (
              <div className="space-y-4">
                <div className="p-4 rounded-3xl bg-[#FFF7ED] border-2 border-[#FED7AA] text-center space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[#C2410C]">Palavra Alvo em Datilologia:</span>
                  <div className="text-2xl sm:text-3xl font-black tracking-widest text-[#9A3412] font-mono">
                    {currentExercise.targetGloss}
                  </div>
                  <div className="text-xs text-[#EA580C] font-semibold">{currentExercise.portugueseSentence}</div>
                </div>

                {/* Spelling Construction row */}
                <div className="min-h-[64px] p-3 rounded-2xl border-b-2 border-dashed border-[#FED7AA] bg-[#FFFDF9] flex flex-wrap items-center justify-center gap-2">
                  {selectedWords.map((word, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleRemoveWord(word, idx)}
                      className="w-12 h-12 rounded-2xl bg-white border-2 border-[#F1EAE2] border-b-4 border-[#FED7AA] text-[#EA580C] font-black text-lg shadow-sm hover:bg-rose-50 hover:border-rose-300 transition-all cursor-pointer active:translate-y-0.5 animate-scale-in"
                    >
                      {word}
                    </button>
                  ))}
                </div>

                {/* Available Letters */}
                <div className="flex flex-wrap justify-center gap-2.5 pt-2">
                  {availableWords.map((word, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleWordClick(word, idx)}
                      className="w-12 h-12 rounded-2xl bg-white border-2 border-[#F1EAE2] border-b-4 border-[#FED7AA] text-[#292524] font-black text-lg shadow-sm hover:bg-[#FFF7ED] hover:border-[#FDBA74] transition-all cursor-pointer active:translate-y-1 flex flex-col items-center justify-center"
                    >
                      <span>{word}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Translate to Libras Grammar (Word Bank Tiles) with Signer Avatar */}
            {currentExercise.type === 'translate_to_libras' && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 py-2">
                  <DuoOwl mood="signing_ily" size="sm" />
                  <div className="bg-[#FFFDF9] border-2 border-[#F1EAE2] px-4 py-3 rounded-2xl font-black text-lg text-[#292524] shadow-inner flex-1">
                    {currentExercise.portugueseSentence}
                  </div>
                </div>

                {/* Assembled Sentence Row */}
                <div className="min-h-[64px] p-3 rounded-2xl border-b-2 border-dashed border-[#FDBA74] bg-[#FFFDF9] flex flex-wrap items-center gap-2">
                  {selectedWords.map((word, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleRemoveWord(word, idx)}
                      className="px-4 py-2.5 rounded-2xl bg-white border-2 border-[#FED7AA] border-b-4 border-[#FDBA74] text-[#EA580C] font-black text-sm sm:text-base shadow-sm hover:bg-rose-50 hover:border-rose-300 transition-all cursor-pointer active:translate-y-0.5 animate-scale-in"
                    >
                      {word}
                    </button>
                  ))}
                </div>

                {/* Available Word Bank */}
                <div className="flex flex-wrap gap-2 sm:gap-2.5 pt-2">
                  {availableWords.map((word, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleWordClick(word, idx)}
                      className="px-4 py-2.5 rounded-2xl bg-white border-2 border-[#F1EAE2] border-b-4 border-[#FED7AA] text-[#292524] font-black text-sm sm:text-base shadow-sm hover:bg-[#FFF7ED] hover:border-[#FDBA74] transition-all cursor-pointer active:translate-y-1"
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Match Sign Pairs */}
            {currentExercise.type === 'match_sign_pairs' && currentExercise.matchPairs && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                
                {/* Sign Column */}
                <div className="space-y-2">
                  <span className="text-[11px] font-black uppercase text-[#A8A29E] tracking-wider">Sinal / Gestos</span>
                  {currentExercise.matchPairs.map((p) => {
                    const isMatched = matchedPairIds.includes(p.id);
                    const isSelected = selectedSignItem?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        disabled={isMatched}
                        onClick={() => handleSelectSignItem(p.id, p.signName)}
                        className={`
                          w-full py-3.5 px-3 rounded-2xl border-2 border-b-6 font-black text-sm text-left transition-all cursor-pointer active:translate-y-0.5 flex items-center gap-2.5
                          ${isMatched 
                            ? 'bg-[#E7E5E4] text-[#A8A29E] border-[#D6D3D1] border-b-[#A8A29E] cursor-not-allowed opacity-50' 
                            : isSelected
                            ? 'bg-[#FFEDD5] text-[#C2410C] border-[#FF6B00] border-b-[#9A3412]'
                            : 'bg-white text-[#292524] border-[#F1EAE2] border-b-[#FED7AA] hover:bg-[#FFF7ED]'}
                        `}
                      >
                        <span className="text-2xl">{p.signGlyph}</span>
                        <div>
                          <div className="font-black text-xs sm:text-sm">{p.signName}</div>
                          <div className="text-[10px] text-[#78716C]">{p.handshape}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Meaning Column */}
                <div className="space-y-2">
                  <span className="text-[11px] font-black uppercase text-[#A8A29E] tracking-wider">Português</span>
                  {currentExercise.matchPairs.map((p) => {
                    const isMatched = matchedPairIds.includes(p.id);
                    const isSelected = selectedWordItem?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        disabled={isMatched}
                        onClick={() => handleSelectWordItem(p.id, p.portugueseText)}
                        className={`
                          w-full py-4 px-4 rounded-2xl border-2 border-b-6 font-black text-sm text-left transition-all cursor-pointer active:translate-y-0.5
                          ${isMatched 
                            ? 'bg-[#E7E5E4] text-[#A8A29E] border-[#D6D3D1] border-b-[#A8A29E] cursor-not-allowed opacity-50' 
                            : isSelected
                            ? 'bg-[#FFEDD5] text-[#C2410C] border-[#FF6B00] border-b-[#9A3412]'
                            : 'bg-white text-[#292524] border-[#F1EAE2] border-b-[#FED7AA] hover:bg-[#FFF7ED]'}
                        `}
                      >
                        {p.portugueseText}
                      </button>
                    );
                  })}
                </div>

              </div>
            )}

            {/* 5. Parameter Quiz (CM, PA, M, NMF) with visual diagram */}
            {(currentExercise.type === 'parameter_quiz' || currentExercise.type === 'nmf_facial_quiz') && (
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
                          onClick={() => {
                            soundService.playTap();
                            setSelectedOptionId(opt.id);
                          }}
                          className={`
                            p-4 rounded-2xl border-2 border-b-4 text-left font-black text-sm transition-all cursor-pointer active:translate-y-0.5 flex items-center gap-3
                            ${isSelected
                              ? 'bg-[#FFF7ED] text-[#EA580C] border-[#FF6B00] border-b-[#9A3412]'
                              : 'bg-white text-[#292524] border-[#F1EAE2] border-b-[#FED7AA] hover:bg-[#FFF7ED]'}
                          `}
                        >
                          {opt.glyph && <span className="text-2xl shrink-0">{opt.glyph}</span>}
                          <div>
                            <div>{opt.text}</div>
                            {opt.explanation && <div className="text-xs text-[#78716C] font-medium">{opt.explanation}</div>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 6. Story Dialogue in Libras */}
            {currentExercise.type === 'story_dialogue' && currentExercise.storyLines && (
              <div className="space-y-4 pt-2">
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                  {currentExercise.storyLines.slice(0, storyLineIndex + 1).map((line, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FFF7ED] border border-[#FED7AA] animate-fade-in">
                      <span className="text-3xl shrink-0">{line.avatar}</span>
                      <div className="space-y-1">
                        <div className="font-black text-xs text-[#EA580C]">{line.speaker}</div>
                        <div className="font-black text-base text-[#292524] font-mono tracking-wide">{line.librasSentence}</div>
                        <div className="text-xs text-[#78716C] font-medium">Tradução: {line.portugueseSentence}</div>
                        {line.signExplanation && (
                          <div className="text-[11px] text-[#C2410C] bg-white/80 px-2 py-1 rounded-lg border border-[#FED7AA] mt-1">
                            💡 {line.signExplanation}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {storyLineIndex < currentExercise.storyLines.length - 1 ? (
                  <button
                    onClick={() => {
                      soundService.playTap();
                      setStoryLineIndex(storyLineIndex + 1);
                    }}
                    className="w-full py-3 rounded-2xl bg-[#FF6B00] hover:bg-[#EA580C] text-white font-black text-xs uppercase tracking-wider border-b-4 border-[#9A3412] cursor-pointer shadow-sm"
                  >
                    Próxima Fala em Libras 🤟
                  </button>
                ) : (
                  <div className="p-4 rounded-2xl bg-[#FFEDD5] text-[#EA580C] font-black text-xs text-center border-2 border-[#FDBA74]">
                    Diálogo em Libras completo! Toque em Continuar.
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </main>

      {/* 3. Bottom Verification & Feedback Sheet */}
      {status !== 'completed' && status !== 'out_of_hearts' && (
        <footer className={`
          border-t-2 py-4 sm:py-6 px-4 transition-colors duration-200
          ${status === 'correct' 
            ? 'bg-[#FFEDD5] border-[#FDBA74] text-[#C2410C]' 
            : status === 'incorrect' 
            ? 'bg-[#FFE4E6] border-[#FECDD3] text-[#E11D48]' 
            : 'bg-white border-[#F1EAE2]'}
        `}>
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            
            {/* Feedback message */}
            {status === 'correct' && (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#FF6B00] text-white flex items-center justify-center text-xl shadow-sm">
                  🤟
                </div>
                <div>
                  <h3 className="text-xl font-black">Sinalização Perfeita!</h3>
                  <p className="text-xs font-bold text-[#EA580C]">Você acertou o sinal e os parâmetros!</p>
                </div>
              </div>
            )}

            {status === 'incorrect' && (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#E11D48] text-white flex items-center justify-center">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xl font-black">Resposta correta:</h3>
                  <p className="text-xs font-bold text-[#BE123C]">
                    {currentExercise?.correctAnswers[0] || 'Tente novamente'}
                  </p>
                </div>
              </div>
            )}

            {status === 'idle' && (
              <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-[#A8A29E]">
                <span>Assista ao vídeo demonstrativo e toque em verificar</span>
              </div>
            )}

            {/* Action button */}
            <div className="w-full sm:w-auto flex justify-end">
              {status === 'idle' ? (
                <button
                  onClick={handleCheckAnswer}
                  className="w-full sm:w-48 py-3.5 px-6 rounded-2xl bg-[#FF6B00] hover:bg-[#EA580C] text-white font-black text-sm uppercase tracking-wider border-b-6 border-[#9A3412] cursor-pointer shadow-md transition-all active:translate-y-1"
                >
                  Verificar
                </button>
              ) : (
                <button
                  onClick={handleContinue}
                  className={`
                    w-full sm:w-48 py-3.5 px-6 rounded-2xl text-white font-black text-sm uppercase tracking-wider border-b-6 cursor-pointer shadow-md transition-all active:translate-y-1 flex items-center justify-center gap-2
                    ${status === 'correct' ? 'bg-[#FF6B00] hover:bg-[#EA580C] border-[#9A3412]' : 'bg-[#E11D48] hover:bg-[#BE123C] border-[#9F1239]'}
                  `}
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
