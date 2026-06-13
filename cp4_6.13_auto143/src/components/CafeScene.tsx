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
  removeHighlightRing,
  animateTailWag
} from '../utils/animation';

interface CatAnimationState {
  status: 'flying' | 'landing' | 'idle' | 'moving' | 'removing';
  currentBehavior: CatBehavior;
  behaviorTimer: number | null;
  tailAnimation: anime.AnimeInstance | null;
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
}

export const CafeScene: React.FC<CafeSceneProps> = ({
  spawnedCats,
  highlightedCatId,
  onSpotClick,
  onCatMove,
  onCatAnimationComplete,
  removingCatIds,
  onCatBehaviorChange
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
      if (state.tailAnimation) {
        state.tailAnimation.pause();
        state.tailAnimation = null;
      }
    }
  }, []);

  const startIdleAnimation = useCallback((catId: string, element: HTMLDivElement, behavior: CatBehavior) => {
    cleanupAnimations(catId);
    
    const anim = animateIdleBehavior(element, behavior);
    animationRefs.current.set(catId, [anim]);
    
    const tailEl = element.querySelector('.cat-tail') as HTMLElement;
    if (tailEl && behavior !== 'sleeping') {
      const tailAnim = animateTailWag(tailEl);
      const state = catStates.current.get(catId);
      if (state) {
        state.tailAnimation = tailAnim;
      }
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
  }, [cleanupAnimations, onCatBehaviorChange]);

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
