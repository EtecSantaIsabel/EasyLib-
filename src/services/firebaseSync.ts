import { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { LIBRAS_ACHIEVEMENTS, LIBRAS_QUESTS } from '../data/librasData';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile } from '../types';
import { LeagueTier, LibrasTrack } from '../types';
import { NmfExpressionType } from '../types/librasRecognition';
import {
  ROOM_CODE_REGEX,
  generateCandidateRoomCode,
  isValidRoomCodeFormat,
  normalizeRoomCode
} from './roomCodeUtils';

export { ROOM_CODE_REGEX, isValidRoomCodeFormat, normalizeRoomCode };

export interface ClosedRoom {
  roomCode: string;
  name: string;
  ownerUid: string;
}

export interface RoomMemberEntry {
  roomCode: string;
  userId: string;
  name: string;
  username: string;
  avatar: string;
  xp: number;
  streakDays: number;
  currentLeague: LeagueTier;
}

export interface CloudLeaderboardEntry {
  userId: string;
  name: string;
  username: string;
  avatar: string;
  xp: number;
  streakDays: number;
  currentLeague: LeagueTier;
  isPublic: boolean;
}

export interface SavedTranslationRecord {
  id: string;
  userId: string;
  glosses: string[];
  portugueseText: string;
  nmfExpression: string;
  createdAtMs: number;
}

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

function sanitizeStringList(list: string[], maxItems: number, maxItemLen: number): string[] {
  const unique = Array.from(new Set(list.map((s) => String(s).trim()).filter(Boolean)));
  return unique.slice(0, maxItems).map((s) => s.slice(0, maxItemLen));
}

function clampNumber(val: number, min: number, max: number): number {
  if (!Number.isFinite(val)) return min;
  return Math.max(min, Math.min(max, Math.round(val)));
}

function sanitizeMutableProfileFields(profile: UserProfile) {
  const safeName = (profile.name || 'Aprendiz de Libras').trim().slice(0, 80) || 'Aprendiz de Libras';
  const safeUsername =
    (profile.username || 'sinalizador_easylib')
      .trim()
      .replace(/\s+/g, '_')
      .slice(0, 40) || 'sinalizador_easylib';
  const safeAvatar = (profile.avatar || '🦉').trim().slice(0, 16) || '🦉';
  const safeTrack: LibrasTrack = VALID_TRACKS.includes(profile.selectedTrack)
    ? profile.selectedTrack
    : 'iniciante';
  const safeLeague: LeagueTier = VALID_LEAGUES.includes(profile.currentLeague)
    ? profile.currentLeague
    : 'Ouro';
  const safeMaxHearts = clampNumber(profile.maxHearts, 1, 20);
  const safeHearts = clampNumber(profile.hearts, 0, safeMaxHearts);
  const claimedQuestIds = sanitizeStringList(
    profile.quests.filter((q) => q.claimed).map((q) => q.id),
    50,
    80
  );

  return {
    name: safeName,
    username: safeUsername,
    avatar: safeAvatar,
    selectedTrack: safeTrack,
    xp: clampNumber(profile.xp, 0, 10000000),
    gems: clampNumber(profile.gems, 0, 10000000),
    hearts: safeHearts,
    maxHearts: safeMaxHearts,
    streakDays: clampNumber(profile.streakDays, 0, 36500),
    hasActiveStreakFreeze: Boolean(profile.hasActiveStreakFreeze),
    streakFreezeCount: clampNumber(profile.streakFreezeCount, 0, 100),
    isSuperDuolingo: Boolean(profile.isSuperDuolingo),
    completedNodeIds: sanitizeStringList(profile.completedNodeIds || [], 3000, 80),
    learnedSignIds: sanitizeStringList(profile.learnedSignIds || [], 500, 80),
    favoriteSignIds: sanitizeStringList(profile.favoriteSignIds || [], 500, 80),
    currentLeague: safeLeague,
    duoOutfit: (profile.duoOutfit || 'classic').trim().slice(0, 40) || 'classic',
    unlockedOutfits: sanitizeStringList(
      profile.unlockedOutfits?.length ? profile.unlockedOutfits : ['classic'],
      50,
      40
    ),
    wagerActive: Boolean(profile.wagerActive),
    wagerDaysLeft: clampNumber(profile.wagerDaysLeft, 0, 30),
    claimedQuestIds
  };
}

