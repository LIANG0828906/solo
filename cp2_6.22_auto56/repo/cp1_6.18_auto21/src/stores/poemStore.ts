import { create } from 'zustand';
import {
  Particle,
  Ripple,
  AnimationMode,
  textToParticles,
  updateParticle,
  updateRipple,
  createRipple,
} from '@/utils/textToParticles';

interface PoemState {
  inputText: string;
  particles: Particle[];
  animationMode: AnimationMode;
  isAnimating: boolean;
  hoveredParticleId: string | null;
  ripples: Ripple[];
  canvasWidth: number;
  canvasHeight: number;
  animationStartTime: number;
  fontSize: number;
  spacing: number;
  setInputText: (text: string) => void;
  generateParticles: () => void;
  setAnimationMode: (mode: AnimationMode) => void;
  setHoveredParticle: (id: string | null) => void;
  addRipple: (x: number, y: number) => void;
  updateParticles: (deltaTime: number) => void;
  setCanvasSize: (width: number, height: number) => void;
  resetParticles: () => void;
}

export const usePoemStore = create<PoemState>((set, get) => ({
  inputText: '',
  particles: [],
  animationMode: 'ripple',
  isAnimating: false,
  hoveredParticleId: null,
  ripples: [],
  canvasWidth: 800,
  canvasHeight: 600,
  animationStartTime: 0,
  fontSize: 32,
  spacing: 20,

  setInputText: (text: string) => {
    const limitedText = text.slice(0, 50);
    set({ inputText: limitedText });
  },

  generateParticles: () => {
    const { inputText, canvasWidth, canvasHeight, fontSize, spacing } = get();
    if (!inputText.trim()) return;

    const particles = textToParticles({
      text: inputText,
      canvasWidth,
      canvasHeight,
      fontSize,
      spacing,
    });

    set({
      particles,
      isAnimating: true,
      animationStartTime: Date.now(),
      ripples: [],
    });
  },

  setAnimationMode: (mode: AnimationMode) => {
    set({
      animationMode: mode,
      animationStartTime: Date.now(),
    });
    const { particles } = get();
    set({
      particles: particles.map((p) => ({
        ...p,
        x: p.baseX,
        y: p.baseY,
        vx: 0,
        vy: 0,
        spiralAngle: 0,
      })),
    });
  },

  setHoveredParticle: (id: string | null) => {
    set((state) => ({
      particles: state.particles.map((p) => ({
        ...p,
        scale: p.id === id ? 1.5 : 1,
        glowRadius: p.id === id ? 40 : 10 + Math.random() * 10,
      })),
      hoveredParticleId: id,
    }));
  },

  addRipple: (x: number, y: number) => {
    set((state) => ({
      ripples: [...state.ripples, createRipple(x, y)],
    }));
  },

  updateParticles: (deltaTime: number) => {
    const { particles, ripples, animationMode, canvasWidth, canvasHeight, animationStartTime } = get();
    const elapsed = Date.now() - animationStartTime;

    const updatedParticles = particles.map((particle) =>
      updateParticle(particle, animationMode, canvasWidth, canvasHeight, deltaTime, elapsed)
    );

    const updatedRipples = ripples
      .map((ripple) => updateRipple(ripple, deltaTime))
      .filter((ripple) => ripple.opacity > 0);

    set({
      particles: updatedParticles,
      ripples: updatedRipples,
    });
  },

  setCanvasSize: (width: number, height: number) => {
    const isMobile = width < 768;
    set({
      canvasWidth: width,
      canvasHeight: height,
      fontSize: isMobile ? 24 : 32,
      spacing: isMobile ? 12 : 20,
    });
  },

  resetParticles: () => {
    set({
      particles: [],
      ripples: [],
      isAnimating: false,
    });
  },
}));
