import {
  LibrasTrackInfo,
  Section,
  Unit,
  PathNode,
  Exercise,
  SignData,
  Quest,
  Achievement,
  DuoOutfit,
  LeaderboardUser,
  MatchPair
} from '../types';
import { CatalogSign, findCatalogSign, LIBRAS_CATALOG_255 } from './librasCatalog255';

export const TRACK_STRUCTURE = {
  sections: 10,
  stagesPerSection: 20,
  activitiesPerStage: 12,
  exercisesPerActivity: 5
} as const;

export function getActivityNodeId(
  sectionNumber: number,
  stageNumber: number,
  activityNumber: number
): string {
  return `s${sectionNumber}_e${stageNumber}_a${activityNumber}`;
}

export const LIBRAS_TRACKS: LibrasTrackInfo[] = [
  {
    id: 'iniciante',
    title: 'Libras: Trilha Completa',
    subtitle: '10 seções progressivas · 255 sinais essenciais',
    badge: '🤟',
    totalUnits: 200
  }
];

export const LIBRAS_DICTIONARY: SignData[] = LIBRAS_CATALOG_255.slice(0, 24).map((cat) => ({
  id: cat.id,
  name: cat.palavra,
  category: cat.categoria,
  meaning: cat.significado,
  handshapeName: cat.palavra,
  handshapeIcon: '🤟',
  bodyLocation: cat.categoria,
  movementType: cat.significado,
  facialExpression: 'Natural',
  description: cat.significado,
  visualGlyph: '🤟',
  realVideoUrl: cat.videoUrl,
  validationStatus: 'validated'
}));

export interface SectionMeta {
  sectionNumber: number;
  title: string;
  description: string;
  themeColor: Unit['themeColor'];
  categories: string[];
  grammarTitle: string;
  grammarExplanation: string;
  exampleGloss: string;
  examplePt: string;
  culturalTip: string;
}