export function hydrateProfileFromFirestore(
  data: Record<string, any>,
  fallback: UserProfile
): UserProfile {
  const claimedSet = new Set<string>(Array.isArray(data.claimedQuestIds) ? data.claimedQuestIds : []);
  const xp = typeof data.xp === 'number' ? data.xp : fallback.xp;
  const completedNodeIds = Array.isArray(data.completedNodeIds)
    ? data.completedNodeIds
    : fallback.completedNodeIds;

  return {
    ...fallback,
    userId: typeof data.uid === 'string' ? data.uid : fallback.userId,
    name: typeof data.name === 'string' ? data.name : fallback.name,
    username: typeof data.username === 'string' ? data.username : fallback.username,
    avatar: typeof data.avatar === 'string' ? data.avatar : fallback.avatar,
    selectedTrack: VALID_TRACKS.includes(data.selectedTrack) ? data.selectedTrack : fallback.selectedTrack,
    xp,
    gems: typeof data.gems === 'number' ? data.gems : fallback.gems,
    hearts: typeof data.hearts === 'number' ? data.hearts : fallback.hearts,
    maxHearts: typeof data.maxHearts === 'number' ? data.maxHearts : fallback.maxHearts,
    streakDays: typeof data.streakDays === 'number' ? data.streakDays : fallback.streakDays,
    hasActiveStreakFreeze:
      typeof data.hasActiveStreakFreeze === 'boolean'
        ? data.hasActiveStreakFreeze
        : fallback.hasActiveStreakFreeze,
    streakFreezeCount:
      typeof data.streakFreezeCount === 'number' ? data.streakFreezeCount : fallback.streakFreezeCount,
    isSuperDuolingo:
      typeof data.isSuperDuolingo === 'boolean' ? data.isSuperDuolingo : fallback.isSuperDuolingo,
    completedNodeIds,
    learnedSignIds: Array.isArray(data.learnedSignIds) ? data.learnedSignIds : fallback.learnedSignIds,
    favoriteSignIds: Array.isArray(data.favoriteSignIds) ? data.favoriteSignIds : fallback.favoriteSignIds,
    currentLeague: VALID_LEAGUES.includes(data.currentLeague) ? data.currentLeague : fallback.currentLeague,
    duoOutfit: typeof data.duoOutfit === 'string' ? data.duoOutfit : fallback.duoOutfit,
    unlockedOutfits: Array.isArray(data.unlockedOutfits) ? data.unlockedOutfits : fallback.unlockedOutfits,
    wagerActive: typeof data.wagerActive === 'boolean' ? data.wagerActive : fallback.wagerActive,
    wagerDaysLeft: typeof data.wagerDaysLeft === 'number' ? data.wagerDaysLeft : fallback.wagerDaysLeft,
    quests: LIBRAS_QUESTS.map((q) => ({
      ...q,
      claimed: claimedSet.has(q.id)
    })),
    achievements: LIBRAS_ACHIEVEMENTS.map((a) => ({
      ...a,
      currentProgress: a.id === 'ach_xp' ? xp : a.id === 'ach_nodes' ? completedNodeIds.length : a.currentProgress
    }))
  };
}

