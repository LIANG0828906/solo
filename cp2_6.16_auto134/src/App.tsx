import React, { useEffect, useState } from 'react';
import { useGameStore } from './store/useGameStore';
import MainMenu from './components/MainMenu';
import GameCanvas from './components/GameCanvas';
import ShipCustomizer from './modules/ShipCustomizer';
import Achievements from './components/Achievements';
import { getCurrentBuild, getHighScore, getCredits, getTotalKills, getAchievements } from './utils/storage';
import './styles/global.css';

const App: React.FC = () => {
  const {
    scene,
    currentBuild,
    setCurrentBuild,
    setHighScore,
    setCredits,
    setTotalKills,
    setAchievements,
    showAchievement,
    hideAchievementPopup,
  } = useGameStore();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    try {
      const build = await getCurrentBuild();
      if (build) setCurrentBuild(build);

      const highScore = await getHighScore();
      setHighScore(highScore);

      const credits = await getCredits();
      setCredits(credits);

      const kills = await getTotalKills();
      setTotalKills(kills);

      const achievements = await getAchievements();
      setAchievements(achievements);
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (showAchievement) {
      const timer = setTimeout(() => {
        hideAchievementPopup();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showAchievement, hideAchievementPopup]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden">
      {scene === 'menu' && <MainMenu />}
      
      {scene === 'playing' && currentBuild && (
        <GameCanvas build={currentBuild} />
      )}
      
      {scene === 'customize' && <ShipCustomizer />}
      
      {scene === 'achievements' && <Achievements />}

      {showAchievement && (
        <div className="achievement-popup">
          <div className="font-bold text-lg">🏆 成就解锁！</div>
          <div className="text-sm">{showAchievement.name}</div>
        </div>
      )}
    </div>
  );
};

export default App;