export const LIBRAS_SECTIONS_META: SectionMeta[] = [
  {
    sectionNumber: 1,
    title: 'Saudações & Primeiros Contatos',
    description: 'Cumprimentos, cortesia e diálogos iniciais em Libras.',
    themeColor: 'green',
    categories: ['Saudações', 'Cortesia e Comunicação'],
    grammarTitle: 'Cumprimentos e Expressão Facial',
    grammarExplanation: 'A expressão facial amigável acompanha as saudações e diferencia perguntas de afirmações.',
    exampleGloss: 'OI! TUDO-BEM?',
    examplePt: 'Oi! Tudo bem?',
    culturalTip: 'Manter o contato visual durante toda a conversa é sinal de atenção e respeito na cultura surda.'
  },
  {
    sectionNumber: 2,
    title: 'Pronomes & Perguntas',
    description: 'Pessoas do discurso, posse e pronomes interrogativos.',
    themeColor: 'teal',
    categories: ['Pronomes e Perguntas', 'Cortesia e Comunicação'],
    grammarTitle: 'Apontamento e Perguntas',
    grammarExplanation: 'O apontamento indica pronomes no espaço. Perguntas com QUEM, ONDE ou QUANDO levam sobrancelhas franzidas.',
    exampleGloss: 'VOCÊ MORAR ONDE?',
    examplePt: 'Onde você mora?',
    culturalTip: 'Em Libras, apontar para indicar pessoas ou lugares faz parte natural da gramática visual.'
  },
  {
    sectionNumber: 3,
    title: 'Família & Pessoas',
    description: 'Parentesco, relações próximas e pessoas.',
    themeColor: 'blue',
    categories: ['Família e Pessoas'],
    grammarTitle: 'Relações Familiares',
    grammarExplanation: 'Muitos sinais de parentesco combinam o marcador de gênero com a relação familiar.',
    exampleGloss: 'MINHA MÃE AMAR FAMÍLIA',
    examplePt: 'Minha mãe ama a família.',
    culturalTip: 'Quando ouvintes da família aprendem Libras, a convivência em casa fica mais próxima e acessível.'
  },
  {
    sectionNumber: 4,
    title: 'Animais',
    description: 'Animais domésticos, silvestres e marinhos.',
    themeColor: 'orange',
    categories: ['Animais'],
    grammarTitle: 'Características Visuais',
    grammarExplanation: 'Os sinais de animais destacam traços visíveis como orelhas, bico, focinho ou modo de andar.',
    exampleGloss: 'MEU CACHORRO BONITO',
    examplePt: 'Meu cachorro é bonito.',
    culturalTip: 'Animais de apoio para pessoas surdas são treinados para avisar campainhas e alertas sonoros.'
  },
  {
    sectionNumber: 5,
    title: 'Natureza & Ambiente',
    description: 'Elementos naturais, céu, clima e plantas.',
    themeColor: 'green',
    categories: ['Natureza'],
    grammarTitle: 'Intensidade Visual do Clima',
    grammarExplanation: 'A amplitude e o ritmo do movimento mostram se a chuva ou o vento são suaves ou intensos.',
    exampleGloss: 'HOJE SOL QUENTE',
    examplePt: 'Hoje está sol e quente.',
    culturalTip: 'Boletins do tempo com janela de Libras garantem acesso claro a alertas meteorológicos.'
  },
  {
    sectionNumber: 6,
    title: 'Alimentos & Bebidas',
    description: 'Frutas, refeições do dia a dia e bebidas.',
    themeColor: 'yellow',
    categories: ['Alimentos e Bebidas'],
    grammarTitle: 'Sinais Próximos à Boca',
    grammarExplanation: 'Grande parte dos sinais de alimentos e refeições é feita próxima à boca ou ao queixo.',
    exampleGloss: 'EU GOSTAR CAFÉ PÃO',
    examplePt: 'Eu gosto de café e pão.',
    culturalTip: 'Em encontros à mesa, lugares onde todos possam se enxergar facilitam o diálogo em Libras.'
  },
  {
    sectionNumber: 7,
    title: 'Casa & Escola',
    description: 'Cômodos, móveis, estudos e sala de aula.',
    themeColor: 'purple',
    categories: ['Casa e Escola'],
    grammarTitle: 'Organização Espacial',
    grammarExplanation: 'Ao descrever ambientes, você posiciona objetos e cômodos no espaço à sua frente.',
    exampleGloss: 'MINHA ESCOLA GRANDE',
    examplePt: 'Minha escola é grande.',
    culturalTip: 'Escolas bilíngues adotam a Libras como primeira língua e o Português escrito como segunda língua.'
  },
  {
    sectionNumber: 8,
    title: 'Trabalho & Lugares',
    description: 'Rotina profissional, finanças e pontos da cidade.',
    themeColor: 'blue',
    categories: ['Trabalho e Lugares'],
    grammarTitle: 'Referências da Cidade',
    grammarExplanation: 'Primeiro indica-se o local de referência e depois a ação realizada naquele espaço.',
    exampleGloss: 'AMANHÃ EU TRABALHAR MERCADO',
    examplePt: 'Amanhã eu vou trabalhar no mercado.',
    culturalTip: 'Intérpretes de Libras asseguram comunicação justa no trabalho e no atendimento ao público.'
  },
  {
    sectionNumber: 9,
    title: 'Transporte & Ações',
    description: 'Meios de locomoção e verbos do cotidiano.',
    themeColor: 'teal',
    categories: ['Transporte e Ações'],
    grammarTitle: 'Verbos e Direção',
    grammarExplanation: 'Verbos de deslocamento mostram no espaço o ponto de partida e o destino da ação.',
    exampleGloss: 'HOJE EU IR PRAIA ÔNIBUS',
    examplePt: 'Hoje eu vou à praia de ônibus.',
    culturalTip: 'Sinalizadores adaptam a trajetória das mãos para mostrar quem faz a ação e para onde vai.'
  },
  {
    sectionNumber: 10,
    title: 'Sentimentos, Tempo, Cores & Adjetivos',
    description: 'Emoções, noções de tempo, cores e qualidades.',
    themeColor: 'red',
    categories: ['Sentimentos', 'Tempo', 'Cores', 'Adjetivos'],
    grammarTitle: 'Linha do Tempo e Expressão',
    grammarExplanation: 'Passado fica atrás do corpo, presente no centro e futuro à frente, junto com a expressão emocional.',
    exampleGloss: 'HOJE EU FELIZ MUITO',
    examplePt: 'Hoje eu estou muito feliz.',
    culturalTip: 'Dominar expressões emocionais e temporais torna sua sinalização natural e fluente.'
  }
];

