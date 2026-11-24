import { UserProfile, LibrasTrack, LeagueTier } from '../types';
import { LIBRAS_ACHIEVEMENTS, LIBRAS_QUESTS } from '../data/librasData';

const STORAGE_KEY = 'duolingo_libras_user_profile_v1';
const LAST_PRACTICE_DATE_KEY = 'duolingo_libras_last_practice_date_v1';

const VALID_TRACKS: LibrasTrack[] = ['iniciante', 'intermediario', 'avancado', 'gramatica_nmf'];
const VALID_LEAGUES: LeagueTier[] = [
  'Bronze',
  'Prata',
  'Ouro',
  'Safira',
  'Rubi',
  'Esmeralda',
  'Ametista',
  'Pérola',
  'Obsidiana',
  'Diamante'
];

function getLocalDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const DEFAULT_PROFILE: UserProfile = {
  userId: 'DUO-LIBRAS-7842',
  name: 'Visitante',
  username: 'visitante_easylib',
  avatar: '🦉',
  selectedTrack: 'iniciante',
  xp: 145,
  gems: 380,
  hearts: 5,
  maxHearts: 5,
  streakDays: 5,
  hasActiveStreakFreeze: true,
  streakFreezeCount: 1,
  isSuperDuolingo: false,
  completedNodeIds: [],
  learnedSignIds: ['oi', 'tudo-bem', 'obrigado'],
  favoriteSignIds: ['oi', 'amor'],
  currentLeague: 'Ouro',
  duoOutfit: 'classic',
  unlockedOutfits: ['classic'],
  wagerActive: false,
  wagerDaysLeft: 0,
  quests: LIBRAS_QUESTS,
  achievements: LIBRAS_ACHIEVEMENTS,
  mistakeHistory: []
};

function asSafeNumber(value: unknown, fallback: number, min = 0, max = 10000000): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function asSafeStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  return value.map((v) => String(v)).filter(Boolean);
}

