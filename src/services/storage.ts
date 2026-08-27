import { UserProfile, LibrasTrack } from '../types';
import { LIBRAS_ACHIEVEMENTS, LIBRAS_QUESTS } from '../data/librasData';

const STORAGE_KEY = 'duolingo_libras_user_profile_v1';

const DEFAULT_PROFILE: UserProfile = {
  userId: 'DUO-LIBRAS-7842',
  name: 'Aprendiz de Libras',
  username: 'sinalizador_duo',
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
  completedNodeIds: ['node_u1_1'],
  learnedSignIds: ['sign_oi', 'sign_tudo_bem', 'sign_obrigado'],
  favoriteSignIds: ['sign_oi', 'sign_eu_te_amo'],
  currentLeague: 'Ouro',
  duoOutfit: 'classic',
  unlockedOutfits: ['classic'],
  wagerActive: false,
  wagerDaysLeft: 0,
  quests: LIBRAS_QUESTS,
  achievements: LIBRAS_ACHIEVEMENTS,
  mistakeHistory: []
};

export const storageService = {
  getUserProfile(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return { ...DEFAULT_PROFILE, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('Failed to read storage', e);
    }
    return DEFAULT_PROFILE;
  },

  saveUserProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to save storage', e);
    }
  },

  addXpAndGems(xp: number, gems: number): UserProfile {
    const profile = this.getUserProfile();
    const newXp = profile.xp + xp;
    const newGems = profile.gems + gems;

    const updatedQuests = profile.quests.map((q) => {
      if (q.id === 'q_daily_2' && !q.completed) {
        const nextVal = Math.min(q.target, q.current + 1);
        return { ...q, current: nextVal, completed: nextVal >= q.target };
      }
      return q;
    });

    const updatedProfile: UserProfile = {
      ...profile,
      xp: newXp,
      gems: newGems,
      quests: updatedQuests
    };

    this.saveUserProfile(updatedProfile);
    return updatedProfile;
  },

  markNodeCompleted(nodeId: string, xpReward: number, gemsReward: number): UserProfile {
    const profile = this.getUserProfile();
    const completedSet = new Set(profile.completedNodeIds);
    completedSet.add(nodeId);

    const updatedProfile: UserProfile = {
      ...profile,
      xp: profile.xp + xpReward,
      gems: profile.gems + gemsReward,
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