const CURATED_DACTYLOLOGY_WORDS = [
  'OI',
  'CASA',
  'MÃE',
  'PAI',
  'AMOR',
  'ÁGUA',
  'PÃO',
  'SOL',
  'LUA',
  'GATO',
  'FLOR',
  'PAZ',
  'DIA',
  'AZUL',
  'CAFÉ',
  'MAÇÃ',
  'LIVRO',
  'ESCOLA',
  'AMIGO',
  'LIBRAS'
];

const CURATED_GLOSS_CHALLENGES = [
  {
    portuguese: 'Onde você mora?',
    glossTokens: ['VOCÊ', 'MORAR', 'ONDE?'],
    distractors: ['ONTEM', 'DE', 'É']
  },
  {
    portuguese: 'Meu nome é Ana.',
    glossTokens: ['MEU', 'NOME', 'A-N-A'],
    distractors: ['É', 'PARA', 'DE']
  },
  {
    portuguese: 'Eu aprendo Libras hoje.',
    glossTokens: ['HOJE', 'EU', 'APRENDER', 'LIBRAS'],
    distractors: ['DE', 'ONTEM', 'PARA']
  },
  {
    portuguese: 'Eu gosto da minha família.',
    glossTokens: ['MINHA', 'FAMÍLIA', 'EU', 'GOSTAR'],
    distractors: ['DA', 'É', 'NÃO']
  },
  {
    portuguese: 'Amanhã eu vou trabalhar.',
    glossTokens: ['AMANHÃ', 'EU', 'TRABALHAR', 'IR'],
    distractors: ['VOU', 'PARA', 'ONTEM']
  },
  {
    portuguese: 'O cachorro é bonito.',
    glossTokens: ['CACHORRO', 'BONITO'],
    distractors: ['O', 'É', 'DE']
  },
  {
    portuguese: 'Eu quero beber água.',
    glossTokens: ['EU', 'ÁGUA', 'BEBER', 'QUERER'],
    distractors: ['DE', 'COMER', 'ONTEM']
  },
  {
    portuguese: 'Hoje está muito frio.',
    glossTokens: ['HOJE', 'FRIO', 'MUITO'],
    distractors: ['ESTÁ', 'O', 'AMANHÃ']
  }
];

const CURATED_DIALOGUES = [
  {
    speaker: 'Mariana',
    gloss: 'OI! TUDO-BEM?',
    portuguese: 'Oi! Tudo bem com você?',
    nmfType: 'interrogative_brows_up' as const,
    nmfLabel: 'Pergunta cordial',
    catalogSignId: 'tudo-bem',
    options: [
      {
        id: 'dlg_1',
        text: 'Tudo bem, e você?',
        gloss: 'TUDO-BEM, VOCÊ?',
        catalogSignId: 'tudo-bem'
      },
      {
        id: 'dlg_2',
        text: 'Minha casa é azul.',
        gloss: 'MINHA CASA AZUL',
        catalogSignId: 'casa'
      },
      {
        id: 'dlg_3',
        text: 'Eu quero água.',
        gloss: 'EU ÁGUA QUERER',
        catalogSignId: 'agua'
      }
    ],
    correctAnswer: 'Tudo bem, e você?'
  },
  {
    speaker: 'Gabriel',
    gloss: 'VOCÊ APRENDER LIBRAS GOSTAR?',
    portuguese: 'Você gosta de aprender Libras?',
    nmfType: 'interrogative_brows_up' as const,
    nmfLabel: 'Pergunta de Sim ou Não',
    catalogSignId: 'libras',
    options: [
      {
        id: 'dlg_1',
        text: 'Sim! Eu gosto de Libras.',
        gloss: 'SIM! EU LIBRAS GOSTAR',
        catalogSignId: 'gostar'
      },
      {
        id: 'dlg_2',
        text: 'Preciso ir dormir.',
        gloss: 'EU DORMIR PRECISAR',
        catalogSignId: 'dormir'
      },
      {
        id: 'dlg_3',
        text: 'Onde fica o mercado?',
        gloss: 'MERCADO ONDE?',
        catalogSignId: 'mercado'
      }
    ],
    correctAnswer: 'Sim! Eu gosto de Libras.'
  },
  {
    speaker: 'Camila',
    gloss: 'VOCÊ PRECISAR AJUDA?',
    portuguese: 'Você precisa de ajuda?',
    nmfType: 'interrogative_brows_up' as const,
    nmfLabel: 'Oferta de auxílio',
    catalogSignId: 'ajuda',
    options: [
      {
        id: 'dlg_1',
        text: 'Sim, por favor! Obrigado.',
        gloss: 'SIM POR-FAVOR! OBRIGADO',
        catalogSignId: 'obrigado'
      },
      {
        id: 'dlg_2',
        text: 'Gosto de suco de laranja.',
        gloss: 'SUCO LARANJA GOSTAR',
        catalogSignId: 'suco'
      },
      {
        id: 'dlg_3',
        text: 'Boa noite para você.',
        gloss: 'VOCÊ BOA-NOITE',
        catalogSignId: 'boa-noite'
      }
    ],
    correctAnswer: 'Sim, por favor! Obrigado.'
  }
];

function deterministicShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  for (let idx = arr.length - 1; idx > 0; idx--) {
    const swapIdx = (seed * (idx + 7) + idx * 13) % (idx + 1);
    const tmp = arr[idx];
    arr[idx] = arr[swapIdx];
    arr[swapIdx] = tmp;
  }
  return arr;
}

const sectionCatalogCache = new Map<number, CatalogSign[]>();

function getSignsForSection(sectionNumber: number): CatalogSign[] {
  const cached = sectionCatalogCache.get(sectionNumber);
  if (cached) return cached;

  const meta = LIBRAS_SECTIONS_META[sectionNumber - 1] || LIBRAS_SECTIONS_META[0];
  const matched = LIBRAS_CATALOG_255.filter((s) => meta.categories.includes(s.categoria));
  const pool = matched.length >= 8 ? matched : LIBRAS_CATALOG_255;
  sectionCatalogCache.set(sectionNumber, pool);
  return pool;
}

function getSignsForStage(sectionNumber: number, stageNumber: number): CatalogSign[] {
  const pool = getSignsForSection(sectionNumber);
  const start = ((stageNumber - 1) * 3) % pool.length;
  const result: CatalogSign[] = [];
  for (let k = 0; k < 4; k++) {
    result.push(pool[(start + k) % pool.length]);
  }
  return result;
}

const activityExercisesCache = new Map<string, Exercise[]>();

