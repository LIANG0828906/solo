import React, { useEffect, useRef, useCallback, useState } from 'react';
import anime from 'animejs';
import type { SpawnedCat, SpotType, CatBehavior } from '../data/cats';
import { SPOT_POSITIONS, getBreedById, getRandomBehavior, getRandomAdjacentSpot } from '../data/cats';
import {
  animateFlyIn,
  animateLandingSit,
  animateIdleBehavior,
  animateMoveToSpot,
  animateFadeAway,
  createHighlightRing,
  removeHighlightRing
} from '../utils/animation';

interface CatAnimationState {
  status: 'flying' | 'landing' | 'idle' | 'moving' | 'removing';
  currentBehavior: CatBehavior;
  behaviorTimer: number | null;
  lastBehaviorChange: number;
}

interface CafeSceneProps {
  spawnedCats: SpawnedCat[];
  highlightedCatId: string | null;
  onSpotClick: (spot: SpotType) => void;
  onCatMove: (catId: string, newSpot: SpotType) => void;
  onCatAnimationComplete: (catId: string) => void;
  removingCatIds: string[];
  onCatBehaviorChange: (catId: string, behavior: CatBehavior) => void;
  onCatRemovalComplete: (catId: string) => void;
}

export const CafeScene: React.FC<CafeSceneProps> = ({
  spawnedCats,
  highlightedCatId,
  onSpotClick,
  onCatMove,
  onCatAnimationComplete,
  removingCatIds,
  onCatBehaviorChange,
  onCatRemovalComplete
}) => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const catRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const animationRefs = useRef<Map<string, anime.AnimeInstance[]>>(new Map());
  const catStates = useRef<Map<string, CatAnimationState>>(new Map());
  const rafRef = useRef<number | null>(null);
  const processedNewCats = useRef<Set<string>>(new Set());

  const cleanupAnimations = useCallback((catId: string) => {
    const anims = animationRefs.current.get(catId);
    if (anims) {
      anims.forEach(anim => anim.pause());
      animationRefs.current.delete(catId);
    }
    
    const state = catStates.current.get(catId);
    if (state) {
      if (state.behaviorTimer) {
        clearTimeout(state.behaviorTimer);
        state.behaviorTimer = null;
      }
    }
  }, []);

  const startTailWag = useCallback((element: HTMLElement) => {
    const tailEl = element.querySelector('.cat-tail') as HTMLElement;
    if (!tailEl) return null;
    
    return anime({
      targets: tailEl,
      rotate: [-15, 20, -15],
      duration: 500,
      loop: true,
      easing: 'easeInOutSine',
      autoplay: true
    });
  }, []);

  const startSittingAnimation = useCallback((element: HTMLElement, duration: number): anime.AnimeInstance => {
    const bodyEl = element.querySelector('.cat-body') as HTMLElement;
    const tailEl = element.querySelector('.cat-tail') as HTMLElement;
    
    const bodyAnim = anime({
      targets: bodyEl,
      keyframes: [
        { scaleY: 0.92, scaleX: 1.05, translateY: 3, duration: 180, easing: 'easeOutQuad' },
        { scaleY: 1.02, scaleX: 0.98, translateY: -2, duration: 150, easing: 'easeInQuad' },
        { scaleY: 1, scaleX: 1, translateY: 0, duration: 120, easing: 'easeOutQuad' }
      ],
      loop: Math.floor(duration / 450),
      easing: 'easeInOutSine',
      autoplay: true
    });

    if (tailEl) {
      anime({
        targets: tailEl,
        rotate: [-15, 25, -15],
        duration: 450,
        loop: Math.floor(duration / 450),
        easing: 'easeInOutSine',
        autoplay: true
      });
    }

    return bodyAnim;
  }, []);

  const startIdleAnimation = useCallback((catId: string, element: HTMLDivElement, behavior: CatBehavior) => {
    cleanupAnimations(catId);
    
    const anim = animateIdleBehavior(element, behavior);
    animationRefs.current.set(catId, [anim]);
    
    if (behavior !== 'sleeping' && behavior !== 'lying') {
      startTailWag(element);
    }
    
    const state = catStates.current.get(catId);
    if (state) {
      state.status = 'idle';
      state.currentBehavior = behavior;
      state.lastBehaviorChange = Date.now();
    }
    
    onCatBehaviorChange(catId, behavior);
    
    const nextBehaviorDelay = 5000 + Math.random() * 5000;
    const timer = window.setTimeout(() => {
      const currentState = catStates.current.get(catId);
      const currentEl = catRefs.current.get(catId);
      if (currentState && currentEl && currentState.status === 'idle') {
        const newBehavior = getRandomBehavior();
        startIdleAnimation(catId, currentEl, newBehavior);
      }
    }, nextBehaviorDelay);
    
    if (state) {
      state.behaviorTimer = timer;
    }
  }, [cleanupAnimations, startTailWag, onCatBehaviorChange]);

  const decideNextAction = useCallback((catId: string) => {
    const element = catRefs.current.get(catId);
    const cat = spawnedCats.find(c => c.id === catId);
    if (!element || !cat) return;
    
    const state = catStates.current.get(catId);
    if (!state) return;
    
    state.status = 'idle';
    
    if (Math.random() < 0.3) {
      const newSpot = getRandomAdjacentSpot(cat.position);
      state.status = 'moving';
      
      cleanupAnimations(catId);
      const moveAnim = animateMoveToSpot(element, cat.position, newSpot);
      animationRefs.current.set(catId, [moveAnim]);
      
      moveAnim.finished.then(() => {
        onCatMove(catId, newSpot);
        const newBehavior = getRandomBehavior();
        startIdleAnimation(catId, element, newBehavior);
      });
    } else {
      const newBehavior = getRandomBehavior();
      startIdleAnimation(catId, element, newBehavior);
    }
  }, [spawnedCats, cleanupAnimations, onCatMove, startIdleAnimation]);

  const animateCatIn = useCallback((catId: string, spot: SpotType) => {
    const element = catRefs.current.get(catId);
    if (!element) return;

    catStates.current.set(catId, {
      status: 'flying',
      currentBehavior: 'sitting',
      behaviorTimer: null,
      lastBehaviorChange: Date.now()
    });

    const flyInAnim = animateFlyIn(element, spot);
    animationRefs.current.set(catId, [flyInAnim]);

    flyInAnim.finished.then(() => {
      const state = catStates.current.get(catId);
      if (!state) return;
      
      state.status = 'landing';
      
      const landingAnim = startSittingAnimation(element, 2000);
      animationRefs.current.set(catId, [landingAnim]);
      
      landingAnim.finished.then(() => {
        onCatAnimationComplete(catId);
        decideNextAction(catId);
      });
    });
  }, [startSittingAnimation, onCatAnimationComplete, decideNextAction]);

  const animateCatOut = useCallback((catId: string) => {
    const element = catRefs.current.get(catId);
    if (!element) {
      onCatRemovalComplete(catId);
      return;
    }

    cleanupAnimations(catId);
    
    const state = catStates.current.get(catId);
    if (state) {
      state.status = 'removing';
    }

    animateFadeAway(element).then(() => {
      catRefs.current.delete(catId);
      catStates.current.delete(catId);
      onCatRemovalComplete(catId);
    });
  }, [cleanupAnimations, onCatRemovalComplete]);

  useEffect(() => {
    spawnedCats.forEach((cat, index) => {
      const isNew = !catStates.current.has(cat.id);
      
      if (isNew) {
        catStates.current.set(cat.id, {
          status: 'idle',
          currentBehavior: cat.behavior,
          behaviorTimer: null,
          lastBehaviorChange: Date.now()
        });
      }

      const isNewlyAdded = !processedNewCats.current.has(cat.id);
      if (isNewlyAdded && index === spawnedCats.length - 1) {
        processedNewCats.current.add(cat.id);
        
        setTimeout(() => {
          animateCatIn(cat.id, cat.position);
        }, 100);
      }
    });
  }, [spawnedCats, animateCatIn]);

  useEffect(() => {
    removingCatIds.forEach(catId => {
      if (!catStates.current.has(catId)) return;
      animateCatOut(catId);
    });
  }, [removingCatIds, animateCatOut]);

  useEffect(() => {
    const animate = () => {
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
      catStates.current.forEach(state => {
        if (state.behaviorTimer) {
          clearTimeout(state.behaviorTimer);
        }
      });
      catStates.current.clear();
    };
  }, []);

  useEffect(() => {
    catRefs.current.forEach((element, catId) => {
      const isHighlighted = highlightedCatId === catId;
      const existingRing = element.querySelector('.highlight-glow-ring');
      
      if (isHighlighted && !existingRing) {
        createHighlightRing(element);
      } else if (!isHighlighted && existingRing) {
        removeHighlightRing(element);
      }
    });
  }, [highlightedCatId]);

  const setCatRef = (catId: string, isNew: boolean, spot: SpotType) => (el: HTMLDivElement | null) => {
    if (el) {
      catRefs.current.set(catId, el);
      if (isNew) {
        setTimeout(() => animateCatIn(catId, spot), 50);
      }
    } else {
      catRefs.current.delete(catId);
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

        {spawnedCats.map((cat) => {
          const breed = getBreedById(cat.breedId);
          if (!breed) return null;

          const pos = SPOT_POSITIONS[cat.position];
          const isHighlighted = highlightedCatId === cat.id;
          const isNew = !processedNewCats.current.has(cat.id);

          return (
            <div
              key={cat.id}
              ref={setCatRef(cat.id, isNew, cat.position)}
              className={`cat-sprite ${isHighlighted ? 'highlighted' : ''}`}
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
        
        .highlight-glow-ring {
          position: absolute !important;
          inset: -15px !important;
          border-radius: 50% !important;
          pointer-events: none !important;
        }
        
        .fade-sparkles {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: visible;
          z-index: 1000;
        }
        
        .sparkle {
          position: absolute;
          left: 50%;
          top: 50%;
          border-radius: 50%;
          box-shadow: 0 0 10px currentColor;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes borderPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
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
