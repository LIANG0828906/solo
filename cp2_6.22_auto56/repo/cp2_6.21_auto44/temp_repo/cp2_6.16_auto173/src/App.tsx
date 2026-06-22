import React, { useState, useEffect, useCallback } from 'react';
import type { Rarity, ChestOpenResult } from './types';
import { useGameStore } from './store/useGameStore';
import { ChestGrid } from './modules/chest/chestUI';
import { ChestRenderer } from './modules/chest/chestRenderer';
import { generateChestResult } from './modules/chest/chestLogic';
import { InventoryUI } from './modules/inventory/inventoryUI';
import CelebrationBanner from './components/CelebrationBanner';
import AchievementPopup from './components/AchievementPopup';
import './App.css';

const App: React.FC = () => {
  const {
    keys,
    fragments,
    equipment,
    isOpening,
    chestResult,
    showInsufficientKeys,
    showAchievementPopup,
    showCelebrationBanner,
    setIsOpening,
    setChestResult,
    setShowInsufficientKeys,
    setShowAchievementPopup,
    setShowCelebrationBanner,
    openChest,
    addChestItems,
    tryCraft,
    checkAndGrantAchievements,
  } = useGameStore();

  const [currentChestRarity, setCurrentChestRarity] = useState<Rarity>('common');

  const handleOpenChest = useCallback((rarity: Rarity) => {
    const success = openChest(rarity);
    if (success) {
      setCurrentChestRarity(rarity);
      const result = generateChestResult(rarity);
      setChestResult(result);
    }
  }, [openChest, setChestResult]);

  const handleChestAnimationComplete = useCallback(() => {
    if (chestResult) {
      addChestItems(chestResult.items);
      checkAndGrantAchievements();
    }
    setIsOpening(false);
    setChestResult(null);
  }, [chestResult, addChestItems, checkAndGrantAchievements, setIsOpening, setChestResult]);

  const handleCraft = useCallback((fragmentId: string) => {
    tryCraft(fragmentId);
  }, [tryCraft]);

  const handleBannerClose = useCallback(() => {
    setShowCelebrationBanner(null);
  }, [setShowCelebrationBanner]);

  const handleAchievementClose = useCallback(() => {
    setShowAchievementPopup(null);
  }, [setShowAchievementPopup]);

  useEffect(() => {
    if (showInsufficientKeys) {
      const timer = setTimeout(() => {
        setShowInsufficientKeys(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showInsufficientKeys, setShowInsufficientKeys]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">LootCrate</h1>
        <p className="app-subtitle">开箱模拟器</p>
      </header>

      <section className="chest-section">
        <h2 className="section-title">选择宝箱</h2>
        <ChestGrid
          keys={keys}
          onOpenChest={handleOpenChest}
          shakingRarity={showInsufficientKeys}
        />
      </section>

      <section className="inventory-section">
        <InventoryUI
          fragments={fragments}
          equipment={equipment}
          onCraft={handleCraft}
        />
      </section>

      <ChestRenderer
        isOpen={isOpening}
        chestRarity={currentChestRarity}
        result={chestResult}
        onComplete={handleChestAnimationComplete}
      />

      <CelebrationBanner
        equipment={showCelebrationBanner}
        onClose={handleBannerClose}
      />

      <AchievementPopup
        data={showAchievementPopup}
        onClose={handleAchievementClose}
      />
    </div>
  );
};

export default App;
