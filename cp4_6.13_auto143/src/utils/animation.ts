import anime from 'animejs';
import type { CatBehavior, SpotType } from '../data/cats';
import { SPOT_POSITIONS } from '../data/cats';

export const animateFlyIn = (element: HTMLElement, targetSpot: SpotType): anime.AnimeInstance => {
  const startX = window.innerWidth > 768 ? -100 : -50;
  const startY = -100;
  const targetPos = SPOT_POSITIONS[targetSpot];
  
  element.style.opacity = '0';
  element.style.transform = `translate(${startX}px, ${startY}px) scale(0.5)`;
  
  return anime({
    targets: element,
    translateX: [startX, 0],
    translateY: [startY, 0],
    scale: [0.5, 1],
    opacity: [0, 1],
    duration: 1200,
    easing: 'easeOutElastic(1, 0.6)',
    delay: 0
  });
};

export const animateLandingSit = (element: HTMLElement): anime.AnimeInstance => {
  return anime({
    targets: element,
    keyframes: [
      { scaleY: 0.85, duration: 150 },
      { scaleY: 1.05, duration: 150 },
      { scaleY: 1, duration: 150 }
    ],
    loop: 3,
    easing: 'easeInOutSine'
  });
};

export const animateTailWag = (tailElement: HTMLElement): anime.AnimeInstance => {
  return anime({
    targets: tailElement,
    rotate: [-10, 15, -10],
    duration: 600,
    loop: true,
    easing: 'easeInOutSine'
  });
};

export const animateIdleBehavior = (
  element: HTMLElement,
  behavior: CatBehavior
): anime.AnimeInstance => {
  switch (behavior) {
    case 'sleeping':
      return anime({
        targets: element,
        translateY: [0, -3, 0],
        duration: 2000,
        loop: true,
        easing: 'easeInOutSine'
      });
    case 'grooming':
      return anime({
        targets: element,
        rotate: [-5, 5, -5],
        duration: 800,
        loop: true,
        easing: 'easeInOutSine'
      });
    case 'playing':
      return anime({
        targets: element,
        scale: [1, 1.1, 1],
        rotate: [-5, 5, -5],
        duration: 500,
        loop: true,
        easing: 'easeInOutQuad'
      });
    case 'yawning':
      return anime({
        targets: element,
        scaleY: [1, 1.15, 1],
        duration: 1500,
        loop: 3,
        easing: 'easeInOutSine'
      });
    case 'lying':
      return anime({
        targets: element,
        scale: [1, 1.02, 1],
        duration: 3000,
        loop: true,
        easing: 'easeInOutSine'
      });
    default:
      return anime({
        targets: element,
        translateY: [0, -2, 0],
        duration: 2000,
        loop: true,
        easing: 'easeInOutSine'
      });
  }
};

export const animateMoveToSpot = (
  element: HTMLElement,
  fromSpot: SpotType,
  toSpot: SpotType
): anime.AnimeInstance => {
  const from = SPOT_POSITIONS[fromSpot];
  const to = SPOT_POSITIONS[toSpot];
  const dx = (to.x - from.x) * 0.01 * element.parentElement!.offsetWidth;
  const dy = (to.y - from.y) * 0.01 * element.parentElement!.offsetHeight;
  
  return anime({
    targets: element,
    translateX: [0, dx],
    translateY: [0, dy],
    duration: 1500,
    easing: 'easeInOutQuad'
  });
};

export const animateCardFlip = (element: HTMLElement): Promise<void> => {
  return new Promise((resolve) => {
    anime({
      targets: element,
      rotateY: [0, 90],
      duration: 300,
      easing: 'easeInOutSine',
      complete: () => {
        anime({
          targets: element,
          rotateY: [270, 360],
          duration: 300,
          easing: 'easeInOutSine',
          complete: () => resolve()
        });
      }
    });
  });
};

export const animateFadeAway = (element: HTMLElement): Promise<void> => {
  return new Promise((resolve) => {
    anime({
      targets: element,
      opacity: [1, 0],
      scale: [1, 1.5, 0],
      duration: 800,
      easing: 'easeOutExpo',
      complete: () => resolve()
    });
  });
};

export const createHighlightRing = (element: HTMLElement): anime.AnimeInstance => {
  return anime({
    targets: element,
    boxShadow: [
      '0 0 0 0 rgba(255, 215, 0, 0)',
      '0 0 20px 10px rgba(255, 215, 0, 0.8)',
      '0 0 0 0 rgba(255, 215, 0, 0)'
    ],
    scale: [1, 1.1, 1],
    duration: 1500,
    loop: true,
    easing: 'easeInOutSine'
  });
};
