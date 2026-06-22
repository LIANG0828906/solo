import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ElementCard } from './components/ElementCard';
import { Cauldron } from './components/Cauldron';
import { CollectionShelf } from './components/CollectionShelf';
import { ELEMENTS, ElementInfo, PotionInfo } from './utils/recipes';
import { ParticleSystem } from './utils/effects';
import './App.css';

const App: React.FC = () => {
  const [potions, setPotions] = useState<PotionInfo[]>([]);
  const [score, setScore] = useState(0);
  const [_dragElement, setDragElement] = useState<ElementInfo | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleSystemRef = useRef<ParticleSystem | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const particleSystem = new ParticleSystem(canvas);
    particleSystemRef.current = particleSystem;

    const handleResize = () => {
      particleSystem.resize(window.innerWidth, window.innerHeight);
    };

    handleResize();
    particleSystem.start();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      particleSystem.stop();
    };
  }, []);

  const handleDragStart = useCallback((_e: React.DragEvent, element: ElementInfo) => {
    setDragElement(element);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragElement(null);
  }, []);

  const handlePotionCreated = useCallback((potion: PotionInfo) => {
    const potionWithId = { ...potion, id: uuidv4() } as PotionInfo & { id: string };
    setPotions((prev) => [potionWithId as unknown as PotionInfo, ...prev].slice(0, 12));
    setScore((prev) => prev + potion.score);
  }, []);

  const elementList = Object.values(ELEMENTS);

  return (
    <div className="app">
      <canvas ref={canvasRef} className="particle-canvas" />

      <header className="app-header">
        <h1 className="app-title">
          <span className="title-icon">⚗️</span>
          魔法药水工坊
          <span className="title-icon">✨</span>
        </h1>
        <div className="score-display">
          <span className="score-label">得分</span>
          <span className="score-value">{score}</span>
        </div>
      </header>

      <main className="game-area">
        <aside className="materials-panel">
          <h2 className="panel-title">
            <span className="panel-icon">🔮</span>
            基础元素
          </h2>
          <div className="element-cards">
            {elementList.map((element) => (
              <ElementCard
                key={element.type}
                element={element}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />
            ))}
          </div>
          <div className="tips">
            <p>💡 提示: 将元素拖入坩埚</p>
            <p>✨ 尝试不同组合发现新配方</p>
          </div>
        </aside>

        <section className="cauldron-area">
          <Cauldron
            particleSystem={particleSystemRef.current}
            onPotionCreated={handlePotionCreated}
          />
        </section>

        <aside className="collection-panel">
          <CollectionShelf
            potions={potions}
            particleSystem={particleSystemRef.current}
          />
        </aside>
      </main>
    </div>
  );
};

export default App;