export function getExercisesForActivity(
  sectionNumber: number,
  stageNumber: number,
  activityNumber: number
): Exercise[] {
  const cacheKey = `${sectionNumber}_${stageNumber}_${activityNumber}`;
  const cached = activityExercisesCache.get(cacheKey);
  if (cached) return cached;

  const stageSigns = getSignsForStage(sectionNumber, stageNumber);
  const primaryCat = stageSigns[(activityNumber - 1) % stageSigns.length];
  const secondaryCat = stageSigns[activityNumber % stageSigns.length];
  const thirdCat = stageSigns[(activityNumber + 1) % stageSigns.length];
  const fourthCat = stageSigns[(activityNumber + 2) % stageSigns.length];

  const seed = sectionNumber * 97 + stageNumber * 31 + activityNumber * 13;

  const getDistractors = (targetId: string, count = 3): CatalogSign[] => {
    const res: CatalogSign[] = [];
    for (let offset = 1; res.length < count && offset < LIBRAS_CATALOG_255.length; offset++) {
      const candidate = LIBRAS_CATALOG_255[(seed + offset * 7) % LIBRAS_CATALOG_255.length];
      if (candidate.id !== targetId && !res.some((r) => r.id === candidate.id)) {
        res.push(candidate);
      }
    }
    return res;
  };

  const primaryDistractors = getDistractors(primaryCat.id, 3);
  const secondaryDistractors = getDistractors(secondaryCat.id, 3);

  const pairSigns: CatalogSign[] = [primaryCat, secondaryCat, thirdCat, fourthCat].filter(
    (v, idx, arr) => arr.findIndex((x) => x.id === v.id) === idx
  );
  let pairAttempt = 0;
  while (pairSigns.length < 4 && pairAttempt < LIBRAS_CATALOG_255.length) {
    const extra = LIBRAS_CATALOG_255[(seed + pairAttempt * 5) % LIBRAS_CATALOG_255.length];
    if (!pairSigns.some((p) => p.id === extra.id)) {
      pairSigns.push(extra);
    }
    pairAttempt++;
  }

  const matchPairs: MatchPair[] = pairSigns.slice(0, 4).map((cat, idx) => ({
    id: `pair_${cacheKey}_${idx}`,
    signId: cat.id,
    catalogSignId: cat.id,
    signName: cat.palavra,
    signGlyph: '🤟',
    handshape: cat.palavra,
    portugueseText: cat.palavra
  }));

  const dactWord = CURATED_DACTYLOLOGY_WORDS[seed % CURATED_DACTYLOLOGY_WORDS.length];
  const extraLetters = ['B', 'R', 'S', 'T', 'L', 'O', 'E', 'A'];
  const dactLetters = dactWord.split('');
  const dactDistractors = extraLetters.filter((l) => !dactLetters.includes(l)).slice(0, 3);
  const letterBank = deterministicShuffle([...dactLetters, ...dactDistractors], seed);

  const glossChallenge = CURATED_GLOSS_CHALLENGES[seed % CURATED_GLOSS_CHALLENGES.length];
  const dialogueSpec = CURATED_DIALOGUES[seed % CURATED_DIALOGUES.length];

  const isOddActivity = activityNumber % 2 === 1;

  // Exactly 5 clean exercises per activity
  const exercises: Exercise[] = [
    // 1. Sinal Novo (destaque limpo: nome do sinal + significado + 4 cartões visuais)
    {
      id: `ex_${cacheKey}_1`,
      type: 'new_sign_cards',
      isNewSign: true,
      prompt: primaryCat.palavra,
      signMeaning: primaryCat.significado,
      targetSignId: primaryCat.id,
      correctAnswers: [primaryCat.palavra],
      options: deterministicShuffle(
        [
          {
            id: 'opt_1',
            text: primaryCat.palavra,
            catalogSignId: primaryCat.id
          },
          ...primaryDistractors.map((dc, idx) => ({
            id: `opt_${idx + 2}`,
            text: dc.palavra,
            catalogSignId: dc.id
          }))
        ],
        seed + 1
      )
    },

    // 2. Leitura de Sinal com Câmera Lenta (0.5x)
    {
      id: `ex_${cacheKey}_2`,
      type: 'slow_reading',
      prompt: 'Qual é o significado deste sinal?',
      targetSignId: secondaryCat.id,
      correctAnswers: [secondaryCat.palavra],
      options: deterministicShuffle(
        [
          {
            id: 'sr_1',
            text: secondaryCat.palavra
          },
          ...secondaryDistractors.map((dc, idx) => ({
            id: `sr_${idx + 2}`,
            text: dc.palavra
          }))
        ],
        seed + 2
      )
    },

    // 3. Combine os Pares (ímpar) ou Datilologia (par)
    isOddActivity
      ? {
          id: `ex_${cacheKey}_3`,
          type: 'match_sign_pairs',
          prompt: 'Combine cada palavra com o sinal correspondente:',
          matchPairs,
          correctAnswers: pairSigns.slice(0, 4).map((p) => p.palavra)
        }
      : {
          id: `ex_${cacheKey}_3`,
          type: 'dactylology_spelling',
          prompt: 'Observe a soletração e monte a palavra:',
          dactylologyWord: dactWord,
          wordBank: letterBank,
          correctAnswers: [dactWord]
        },

    // 4. Prática na Câmera (validação exclusiva para o sinal alvo)
    {
      id: `ex_${cacheKey}_4`,
      type: 'camera_practice',
      targetSignId: primaryCat.id,
      prompt: `Faça o sinal de "${primaryCat.palavra}"`,
      signMeaning: primaryCat.significado,
      correctAnswers: ['validado']
    },

    // 5. Monte a Frase em Glosas (ímpar) ou Complete o Diálogo (par)
    isOddActivity
      ? {
          id: `ex_${cacheKey}_5`,
          type: 'translate_to_libras',
          prompt: 'Monte a frase em Libras:',
          portugueseSentence: glossChallenge.portuguese,
          targetGloss: glossChallenge.glossTokens.join(' '),
          glossSequence: glossChallenge.glossTokens,
          wordBank: deterministicShuffle(
            [...glossChallenge.glossTokens, ...glossChallenge.distractors],
            seed + 5
          ),
          correctAnswers: [glossChallenge.glossTokens.join(' ')]
        }
      : {
          id: `ex_${cacheKey}_5`,
          type: 'dialogue_completion',
          prompt: 'Escolha a resposta adequada em Libras:',
          dialoguePrompt: {
            speaker: dialogueSpec.speaker,
            gloss: dialogueSpec.gloss,
            portuguese: dialogueSpec.portuguese,
            nmfType: dialogueSpec.nmfType,
            nmfLabel: dialogueSpec.nmfLabel,
            catalogSignId: dialogueSpec.catalogSignId
          },
          correctAnswers: [dialogueSpec.correctAnswer],
          options: deterministicShuffle(dialogueSpec.options, seed + 5)
        }
  ];

  activityExercisesCache.set(cacheKey, exercises);
  return exercises;
}

