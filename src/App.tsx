import React, { useState, useEffect } from 'react';
import { MainTabType, PathNode, Unit, UserProfile, LibrasTrack, SignData } from './types';
import { storageService } from './services/storage';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { RightSidebar } from './components/RightSidebar';
import { LearnPathView } from './views/LearnPathView';
import { DictionaryView } from './views/DictionaryView';
import { PracticeHubView } from './views/PracticeHubView';
import { CameraStudioView } from './views/CameraStudioView';
import { LeaderboardView } from './views/LeaderboardView';
import { QuestsView } from './views/QuestsView';
import { ShopView } from './views/ShopView';
import { ProfileView } from './views/ProfileView';
import { LessonPlayerModal } from './views/LessonPlayerModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTabType>('learn');
  const [userProfile, setUserProfile] = useState<UserProfile>(storageService.getUserProfile());
  const [activeLesson, setActiveLesson] = useState<{ node: PathNode; unit: Unit } | null>(null);

  useEffect(() => {
    storageService.saveUserProfile(userProfile);
  }, [userProfile]);

  const handleSelectTrack = (track: LibrasTrack) => {
    const updated = storageService.setLibrasTrack(track);
    setUserProfile(updated);
  };

  const handleToggleFavoriteSign = (signId: string) => {
    const updated = storageService.toggleFavoriteSign(signId);
    setUserProfile(updated);
  };

  const handleStartNode = (node: PathNode, unit: Unit) => {
    setActiveLesson({ node, unit });
  };

  const handleLessonCompleted = (xpEarned: number, gemsEarned: number) => {
    if (!activeLesson) return;
    const nodeId = activeLesson.node.id;

    const newCompleted = Array.from(new Set([...userProfile.completedNodeIds, nodeId]));
    const updated = storageService.addXpAndGems(xpEarned, gemsEarned);
    const finalProfile: UserProfile = {
      ...updated,
      completedNodeIds: newCompleted
    };

    setUserProfile(finalProfile);
    storageService.saveUserProfile(finalProfile);
  };

  const handleLoseHeart = () => {
    const res = storageService.loseHeart();
    setUserProfile(res.profile);
  };

  const handleRefillHearts = () => {
    const updated = storageService.refillHearts();
    setUserProfile(updated);
  };

  const handleToggleSuper = () => {
    const updated = storageService.toggleSuperDuolingo();
    setUserProfile(updated);
  };

  const handleBuyShopItem = (itemId: string, cost: number) => {
    const currentGems = userProfile.gems - cost;
    let updatedProfile = { ...userProfile, gems: Math.max(0, currentGems) };

    if (itemId === 'hearts') {
      updatedProfile.hearts = updatedProfile.maxHearts;
    } else if (itemId === 'freeze') {
      updatedProfile.streakFreezeCount += 1;
    } else if (itemId === 'wager') {
      updatedProfile.wagerActive = true;
      updatedProfile.wagerDaysLeft = 7;
    } else {
      // It's an outfit
      if (!updatedProfile.unlockedOutfits.includes(itemId)) {
        updatedProfile.unlockedOutfits = [...updatedProfile.unlockedOutfits, itemId];
      }
    }

    setUserProfile(updatedProfile);
    storageService.saveUserProfile(updatedProfile);
  };

  const handleEquipOutfit = (outfitId: string) => {
    const updated = { ...userProfile, duoOutfit: outfitId };
    setUserProfile(updated);
    storageService.saveUserProfile(updated);
  };

  const handleClaimQuest = (questId: string) => {
    const quest = userProfile.quests.find(q => q.id === questId);
    if (!quest) return;

    const updatedQuests = userProfile.quests.map(q => q.id === questId ? { ...q, claimed: true } : q);
    const updatedProfile = storageService.addXpAndGems(quest.rewardXp, quest.rewardGems);
    const finalProfile = { ...updatedProfile, quests: updatedQuests };
    setUserProfile(finalProfile);
    storageService.saveUserProfile(finalProfile);
  };

  const handleUpdateProfile = (name: string, username: string) => {
    const updated = { ...userProfile, name, username };
    setUserProfile(updated);
    storageService.saveUserProfile(updated);
  };

  const handleResetData = () => {
    const fresh = storageService.resetAllData();
    setUserProfile(fresh);
  };

  const handleRewardFromCamera = (xp: number, gems: number) => {
    const updated = storageService.addXpAndGems(xp, gems);
    setUserProfile(updated);
  };

  return (
    <div className="min-h-screen bg-white text-[#4B4B4B] font-sans flex flex-col md:flex-row antialiased selection:bg-[#58CC02] selection:text-white">
      
      {/* 1. Left Sidebar (Fixed on Desktop, Bottom on Mobile) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userProfile={userProfile}
      />

      {/* 2. Main Content Center + Top Bar + Right Sidebar */}
      <div className="flex-1 flex flex-col min-h-screen">
        
        {/* Top Floating Status Bar */}
        <TopHeader
          userProfile={userProfile}
          onSelectTrack={handleSelectTrack}
          onRefillHearts={handleRefillHearts}
          onToggleSuper={handleToggleSuper}
          onOpenShop={() => setActiveTab('shop')}
          onResetData={handleResetData}
        />

        {/* Dynamic Center Stage & Right Sidebar Layout */}
        <div className="flex-1 flex justify-center max-w-7xl w-full mx-auto pb-20 md:pb-8">
          
          {/* Active View */}
          <main className="flex-1 min-w-0 px-2 sm:px-4 py-4 max-w-3xl">
            {activeTab === 'learn' && (
              <LearnPathView
                userProfile={userProfile}
                onStartNode={handleStartNode}
              />
            )}

            {activeTab === 'camera' && (
              <CameraStudioView
                userProfile={userProfile}
                onClose={() => setActiveTab('learn')}
                onEarnReward={handleRewardFromCamera}
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
                onOpenCameraStudio={() => setActiveTab('camera')}
              />
            )}

            {activeTab === 'leaderboards' && (
              <LeaderboardView
                userProfile={userProfile}
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
              />
            )}
          </main>

          {/* Right Sidebar Widgets */}
          <RightSidebar
            userProfile={userProfile}
            onNavigateTab={setActiveTab}
          />

        </div>

      </div>

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
  );
}
