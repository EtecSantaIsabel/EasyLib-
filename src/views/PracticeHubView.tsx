import React, { useState, useEffect } from 'react';
import {
  Dumbbell,
  RotateCcw,
  Play,
  Layers,
  BookOpen,
  Smile,
  CheckCircle2,
  AlertCircle,
  Trophy,
  ArrowRight,
  Hand,
  Type
} from 'lucide-react';
import { UserProfile, PathNode, Unit } from '../types';
import { LIBRAS_DICTIONARY } from '../data/librasData';
import { soundService } from '../services/soundService';

interface PracticeHubViewProps {
  userProfile: UserProfile;
  onStartPractice: (node: PathNode, unit: Unit) => void;
  onRefillHearts: () => void;
  onOpenDictionary?: () => void;
}

export const PracticeHubView = ({
  onOpenDictionary
}: PracticeHubViewProps) => {
  // Practice Sub-tabs
  const [activePracticeTab, setActivePracticeTab] = useState<'hub' | 'parameters_lab' | 'nmf_quiz' | 'memory_game' | 'fast_dactylology'>('hub');

  // --- 1. Datilologia Quick Trainer State ---
  const [dactylologyInput, setDactylologyInput] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const wordsList = ['LIBRAS', 'SURDO', 'BOM', 'AMOR', 'CASA', 'PAI', 'MÃE', 'AMIGO', 'PAZ', 'VIDA'];
  const currentWord = wordsList[currentWordIndex];
  const [showDactylologySuccess, setShowDactylologySuccess] = useState(false);

  // --- 2. Memory Game State ---
  interface MemoryCard {
    id: number;
    signId: string;
    type: 'sign' | 'word';
    label: string;
    glyph: string;
    isFlipped: boolean;
    isMatched: boolean;
  }
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>([]);
  const [flippedCardIds, setFlippedCardIds] = useState<number[]>([]);
  const [memoryMatchesCount, setMemoryMatchesCount] = useState(0);
  const [memoryGameOver, setMemoryGameOver] = useState(false);

  const initMemoryGame = () => {
    const selectedSigns = LIBRAS_DICTIONARY.slice(0, 6);
    let cards: MemoryCard[] = [];
    selectedSigns.forEach((sign, idx) => {
      cards.push({
        id: idx * 2,
        signId: sign.id,
        type: 'sign',
        label: sign.name,
        glyph: sign.visualGlyph || '🤟',
        isFlipped: false,
        isMatched: false
      });
      cards.push({
        id: idx * 2 + 1,
        signId: sign.id,
        type: 'word',
        label: sign.name,
        glyph: '📝',
        isFlipped: false,
        isMatched: false
      });
    });
    cards = cards.sort(() => Math.random() - 0.5);
    setMemoryCards(cards);
    setFlippedCardIds([]);
    setMemoryMatchesCount(0);
    setMemoryGameOver(false);
  };

  const handleCardClick = (card: MemoryCard) => {
    if (card.isFlipped || card.isMatched || flippedCardIds.length >= 2) return;
    soundService.playTap();

    const newCards = memoryCards.map(c => c.id === card.id ? { ...c, isFlipped: true } : c);
    setMemoryCards(newCards);

    const newFlipped = [...flippedCardIds, card.id];
    setFlippedCardIds(newFlipped);

    if (newFlipped.length === 2) {
      const firstCard = newCards.find(c => c.id === newFlipped[0]);
      const secondCard = newCards.find(c => c.id === newFlipped[1]);

      if (firstCard && secondCard && firstCard.signId === secondCard.signId) {
        setTimeout(() => {
          soundService.playCorrect();
          setMemoryCards(prev => prev.map(c => c.signId === firstCard.signId ? { ...c, isMatched: true } : c));
          setFlippedCardIds([]);
          const newMatches = memoryMatchesCount + 1;
          setMemoryMatchesCount(newMatches);
          if (newMatches >= 6) {
            setMemoryGameOver(true);
          }
        }, 500);
      } else {
        setTimeout(() => {
          soundService.playIncorrect();
          setMemoryCards(prev => prev.map(c => newFlipped.includes(c.id) ? { ...c, isFlipped: false } : c));
          setFlippedCardIds([]);
        }, 900);
      }
    }
  };

  // --- 3. 5 Parameters Lab Quiz State ---
  const [paramQuestionIndex, setParamQuestionIndex] = useState(0);
  const [paramSelectedOption, setParamSelectedOption] = useState<number | null>(null);
  const [paramAnswerStatus, setParamAnswerStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');

  const paramQuizList = [
    {
      question: 'Qual é o Ponto de Articulação (PA) do sinal de APRENDER?',
      signName: 'Aprender',
      glyph: '🧠',
      correctIndex: 0,
      options: [
        'Testa (fechando a mão na mente)',
        'Peito (deslizando no coração)',
        'Espaço Neutro (à frente do corpo)',
        'Queixo (tocando os lábios)'
      ],
      explanation: 'O sinal de APRENDER articula-se na TESTA, simbolizando a retenção de conhecimento na mente.'
    },
    {
      question: 'No sinal de SURDO, quais partes do corpo são tocadas?',
      signName: 'Surdo(a)',
      glyph: '🧏',
      correctIndex: 1,
      options: [
        'Apenas os dois olhos',
        'Orelha/Ouvido e em seguida a Boca',
        'Peito e Ombros',
        'Testa e Queixo'
      ],
      explanation: 'O sinal de SURDO utiliza o dedo indicador tocando próximo à orelha e depois próximo aos lábios.'
    },
    {
      question: 'Qual a Configuração de Mão (CM) do sinal de MEU NOME?',
      signName: 'Meu Nome',
      glyph: '📇',
      correctIndex: 2,
      options: [
        'Mão em punho fechado (letra S)',
        'Mão aberta com cinco dedos espalmados',
        'Mão com dedos indicador e médio juntos (letra U / N)',
        'Mão em formato de L com polegar'
      ],
      explanation: 'O sinal de NOME é feito com os dedos indicador e médio estendidos juntos deslizando no peito.'
    },
    {
      question: 'O que diferencia o sinal de APRENDER do sinal de LARANJA/SÁBADO?',
      signName: 'Parâmetro: Ponto de Articulação',
      glyph: '🍊',
      correctIndex: 0,
      options: [
        'O Ponto de Articulação (Testa vs Boca)',
        'A velocidade do sinal',
        'A mão utilizada (direita ou esquerda)',
        'Não há diferença'
      ],
      explanation: 'Com a mesma Configuração de Mão em "S" abrindo/fechando: na TESTA é APRENDER, na BOCA é LARANJA ou SÁBADO!'
    }
  ];

  const handleParamCheck = (index: number) => {
    if (paramAnswerStatus !== 'idle') return;
    setParamSelectedOption(index);
    const currentQ = paramQuizList[paramQuestionIndex];
    if (index === currentQ.correctIndex) {
      soundService.playCorrect();
      setParamAnswerStatus('correct');
    } else {
      soundService.playIncorrect();
      setParamAnswerStatus('incorrect');
    }
  };

  const handleParamNext = () => {
    setParamAnswerStatus('idle');
    setParamSelectedOption(null);
    if (paramQuestionIndex < paramQuizList.length - 1) {
      setParamQuestionIndex(prev => prev + 1);
    } else {
      setParamQuestionIndex(0);
      setActivePracticeTab('hub');
    }
  };

  // --- 4. NMF (Expressões Faciais) Quiz State ---
  const [nmfQuestionIndex, setNmfQuestionIndex] = useState(0);
  const [nmfSelectedOption, setNmfSelectedOption] = useState<number | null>(null);
  const [nmfAnswerStatus, setNmfAnswerStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');

  const nmfQuizList = [
    {
      prompt: 'Em perguntas com pronomes interrogativos em Libras (Quem? Onde? Por quê?), como deve ser a expressão facial?',
      glyph: '🤔',
      correctIndex: 1,
      options: [
        'Sobrancelhas erguidas e boca aberta sorrindo',
        'Sobrancelhas franzidas e cabeça levemente inclinada',
        'Olhos fechados e cabeça balançando',
        'Expressão totalmente neutra e sem movimento'
      ],
      explanation: 'Perguntas do tipo Qu- (Quem, Onde, O que, Por que) exigem SOBRANCELHAS FRANZIDAS para marcar a dúvida na gramática de Libras!'
    },
    {
      prompt: 'Para fazer perguntas simples de SIM ou NÃO (ex: "Você é surdo?"), qual é a regra dos NMF?',
      glyph: '🤨',
      correctIndex: 0,
      options: [
        'Sobrancelhas levantadas e olhar focado no interlocutor',
        'Sobrancelhas franzidas e cabeça abaixada',
        'Fechar os olhos',
        'Sorrir sem olhar para a pessoa'
      ],
      explanation: 'Perguntas de SIM/NÃO utilizam SOBRANCELHAS LEVANTADAS e inclinação sutil da cabeça para a frente.'
    },
    {
      prompt: 'Como é sinalizada a negação na frase "EU NÃO QUERO"?',
      glyph: '🙅‍♂️',
      correctIndex: 2,
      options: [
        'Balançar os braços para cima',
        'Apenas soletrar a palavra N-A-O',
        'Movimento de cabeça para os lados (negação) junto com o sinal virando para fora',
        'Dar um passo para trás'
      ],
      explanation: 'A negação em Libras é incorporada pelo movimento simultâneo de cabeça (movimento não-manual) e orientação das mãos para fora.'
    }
  ];

  const handleNmfCheck = (index: number) => {
    if (nmfAnswerStatus !== 'idle') return;
    setNmfSelectedOption(index);
    const currentQ = nmfQuizList[nmfQuestionIndex];
    if (index === currentQ.correctIndex) {
      soundService.playCorrect();
      setNmfAnswerStatus('correct');
    } else {
      soundService.playIncorrect();
      setNmfAnswerStatus('incorrect');
    }
  };

  const handleNmfNext = () => {
    setNmfAnswerStatus('idle');
    setNmfSelectedOption(null);
    if (nmfQuestionIndex < nmfQuizList.length - 1) {
      setNmfQuestionIndex(prev => prev + 1);
    } else {
      setNmfQuestionIndex(0);
      setActivePracticeTab('hub');
    }
  };

  const handleTestWord = () => {
    if (dactylologyInput.trim().toUpperCase() === currentWord) {
      soundService.playCorrect();
      setShowDactylologySuccess(true);
      setTimeout(() => {
        setShowDactylologySuccess(false);
        setDactylologyInput('');
        setCurrentWordIndex(prev => (prev + 1) % wordsList.length);
      }, 1200);
    } else {
      soundService.playIncorrect();
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-2 sm:px-4 py-4 space-y-6 select-none animate-fade-in">
      
      {/* Top Practice Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => {
            soundService.playTap();
            setActivePracticeTab('hub');
          }}
          className={`px-3.5 py-2 rounded-xl font-bold text-xs shrink-0 transition-colors cursor-pointer ${
            activePracticeTab === 'hub'
              ? 'bg-[#0D9488] text-white border-b-2 border-[#0F766E]'
              : 'bg-[#F3F0EA] text-[#57534E] hover:bg-[#E8E2D9] hover:text-[#1C1917]'
          }`}
        >
          Todos os treinos
        </button>
        <button
          onClick={() => {
            soundService.playTap();
            setActivePracticeTab('parameters_lab');
          }}
          className={`px-3.5 py-2 rounded-xl font-bold text-xs shrink-0 transition-colors cursor-pointer ${
            activePracticeTab === 'parameters_lab'
              ? 'bg-[#0D9488] text-white border-b-2 border-[#0F766E]'
              : 'bg-[#F3F0EA] text-[#57534E] hover:bg-[#E8E2D9] hover:text-[#1C1917]'
          }`}
        >
          5 Parâmetros
        </button>
        <button
          onClick={() => {
            soundService.playTap();
            setActivePracticeTab('nmf_quiz');
          }}
          className={`px-3.5 py-2 rounded-xl font-bold text-xs shrink-0 transition-colors cursor-pointer ${
            activePracticeTab === 'nmf_quiz'
              ? 'bg-[#0D9488] text-white border-b-2 border-[#0F766E]'
              : 'bg-[#F3F0EA] text-[#57534E] hover:bg-[#E8E2D9] hover:text-[#1C1917]'
          }`}
        >
          Expressões (NMF)
        </button>
        <button
          onClick={() => {
            soundService.playTap();
            initMemoryGame();
            setActivePracticeTab('memory_game');
          }}
          className={`px-3.5 py-2 rounded-xl font-bold text-xs shrink-0 transition-colors cursor-pointer ${
            activePracticeTab === 'memory_game'
              ? 'bg-[#0D9488] text-white border-b-2 border-[#0F766E]'
              : 'bg-[#F3F0EA] text-[#57534E] hover:bg-[#E8E2D9] hover:text-[#1C1917]'
          }`}
        >
          Memória de sinais
        </button>
      </div>

      {/* 1. MAIN PRACTICE HUB OVERVIEW */}
      {activePracticeTab === 'hub' && (
        <div className="space-y-5 animate-fade-in">
          {/* Library Overview Card */}
          <div className="bg-[#0D9488] rounded-2xl p-5 sm:p-6 text-white border-b-4 border-[#0F766E] space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5 max-w-lg">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#CCFBF1]">
                  Vocabulário completo
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
                  Biblioteca com 255 Sinais
                </h2>
                <p className="text-xs sm:text-sm text-white/90 font-medium leading-relaxed">
                  Consulte vídeos e significados dos sinais em Libras antes de praticar nas lições.
                </p>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
            </div>

            <button
              onClick={() => {
                soundService.playTap();
                if (onOpenDictionary) onOpenDictionary();
              }}
              className="tactile-btn w-full py-3.5 px-6 rounded-xl bg-white text-[#0F766E] hover:bg-[#F0FDFA] font-bold text-xs uppercase tracking-wider border-b-4 border-[#99F6E4] cursor-pointer flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Abrir biblioteca</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Activity 2: Interactive Datilologia Trainer */}
          <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#FFF1E6] text-[#EA580C] flex items-center justify-center shrink-0">
                <Type className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-display font-bold text-base text-[#1C1917]">
                  Treino rápido de datilologia
                </h4>
                <p className="text-xs text-[#57534E] font-medium">
                  Palavra alvo:{' '}
                  <span className="font-bold text-[#EA580C] tracking-widest">{currentWord}</span>
                </p>
              </div>
            </div>

            {/* Handshape Sequence Demonstration */}
            <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#FAF9F6] border border-[#E8E2D9] overflow-x-auto">
              {currentWord.split('').map((letter, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center gap-1 bg-white px-3 py-2 rounded-lg border border-[#E8E2D9]"
                >
                  <Hand className="w-4 h-4 text-[#0D9488]" />
                  <span className="text-xs font-bold text-[#EA580C]">{letter}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={dactylologyInput}
                onChange={(e) => setDactylologyInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleTestWord()}
                placeholder="Digite a palavra soletrada..."
                className="flex-1 px-4 py-3 rounded-xl border border-[#E8E2D9] font-bold text-sm uppercase text-[#1C1917] focus:outline-none focus:border-[#0D9488]"
              />
              <button
                onClick={handleTestWord}
                className="tactile-btn px-5 py-3 rounded-xl bg-[#EA580C] hover:bg-[#DC4F06] text-white font-bold text-xs uppercase tracking-wider border-b-[3px] border-[#9A3412] cursor-pointer"
              >
                {showDactylologySuccess ? 'Correto' : 'Verificar'}
              </button>
            </div>
          </div>

          {/* Activity 3 & 4 Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] text-[#0D9488] flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-base text-[#1C1917]">
                    5 Parâmetros da Libras
                  </h4>
                  <p className="text-xs text-[#57534E] font-medium mt-1">
                    Revise CM, ponto de articulação, movimento, orientação e NMF.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  soundService.playTap();
                  setActivePracticeTab('parameters_lab');
                }}
                className="tactile-btn w-full py-2.5 px-4 rounded-xl bg-[#EA580C] hover:bg-[#DC4F06] text-white font-bold text-xs uppercase tracking-wider border-b-[3px] border-[#9A3412] cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Praticar parâmetros</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#FFF1E6] text-[#EA580C] flex items-center justify-center">
                  <Smile className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-base text-[#1C1917]">
                    Expressões Faciais (NMF)
                  </h4>
                  <p className="text-xs text-[#57534E] font-medium mt-1">
                    Entenda o papel das sobrancelhas, olhar e cabeça nas perguntas e negações.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  soundService.playTap();
                  setActivePracticeTab('nmf_quiz');
                }}
                className="tactile-btn w-full py-2.5 px-4 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs uppercase tracking-wider border-b-[3px] border-[#115E59] cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Treinar expressões</span>
              </button>
            </div>
          </div>

          {/* Activity 5: Memory Game */}
          <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F3F0EA] text-[#1C1917] flex items-center justify-center shrink-0">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display font-bold text-base text-[#1C1917]">
                  Jogo da Memória dos Sinais
                </h4>
                <p className="text-xs text-[#57534E] font-medium">
                  Encontre os pares de sinais e significados.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                soundService.playTap();
                initMemoryGame();
                setActivePracticeTab('memory_game');
              }}
              className="tactile-btn px-5 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#DC4F06] text-white font-bold text-xs uppercase tracking-wider border-b-[3px] border-[#9A3412] cursor-pointer shrink-0"
            >
              Jogar
            </button>
          </div>
        </div>
      )}

      {/* 2. PARAMETERS LAB QUIZ VIEW */}
      {activePracticeTab === 'parameters_lab' && (
        <div className="bg-white rounded-2xl border border-[#E8E2D9] p-6 space-y-5 animate-scale-in">
          <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] text-[#0D9488] flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-[#1C1917]">
                  5 Parâmetros da Libras
                </h3>
                <span className="text-xs font-semibold text-[#57534E]">
                  Questão {paramQuestionIndex + 1} de {paramQuizList.length}
                </span>
              </div>
            </div>

            <button
              onClick={() => setActivePracticeTab('hub')}
              className="text-xs font-bold text-[#EA580C] hover:underline cursor-pointer"
            >
              Voltar
            </button>
          </div>

          <div className="space-y-2 text-center py-2">
            <h4 className="font-display text-lg font-bold text-[#1C1917]">
              {paramQuizList[paramQuestionIndex].question}
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {paramQuizList[paramQuestionIndex].options.map((opt, idx) => {
              const isSelected = paramSelectedOption === idx;
              const isCorrect = idx === paramQuizList[paramQuestionIndex].correctIndex;
              let btnStyle =
                'bg-white border-[#E8E2D9] border-b-[#D6CFC5] text-[#1C1917] hover:bg-[#FAF9F6]';

              if (paramAnswerStatus !== 'idle') {
                if (isCorrect) {
                  btnStyle = 'bg-[#F0FDFA] border-[#0D9488] border-b-[#0F766E] text-[#0F766E]';
                } else if (isSelected && !isCorrect) {
                  btnStyle = 'bg-[#FFF1F2] border-[#E11D48] border-b-[#9F1239] text-[#BE123C]';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleParamCheck(idx)}
                  className={`tactile-btn p-4 rounded-xl border border-b-4 font-bold text-sm text-left cursor-pointer flex items-center justify-between ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {paramAnswerStatus !== 'idle' && isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-[#0D9488] shrink-0" />
                  )}
                  {paramAnswerStatus !== 'idle' && isSelected && !isCorrect && (
                    <AlertCircle className="w-5 h-5 text-[#E11D48] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {paramAnswerStatus !== 'idle' && (
            <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E8E2D9] space-y-3 animate-fade-in">
              <p className="text-xs text-[#57534E] font-medium">
                <strong className="text-[#1C1917]">Explicação:</strong>{' '}
                {paramQuizList[paramQuestionIndex].explanation}
              </p>
              <button
                onClick={handleParamNext}
                className="tactile-btn w-full py-3 px-4 rounded-xl bg-[#EA580C] hover:bg-[#DC4F06] text-white font-bold text-xs uppercase tracking-wider border-b-4 border-[#9A3412] cursor-pointer"
              >
                {paramQuestionIndex < paramQuizList.length - 1
                  ? 'Próxima questão'
                  : 'Concluir treino'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. NMF (EXPRESSÕES FACIAIS) QUIZ VIEW */}
      {activePracticeTab === 'nmf_quiz' && (
        <div className="bg-white rounded-2xl border border-[#E8E2D9] p-6 space-y-5 animate-scale-in">
          <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF1E6] text-[#EA580C] flex items-center justify-center">
                <Smile className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-[#1C1917]">
                  Expressões Não-Manuais (NMF)
                </h3>
                <span className="text-xs font-semibold text-[#57534E]">
                  Desafio {nmfQuestionIndex + 1} de {nmfQuizList.length}
                </span>
              </div>
            </div>

            <button
              onClick={() => setActivePracticeTab('hub')}
              className="text-xs font-bold text-[#EA580C] hover:underline cursor-pointer"
            >
              Voltar
            </button>
          </div>

          <div className="space-y-2 text-center py-2">
            <h4 className="font-display text-lg font-bold text-[#1C1917]">
              {nmfQuizList[nmfQuestionIndex].prompt}
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {nmfQuizList[nmfQuestionIndex].options.map((opt, idx) => {
              const isSelected = nmfSelectedOption === idx;
              const isCorrect = idx === nmfQuizList[nmfQuestionIndex].correctIndex;
              let btnStyle =
                'bg-white border-[#E8E2D9] border-b-[#D6CFC5] text-[#1C1917] hover:bg-[#FAF9F6]';

              if (nmfAnswerStatus !== 'idle') {
                if (isCorrect) {
                  btnStyle = 'bg-[#F0FDFA] border-[#0D9488] border-b-[#0F766E] text-[#0F766E]';
                } else if (isSelected && !isCorrect) {
                  btnStyle = 'bg-[#FFF1F2] border-[#E11D48] border-b-[#9F1239] text-[#BE123C]';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleNmfCheck(idx)}
                  className={`tactile-btn p-4 rounded-xl border border-b-4 font-bold text-sm text-left cursor-pointer flex items-center justify-between ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {nmfAnswerStatus !== 'idle' && isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-[#0D9488] shrink-0" />
                  )}
                  {nmfAnswerStatus !== 'idle' && isSelected && !isCorrect && (
                    <AlertCircle className="w-5 h-5 text-[#E11D48] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {nmfAnswerStatus !== 'idle' && (
            <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E8E2D9] space-y-3 animate-fade-in">
              <p className="text-xs text-[#57534E] font-medium">
                <strong className="text-[#1C1917]">Regra:</strong>{' '}
                {nmfQuizList[nmfQuestionIndex].explanation}
              </p>
              <button
                onClick={handleNmfNext}
                className="tactile-btn w-full py-3 px-4 rounded-xl bg-[#EA580C] hover:bg-[#DC4F06] text-white font-bold text-xs uppercase tracking-wider border-b-4 border-[#9A3412] cursor-pointer"
              >
                {nmfQuestionIndex < nmfQuizList.length - 1
                  ? 'Próxima pergunta'
                  : 'Concluir treino'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. JOGO DA MEMÓRIA */}
      {activePracticeTab === 'memory_game' && (
        <div className="bg-white rounded-2xl border border-[#E8E2D9] p-6 space-y-5 animate-scale-in">
          <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF1E6] text-[#EA580C] flex items-center justify-center">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-[#1C1917]">
                  Jogo da Memória de Sinais
                </h3>
                <span className="text-xs font-semibold text-[#57534E]">
                  Pares encontrados: {memoryMatchesCount} de 6
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={initMemoryGame}
                className="p-2 rounded-xl bg-[#F3F0EA] text-[#57534E] hover:text-[#1C1917] cursor-pointer"
                title="Reiniciar"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActivePracticeTab('hub')}
                className="text-xs font-bold text-[#EA580C] hover:underline cursor-pointer"
              >
                Sair
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {memoryCards.map((card) => {
              const isRevealed = card.isFlipped || card.isMatched;
              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card)}
                  disabled={card.isMatched}
                  className={`
                    tactile-btn h-24 sm:h-28 rounded-xl border border-b-4 font-bold text-xs cursor-pointer flex flex-col items-center justify-center p-2 text-center select-none
                    ${card.isMatched
                      ? 'bg-[#F0FDFA] border-[#99F6E4] border-b-[#0D9488] text-[#0F766E] opacity-80'
                      : isRevealed
                      ? 'bg-white border-[#EA580C] border-b-[#9A3412] text-[#1C1917]'
                      : 'bg-[#0D9488] border-[#0F766E] border-b-[#115E59] text-white'}
                  `}
                >
                  {isRevealed ? (
                    <div className="space-y-1 animate-fade-in">
                      <span className="text-[10px] uppercase font-bold text-[#78716C] block">
                        {card.type === 'sign' ? 'Sinal' : 'Palavra'}
                      </span>
                      <div className="font-bold text-xs line-clamp-2">{card.label}</div>
                    </div>
                  ) : (
                    <Hand className="w-5 h-5 text-white/90" />
                  )}
                </button>
              );
            })}
          </div>

          {memoryGameOver && (
            <div className="p-5 rounded-2xl bg-[#0D9488] text-white text-center space-y-3 animate-scale-in">
              <Trophy className="w-8 h-8 mx-auto text-white" />
              <h4 className="font-display text-xl font-bold">
                Todos os pares encontrados
              </h4>
              <div className="flex justify-center gap-3 pt-1">
                <button
                  onClick={initMemoryGame}
                  className="tactile-btn py-2.5 px-5 rounded-xl bg-white text-[#0F766E] font-bold text-xs uppercase border-b-[3px] border-[#99F6E4] cursor-pointer"
                >
                  Jogar novamente
                </button>
                <button
                  onClick={() => setActivePracticeTab('hub')}
                  className="tactile-btn py-2.5 px-5 rounded-xl bg-[#0F766E] text-white font-bold text-xs uppercase border-b-[3px] border-[#115E59] cursor-pointer"
                >
                  Voltar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