const sectionUnitsCache = new Map<number, Unit[]>();

export function getUnitsForSection(sectionNumber: number): Unit[] {
  const safeSec = Math.max(1, Math.min(TRACK_STRUCTURE.sections, sectionNumber));
  const cached = sectionUnitsCache.get(safeSec);
  if (cached) return cached;

  const meta = LIBRAS_SECTIONS_META[safeSec - 1] || LIBRAS_SECTIONS_META[0];
  const units: Unit[] = [];

  for (let stage = 1; stage <= TRACK_STRUCTURE.stagesPerSection; stage++) {
    const stageSigns = getSignsForStage(safeSec, stage);
    const focusPreview = stageSigns
      .slice(0, 3)
      .map((s) => s.palavra)
      .join(', ');

    const nodes: PathNode[] = [];
    for (let act = 1; act <= TRACK_STRUCTURE.activitiesPerStage; act++) {
      const nodeId = getActivityNodeId(safeSec, stage, act);
      const isChest = act === 6;
      const isTrophy = act === 12;
      const isStory = act === 4 || act === 8;
      const isRapid = act === 10;
      const nodeType = isChest
        ? 'chest'
        : isTrophy
        ? 'trophy'
        : isStory
        ? 'story'
        : isRapid
        ? 'rapid'
        : 'lesson';

      const targetSign = stageSigns[(act - 1) % stageSigns.length];
      const title = isTrophy
        ? `Atividade ${act}: Revisão da Etapa`
        : isChest
        ? `Atividade ${act}: Prática Especial`
        : `Atividade ${act}: ${targetSign.palavra}`;

      const node: PathNode = {
        id: nodeId,
        type: nodeType,
        title,
        description: targetSign.significado,
        xpReward: isTrophy ? 40 : isChest ? 30 : 20,
        gemsReward: isTrophy ? 20 : isChest ? 30 : 10,
        status: safeSec === 1 && stage === 1 && act === 1 ? 'available' : 'locked',
        get exercises() {
          return getExercisesForActivity(safeSec, stage, act);
        }
      };
      nodes.push(node);
    }

    units.push({
      id: `s${safeSec}_e${stage}`,
      unitNumber: stage,
      sectionNumber: safeSec,
      title: `Etapa ${stage}: ${focusPreview}`,
      description: `${meta.title} · ${focusPreview}`,
      themeColor: meta.themeColor,
      guidebook: {
        signsOverview: stageSigns.map((s) => ({
          sign: s.palavra,
          meaning: s.significado,
          slug: s.slug
        })),
        grammarRule: {
          title: meta.grammarTitle,
          explanation: meta.grammarExplanation,
          exampleGloss: meta.exampleGloss,
          examplePortuguese: meta.examplePt
        },
        culturalTip: meta.culturalTip
      },
      nodes
    });
  }

  sectionUnitsCache.set(safeSec, units);
  return units;
}

export function getSectionByNumber(sectionNumber: number): Section {
  const safeSec = Math.max(1, Math.min(TRACK_STRUCTURE.sections, sectionNumber));
  const meta = LIBRAS_SECTIONS_META[safeSec - 1] || LIBRAS_SECTIONS_META[0];
  return {
    sectionNumber: safeSec,
    title: meta.title,
    description: meta.description,
    get units() {
      return getUnitsForSection(safeSec);
    }
  };
}

