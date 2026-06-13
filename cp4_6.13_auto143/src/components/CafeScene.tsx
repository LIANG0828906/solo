import React, { useEffect, useRef, useCallback } from 'react';
import anime from 'animejs';
import type { SpawnedCat, SpotType } from '../data/cats';
import { SPOT_POSITIONS, getBreedById } from '../data/cats';
import {
  animateFlyIn,
  animateLandingSit,
  animateIdleBehavior,
  animateMoveToSpot,
  animateFadeAway,
  createHighlightRing
} from '../utils/animation';

interface CafeSceneProps {
  spawnedCats: SpawnedCat[];
  highlightedCatId: string | null;
  onSpotClick: (spot: SpotType) => void;
  onCatMove: (catId: string, newSpot: SpotType) => void;
  onCatAnimationComplete: (catId: string) => void;
  removingCatIds: string[];
}

export const CafeScene: React.FC<CafeSceneProps> = ({
  spawnedCats,
  highlightedCatId,
  onSpotClick,
  onCatMove,
  onCatAnimationComplete,
  removingCatIds
}) => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const catRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const animationRefs = useRef<Map<string, anime.AnimeInstance[]>>(new Map());
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const cleanupAnimations = useCallback((catId: string) => {
    const anims = animationRefs.current.get(catId);
    if (anims) {
      anims.forEach(anim => anim.pause());
      animationRefs.current.delete(catId);
    }
  }, []);

  const startIdleAnimation = useCallback((catId: string, element: HTMLDivElement, behavior: string) => {
    cleanupAnimations(catId);
    const anim = animateIdleBehavior(element, behavior as any);
    animationRefs.current.set(catId, [anim]);
  }, [cleanupAnimations]);

  const animateCatIn = useCallback((catId: string, spot: SpotType) => {
    const element = catRefs.current.get(catId);
    if (!element) return;

    const flyInAnim = animateFlyIn(element, spot);
    flyInAnim.finished.then(() => {
      const landingAnim = animateLandingSit(element);
      landingAnim.finished.then(() => {
        onCatAnimationComplete(catId);
      });
      animationRefs.current.set(catId, [landingAnim]);
    });
    animationRefs.current.set(catId, [flyInAnim]);
  }, [onCatAnimationComplete]);

  const animateCatMove = useCallback((catId: string, fromSpot: SpotType, toSpot: SpotType) => {
    const element = catRefs.current.get(catId);
    if (!element) return;

    cleanupAnimations(catId);
    const moveAnim = animateMoveToSpot(element, fromSpot, toSpot);
    moveAnim.finished.then(() => {
      onCatMove(catId, toSpot);
    });
    animationRefs.current.set(catId, [moveAnim]);
  }, [cleanupAnimations, onCatMove]);

  const animateCatOut = useCallback((catId: string) => {
    const element = catRefs.current.get(catId);
    if (!element) return;

    cleanupAnimations(catId);
    animateFadeAway(element).then(() => {
      catRefs.current.delete(catId);
    });
  }, [cleanupAnimations]);

  useEffect(() => {
    spawnedCats.forEach(cat => {
      const element = catRefs.current.get(cat.id);
      if (!element) return;

      if (!animationRefs.current.has(cat.id) || animationRefs.current.get(cat.id)?.length === 0) {
        if (cat.behavior !== 'sitting') {
          startIdleAnimation(cat.id, element, cat.behavior);
        }
      } else if (cat.behavior !== 'sitting') {
        const currentAnims = animationRefs.current.get(cat.id);
        if (currentAnims && currentAnims[0] && !currentAnims[0].completed) {
          return;
        }
        startIdleAnimation(cat.id, element, cat.behavior);
      }
    });
  }, [spawnedCats, startIdleAnimation]);

  useEffect(() => {
    removingCatIds.forEach(catId => {
      animateCatOut(catId);
    });
  }, [removingCatIds, animateCatOut]);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      animationRefs.current.forEach(anims => {
        anims.forEach(anim => anim.pause());
      });
      animationRefs.current.clear();
    };
  }, []);

  useEffect(() => {
    const highlightElements = document.querySelectorAll<HTMLDivElement>('.cat-sprite.highlighted');
    highlightElements.forEach(el => {
      createHighlightRing(el);
    });
  }, [highlightedCatId]);

  const setCatRef = (catId: string, isNew: boolean, spot: SpotType) => (el: HTMLDivElement | null) => {
    if (el) {
      catRefs.current.set(catId, el);
      if (isNew) {
        setTimeout(() => animateCatIn(catId, spot), 50);
      }
    }
  };

  return (
    <div ref={sceneRef} className="cafe-scene">
      <div className="pixel-art">
        <div className="floor" />
        
        <div className="spot bar" onClick={() => onSpotClick('bar')} title="点击吧台召唤猫咪">
          <div className="spot-label">吧台</div>
          <div className="spot-click-hint">☕</div>
        </div>
        
        <div className="spot bookshelf" onClick={() => onSpotClick('bookshelf')} title="点击书架召唤猫咪">
          <div className="spot-label">书架</div>
          <div className="spot-click-hint">📚</div>
        </div>
        
        <div className="spot carpet" onClick={() => onSpotClick('carpet')} title="点击地毯召唤猫咪">
          <div className="spot-label">地毯</div>
          <div className="spot-click-hint">🧶</div>
        </div>
        
        <div className="spot windowsill" onClick={() => onSpotClick('windowsill')} title="点击窗台召唤猫咪">
          <div className="spot-label">窗台</div>
          <div className="spot-click-hint">🌿</div>
        </div>

        <div className="decoration counter">
          <div className="pixel-text">☕</div>
        </div>
        <div className="decoration books">
          <div className="pixel-text">📚</div>
        </div>
        <div className="decoration plant">
          <div className="pixel-text">🪴</div>
        </div>
        <div className="decoration lamp">
          <div className="pixel-text">💡</div>
        </div>
        <div className="decoration rug">
          <div className="rug-pattern" />
        </div>
        <div className="decoration window">
          <div className="window-view" />
        </div>

        {spawnedCats.map((cat, index) => {
          const breed = getBreedById(cat.breedId);
          if (!breed) return null;

          const pos = SPOT_POSITIONS[cat.position];
          const isHighlighted = highlightedCatId === cat.id;
          const isNew = !animationRefs.current.has(cat.id) && index === spawnedCats.length - 1;
          const isRemoving = removingCatIds.includes(cat.id);

          return (
            <div
              key={cat.id}
              ref={setCatRef(cat.id, isNew, cat.position)}
              className={`cat-sprite ${isHighlighted ? 'highlighted' : ''} ${isRemoving ? 'removing' : ''}`}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                zIndex: Math.floor(pos.y) + 10,
                willChange: 'transform, opacity'
              }}
            >
              <div 
                className="cat-body"
                style={{
                  background: `linear-gradient(135deg, ${breed.colorTheme.primary}, ${breed.colorTheme.secondary})`,
                  borderColor: breed.colorTheme.accent
                }}
              >
                <div className="cat-face">
                  <div className="cat-eyes">
                    <div className="eye left" />
                    <div className="eye right" />
                  </div>
                  <div className="cat-nose" style={{ background: breed.colorTheme.accent }} />
                  <div className="cat-mouth" />
                </div>
                <div className="cat-ears">
                  <div className="ear left" style={{ borderBottomColor: breed.colorTheme.primary }} />
                  <div className="ear right" style={{ borderBottomColor: breed.colorTheme.primary }} />
                </div>
                <div 
                  className="cat-tail" 
                  style={{ background: breed.colorTheme.secondary }}
                />
                <div className="cat-paws">
                  <div className="paw front-left" />
                  <div className="paw front-right" />
                  <div className="paw back-left" />
                  <div className="paw back-right" />
                </div>
              </div>
              {isHighlighted && <div className="highlight-ring" />}
            </div>
          );
        })}
      </div>

      <style>{`
        .cafe-scene {
          width: 100%;
          height: 100%;
          min-height: 400px;
          background: #1a1210;
          border-radius: 16px;
          overflow: hidden;
          border: 3px solid #8B4513;
          position: relative;
        }
        
        .pixel-art {
          width: 100%;
          height: 100%;
          position: relative;
          image-rendering: pixelated;
          image-rendering: crisp-edges;
        }
        
        .floor {
          position: absolute;
          inset: 0;
          background: 
            repeating-linear-gradient(
              90deg,
              #8B4513 0px,
              #8B4513 40px,
              #A0522D 40px,
              #A0522D 80px
            ),
            repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 38px,
              #6B3E0A 38px,
              #6B3E0A 40px
            );
          opacity: 0.8;
        }
        
        .spot {
          position: absolute;
          width: 120px;
          height: 100px;
          transform: translate(-50%, -50%);
          cursor: pointer;
          border-radius: 12px;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 5;
        }
        
        .spot::before {
          content: '';
          position: absolute;
          inset: 0;
          border: 2px dashed rgba(255, 215, 0, 0.3);
          border-radius: 12px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .spot:hover::before {
          opacity: 1;
          animation: borderPulse 1.5s ease-in-out infinite;
        }
        
        .spot:hover {
          transform: translate(-50%, -50%) scale(1.05);
        }
        
        .spot:active {
          transform: translate(-50%, -50%) scale(0.95);
        }
        
        .spot-label {
          font-family: 'ZCOOL KuaiLe', cursive;
          font-size: 14px;
          color: #F5DEB3;
          background: rgba(0, 0, 0, 0.6);
          padding: 2px 10px;
          border-radius: 10px;
          margin-top: 4px;
          pointer-events: none;
        }
        
        .spot-click-hint {
          font-size: 28px;
          pointer-events: none;
          animation: float 2s ease-in-out infinite;
        }
        
        .spot.bar { left: 25%; top: 30%; }
        .spot.bookshelf { left: 70%; top: 25%; }
        .spot.carpet { left: 40%; top: 65%; }
        .spot.windowsill { left: 75%; top: 70%; }
        
        .decoration {
          position: absolute;
          pointer-events: none;
          z-index: 1;
        }
        
        .decoration.counter {
          left: 15%;
          top: 15%;
          width: 120px;
          height: 60px;
          background: linear-gradient(180deg, #654321, #4a3015);
          border-radius: 8px;
          border: 3px solid #2d1f0f;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .decoration.books {
          right: 10%;
          top: 10%;
          width: 100px;
          height: 80px;
          background: linear-gradient(180deg, #8B4513, #654321);
          border-radius: 6px;
          border: 3px solid #4a3015;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .decoration.plant {
          right: 5%;
          top: 55%;
          font-size: 36px;
        }
        
        .decoration.lamp {
          left: 50%;
          top: 8%;
          transform: translateX(-50%);
          font-size: 32px;
        }
        
        .decoration.rug {
          left: 30%;
          top: 55%;
          width: 150px;
          height: 100px;
        }
        
        .rug-pattern {
          width: 100%;
          height: 100%;
          background: 
            repeating-linear-gradient(
              45deg,
              #B22222 0px,
              #B22222 10px,
              #DC143C 10px,
              #DC143C 20px
            );
          border-radius: 12px;
          opacity: 0.6;
          border: 3px solid #8B0000;
        }
        
        .decoration.window {
          right: 8%;
          top: 45%;
          width: 80px;
          height: 120px;
          background: #87CEEB;
          border: 6px solid #654321;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .window-view {
          width: 100%;
          height: 100%;
          background: linear-gradient(180deg, #87CEEB 0%, #98D8C8 100%);
          position: relative;
        }
        
        .window-view::before {
          content: '☁️';
          position: absolute;
          top: 20%;
          left: 20%;
          font-size: 16px;
          animation: cloudFloat 8s ease-in-out infinite;
        }
        
        .pixel-text {
          font-size: 24px;
        }
        
        .cat-sprite {
          position: absolute;
          width: 50px;
          height: 50px;
          transform: translate(-50%, -50%);
          transition: z-index 0s;
        }
        
        .cat-sprite.highlighted {
          z-index: 100 !important;
        }
        
        .cat-body {
          width: 100%;
          height: 100%;
          border-radius: 50% 50% 45% 45%;
          border: 3px solid;
          position: relative;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        
        .cat-face {
          position: absolute;
          top: 20%;
          left: 50%;
          transform: translateX(-50%);
          width: 60%;
          height: 50%;
        }
        
        .cat-eyes {
          display: flex;
          justify-content: space-between;
          position: absolute;
          top: 20%;
          left: 5%;
          right: 5%;
        }
        
        .eye {
          width: 8px;
          height: 10px;
          background: #2D2D2D;
          border-radius: 50%;
          position: relative;
        }
        
        .eye::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 3px;
          height: 3px;
          background: white;
          border-radius: 50%;
        }
        
        .cat-nose {
          position: absolute;
          top: 45%;
          left: 50%;
          transform: translateX(-50%);
          width: 6px;
          height: 4px;
          border-radius: 50% 50% 50% 50%;
        }
        
        .cat-mouth {
          position: absolute;
          top: 60%;
          left: 50%;
          transform: translateX(-50%);
          width: 12px;
          height: 6px;
          border-bottom: 2px solid #2D2D2D;
          border-radius: 0 0 50% 50%;
        }
        
        .cat-ears {
          position: absolute;
          top: -8px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-between;
          padding: 0 5px;
        }
        
        .ear {
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 12px solid;
        }
        
        .ear.left { transform: rotate(-20deg); }
        .ear.right { transform: rotate(20deg); }
        
        .cat-tail {
          position: absolute;
          bottom: 5px;
          right: -12px;
          width: 20px;
          height: 8px;
          border-radius: 4px;
          transform-origin: left center;
          animation: tailWag 1s ease-in-out infinite;
        }
        
        .cat-paws {
          position: absolute;
          bottom: -5px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-between;
          padding: 0 8px;
        }
        
        .paw {
          width: 10px;
          height: 8px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 50%;
        }
        
        .highlight-ring {
          position: absolute;
          inset: -10px;
          border-radius: 50%;
          border: 3px solid #FFD700;
          animation: pulse 1.5s ease-in-out infinite;
          pointer-events: none;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes borderPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        
        @keyframes pulse {
          0%, 100% { 
            transform: scale(1);
            opacity: 0.8;
          }
          50% { 
            transform: scale(1.2);
            opacity: 0.4;
          }
        }
        
        @keyframes tailWag {
          0%, 100% { transform: rotate(-10deg); }
          50% { transform: rotate(15deg); }
        }
        
        @keyframes cloudFloat {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(20px); }
        }
        
        @media (max-width: 768px) {
          .cafe-scene {
            min-height: 350px;
          }
          
          .spot {
            width: 80px;
            height: 70px;
          }
          
          .spot-click-hint {
            font-size: 20px;
          }
          
          .spot-label {
            font-size: 11px;
          }
          
          .cat-sprite {
            width: 40px;
            height: 40px;
          }
          
          .decoration.counter {
            width: 80px;
            height: 45px;
          }
          
          .decoration.books {
            width: 70px;
            height: 60px;
          }
          
          .decoration.rug {
            width: 100px;
            height: 70px;
          }
          
          .decoration.window {
            width: 60px;
            height: 90px;
          }
        }
      `}</style>
    </div>
  );
};
