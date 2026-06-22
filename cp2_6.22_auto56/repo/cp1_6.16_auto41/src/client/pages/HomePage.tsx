import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Pet, PetStats, InteractionType } from '../types';
import { getWarningStats } from '../pet';
import PetAnimation from '../PetAnimation';
import InteractionPanel from '../InteractionPanel';
import StatBar from '../components/StatBar';
import WarningBanner from '../components/WarningBanner';
import './HomePage.css';

interface HomePageProps {
  pet: Pet;
  userId: string;
  onInteract: (type: InteractionType) => Promise<void>;
}

const HomePage = function HomePage({ pet, userId, onInteract }: HomePageProps) {
  const [animationType, setAnimationType] = useState<'feed' | 'clean' | 'play' | null>(null);

  const warnings = useMemo(() => getWarningStats(pet.stats), [pet.stats]);

  const handleInteract = useCallback(async (type: InteractionType) => {
    setAnimationType(type);
    await onInteract(type);
    
    setTimeout(() => {
      setAnimationType(null);
    }, 1500);
  }, [onInteract]);

  const statOrder: Array<keyof PetStats> = ['hunger', 'happiness', 'cleanliness', 'energy'];

  return (
    <div className="home-page">
      <WarningBanner warnings={warnings} petName={pet.name} />
      
      <div className="user-id-display">
        我的ID: <span className="id-number">{userId}</span>
      </div>
      
      <div className="stats-panel">
        {statOrder.map(stat => (
          <StatBar key={stat} stat={stat} value={pet.stats[stat]} />
        ))}
      </div>
      
      <div className="pet-display-area">
        <div className="pet-background">
          <PetAnimation
            name={pet.name}
            color={pet.color}
            stats={pet.stats}
            isSick={pet.isSick}
            animationType={animationType}
          />
        </div>
      </div>
      
      <InteractionPanel onInteract={handleInteract} disabled={pet.isSick} />
      
      {pet.isSick && (
        <div className="sick-notice">
          <span>😷</span>
          <p>宠物生病了！需要好友送药帮助恢复</p>
        </div>
      )}
    </div>
  );
};

export default HomePage;