export const LIBRAS_SECTIONS: Section[] = LIBRAS_SECTIONS_META.map((meta) => ({
  sectionNumber: meta.sectionNumber,
  title: meta.title,
  description: meta.description,
  get units() {
    return getUnitsForSection(meta.sectionNumber);
  }
}));

export interface TrackUnlockState {
  isActivityCompleted: (section: number, stage: number, activity: number) => boolean;
  isStageCompleted: (section: number, stage: number) => boolean;
  isSectionCompleted: (section: number) => boolean;
  isSectionUnlocked: (section: number) => boolean;
  isStageUnlocked: (section: number, stage: number) => boolean;
  isActivityUnlocked: (section: number, stage: number, activity: number) => boolean;
  currentSectionNumber: number;
  currentStageNumber: number;
  currentActivityNumber: number;
}

export function getTrackUnlockState(completedNodeIds: string[]): TrackUnlockState {
  const completedSet = new Set(completedNodeIds);

  const isActivityCompleted = (section: number, stage: number, activity: number): boolean =>
    completedSet.has(getActivityNodeId(section, stage, activity));

  const isStageCompleted = (section: number, stage: number): boolean => {
    for (let act = 1; act <= TRACK_STRUCTURE.activitiesPerStage; act++) {
      if (!isActivityCompleted(section, stage, act)) return false;
    }
    return true;
  };

  const isSectionCompleted = (section: number): boolean => {
    for (let stage = 1; stage <= TRACK_STRUCTURE.stagesPerSection; stage++) {
      if (!isStageCompleted(section, stage)) return false;
    }
    return true;
  };

  const isSectionUnlocked = (section: number): boolean => {
    if (section <= 1) return true;
    return isSectionCompleted(section - 1);
  };

  const isStageUnlocked = (section: number, stage: number): boolean => {
    if (!isSectionUnlocked(section)) return false;
    if (stage <= 1) return true;
    return isStageCompleted(section, stage - 1);
  };

  const isActivityUnlocked = (section: number, stage: number, activity: number): boolean => {
    if (!isStageUnlocked(section, stage)) return false;
    if (activity <= 1) return true;
    return isActivityCompleted(section, stage, activity - 1);
  };

  let currentSectionNumber = 1;
  let currentStageNumber = 1;
  let currentActivityNumber = 1;

  outer: for (let s = 1; s <= TRACK_STRUCTURE.sections; s++) {
    if (!isSectionUnlocked(s)) break;
    for (let st = 1; st <= TRACK_STRUCTURE.stagesPerSection; st++) {
      if (!isStageUnlocked(s, st)) break outer;
      for (let a = 1; a <= TRACK_STRUCTURE.activitiesPerStage; a++) {
        if (!isActivityCompleted(s, st, a)) {
          currentSectionNumber = s;
          currentStageNumber = st;
          currentActivityNumber = a;
          break outer;
        }
      }
    }
  }

  return {
    isActivityCompleted,
    isStageCompleted,
    isSectionCompleted,
    isSectionUnlocked,
    isStageUnlocked,
    isActivityUnlocked,
    currentSectionNumber,
    currentStageNumber,
    currentActivityNumber
  };
}

export const LIBRAS_DAILY_QUESTS: Quest[] = [
  {
    id: 'q_daily_1',
    title: 'Praticante Dedicado',
    description: 'Complete 3 atividades de Libras hoje.',
    icon: '⚡',
    target: 3,
    current: 0,
    rewardGems: 25,
    rewardXp: 40,
    completed: false,
    claimed: false
  },
  {
    id: 'q_daily_2',
    title: 'Prática com Câmera',
    description: 'Conclua 5 exercícios de sinalização na câmera.',
    icon: '📸',
    target: 5,
    current: 0,
    rewardGems: 30,
    rewardXp: 50,
    completed: false,
    claimed: false
  },
  {
    id: 'q_daily_3',
    title: 'Leitura Visual',
    description: 'Acerte 10 exercícios seguidos nas atividades.',
    icon: '🎯',
    target: 10,
    current: 0,
    rewardGems: 40,
    rewardXp: 60,
    completed: false,
    claimed: false
  }
];

