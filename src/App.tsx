import React, { useState, useEffect, useRef, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { MainTabType, PathNode, Unit, UserProfile, LibrasTrack } from './types';
import {
  auth,
  formatFirebaseAuthError,
  isUserVerifiedForFirestore,
  sendEmailVerification,
  signOut
} from './firebase';
import {
  ClosedRoom,
  RoomMemberEntry,
  SavedTranslationRecord,
  createClosedRoom,
  deleteSavedTranslation,
  ensureUserDocuments,
  fetchExistingClosedRoom,
  getSavedRoomsHistory,
  getStoredActiveRoom,
  joinClosedRoomByCode,
  leaveClosedRoom,
  removeRoomFromHistory,
  setStoredActiveRoom,
  subscribeRoomMembers,
  subscribeSavedTranslations,
  subscribeUserProfile,
  syncProfileToFirestore,
  syncRoomMemberProgress
} from './services/firebaseSync';
import { storageService } from './services/storage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { RightSidebar } from './components/RightSidebar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AuthModal } from './components/AuthModal';
import { LearnPathView } from './views/LearnPathView';
import { DictionaryView } from './views/DictionaryView';
import { PracticeHubView } from './views/PracticeHubView';
import { LeaderboardView } from './views/LeaderboardView';
import { QuestsView } from './views/QuestsView';
import { ShopView } from './views/ShopView';
import { ProfileView } from './views/ProfileView';
import { LessonPlayerModal } from './views/LessonPlayerModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTabType>('learn');
  const [userProfile, setUserProfile] = useState<UserProfile>(() => storageService.getUserProfile());
  const [activeLesson, setActiveLesson] = useState<{ node: PathNode; unit: Unit } | null>(null);

  // Firebase Auth & Firestore state
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [authBusy, setAuthBusy] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState<'options' | 'email' | 'phone'>('options');
  const [authReloadNonce, setAuthReloadNonce] = useState<number>(0);

  const [savedTranslations, setSavedTranslations] = useState<SavedTranslationRecord[]>([]);
  const [activeRoom, setActiveRoom] = useState<ClosedRoom | null>(null);
  const [savedRooms, setSavedRooms] = useState<ClosedRoom[]>([]);
  const [roomMembers, setRoomMembers] = useState<RoomMemberEntry[]>([]);
  const [roomBusy, setRoomBusy] = useState<boolean>(false);
  const [roomError, setRoomError] = useState<string | null>(null);

  const skipNextCloudSyncRef = useRef<boolean>(false);
  const latestProfileRef = useRef<UserProfile>(userProfile);
  latestProfileRef.current = userProfile;
  const activeRoomRef = useRef<ClosedRoom | null>(activeRoom);
  activeRoomRef.current = activeRoom;

  // Always persist locally for instant offline availability
  useEffect(() => {
    storageService.saveUserProfile(userProfile);
  }, [userProfile]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
      setAuthError(null);
      if (!user) {
        setSavedTranslations([]);
        setActiveRoom(null);
        setSavedRooms([]);
        setRoomMembers([]);
        setRoomError(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const canSyncCloud = isUserVerifiedForFirestore(firebaseUser);

  // Attach Firestore listeners only when auth is ready and caller passes verification invariant
  useEffect(() => {
    if (!authReady || !firebaseUser || !canSyncCloud) return;

    let cancelled = false;
    let unsubProfile: (() => void) | undefined;
    let unsubTranslations: (() => void) | undefined;

    setSavedRooms(getSavedRoomsHistory(firebaseUser.uid));

    (async () => {
      try {
        const syncedProfile = await ensureUserDocuments(firebaseUser, latestProfileRef.current);
        if (cancelled) return;

        skipNextCloudSyncRef.current = true;
        setUserProfile(syncedProfile);
        storageService.saveUserProfile(syncedProfile);

        unsubProfile = subscribeUserProfile(
          firebaseUser.uid,
          syncedProfile,
          (remoteProfile) => {
            skipNextCloudSyncRef.current = true;
            setUserProfile(remoteProfile);
          },
          (err) => {
            console.warn('Erro ao sincronizar perfil:', err.message);
          }
        );

        unsubTranslations = subscribeSavedTranslations(
          firebaseUser.uid,
          (records) => setSavedTranslations(records),
          (err) => console.warn('Erro ao carregar traduções salvas:', err.message)
        );

        // Restore previously joined room only after verifying it still exists
        const storedRoom = getStoredActiveRoom(firebaseUser.uid);
        if (storedRoom) {
          const verifiedRoom = await fetchExistingClosedRoom(storedRoom.roomCode);
          if (!cancelled && verifiedRoom) {
            setActiveRoom(verifiedRoom);
            syncRoomMemberProgress(firebaseUser, verifiedRoom.roomCode, syncedProfile).catch(
              () => undefined
            );
          } else if (!cancelled) {
            removeRoomFromHistory(firebaseUser.uid, storedRoom.roomCode);
            setStoredActiveRoom(firebaseUser.uid, null);
            setSavedRooms(getSavedRoomsHistory(firebaseUser.uid));
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('Erro ao inicializar dados Firebase:', err);
          setAuthError('Sincronização em nuvem temporariamente indisponível. Seu progresso local continua salvo.');
        }
      }
    })();

    return () => {
      cancelled = true;
      unsubProfile?.();
      unsubTranslations?.();
    };
  }, [authReady, firebaseUser, canSyncCloud, authReloadNonce]);

  // Subscribe exclusively to members of the active verified room
  useEffect(() => {
    if (!authReady || !firebaseUser || !canSyncCloud || !activeRoom) {
      setRoomMembers([]);
      return;
    }

    const unsubscribe = subscribeRoomMembers(
      activeRoom.roomCode,
      (members) => {
        setRoomMembers(members);
      },
      (err) => {
        console.warn('Erro ao carregar membros da sala:', err.message);
        setRoomError('Não foi possível sincronizar os participantes da sala agora. Tente novamente.');
      }
    );

    return () => unsubscribe();
  }, [authReady, firebaseUser, canSyncCloud, activeRoom]);

  // Helper to update profile both locally and in Firestore (plus active room member row)
  const commitProfileUpdate = useCallback(
    (nextProfile: UserProfile) => {
      setUserProfile(nextProfile);
      storageService.saveUserProfile(nextProfile);

      if (firebaseUser && isUserVerifiedForFirestore(firebaseUser)) {
        syncProfileToFirestore(firebaseUser, nextProfile).catch((err) => {
          console.warn('Falha ao salvar progresso no Firebase:', err);
        });
        if (activeRoomRef.current) {
          syncRoomMemberProgress(firebaseUser, activeRoomRef.current.roomCode, nextProfile).catch(
            () => undefined
          );
        }
      }
    },
    [firebaseUser]
  );

  const openAuthModal = (initialTab: 'options' | 'email' | 'phone' = 'options') => {
    setAuthError(null);
    setAuthModalInitialTab(initialTab);
    setIsAuthModalOpen(true);
  };

  const handleResendVerificationEmail = async () => {
    if (!firebaseUser) return;
    setAuthBusy(true);
    setAuthError(null);
    try {
      await sendEmailVerification(firebaseUser);
    } catch (err) {
      setAuthError(formatFirebaseAuthError(err));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleRefreshAuthUser = async () => {
    if (!firebaseUser) return;
    setAuthBusy(true);
    setAuthError(null);
    try {
      await firebaseUser.reload();
      setFirebaseUser(auth.currentUser);
      setAuthReloadNonce((n) => n + 1);
    } catch (err) {
      setAuthError(formatFirebaseAuthError(err));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Sign out error:', err);
      setAuthError(formatFirebaseAuthError(err));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSelectTrack = (track: LibrasTrack) => {
    const updated = storageService.setLibrasTrack(track);
    commitProfileUpdate(updated);
  };

  const handleToggleFavoriteSign = (signId: string) => {
    const updated = storageService.toggleFavoriteSign(signId);
    commitProfileUpdate(updated);
  };

  const handleStartNode = (node: PathNode, unit: Unit) => {
    setActiveLesson({ node, unit });
  };

  const handleLessonCompleted = (xpEarned: number, gemsEarned: number) => {
    if (!activeLesson) return;
    const nodeId = activeLesson.node.id;

    const newCompleted = Array.from(new Set([...userProfile.completedNodeIds, nodeId]));
    const updated = storageService.addXpAndGems(xpEarned, gemsEarned, true);
    const finalProfile: UserProfile = {
      ...updated,
      completedNodeIds: newCompleted
    };

    commitProfileUpdate(finalProfile);
  };

  const handleLoseHeart = () => {
    const res = storageService.loseHeart();
    commitProfileUpdate(res.profile);
  };

  const handleRefillHearts = () => {
    const updated = storageService.refillHearts();
    commitProfileUpdate(updated);
  };

  const handleToggleSuper = () => {
    const updated = storageService.toggleSuperDuolingo();
    commitProfileUpdate(updated);
  };

  const handleBuyShopItem = (itemId: string, cost: number) => {
    const currentGems = userProfile.gems - cost;
    const updatedProfile = { ...userProfile, gems: Math.max(0, currentGems) };

    if (itemId === 'hearts') {
      updatedProfile.hearts = updatedProfile.maxHearts;
    } else if (itemId === 'freeze') {
      updatedProfile.streakFreezeCount += 1;
    } else if (itemId === 'wager') {
      updatedProfile.wagerActive = true;
      updatedProfile.wagerDaysLeft = 7;
    } else {
      if (!updatedProfile.unlockedOutfits.includes(itemId)) {
        updatedProfile.unlockedOutfits = [...updatedProfile.unlockedOutfits, itemId];
      }
    }

    commitProfileUpdate(updatedProfile);
  };

  const handleEquipOutfit = (outfitId: string) => {
    commitProfileUpdate({ ...userProfile, duoOutfit: outfitId });
  };

  const handleClaimQuest = (questId: string) => {
    const quest = userProfile.quests.find((q) => q.id === questId);
    if (!quest) return;

    const updatedQuests = userProfile.quests.map((q) =>
      q.id === questId ? { ...q, claimed: true } : q
    );
    const updatedProfile = storageService.addXpAndGems(quest.rewardXp, quest.rewardGems);
    const finalProfile = { ...updatedProfile, quests: updatedQuests };
    commitProfileUpdate(finalProfile);
  };

  const handleUpdateProfile = (name: string, username: string) => {
    commitProfileUpdate({ ...userProfile, name, username });
  };

  const handleResetData = () => {
    const fresh = storageService.resetAllData();
    const withUid = firebaseUser ? { ...fresh, userId: firebaseUser.uid } : fresh;
    commitProfileUpdate(withUid);
  };

  const handleDeleteSavedTranslation = async (translationId: string) => {
    if (!firebaseUser) return;
    await deleteSavedTranslation(firebaseUser.uid, translationId).catch(() => undefined);
  };

  const formatRoomErrorMessage = (err: unknown, fallback: string): string => {
    const raw = err instanceof Error ? err.message : String(err || '');
    if (raw.startsWith('{')) {
      try {
        const parsed = JSON.parse(raw) as { error?: string };
        const inner = String(parsed.error || '').toLowerCase();
        if (inner.includes('permission') || inner.includes('insufficient')) {
          return 'Permissão negada no Firebase para acessar esta sala. Verifique se sua conta está autenticada e confirmada.';
        }
        if (inner.includes('offline') || inner.includes('network') || inner.includes('unavailable')) {
          return 'Sem conexão com o servidor no momento. Tente novamente em instantes.';
        }
        if (inner.includes('quota')) {
          return 'Limite diário do banco de dados atingido. Tente novamente amanhã.';
        }
        return fallback;
      } catch {
        return fallback;
      }
    }
    return raw || fallback;
  };

  const handleJoinRoomByCode = async (code: string) => {
    if (!firebaseUser || !canSyncCloud) {
      openAuthModal('options');
      return;
    }
    setRoomBusy(true);
    setRoomError(null);
    try {
      const joinedRoom = await joinClosedRoomByCode(firebaseUser, latestProfileRef.current, code);
      setActiveRoom(joinedRoom);
      setSavedRooms(getSavedRoomsHistory(firebaseUser.uid));
    } catch (err) {
      setRoomError(
        formatRoomErrorMessage(
          err,
          'Não foi possível entrar na sala. Confira o código informado.'
        )
      );
    } finally {
      setRoomBusy(false);
    }
  };

  const handleCreateClosedRoom = async (roomName: string) => {
    if (!firebaseUser || !canSyncCloud) {
      openAuthModal('options');
      return;
    }
    setRoomBusy(true);
    setRoomError(null);
    try {
      const created = await createClosedRoom(firebaseUser, latestProfileRef.current, roomName);
      setActiveRoom(created);
      setSavedRooms(getSavedRoomsHistory(firebaseUser.uid));
    } catch (err) {
      setRoomError(
        formatRoomErrorMessage(
          err,
          'Não foi possível criar a sala agora. Tente novamente.'
        )
      );
    } finally {
      setRoomBusy(false);
    }
  };

  const handleSwitchRoom = () => {
    if (firebaseUser) {
      setStoredActiveRoom(firebaseUser.uid, null);
    }
    setActiveRoom(null);
    setRoomError(null);
  };

  const handleLeaveRoom = async (roomCode: string) => {
    if (!firebaseUser) return;
    setRoomBusy(true);
    setRoomError(null);
    try {
      await leaveClosedRoom(firebaseUser, roomCode);
      setActiveRoom(null);
      setSavedRooms(getSavedRoomsHistory(firebaseUser.uid));
    } catch (err) {
      setRoomError(formatRoomErrorMessage(err, 'Erro ao sair da sala.'));
    } finally {
      setRoomBusy(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#FAF9F6] text-[#1C1917] font-sans flex flex-col md:flex-row antialiased selection:bg-[#0D9488] selection:text-white">
        {/* 1. Left Sidebar (Fixed on Desktop, Bottom on Mobile) */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          userProfile={userProfile}
        />

        {/* 2. Main Content Center + Top Bar + Right Sidebar */}
        <div className="flex-1 flex flex-col min-h-screen min-w-0">
          <OfflineIndicator />

          {/* Top Floating Status Bar */}
          <TopHeader
            userProfile={userProfile}
            onSelectTrack={handleSelectTrack}
            onRefillHearts={handleRefillHearts}
            onToggleSuper={handleToggleSuper}
            onOpenShop={() => setActiveTab('shop')}
            onResetData={handleResetData}
            firebaseUser={firebaseUser}
            authBusy={authBusy}
            onOpenAuthModal={() => openAuthModal('options')}
            onOpenProfile={() => setActiveTab('profile')}
          />

          {/* Dynamic Center Stage & Right Sidebar Layout */}
          <div className="flex-1 flex justify-center max-w-6xl w-full mx-auto pb-20 md:pb-8">
            {/* Active View */}
            <main className="flex-1 min-w-0 px-3 sm:px-6 py-4 max-w-3xl w-full">
              {activeTab === 'learn' && (
                <LearnPathView
                  userProfile={userProfile}
                  onStartNode={handleStartNode}
                />
              )}

              {activeTab === 'dictionary' && (
                <DictionaryView
                  userProfile={userProfile}
                  onToggleFavorite={handleToggleFavoriteSign}
                />
              )}

              {activeTab === 'practice' && (
                <PracticeHubView
                  userProfile={userProfile}
                  onStartPractice={handleStartNode}
                  onRefillHearts={handleRefillHearts}
                  onOpenDictionary={() => setActiveTab('dictionary')}
                />
              )}

              {activeTab === 'leaderboards' && (
                <LeaderboardView
                  userProfile={userProfile}
                  currentUid={firebaseUser?.uid ?? null}
                  isSignedIn={Boolean(firebaseUser)}
                  userEmail={firebaseUser?.email ?? null}
                  canSyncCloud={canSyncCloud}
                  authBusy={authBusy}
                  activeRoom={activeRoom}
                  savedRooms={savedRooms}
                  roomMembers={roomMembers}
                  roomBusy={roomBusy}
                  roomError={roomError}
                  onJoinRoomByCode={handleJoinRoomByCode}
                  onCreateRoom={handleCreateClosedRoom}
                  onSwitchRoom={handleSwitchRoom}
                  onLeaveRoom={handleLeaveRoom}
                  onClearRoomError={() => setRoomError(null)}
                  onOpenAuthModal={() => openAuthModal('options')}
                  onResendVerification={handleResendVerificationEmail}
                  onRefreshVerification={handleRefreshAuthUser}
                />
              )}

              {activeTab === 'quests' && (
                <QuestsView
                  userProfile={userProfile}
                  onClaimQuest={handleClaimQuest}
                />
              )}

              {activeTab === 'shop' && (
                <ShopView
                  userProfile={userProfile}
                  onBuyItem={handleBuyShopItem}
                  onEquipOutfit={handleEquipOutfit}
                  onToggleSuper={handleToggleSuper}
                />
              )}

              {activeTab === 'profile' && (
                <ProfileView
                  userProfile={userProfile}
                  onUpdateName={handleUpdateProfile}
                  onResetData={handleResetData}
                  firebaseUser={firebaseUser}
                  canSyncCloud={canSyncCloud}
                  authBusy={authBusy}
                  authError={authError}
                  onOpenAuthModal={openAuthModal}
                  onResendVerification={handleResendVerificationEmail}
                  onRefreshVerification={handleRefreshAuthUser}
                  onSignOut={handleSignOut}
                  savedTranslations={savedTranslations}
                  onDeleteTranslation={handleDeleteSavedTranslation}
                />
              )}
            </main>

            {/* Right Sidebar Widgets */}
            <RightSidebar
              userProfile={userProfile}
              onNavigateTab={setActiveTab}
              firebaseUser={firebaseUser}
              authBusy={authBusy}
              onOpenAuthModal={() => openAuthModal('options')}
            />
          </div>
        </div>

        {/* Multi-Provider Authentication Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          initialTab={authModalInitialTab}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={() => setAuthReloadNonce((n) => n + 1)}
        />

        {/* Fullscreen Interactive Lesson Player Modal */}
        {activeLesson && (
          <LessonPlayerModal
            node={activeLesson.node}
            unit={activeLesson.unit}
            userProfile={userProfile}
            onClose={() => setActiveLesson(null)}
            onLessonCompleted={handleLessonCompleted}
            onLoseHeart={handleLoseHeart}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
