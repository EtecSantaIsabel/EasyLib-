import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Sparkles, 
  RotateCcw, 
  Zap, 
  Heart, 
  Play,
  Layers,
  BookOpen,
  Camera,
  Smile,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Trophy,
  Flame,
  Award,
  ArrowRight
} from 'lucide-react';
import { UserProfile, PathNode, Unit, SignData } from '../types';
import { LIBRAS_SECTIONS, LIBRAS_DICTIONARY } from '../data/librasData';
import { soundService } from '../services/soundService';

interface PracticeHubViewProps {
  userProfile: UserProfile;
  onStartPractice: (node: PathNode, unit: Unit) => void;
  onRefillHearts: () => void;
  onOpenDictionary?: () => void;
  onOpenCameraStudio?: () => void;
}

export const PracticeHubView: React.FC<PracticeHubViewProps> = ({
  userProfile,
  onStartPractice,
  onRefillHearts,
  onOpenDictionary,
  onOpenCameraStudio
}) => {
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
    // Shuffle cards
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
        // Matched!
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
        // Did not match
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

  const sampleUnit = LIBRAS_SECTIONS[0]?.units[0];
  const sampleNode = sampleUnit?.nodes[0];

  const handleLaunch = () => {
    if (!sampleNode || !sampleUnit) return;
    soundService.playTap();
    onStartPractice(sampleNode, sampleUnit);
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
      
      {/* Top Practice Navigation Pill Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => {
            soundService.playTap();
            setActivePracticeTab('hub');
          }}
          className={`px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-wider shrink-0 transition-all cursor-pointer ${activePracticeTab === 'hub' ? 'bg-[#FF6B00] text-white shadow-md' : 'bg-white border-2 border-[#F1EAE2] text-[#78716C] hover:bg-[#FFF7ED]'}`}
        >
          🏋️ Todos os Treinos
        </button>
        <button
          onClick={() => {
            soundService.playTap();
            setActivePracticeTab('parameters_lab');
          }}
          className={`px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-wider shrink-0 transition-all cursor-pointer ${activePracticeTab === 'parameters_lab' ? 'bg-[#FF6B00] text-white shadow-md' : 'bg-white border-2 border-[#F1EAE2] text-[#78716C] hover:bg-[#FFF7ED]'}`}
        >
          🧠 5 Parâmetros
        </button>
        <button
          onClick={() => {
            soundService.playTap();
            setActivePracticeTab('nmf_quiz');
          }}
          className={`px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-wider shrink-0 transition-all cursor-pointer ${activePracticeTab === 'nmf_quiz' ? 'bg-[#FF6B00] text-white shadow-md' : 'bg-white border-2 border-[#F1EAE2] text-[#78716C] hover:bg-[#FFF7ED]'}`}
        >
          🎭 Expressões (NMF)
        </button>
        <button
          onClick={() => {
            soundService.playTap();
            initMemoryGame();
            setActivePracticeTab('memory_game');
          }}
          className={`px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-wider shrink-0 transition-all cursor-pointer ${activePracticeTab === 'memory_game' ? 'bg-[#FF6B00] text-white shadow-md' : 'bg-white border-2 border-[#F1EAE2] text-[#78716C] hover:bg-[#FFF7ED]'}`}
        >
          🎴 Jogo da Memória
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. MAIN PRACTICE HUB OVERVIEW */}
      {/* ========================================================================= */}
      {activePracticeTab === 'hub' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* ⭐ STAR FEATURE: ESPELHO DE LIBRAS NA CÂMERA EM TELA CHEIA ⭐ */}
          <div className="bg-gradient-to-br from-[#FF6B00] via-[#F97316] to-[#EA580C] rounded-3xl p-6 text-white border-b-6 border-[#9A3412] shadow-xl relative overflow-hidden space-y-4">
            
            {/* Background Graphic Watermark */}
            <div className="absolute -right-6 -bottom-6 text-9xl opacity-15 pointer-events-none">
              🤟
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1.5 max-w-lg">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full text-[#FEF3C7] shadow-inner">
                  <Camera className="w-4 h-4" />
                  <span>Estúdio de Câmera em Tela Cheia</span>
                </span>
                <h2 className="text-2xl sm:text-3xl font-black leading-tight">
                  Espelho Libras: Treine com seu Corpo
                </h2>
                <p className="text-xs sm:text-sm text-white/95 font-medium leading-relaxed">
                  Abra a câmera na tela toda para visualizar seu enquadramento anatômico, espaço neutro de sinalização, mãos e expressões faciais (NMF).
                </p>
              </div>

              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-4xl shadow-inner shrink-0 animate-pulse">
                📹
              </div>
            </div>

            {/* Quick feature tags */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 relative z-10 text-[11px] font-black">
              <div className="p-2 rounded-xl bg-white/10 border border-white/20 text-center">
                ✨ Tela Cheia Real
              </div>
              <div className="p-2 rounded-xl bg-white/10 border border-white/20 text-center">
                📐 Guia de Enquadramento
              </div>
              <div className="p-2 rounded-xl bg-white/10 border border-white/20 text-center">
                🎯 5 Parâmetros HUD
              </div>
              <div className="p-2 rounded-xl bg-white/10 border border-white/20 text-center">
                📸 Foto com Moldura
              </div>
            </div>

            {/* Big Launch Button */}
            <button
              onClick={() => {
                soundService.playTap();
                if (onOpenCameraStudio) onOpenCameraStudio();
              }}
              className="w-full py-4 px-6 rounded-2xl bg-white text-[#EA580C] hover:bg-[#FFF7ED] font-black text-sm uppercase tracking-wider border-b-4 border-[#FED7AA] cursor-pointer shadow-lg transition-all active:translate-y-1 flex items-center justify-center gap-3 relative z-10"
            >
              <Camera className="w-5 h-5 fill-[#EA580C]" />
              <span>Abrir Câmera em Tela Cheia para Praticar</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Activity 2: Interactive Datilologia Trainer */}
          <div className="bg-white rounded-3xl border-2 border-[#F1EAE2] border-b-6 border-[#FED7AA] p-5 space-y-4 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FFEDD5] text-[#EA580C] flex items-center justify-center text-2xl border border-[#FDBA74] shrink-0">
                🔤
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-base text-[#292524]">Treinador Rápido de Datilologia</h4>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#FFEDD5] text-[#C2410C] border border-[#FDBA74]">
                    +15 XP
                  </span>
                </div>
                <p className="text-xs text-[#78716C] font-semibold">
                  Soletrando a palavra: <span className="font-black text-[#EA580C] tracking-widest">{currentWord}</span>
                </p>
              </div>
            </div>

            {/* Handshape Sequence Demonstration */}
            <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-[#FFFDF9] border border-[#F1EAE2] overflow-x-auto">
              {currentWord.split('').map((letter, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1 bg-white px-3 py-2 rounded-xl border border-[#F1EAE2] shadow-xs">
                  <span className="text-2xl">🖐️</span>
                  <span className="text-xs font-black text-[#EA580C]">{letter}</span>
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
                className="flex-1 px-4 py-3 rounded-2xl border-2 border-[#F1EAE2] font-black text-sm uppercase text-[#292524] focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FFEDD5]"
              />
              <button
                onClick={handleTestWord}
                className="px-6 py-3 rounded-2xl bg-[#FF6B00] hover:bg-[#EA580C] text-white font-black text-xs uppercase tracking-wider border-b-4 border-[#9A3412] cursor-pointer shadow-sm transition-all active:translate-y-0.5"
              >
                {showDactylologySuccess ? '✓ Correto!' : 'Verificar'}
              </button>
            </div>
          </div>

          {/* Activity 3 & 4 Grid: 5 Parâmetros & NMF Modules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* 5 Parâmetros Lab */}
            <div className="bg-white rounded-3xl border-2 border-[#F1EAE2] border-b-6 border-[#FED7AA] p-5 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center text-2xl border border-[#FDE68A]">
                  🧠
                </div>
                <div>
                  <h4 className="font-black text-base text-[#292524]">Laboratório dos 5 Parâmetros</h4>
                  <p className="text-xs text-[#78716C] font-semibold mt-1">
                    Teste seu conhecimento sobre CM, Ponto de Articulação, Movimento, Orientação e NMF.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  soundService.playTap();
                  setActivePracticeTab('parameters_lab');
                }}
                className="w-full py-3 px-4 rounded-2xl bg-[#FF6B00] hover:bg-[#EA580C] text-white font-black text-xs uppercase tracking-wider border-b-4 border-[#9A3412] cursor-pointer shadow-sm flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Praticar Parâmetros (+20 XP)</span>
              </button>
            </div>

            {/* NMF Expressões Faciais */}
            <div className="bg-white rounded-3xl border-2 border-[#F1EAE2] border-b-6 border-[#FED7AA] p-5 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#FFEDD5] text-[#EA580C] flex items-center justify-center text-2xl border border-[#FDBA74]">
                  🎭
                </div>
                <div>
                  <h4 className="font-black text-base text-[#292524]">Expressões Não-Manuais (NMF)</h4>
                  <p className="text-xs text-[#78716C] font-semibold mt-1">
                    Aprenda o papel das sobrancelhas, olhos e movimento de cabeça nas frases de Libras.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  soundService.playTap();
                  setActivePracticeTab('nmf_quiz');
                }}
                className="w-full py-3 px-4 rounded-2xl bg-[#EA580C] hover:bg-[#C2410C] text-white font-black text-xs uppercase tracking-wider border-b-4 border-[#7C2D12] cursor-pointer shadow-sm flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Treinar Expressões (+20 XP)</span>
              </button>
            </div>

          </div>

          {/* Activity 5: Jogo da Memória de Sinais */}
          <div className="bg-white rounded-3xl border-2 border-[#F1EAE2] border-b-6 border-[#FED7AA] p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center text-2xl border border-[#FDE68A]">
                  🎴
                </div>
                <div>
                  <h4 className="font-black text-base text-[#292524]">Jogo da Memória dos Sinais</h4>
                  <p className="text-xs text-[#78716C] font-semibold">
                    Encontre os pares de sinais e traduções no menor tempo possível!
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  soundService.playTap();
                  initMemoryGame();
                  setActivePracticeTab('memory_game');
                }}
                className="px-5 py-2.5 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-black text-xs uppercase tracking-wider border-b-4 border-[#78350F] cursor-pointer shadow-sm"
              >
                Jogar Agora
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PARAMETERS LAB QUIZ VIEW */}
      {/* ========================================================================= */}
      {activePracticeTab === 'parameters_lab' && (
        <div className="bg-white rounded-3xl border-2 border-[#F1EAE2] border-b-6 border-[#FED7AA] p-6 space-y-6 shadow-sm animate-scale-in">
          
          <div className="flex items-center justify-between border-b border-[#F1EAE2] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FFEDD5] text-[#EA580C] flex items-center justify-center text-xl border border-[#FDBA74]">
                🧠
              </div>
              <div>
                <h3 className="text-lg font-black text-[#292524]">Laboratório dos 5 Parâmetros</h3>
                <span className="text-xs font-bold text-[#78716C]">
                  Questão {paramQuestionIndex + 1} de {paramQuizList.length}
                </span>
              </div>
            </div>

            <button
              onClick={() => setActivePracticeTab('hub')}
              className="text-xs font-black text-[#EA580C] hover:underline cursor-pointer"
            >
              Voltar aos Treinos
            </button>
          </div>

          {/* Question Prompt */}
          <div className="space-y-3">
            <div className="text-center py-2">
              <span className="text-5xl">{paramQuizList[paramQuestionIndex].glyph}</span>
            </div>
            <h4 className="text-lg font-black text-[#292524] text-center">
              {paramQuizList[paramQuestionIndex].question}
            </h4>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-2.5">
            {paramQuizList[paramQuestionIndex].options.map((opt, idx) => {
              const isSelected = paramSelectedOption === idx;
              const isCorrect = idx === paramQuizList[paramQuestionIndex].correctIndex;
              let btnStyle = 'bg-white border-[#F1EAE2] border-b-[#FED7AA] text-[#292524] hover:bg-[#FFF7ED]';

              if (paramAnswerStatus !== 'idle') {
                if (isCorrect) {
                  btnStyle = 'bg-[#FFEDD5] border-[#FF6B00] text-[#C2410C] font-black';
                } else if (isSelected && !isCorrect) {
                  btnStyle = 'bg-[#FFE4E6] border-[#E11D48] text-[#E11D48]';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleParamCheck(idx)}
                  className={`p-4 rounded-2xl border-2 border-b-4 font-black text-sm text-left transition-all cursor-pointer flex items-center justify-between ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {paramAnswerStatus !== 'idle' && isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-[#EA580C]" />
                  )}
                  {paramAnswerStatus !== 'idle' && isSelected && !isCorrect && (
                    <AlertCircle className="w-5 h-5 text-[#E11D48]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation & Next */}
          {paramAnswerStatus !== 'idle' && (
            <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#FED7AA] space-y-3 animate-fade-in">
              <p className="text-xs text-[#78716C] font-semibold">
                💡 <strong className="text-[#292524]">Explicação:</strong> {paramQuizList[paramQuestionIndex].explanation}
              </p>
              <button
                onClick={handleParamNext}
                className="w-full py-3 px-4 rounded-2xl bg-[#FF6B00] hover:bg-[#EA580C] text-white font-black text-xs uppercase tracking-wider border-b-4 border-[#9A3412] cursor-pointer shadow-md"
              >
                {paramQuestionIndex < paramQuizList.length - 1 ? 'Próxima Questão' : 'Concluir Treino (+20 XP)'}
              </button>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. NMF (EXPRESSÕES FACIAIS) QUIZ VIEW */}
      {/* ========================================================================= */}
      {activePracticeTab === 'nmf_quiz' && (
        <div className="bg-white rounded-3xl border-2 border-[#F1EAE2] border-b-6 border-[#FED7AA] p-6 space-y-6 shadow-sm animate-scale-in">
          
          <div className="flex items-center justify-between border-b border-[#F1EAE2] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FFEDD5] text-[#EA580C] flex items-center justify-center text-xl border border-[#FDBA74]">
                🎭
              </div>
              <div>
                <h3 className="text-lg font-black text-[#292524]">Expressões Não-Manuais (NMF)</h3>
                <span className="text-xs font-bold text-[#78716C]">
                  Desafio {nmfQuestionIndex + 1} de {nmfQuizList.length}
                </span>
              </div>
            </div>

            <button
              onClick={() => setActivePracticeTab('hub')}
              className="text-xs font-black text-[#EA580C] hover:underline cursor-pointer"
            >
              Voltar aos Treinos
            </button>
          </div>

          {/* Prompt */}
          <div className="space-y-3 text-center">
            <span className="text-5xl">{nmfQuizList[nmfQuestionIndex].glyph}</span>
            <h4 className="text-lg font-black text-[#292524]">
              {nmfQuizList[nmfQuestionIndex].prompt}
            </h4>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-2.5">
            {nmfQuizList[nmfQuestionIndex].options.map((opt, idx) => {
              const isSelected = nmfSelectedOption === idx;
              const isCorrect = idx === nmfQuizList[nmfQuestionIndex].correctIndex;
              let btnStyle = 'bg-white border-[#F1EAE2] border-b-[#FED7AA] text-[#292524] hover:bg-[#FFF7ED]';

              if (nmfAnswerStatus !== 'idle') {
                if (isCorrect) {
                  btnStyle = 'bg-[#FFEDD5] border-[#FF6B00] text-[#C2410C] font-black';
                } else if (isSelected && !isCorrect) {
                  btnStyle = 'bg-[#FFE4E6] border-[#E11D48] text-[#E11D48]';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleNmfCheck(idx)}
                  className={`p-4 rounded-2xl border-2 border-b-4 font-black text-sm text-left transition-all cursor-pointer flex items-center justify-between ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {nmfAnswerStatus !== 'idle' && isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-[#EA580C]" />
                  )}
                  {nmfAnswerStatus !== 'idle' && isSelected && !isCorrect && (
                    <AlertCircle className="w-5 h-5 text-[#E11D48]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation & Next */}
          {nmfAnswerStatus !== 'idle' && (
            <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#FED7AA] space-y-3 animate-fade-in">
              <p className="text-xs text-[#78716C] font-semibold">
                💡 <strong className="text-[#292524]">Regra de Ouro:</strong> {nmfQuizList[nmfQuestionIndex].explanation}
              </p>
              <button
                onClick={handleNmfNext}
                className="w-full py-3 px-4 rounded-2xl bg-[#FF6B00] hover:bg-[#EA580C] text-white font-black text-xs uppercase tracking-wider border-b-4 border-[#9A3412] cursor-pointer shadow-md"
              >
                {nmfQuestionIndex < nmfQuizList.length - 1 ? 'Próxima Pergunta' : 'Finalizar Treino NMF (+20 XP)'}
              </button>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. JOGO DA MEMÓRIA DOS SINAIS DE LIBRAS */}
      {/* ========================================================================= */}
      {activePracticeTab === 'memory_game' && (
        <div className="bg-white rounded-3xl border-2 border-[#F1EAE2] border-b-6 border-[#FED7AA] p-6 space-y-6 shadow-sm animate-scale-in">
          
          <div className="flex items-center justify-between border-b border-[#F1EAE2] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center text-xl border border-[#FDE68A]">
                🎴
              </div>
              <div>
                <h3 className="text-lg font-black text-[#292524]">Jogo da Memória de Sinais</h3>
                <span className="text-xs font-bold text-[#78716C]">
                  Pares encontrados: {memoryMatchesCount} de 6
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={initMemoryGame}
                className="p-2 rounded-xl bg-[#FFF7ED] text-[#EA580C] hover:bg-[#FFEDD5] border border-[#FDBA74] cursor-pointer"
                title="Reiniciar Jogo"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActivePracticeTab('hub')}
                className="text-xs font-black text-[#EA580C] hover:underline cursor-pointer"
              >
                Sair
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {memoryCards.map((card) => {
              const isRevealed = card.isFlipped || card.isMatched;
              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card)}
                  disabled={card.isMatched}
                  className={`
                    h-24 sm:h-28 rounded-2xl border-2 border-b-4 font-black text-xs transition-all duration-200 cursor-pointer flex flex-col items-center justify-center p-2 text-center select-none active:scale-95
                    ${card.isMatched
                      ? 'bg-[#FFEDD5] border-[#FDBA74] text-[#C2410C] opacity-80'
                      : isRevealed
                      ? 'bg-white border-[#FF6B00] text-[#292524] shadow-md'
                      : 'bg-gradient-to-br from-[#FF6B00] to-[#EA580C] border-[#9A3412] text-white shadow-sm'}
                  `}
                >
                  {isRevealed ? (
                    <div className="space-y-1 animate-fade-in">
                      <span className="text-2xl sm:text-3xl">{card.glyph}</span>
                      <div className="font-black text-[11px] sm:text-xs line-clamp-1">{card.label}</div>
                    </div>
                  ) : (
                    <span className="text-2xl text-white/90">🤟</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Victory Modal inside view */}
          {memoryGameOver && (
            <div className="p-6 rounded-3xl bg-gradient-to-r from-[#FF6B00] to-[#EA580C] text-white text-center space-y-3 shadow-xl animate-scale-in">
              <span className="text-5xl">🏆</span>
              <h4 className="text-2xl font-black">Parabéns! Todos os pares encontrados!</h4>
              <p className="text-xs font-bold text-white/90">
                Sua memória visual para sinais em Libras está afiada!
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={initMemoryGame}
                  className="py-3 px-6 rounded-2xl bg-white text-[#EA580C] font-black text-xs uppercase tracking-wider shadow-md hover:bg-[#FFF7ED] cursor-pointer"
                >
                  Jogar Novamente
                </button>
                <button
                  onClick={() => setActivePracticeTab('hub')}
                  className="py-3 px-6 rounded-2xl bg-[#9A3412] text-white font-black text-xs uppercase tracking-wider shadow-md hover:bg-[#7C2D12] cursor-pointer"
                >
                  Voltar ao Hub
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