export async function ensureUserDocuments(user: User, localProfile: UserProfile): Promise<UserProfile> {
  const userPath = `users/${user.uid}`;
  const lbPath = `leaderboard/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);
  const lbRef = doc(db, 'leaderboard', user.uid);

  let existingSnap;
  try {
    existingSnap = await getDoc(userRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, userPath);
  }

  if (existingSnap.exists()) {
    const cloudProfile = hydrateProfileFromFirestore(existingSnap.data(), localProfile);
    const lbFields = sanitizeMutableProfileFields(cloudProfile);
    try {
      await setDoc(
        lbRef,
        {
          userId: user.uid,
          name: lbFields.name,
          username: lbFields.username,
          avatar: lbFields.avatar,
          xp: lbFields.xp,
          streakDays: lbFields.streakDays,
          currentLeague: lbFields.currentLeague,
          isPublic: true,
          updatedAt: serverTimestamp()
        },
        { merge: false }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, lbPath);
    }
    return cloudProfile;
  }

  const isDefaultName =
    localProfile.name === 'Aprendiz de Libras' || localProfile.name === 'Visitante';
  const isDefaultUsername =
    localProfile.username === 'sinalizador_duo' || localProfile.username === 'visitante_easylib';

  const fallbackPhoneLabel = user.phoneNumber
    ? `Aluno ${user.phoneNumber.slice(-4)}`
    : null;

  const seededProfile: UserProfile = {
    ...localProfile,
    userId: user.uid,
    name:
      isDefaultName && (user.displayName || fallbackPhoneLabel)
        ? (user.displayName || fallbackPhoneLabel)!
        : localProfile.name,
    username:
      isDefaultUsername && user.email
        ? user.email.split('@')[0].slice(0, 40)
        : isDefaultUsername && user.phoneNumber
        ? `aluno_${user.phoneNumber.replace(/\D/g, '').slice(-6)}`.slice(0, 40)
        : localProfile.username
  };
  const safeFields = sanitizeMutableProfileFields(seededProfile);
  const safeEmail = (user.email || `${user.uid}@easylib.local`).slice(0, 254);

  const batch = writeBatch(db);
  batch.set(userRef, {
    uid: user.uid,
    email: safeEmail,
    ...safeFields,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  batch.set(lbRef, {
    userId: user.uid,
    name: safeFields.name,
    username: safeFields.username,
    avatar: safeFields.avatar,
    xp: safeFields.xp,
    streakDays: safeFields.streakDays,
    currentLeague: safeFields.currentLeague,
    isPublic: true,
    updatedAt: serverTimestamp()
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, userPath);
  }

  return seededProfile;
}

export async function syncProfileToFirestore(user: User, profile: UserProfile): Promise<void> {
  const userPath = `users/${user.uid}`;
  const lbPath = `leaderboard/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);
  const lbRef = doc(db, 'leaderboard', user.uid);
  const safeFields = sanitizeMutableProfileFields(profile);

  try {
    await updateDoc(userRef, {
      ...safeFields,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, userPath);
  }

  try {
    await updateDoc(lbRef, {
      name: safeFields.name,
      username: safeFields.username,
      avatar: safeFields.avatar,
      xp: safeFields.xp,
      streakDays: safeFields.streakDays,
      currentLeague: safeFields.currentLeague,
      isPublic: true,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    // If leaderboard doc wasn't created yet, create it cleanly
    try {
      await setDoc(lbRef, {
        userId: user.uid,
        name: safeFields.name,
        username: safeFields.username,
        avatar: safeFields.avatar,
        xp: safeFields.xp,
        streakDays: safeFields.streakDays,
        currentLeague: safeFields.currentLeague,
        isPublic: true,
        updatedAt: serverTimestamp()
      });
    } catch (innerErr) {
      handleFirestoreError(innerErr ?? err, OperationType.WRITE, lbPath);
    }
  }
}

export function subscribeUserProfile(
  uid: string,
  fallback: UserProfile,
  onChange: (profile: UserProfile) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `users/${uid}`;
  return onSnapshot(
    doc(db, 'users', uid),
    (snapshot) => {
      if (snapshot.exists()) {
        onChange(hydrateProfileFromFirestore(snapshot.data(), fallback));
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export function subscribePublicLeaderboard(
  onChange: (entries: CloudLeaderboardEntry[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'leaderboard';
  const q = query(collection(db, 'leaderboard'), where('isPublic', '==', true), limit(50));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: CloudLeaderboardEntry[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          userId: String(data.userId || d.id),
          name: String(data.name || 'Aprendiz'),
          username: String(data.username || 'usuario'),
          avatar: String(data.avatar || '🦉'),
          xp: typeof data.xp === 'number' ? data.xp : 0,
          streakDays: typeof data.streakDays === 'number' ? data.streakDays : 0,
          currentLeague: VALID_LEAGUES.includes(data.currentLeague) ? data.currentLeague : 'Ouro',
          isPublic: true
        };
      });
      items.sort((a, b) => b.xp - a.xp);
      onChange(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function saveTranslationToFirestore(
  user: User,
  glosses: string[],
  portugueseText: string,
  nmfExpression: NmfExpressionType
): Promise<void> {
  const path = `users/${user.uid}/translations`;
  const safeGlosses = sanitizeStringList(glosses, 30, 64);
  if (safeGlosses.length === 0) return;

  const safePortuguese = portugueseText.trim().slice(0, 500) || safeGlosses.join(' ');
  const safeNmf = String(nmfExpression || 'neutral').trim().slice(0, 64) || 'neutral';

  try {
    await addDoc(collection(db, 'users', user.uid, 'translations'), {
      userId: user.uid,
      glosses: safeGlosses,
      portugueseText: safePortuguese,
      nmfExpression: safeNmf,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export function subscribeSavedTranslations(
  uid: string,
  onChange: (records: SavedTranslationRecord[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `users/${uid}/translations`;
  const q = query(
    collection(db, 'users', uid, 'translations'),
    where('userId', '==', uid),
    limit(40)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items: SavedTranslationRecord[] = snapshot.docs.map((d) => {
        const data = d.data();
        const createdAtMs =
          data.createdAt && typeof data.createdAt.toMillis === 'function'
            ? data.createdAt.toMillis()
            : Date.now();
        return {
          id: d.id,
          userId: String(data.userId || uid),
          glosses: Array.isArray(data.glosses) ? data.glosses.map(String) : [],
          portugueseText: String(data.portugueseText || ''),
          nmfExpression: String(data.nmfExpression || 'neutral'),
          createdAtMs
        };
      });
      items.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onChange(items.slice(0, 20));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function deleteSavedTranslation(uid: string, translationId: string): Promise<void> {
  const path = `users/${uid}/translations/${translationId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'translations', translationId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

function getActiveRoomStorageKey(uid: string): string {
  return `easylib_active_room_v1_${uid}`;
}

function getSavedRoomsStorageKey(uid: string): string {
  return `easylib_saved_rooms_v1_${uid}`;
}

export function getStoredActiveRoom(uid: string): ClosedRoom | null {
  try {
    const raw = localStorage.getItem(getActiveRoomStorageKey(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ClosedRoom>;
    const code = normalizeRoomCode(parsed.roomCode || '');
    if (!isValidRoomCodeFormat(code)) return null;
    return {
      roomCode: code,
      name: String(parsed.name || `Sala ${code}`).slice(0, 60),
      ownerUid: String(parsed.ownerUid || '')
    };
  } catch {
    return null;
  }
}

export function setStoredActiveRoom(uid: string, room: ClosedRoom | null): void {
  try {
    const key = getActiveRoomStorageKey(uid);
    if (!room) {
      localStorage.removeItem(key);
      return;
    }
    const cleanRoom: ClosedRoom = {
      roomCode: normalizeRoomCode(room.roomCode),
      name: String(room.name || `Sala ${room.roomCode}`).trim().slice(0, 60),
      ownerUid: String(room.ownerUid || '')
    };
    localStorage.setItem(key, JSON.stringify(cleanRoom));
    saveRoomToHistory(uid, cleanRoom);
  } catch {
    // Ignore storage quota errors
  }
}

export function getSavedRoomsHistory(uid: string): ClosedRoom[] {
  try {
    const raw = localStorage.getItem(getSavedRoomsStorageKey(uid));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is ClosedRoom => Boolean(item && isValidRoomCodeFormat(String(item.roomCode || ''))))
      .slice(0, 8)
      .map((item) => ({
        roomCode: normalizeRoomCode(item.roomCode),
        name: String(item.name || `Sala ${item.roomCode}`).slice(0, 60),
        ownerUid: String(item.ownerUid || '')
      }));
  } catch {
    return [];
  }
}

function saveRoomToHistory(uid: string, room: ClosedRoom): void {
  try {
    const existing = getSavedRoomsHistory(uid).filter((r) => r.roomCode !== room.roomCode);
    const updated = [room, ...existing].slice(0, 6);
    localStorage.setItem(getSavedRoomsStorageKey(uid), JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors
  }
}

export function removeRoomFromHistory(uid: string, roomCode: string): void {
  try {
    const normalized = normalizeRoomCode(roomCode);
    const existing = getSavedRoomsHistory(uid).filter((r) => r.roomCode !== normalized);
    localStorage.setItem(getSavedRoomsStorageKey(uid), JSON.stringify(existing));
  } catch {
    // Ignore storage quota errors
  }
}

export async function fetchExistingClosedRoom(rawCode: string): Promise<ClosedRoom | null> {
  const code = normalizeRoomCode(rawCode);
  if (!isValidRoomCodeFormat(code)) {
    return null;
  }

  const roomRef = doc(db, 'rooms', code);
  try {
    const snap = await getDoc(roomRef);
    if (!snap.exists()) {
      return null;
    }
    const data = snap.data();
    return {
      roomCode: code,
      name: String(data.name || `Sala ${code}`).slice(0, 60),
      ownerUid: String(data.ownerUid || '')
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `rooms/${code}`);
  }
}

export async function createClosedRoom(
  user: User,
  profile: UserProfile,
  rawRoomName: string
): Promise<ClosedRoom> {
  const cleanName = rawRoomName.trim().slice(0, 60);
  if (cleanName.length < 2) {
    throw new Error('Digite um nome com pelo menos 2 caracteres para a sala.');
  }

  let chosenCode = '';
  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = generateCandidateRoomCode(6);
    const candidateRef = doc(db, 'rooms', candidate);
    try {
      const existing = await getDoc(candidateRef);
      if (!existing.exists()) {
        chosenCode = candidate;
        break;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `rooms/${candidate}`);
    }
  }

  if (!chosenCode) {
    throw new Error('Não foi possível gerar um código único agora. Tente novamente.');
  }

  const roomRef = doc(db, 'rooms', chosenCode);
  const memberRef = doc(db, 'rooms', chosenCode, 'members', user.uid);
  const safeFields = sanitizeMutableProfileFields(profile);

  try {
    await setDoc(roomRef, {
      roomCode: chosenCode,
      name: cleanName,
      ownerUid: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `rooms/${chosenCode}`);
  }

  try {
    await setDoc(memberRef, {
      roomCode: chosenCode,
      userId: user.uid,
      name: safeFields.name,
      username: safeFields.username,
      avatar: safeFields.avatar,
      xp: safeFields.xp,
      streakDays: safeFields.streakDays,
      currentLeague: safeFields.currentLeague,
      joinedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `rooms/${chosenCode}/members/${user.uid}`);
  }

  const createdRoom: ClosedRoom = {
    roomCode: chosenCode,
    name: cleanName,
    ownerUid: user.uid
  };
  setStoredActiveRoom(user.uid, createdRoom);
  return createdRoom;
}

export async function joinClosedRoomByCode(
  user: User,
  profile: UserProfile,
  rawCode: string
): Promise<ClosedRoom> {
  const code = normalizeRoomCode(rawCode);
  if (!isValidRoomCodeFormat(code)) {
    throw new Error('Código inválido. Use um código de sala com 6 a 12 letras ou números.');
  }

  const room = await fetchExistingClosedRoom(code);
  if (!room) {
    throw new Error('Código de sala inválido ou inexistente. Confira o código com quem criou a sala.');
  }

  const memberRef = doc(db, 'rooms', code, 'members', user.uid);
  const safeFields = sanitizeMutableProfileFields(profile);
  const memberPath = `rooms/${code}/members/${user.uid}`;

  let memberSnap;
  try {
    memberSnap = await getDoc(memberRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, memberPath);
  }

  if (memberSnap.exists()) {
    try {
      await updateDoc(memberRef, {
        name: safeFields.name,
        username: safeFields.username,
        avatar: safeFields.avatar,
        xp: safeFields.xp,
        streakDays: safeFields.streakDays,
        currentLeague: safeFields.currentLeague,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, memberPath);
    }
  } else {
    try {
      await setDoc(memberRef, {
        roomCode: code,
        userId: user.uid,
        name: safeFields.name,
        username: safeFields.username,
        avatar: safeFields.avatar,
        xp: safeFields.xp,
        streakDays: safeFields.streakDays,
        currentLeague: safeFields.currentLeague,
        joinedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, memberPath);
    }
  }

  setStoredActiveRoom(user.uid, room);
  return room;
}

export async function syncRoomMemberProgress(
  user: User,
  roomCode: string,
  profile: UserProfile
): Promise<void> {
  const code = normalizeRoomCode(roomCode);
  if (!isValidRoomCodeFormat(code)) return;

  const memberRef = doc(db, 'rooms', code, 'members', user.uid);
  const safeFields = sanitizeMutableProfileFields(profile);

  try {
    const snap = await getDoc(memberRef);
    if (!snap.exists()) return;
    await updateDoc(memberRef, {
      name: safeFields.name,
      username: safeFields.username,
      avatar: safeFields.avatar,
      xp: safeFields.xp,
      streakDays: safeFields.streakDays,
      currentLeague: safeFields.currentLeague,
      updatedAt: serverTimestamp()
    });
  } catch {
    // Non-fatal background sync for active room
  }
}

export function subscribeRoomMembers(
  roomCode: string,
  onChange: (members: RoomMemberEntry[]) => void,
  onError?: (err: Error) => void
): () => void {
  const code = normalizeRoomCode(roomCode);
  const path = `rooms/${code}/members`;
  const q = query(collection(db, 'rooms', code, 'members'), where('roomCode', '==', code), limit(100));

  return onSnapshot(
    q,
    (snapshot) => {
      const members: RoomMemberEntry[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          roomCode: String(data.roomCode || code),
          userId: String(data.userId || d.id),
          name: String(data.name || 'Aprendiz'),
          username: String(data.username || 'usuario'),
          avatar: String(data.avatar || '🦉'),
          xp: typeof data.xp === 'number' ? data.xp : 0,
          streakDays: typeof data.streakDays === 'number' ? data.streakDays : 0,
          currentLeague: VALID_LEAGUES.includes(data.currentLeague) ? data.currentLeague : 'Ouro'
        };
      });
      members.sort((a, b) => b.xp - a.xp);
      onChange(members);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function leaveClosedRoom(user: User, roomCode: string): Promise<void> {
  const code = normalizeRoomCode(roomCode);
  if (!isValidRoomCodeFormat(code)) return;

  const path = `rooms/${code}/members/${user.uid}`;
  try {
    await deleteDoc(doc(db, 'rooms', code, 'members', user.uid));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
  removeRoomFromHistory(user.uid, code);
  const active = getStoredActiveRoom(user.uid);
  if (active?.roomCode === code) {
    setStoredActiveRoom(user.uid, null);
  }
}

