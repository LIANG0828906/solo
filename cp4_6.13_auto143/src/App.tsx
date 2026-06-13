import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CafeScene } from './components/CafeScene';
import { CatCard } from './components/CatCard';
import { CatStatusPanel } from './components/CatStatusPanel';
import {
  CAT_BREEDS,
  getRandomBreed,
  getRandomPersonality,
  getRandomBehavior,
  getRandomAdjacentSpot,
  getBreedById
} from './data/cats';
import type { SpawnedCat, CatCollection, SpotType, CatBehavior } from './data/cats';

const MAX_CATS = 15;
const SPAWN_CHANCE = 0.2;
const MOVE_CHANCE = 0.3;
const BEHAVIOR_INTERVAL = 5000;

const App: React.FC = () => {
  const [spawnedCats, setSpawnedCats] = useState<SpawnedCat[]>([]);
  const [catCollection, setCatCollection] = useState<CatCollection>({});
  const [highlightedCatId, setHighlightedCatId] = useState<string | null>(null);
  const [newlyUnlockedBreedId, setNewlyUnlockedBreedId] = useState<string | null>(null);
  const [removingCatIds, setRemovingCatIds] = useState<string[]>([]);
  const behaviorTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const initialCollection: CatCollection = {};
    CAT_BREEDS.forEach(breed => {
      initialCollection[breed.id] = {
        unlocked: false,
        count: 0
      };
    });
    setCatCollection(initialCollection);
  }, []);

  const updateCatBehavior = useCallback(() => {
    setSpawnedCats(prev =>
      prev.map(cat => ({
        ...cat,
        behavior: getRandomBehavior()
      }))
    );
  }, []);

  useEffect(() => {
    behaviorTimerRef.current = window.setInterval(updateCatBehavior, BEHAVIOR_INTERVAL);
    return () => {
      if (behaviorTimerRef.current) {
        clearInterval(behaviorTimerRef.current);
      }
    };
  }, [updateCatBehavior]);

  const handleSpotClick = useCallback((spot: SpotType) => {
    if (Math.random() > SPAWN_CHANCE) {
      return;
    }

    const breed = getRandomBreed();
    const personality = getRandomPersonality(breed);
    const newCatId = `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newCat: SpawnedCat = {
      id: newCatId,
      breedId: breed.id,
      position: spot,
      behavior: 'sitting',
      spawnedAt: Date.now(),
      currentPersonality: personality
    };

    setSpawnedCats(prev => {
      let newCats = [...prev, newCat];
      
      if (newCats.length > MAX_CATS) {
        const catsToRemove = newCats.slice(0, newCats.length - MAX_CATS);
        setRemovingCatIds(catsToRemove.map(c => c.id));
        setTimeout(() => {
          setRemovingCatIds([]);
          setSpawnedCats(current => current.filter(c => !catsToRemove.some(r => r.id === c.id)));
        }, 800);
        newCats = newCats.slice(newCats.length - MAX_CATS);
      }
      
      return newCats;
    });

    setCatCollection(prev => {
      const current = prev[breed.id];
      const isNewUnlock = !current?.unlocked;
      
      if (isNewUnlock) {
        setNewlyUnlockedBreedId(breed.id);
        setTimeout(() => setNewlyUnlockedBreedId(null), 1000);
      }

      return {
        ...prev,
        [breed.id]: {
          unlocked: true,
          unlockedAt: isNewUnlock ? Date.now() : current?.unlockedAt,
          count: (current?.count || 0) + 1
        }
      };
    });
  }, []);

  const handleCatAnimationComplete = useCallback((catId: string) => {
    setTimeout(() => {
      setSpawnedCats(prev => {
        const cat = prev.find(c => c.id === catId);
        if (!cat) return prev;

        if (Math.random() < MOVE_CHANCE) {
          const newSpot = getRandomAdjacentSpot(cat.position);
          return prev.map(c =>
            c.id === catId ? { ...c, position: newSpot, behavior: getRandomBehavior() } : c
          );
        } else {
          return prev.map(c =>
            c.id === catId ? { ...c, behavior: getRandomBehavior() } : c
          );
        }
      });
    }, 100);
  }, []);

  const handleCatMove = useCallback((catId: string, newSpot: SpotType) => {
    setSpawnedCats(prev =>
      prev.map(c =>
        c.id === catId ? { ...c, position: newSpot, behavior: getRandomBehavior() } : c
      )
    );
  }, []);

  const handleCardClick = useCallback((breedId: string) => {
    setSpawnedCats(prev => {
      const catsOfBreed = prev.filter(c => c.breedId === breedId);
      if (catsOfBreed.length === 0) return prev;
      
      const randomCat = catsOfBreed[Math.floor(Math.random() * catsOfBreed.length)];
      setHighlightedCatId(randomCat.id);
      
      setTimeout(() => {
        setHighlightedCatId(null);
      }, 5000);
      
      return prev;
    });
  }, []);

  const handleStatusPanelCatClick = useCallback((catId: string) => {
    setHighlightedCatId(prev => prev === catId ? null : catId);
  }, []);

  const unlockedCount = Object.values(catCollection).filter(c => c.unlocked).length;

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🐱 虚拟猫咪咖啡馆 ☕</h1>
        <p className="subtitle">点击场景中的家具，收集可爱的猫咪吧！</p>
        <div className="collection-progress">
          图鉴收集进度：{unlockedCount} / {CAT_BREEDS.length}
        </div>
      </header>

      <main className="main-content">
        <section className="left-panel">
          <CafeScene
            spawnedCats={spawnedCats}
            highlightedCatId={highlightedCatId}
            onSpotClick={handleSpotClick}
            onCatMove={handleCatMove}
            onCatAnimationComplete={handleCatAnimationComplete}
            removingCatIds={removingCatIds}
          />
        </section>

        <section className="right-panel">
          <div className="cat-collection">
            <h2>📖 猫咪图鉴</h2>
            <div className="cat-grid">
              {CAT_BREEDS.map(breed => (
                <CatCard
                  key={breed.id}
                  breed={breed}
                  unlocked={catCollection[breed.id]?.unlocked || false}
                  count={catCollection[breed.id]?.count || 0}
                  isNewlyUnlocked={newlyUnlockedBreedId === breed.id}
                  onCardClick={() => handleCardClick(breed.id)}
                  hasSpawnedCats={spawnedCats.some(c => c.breedId === breed.id)}
                />
              ))}
            </div>
          </div>

          <div className="status-panel-wrapper">
            <CatStatusPanel
              spawnedCats={spawnedCats}
              highlightedCatId={highlightedCatId}
              onCatClick={handleStatusPanelCatClick}
            />
          </div>
        </section>
      </main>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'ZCOOL KuaiLe', cursive;
          background: linear-gradient(135deg, #2a1f1a 0%, #1a1210 100%);
          min-height: 100vh;
          color: #F5DEB3;
        }

        .app-container {
          min-height: 100vh;
          padding: 20px;
          max-width: 1600px;
          margin: 0 auto;
        }

        .app-header {
          text-align: center;
          margin-bottom: 24px;
          padding: 20px;
          background: rgba(42, 31, 26, 0.8);
          border-radius: 16px;
          border: 2px solid #8B4513;
        }

        .app-header h1 {
          font-family: 'Press Start 2P', cursive;
          font-size: 24px;
          color: #FFD700;
          margin-bottom: 8px;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }

        .subtitle {
          font-size: 16px;
          color: #D2B48C;
          margin-bottom: 12px;
        }

        .collection-progress {
          font-family: 'Press Start 2P', cursive;
          font-size: 12px;
          color: #98FB98;
          background: rgba(0, 0, 0, 0.3);
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
        }

        .main-content {
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: 24px;
          height: calc(100vh - 220px);
          min-height: 600px;
        }

        .left-panel {
          height: 100%;
          min-height: 500px;
        }

        .right-panel {
          display: flex;
          flex-direction: column;
          gap: 20px;
          height: 100%;
          overflow: hidden;
        }

        .cat-collection {
          flex: 1;
          background: rgba(42, 31, 26, 0.95);
          border-radius: 16px;
          padding: 16px;
          border: 2px solid #8B4513;
          overflow-y: auto;
        }

        .cat-collection h2 {
          font-family: 'ZCOOL KuaiLe', cursive;
          font-size: 20px;
          color: #F5DEB3;
          margin-bottom: 16px;
          text-align: center;
        }

        .cat-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
        }

        .status-panel-wrapper {
          flex: 1;
          min-height: 0;
        }

        .cat-collection::-webkit-scrollbar {
          width: 8px;
        }

        .cat-collection::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }

        .cat-collection::-webkit-scrollbar-thumb {
          background: #8B4513;
          border-radius: 4px;
        }

        @media (max-width: 1024px) {
          .main-content {
            grid-template-columns: 11fr 9fr;
            gap: 16px;
          }

          .cat-grid {
            grid-template-columns: repeat(4, 1fr);
          }

          .app-header h1 {
            font-size: 20px;
          }
        }

        @media (max-width: 768px) {
          .app-container {
            padding: 12px;
          }

          .main-content {
            grid-template-columns: 1fr;
            height: auto;
            min-height: auto;
          }

          .left-panel {
            min-height: 350px;
            height: 50vh;
          }

          .right-panel {
            flex-direction: column;
          }

          .cat-collection {
            max-height: 400px;
          }

          .cat-grid {
            grid-template-columns: repeat(5, 1fr);
            gap: 8px;
          }

          .app-header h1 {
            font-size: 16px;
          }

          .subtitle {
            font-size: 14px;
          }

          .collection-progress {
            font-size: 10px;
          }

          .cat-collection h2 {
            font-size: 18px;
          }
        }

        @media (max-width: 480px) {
          .cat-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default App;
