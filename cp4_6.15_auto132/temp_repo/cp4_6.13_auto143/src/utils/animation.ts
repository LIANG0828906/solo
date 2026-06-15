import anime from 'animejs';
import type { CatBehavior, SpotType } from '../data/cats';
import { SPOT_POSITIONS } from '../data/cats';

export const animateFlyIn = (element: HTMLElement, targetSpot: SpotType): anime.AnimeInstance => {
  const startX = window.innerWidth > 768 ? -150 : -80;
  const startY = -150;
  
  element.style.opacity = '0';
  element.style.transform = `translate(${startX}px, ${startY}px) scale(0.3) rotate(-20deg)`;
  
  return anime({
    targets: element,
    translateX: [startX, 0],
    translateY: [startY, 0],
    scale: [0.3, 1],
    rotate: [-20, 0],
    opacity: [0, 1],
    duration: 1200,
    easing: 'easeOutElastic(1, 0.5)'
  });
};

export const animateLandingSit = (element: HTMLElement): anime.AnimeInstance => {
  return anime({
    targets: element,
    keyframes: [
      { scaleY: 0.8, scaleX: 1.1, duration: 150, easing: 'easeOutQuad' },
      { scaleY: 1.05, scaleX: 0.95, duration: 150, easing: 'easeInQuad' },
      { scaleY: 1, scaleX: 1, duration: 150, easing: 'easeOutQuad' }
    ],
    loop: 4,
    easing: 'easeInOutSine'
  });
};

export const animateTailWag = (tailElement: HTMLElement): anime.AnimeInstance => {
  return anime({
    targets: tailElement,
    rotate: [-15, 20, -15],
    duration: 500,
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
        translateY: [0, -4, 0],
        scale: [1, 1.02, 1],
        duration: 2500,
        loop: true,
        easing: 'easeInOutSine'
      });
    case 'grooming':
      return anime({
        targets: element,
        rotate: [-8, 8, -8],
        translateY: [0, -2, 0],
        duration: 700,
        loop: true,
        easing: 'easeInOutSine'
      });
    case 'playing':
      return anime({
        targets: element,
        scale: [1, 1.15, 1],
        rotate: [-8, 8, -8],
        translateY: [0, -5, 0],
        duration: 450,
        loop: true,
        easing: 'easeInOutQuad'
      });
    case 'yawning':
      return anime({
        targets: element,
        scaleY: [1, 1.2, 1],
        duration: 2000,
        loop: 2,
        easing: 'easeInOutSine'
      });
    case 'lying':
      return anime({
        targets: element,
        scale: [1, 1.03, 1],
        rotate: [0, 2, 0, -2, 0],
        duration: 4000,
        loop: true,
        easing: 'easeInOutSine'
      });
    default:
      return anime({
        targets: element,
        translateY: [0, -3, 0],
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
  const parent = element.parentElement;
  if (!parent) return anime({ targets: element, duration: 0 });
  
  const dx = (to.x - from.x) * 0.01 * parent.offsetWidth;
  const dy = (to.y - from.y) * 0.01 * parent.offsetHeight;
  
  return anime({
    targets: element,
    translateX: [0, dx],
    translateY: [0, dy],
    rotate: [0, dx > 0 ? 10 : -10, 0],
    scale: [1, 1.05, 1],
    duration: 1800,
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
    const sparkles = document.createElement('div');
    sparkles.className = 'fade-sparkles';
    sparkles.style.cssText = `
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: visible;
    `;
    
    for (let i = 0; i < 12; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'sparkle';
      const angle = (i / 12) * Math.PI * 2;
      const distance = 30 + Math.random() * 40;
      sparkle.style.cssText = `
        position: absolute;
        left: 50%;
        top: 50%;
        width: 6px;
        height: 6px;
        background: ${['#FFD700', '#FFF', '#FFA500', '#FFFF00'][Math.floor(Math.random() * 4)]};
        border-radius: 50%;
        box-shadow: 0 0 10px currentColor;
        transform: translate(-50%, -50%);
      `;
      sparkles.appendChild(sparkle);
      
      anime({
        targets: sparkle,
        translateX: Math.cos(angle) * distance,
        translateY: Math.sin(angle) * distance,
        scale: [1, 0],
        opacity: [1, 0],
        duration: 600 + Math.random() * 400,
        easing: 'easeOutExpo',
        delay: Math.random() * 100
      });
    }
    
    element.appendChild(sparkles);
    
    anime({
      targets: element,
      opacity: [1, 0],
      scale: [1, 0.3],
      duration: 700,
      easing: 'easeInExpo',
      complete: () => {
        setTimeout(() => {
          if (sparkles.parentNode) {
            sparkles.remove();
          }
          resolve();
        }, 300);
      }
    });
  });
};

export const createHighlightRing = (element: HTMLElement): anime.AnimeInstance => {
  const existingRing = element.querySelector('.highlight-glow-ring');
  if (existingRing) {
    existingRing.remove();
  }
  
  const ring = document.createElement('div');
  ring.className = 'highlight-glow-ring';
  ring.style.cssText = `
    position: absolute;
    inset: -15px;
    border-radius: 50%;
    pointer-events: none;
    opacity: 0;
  `;
  element.appendChild(ring);
  
  return anime({
    targets: ring,
    opacity: [0, 0.8, 0],
    scale: [0.8, 1.3, 1.5],
    boxShadow: [
      '0 0 0 0 rgba(255, 215, 0, 0), inset 0 0 20px rgba(255, 215, 0, 0)',
      '0 0 30px 10px rgba(255, 215, 0, 0.6), inset 0 0 30px rgba(255, 215, 0, 0.3)',
      '0 0 0 0 rgba(255, 215, 0, 0), inset 0 0 20px rgba(255, 215, 0, 0)'
    ],
    border: ['3px solid rgba(255, 215, 0, 0)', '3px solid rgba(255, 215, 0, 0.8)', '3px solid rgba(255, 215, 0, 0)'],
    duration: 1500,
    loop: true,
    easing: 'easeInOutSine'
  });
};

export const removeHighlightRing = (element: HTMLElement): void => {
  const ring = element.querySelector('.highlight-glow-ring');
  if (ring) {
    anime({
      targets: ring,
      opacity: 0,
      scale: 1.5,
      duration: 300,
      easing: 'easeOutQuad',
      complete: () => ring.remove()
    });
  }
};
