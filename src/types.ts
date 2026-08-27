export type LibrasTrack = 'iniciante' | 'intermediario' | 'avancado' | 'gramatica_nmf';

export interface LibrasTrackInfo {
  id: LibrasTrack;
  title: string;
  subtitle: string;
  badge: string;
  totalUnits: number;
}

export type ExerciseType = 
  | 'identify_sign'             // Show sign/handshape -> pick Portuguese meaning
  | 'translate_to_libras'       // Portuguese sentence -> build Libras grammar tiles (e.g. EU LIBRAS APRENDER)
  | 'dactylology_spelling'      // Show manual alphabet hands -> type/pick word, or vice-versa
  | 'match_sign_pairs'          // Match 5 sign illustrations with words
  | 'parameter_quiz'            // Identify CM (Configuração de Mão), PA (Ponto de Articulação) or M (Movimento)
  | 'nmf_facial_quiz'           // Facial expression & head tilt identification (pergunta, negação, dúvida)
  | 'fill_in_blank_sign'        // Complete sentence with appropriate sign
  | 'story_dialogue';           // Libras comic dialogue conversation

export interface SignData {
  id: string;
  name: string;
  category: string;
  meaning: string;
  handshapeName: string;       // e.g. "Mão em 'L'", "Mão em 'B'", "Mão aberta em '5'"
  handshapeIcon: string;       // Emoji or hand glyph
  bodyLocation: string;        // e.g. "Espaço Neutro", "Peito", "Testa", "Queixo", "Boca"
  movementType: string;        // e.g. "Movimento retilíneo para frente", "Circular", "Sem movimento"
  facialExpression: string;    // e.g. "Expressão Neutra", "Sobrancelhas franzidas", "Sorriso amigável"
  description: string;
  visualGlyph: string;         // Descriptive graphic emoji or visual symbol
  svgPathType?: 'hand_l' | 'hand_open' | 'hand_fist' | 'hand_pointing' | 'hand_v' | 'hand_b' | 'hand_y' | 'hand_c' | 'hand_i' | 'hand_ily';
  isFavorite?: boolean;
}

export interface MatchPair {
  id: string;
  signId: string;
  signName: string;
  signGlyph: string;
  handshape: string;
  portugueseText: string;
}

export interface StoryDialogueLine {
  speaker: string;
  avatar: string;
  librasSentence: string;      // In gloss format: "OI! TUDO-BEM?"
  portugueseSentence: string;  // "Olá! Como vai você?"
  signExplanation?: string;
  questionAfter?: {
    prompt: string;
    options: string[];
    correctIndex: number;
  };
}

export interface Exercise {
  id: string;
  type: ExerciseType;
  prompt: string;
  sign?: SignData;
  targetGloss?: string;        // Libras sentence gloss e.g. "MEU NOME M-A-R-I-A"
  portugueseSentence?: string; // "Meu nome é Maria"
  wordBank?: string[];
  correctAnswers: string[];
  options?: { 
    id: string; 
    text: string; 
    glyph?: string; 
    handshape?: string;
    explanation?: string;
  }[];
  matchPairs?: MatchPair[];
  storyLines?: StoryDialogueLine[];
  parameterType?: 'CM' | 'PA' | 'M' | 'NMF';
  grammarTip?: string;
}

export type NodeType = 'lesson' | 'story' | 'chest' | 'trophy' | 'rapid';
export type NodeStatus = 'locked' | 'available' | 'completed' | 'legendary';

export interface PathNode {
  id: string;
  type: NodeType;
  title: string;
  description: string;
  xpReward: number;
  gemsReward: number;
  exercises: Exercise[];
  status?: NodeStatus;
}

export interface UnitGuidebook {
  signsOverview: {
    sign: string;
    meaning: string;
    cm: string;
    pa: string;
    mov: string;
    nmf: string;
  }[];
  grammarRule: {
    title: string;
    explanation: string;
    exampleGloss: string;
    examplePortuguese: string;
  };
  culturalTip: string;
}

export interface Unit {
  id: string;
  unitNumber: number;
  sectionNumber: number;
  title: string;
  description: string;
  themeColor: 'green' | 'blue' | 'purple' | 'orange' | 'red' | 'yellow' | 'teal';
  guidebook: UnitGuidebook;
  nodes: PathNode[];
}

export interface Section {
  sectionNumber: number;
  title: string;
  description: string;
  units: Unit[];
}

export type LeagueTier = 
  | 'Bronze' 
  | 'Prata' 
  | 'Ouro' 
  | 'Safira' 
  | 'Rubi' 
  | 'Esmeralda' 
  | 'Ametista' 
  | 'Pérola' 
  | 'Obsidiana' 
  | 'Diamante';

export interface Quest {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  current: number;
  rewardGems: number;
  rewardXp: number;
  completed: boolean;
  claimed: boolean;
}

export interface DuoOutfit {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  unlocked: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: number; // 1 to 5
  maxTier: number;
  currentProgress: number;
  targetProgress: number;
  completed: boolean;
}

export interface LeaderboardUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  xp: number;
  streak: number;
  flag: string;
}

export interface UserProfile {
  userId: string;
  name: string;
  username: string;
  avatar: string;
  selectedTrack: LibrasTrack;
  xp: number;
  gems: number;
  hearts: number;
  maxHearts: number;
  streakDays: number;
  hasActiveStreakFreeze: boolean;
  streakFreezeCount: number;
  isSuperDuolingo: boolean;
  completedNodeIds: string[];
  learnedSignIds: string[];
  favoriteSignIds: string[];
  currentLeague: LeagueTier;
  duoOutfit: string;
  unlockedOutfits: string[];
  wagerActive: boolean;
  wagerDaysLeft: number;
  quests: Quest[];
  achievements: Achievement[];
  mistakeHistory: Exercise[];
}

export type MainTabType = 'learn' | 'camera' | 'dictionary' | 'practice' | 'leaderboards' | 'quests' | 'shop' | 'profile';