export function sanitizeStoredProfile(raw: unknown): UserProfile {
  if (!raw || typeof raw !== 'object') return DEFAULT_PROFILE;
  const parsed = raw as Record<string, unknown>;

  const maxHearts = asSafeNumber(parsed.maxHearts, DEFAULT_PROFILE.maxHearts, 1, 20);
  const hearts = asSafeNumber(parsed.hearts, DEFAULT_PROFILE.hearts, 0, maxHearts);
  const rawQuests = Array.isArray(parsed.quests) ? parsed.quests : [];
  const questById = new Map<string, Record<string, unknown>>();
  for (const q of rawQuests) {
    if (q && typeof q === 'object' && typeof (q as { id?: unknown }).id === 'string') {
      questById.set((q as { id: string }).id, q as Record<string, unknown>);
    }
  }

  const sanitizedQuests = LIBRAS_QUESTS.map((defQ) => {
    const saved = questById.get(defQ.id);
    if (!saved) return defQ;
    const current = asSafeNumber(saved.current, defQ.current, 0, defQ.target);
    return {
      ...defQ,
      current,
      completed: Boolean(saved.completed) || current >= defQ.target,
      claimed: Boolean(saved.claimed)
    };
  });

  const xp = asSafeNumber(parsed.xp, DEFAULT_PROFILE.xp, 0, 10000000);
  const completedNodeIds = asSafeStringArray(parsed.completedNodeIds, DEFAULT_PROFILE.completedNodeIds);

  const rawAchievements = Array.isArray(parsed.achievements) ? parsed.achievements : [];
  const achById = new Map<string, Record<string, unknown>>();
  for (const a of rawAchievements) {
    if (a && typeof a === 'object' && typeof (a as { id?: unknown }).id === 'string') {
      achById.set((a as { id: string }).id, a as Record<string, unknown>);
    }
  }

  const sanitizedAchievements = LIBRAS_ACHIEVEMENTS.map((defA) => {
    const saved = achById.get(defA.id);
    return {
      ...defA,
      currentProgress:
        defA.id === 'ach_xp'
          ? xp
          : defA.id === 'ach_nodes'
          ? completedNodeIds.length
          : asSafeNumber(saved?.currentProgress, defA.currentProgress, 0, 10000000)
    };
  });

  const unlockedOutfits = asSafeStringArray(parsed.unlockedOutfits, DEFAULT_PROFILE.unlockedOutfits);
  if (!unlockedOutfits.includes('classic')) {
    unlockedOutfits.unshift('classic');
  }

  return {
    userId: typeof parsed.userId === 'string' && parsed.userId.trim() ? parsed.userId.trim() : DEFAULT_PROFILE.userId,
    name: typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name.trim().slice(0, 80) : DEFAULT_PROFILE.name,
    username:
      typeof parsed.username === 'string' && parsed.username.trim()
        ? parsed.username.trim().slice(0, 40)
        : DEFAULT_PROFILE.username,
    avatar: typeof parsed.avatar === 'string' && parsed.avatar.trim() ? parsed.avatar.trim().slice(0, 16) : DEFAULT_PROFILE.avatar,
    selectedTrack: VALID_TRACKS.includes(parsed.selectedTrack as LibrasTrack)
      ? (parsed.selectedTrack as LibrasTrack)
      : DEFAULT_PROFILE.selectedTrack,
    xp,
    gems: asSafeNumber(parsed.gems, DEFAULT_PROFILE.gems, 0, 10000000),
    hearts,
    maxHearts,
    streakDays: asSafeNumber(parsed.streakDays, DEFAULT_PROFILE.streakDays, 0, 36500),
    hasActiveStreakFreeze:
      typeof parsed.hasActiveStreakFreeze === 'boolean'
        ? parsed.hasActiveStreakFreeze
        : DEFAULT_PROFILE.hasActiveStreakFreeze,
    streakFreezeCount: asSafeNumber(parsed.streakFreezeCount, DEFAULT_PROFILE.streakFreezeCount, 0, 100),
    isSuperDuolingo:
      typeof parsed.isSuperDuolingo === 'boolean'
        ? parsed.isSuperDuolingo
        : DEFAULT_PROFILE.isSuperDuolingo,
    completedNodeIds,
    learnedSignIds: asSafeStringArray(parsed.learnedSignIds, DEFAULT_PROFILE.learnedSignIds),
    favoriteSignIds: asSafeStringArray(parsed.favoriteSignIds, DEFAULT_PROFILE.favoriteSignIds),
    currentLeague: VALID_LEAGUES.includes(parsed.currentLeague as LeagueTier)
      ? (parsed.currentLeague as LeagueTier)
      : DEFAULT_PROFILE.currentLeague,
    duoOutfit: typeof parsed.duoOutfit === 'string' && parsed.duoOutfit.trim() ? parsed.duoOutfit.trim() : 'classic',
    unlockedOutfits,
    wagerActive: typeof parsed.wagerActive === 'boolean' ? parsed.wagerActive : false,
    wagerDaysLeft: asSafeNumber(parsed.wagerDaysLeft, 0, 0, 30),
    quests: sanitizedQuests,
    achievements: sanitizedAchievements,
    mistakeHistory: Array.isArray(parsed.mistakeHistory) ? parsed.mistakeHistory : []
  };
}