export const LIBRAS_QUESTS = LIBRAS_DAILY_QUESTS;

export const LIBRAS_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'flame_streak',
    title: 'Mãos em Chamas',
    description: 'Mantenha sua ofensiva de estudos em Libras ativa por 7 dias seguidos.',
    icon: '🔥',
    tier: 1,
    maxTier: 5,
    currentProgress: 1,
    targetProgress: 7,
    completed: false
  },
  {
    id: 'units_10_sections',
    title: 'Mestre da Trilha Completa',
    description: 'Conclua as 10 seções da trilha de Libras do EasyLib.',
    icon: '👑',
    tier: 1,
    maxTier: 5,
    currentProgress: 0,
    targetProgress: 10,
    completed: false
  },
  {
    id: 'camera_pose_master',
    title: 'Precisão na Câmera',
    description: 'Valide 50 sinais nas atividades com câmera.',
    icon: '🤖',
    tier: 1,
    maxTier: 5,
    currentProgress: 0,
    targetProgress: 50,
    completed: false
  },
  {
    id: 'interpreter_tier',
    title: 'Fluência Visual',
    description: 'Conclua 100 exercícios de leitura e tradução em Libras.',
    icon: '🤟',
    tier: 1,
    maxTier: 5,
    currentProgress: 0,
    targetProgress: 100,
    completed: false
  }
];

export const LIBRAS_LEADERBOARD_USERS: LeaderboardUser[] = [
  { id: 'u_1', name: 'Mariana Silva', username: 'mari_libras', avatar: '👩‍🏫', xp: 1450, streak: 28, flag: '🇧🇷' },
  { id: 'u_2', name: 'Gabriel Santos', username: 'biel_sinal', avatar: '🧏‍♂️', xp: 1320, streak: 35, flag: '🇧🇷' },
  { id: 'u_3', name: 'Camila Rocha', username: 'camilinha_sinais', avatar: '👩‍🎓', xp: 1180, streak: 19, flag: '🇧🇷' },
  { id: 'u_4', name: 'Rafael Costa', username: 'rafa_aprendiz', avatar: '👨‍💻', xp: 950, streak: 12, flag: '🇧🇷' },
  { id: 'u_5', name: 'Beatriz Lima', username: 'bia_inclusao', avatar: '👩‍⚕️', xp: 840, streak: 14, flag: '🇧🇷' },
  { id: 'u_6', name: 'Thiago Oliveira', username: 'thiago_maos', avatar: '🙋‍♂️', xp: 780, streak: 9, flag: '🇧🇷' },
  { id: 'u_7', name: 'Juliana Mendes', username: 'ju_libras', avatar: '🎨', xp: 650, streak: 8, flag: '🇧🇷' },
  { id: 'u_8', name: 'Lucas Ferreira', username: 'lucas_f', avatar: '🧑‍🏫', xp: 520, streak: 5, flag: '🇧🇷' },
  { id: 'u_9', name: 'Fernanda Nogueira', username: 'nanda_libras', avatar: '👩‍🎤', xp: 410, streak: 4, flag: '🇧🇷' },
  { id: 'u_10', name: 'Carlos Eduardo', username: 'kadu_estudos', avatar: '👨‍🎓', xp: 340, streak: 2, flag: '🇧🇷' }
];

export const LEADERBOARD_NAMES = LIBRAS_LEADERBOARD_USERS;

export const DUO_OUTFITS: DuoOutfit[] = [
  {
    id: 'classic',
    name: 'Libi Clássica',
    description: 'Nossa mascote oficial do EasyLib.',
    price: 0,
    icon: '🦫',
    unlocked: true
  },
  {
    id: 'formal',
    name: 'Libi Intérprete',
    description: 'Traje formal de intérprete de Libras.',
    price: 400,
    icon: '👔',
    unlocked: false
  },
  {
    id: 'superduo',
    name: 'Super Libi',
    description: 'Capa com vidas ilimitadas.',
    price: 1000,
    icon: '🦸‍♂️',
    unlocked: false
  },
  {
    id: 'gold',
    name: 'Libi Dourada',
    description: 'Edição dourada de conclusão.',
    price: 1500,
    icon: '👑',
    unlocked: false
  }
];

export { findCatalogSign };