export const storageService = {
  getUserProfile(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return sanitizeStoredProfile(JSON.parse(data));
      }
    } catch (e) {
      console.warn('Failed to read storage', e);
    }
    return DEFAULT_PROFILE;
  },

  saveUserProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeStoredProfile(profile)));
    } catch (e) {
      console.warn('Failed to save storage', e);
    }
  },

  addXpAndGems(xp: number, gems: number, markDailyPractice = false): UserProfile {
    const profile = this.getUserProfile();
    const newXp = profile.xp + xp;
    const newGems = profile.gems + gems;

    let nextStreak = profile.streakDays;
    if (markDailyPractice) {
      try {
        const today = getLocalDateKey();
        const lastDate = localStorage.getItem(LAST_PRACTICE_DATE_KEY);
        if (lastDate !== today) {
          nextStreak = Math.max(1, profile.streakDays + 1);
          localStorage.setItem(LAST_PRACTICE_DATE_KEY, today);
        } else {
          nextStreak = Math.max(1, profile.streakDays);
        }
      } catch {
        nextStreak = Math.max(1, profile.streakDays);
      }
    }

    const updatedQuests = profile.quests.map((q) => {
      if ((q.id === 'q_daily_1' || q.id === 'q_daily_2') && markDailyPractice && !q.completed) {
        const nextVal = Math.min(q.target, q.current + 1);
        return { ...q, current: nextVal, completed: nextVal >= q.target };
      }
      return q;
    });

    const updatedProfile: UserProfile = {
      ...profile,
      xp: newXp,
      gems: newGems,
      streakDays: nextStreak,
      quests: updatedQuests
    };

    this.saveUserProfile(updatedProfile);
    return updatedProfile;
  },

  markNodeCompleted(nodeId: string, xpReward: number, gemsReward: number): UserProfile {
    const profile = this.addXpAndGems(xpReward, gemsReward, true);
    const completedSet = new Set(profile.completedNodeIds);
    completedSet.add(nodeId);

    const updatedProfile: UserProfile = {
      ...profile,
      completedNodeIds: Array.from(completedSet)
    };

    this.saveUserProfile(updatedProfile);
    return updatedProfile;
  },

  markSignLearned(signId: string): UserProfile {
    const profile = this.getUserProfile();
    const set = new Set(profile.learnedSignIds);
    set.add(signId);

    const updatedProfile = {
      ...profile,
      learnedSignIds: Array.from(set)
    };
    this.saveUserProfile(updatedProfile);
    return updatedProfile;
  },

  toggleFavoriteSign(signId: string): UserProfile {
    const profile = this.getUserProfile();
    const set = new Set(profile.favoriteSignIds);
    if (set.has(signId)) {
      set.delete(signId);
    } else {
      set.add(signId);
    }

    const updatedProfile = {
      ...profile,
      favoriteSignIds: Array.from(set)
    };
    this.saveUserProfile(updatedProfile);
    return updatedProfile;
  },

  loseHeart(): { profile: UserProfile; outOfHearts: boolean } {
    const profile = this.getUserProfile();
    if (profile.isSuperDuolingo) {
      return { profile, outOfHearts: false };
    }

    const newHearts = Math.max(0, profile.hearts - 1);
    const updatedProfile = { ...profile, hearts: newHearts };
    this.saveUserProfile(updatedProfile);
    return { profile: updatedProfile, outOfHearts: newHearts === 0 };
  },

  refillHearts(): UserProfile {
    const profile = this.getUserProfile();
    const updatedProfile = { ...profile, hearts: profile.maxHearts };
    this.saveUserProfile(updatedProfile);
    return updatedProfile;
  },

  setTrack(track: LibrasTrack): UserProfile {
    const profile = this.getUserProfile();
    const updatedProfile = { ...profile, selectedTrack: track };
    this.saveUserProfile(updatedProfile);
    return updatedProfile;
  },

  setLibrasTrack(track: LibrasTrack): UserProfile {
    return this.setTrack(track);
  },

  toggleSuperDuolingo(): UserProfile {
    const profile = this.getUserProfile();
    const isSuper = !profile.isSuperDuolingo;
    const updatedProfile = {
      ...profile,
      isSuperDuolingo: isSuper,
      hearts: isSuper ? 5 : profile.hearts
    };
    this.saveUserProfile(updatedProfile);
    return updatedProfile;
  },

  resetAllData(): UserProfile {
    localStorage.removeItem(STORAGE_KEY);
    return DEFAULT_PROFILE;
  }
};
