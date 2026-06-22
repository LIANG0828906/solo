import { create } from 'zustand';
import type { GradientState, GradientNode, GradientPreset, GradientDirection } from '@/types';
import { randomHslColor, generateGradientCSS, interpolateNode, computeBlendedColors } from '@/gradient/gradientEngine';
import { mapScrollToNodes } from '@/gradient/scrollMapper';

const uid = () => Math.random().toString(36).slice(2, 10);

export const PRESETS: GradientPreset[] = [
  {
    name: '暖阳渐变',
    nodes: [
      { startColor: '#FF6B6B', endColor: '#FFE66D', blendRatio: 50, position: 0 },
      { startColor: '#4ECDC4', endColor: '#556270', blendRatio: 50, position: 33 },
      { startColor: '#11998E', endColor: '#38EF7D', blendRatio: 50, position: 66 },
      { startColor: '#FF512F', endColor: '#DD2475', blendRatio: 50, position: 100 },
    ],
  },
  {
    name: '深海渐变',
    nodes: [
      { startColor: '#4ECDC4', endColor: '#556270', blendRatio: 50, position: 0 },
      { startColor: '#11998E', endColor: '#38EF7D', blendRatio: 50, position: 33 },
      { startColor: '#FF6B6B', endColor: '#FFE66D', blendRatio: 50, position: 66 },
      { startColor: '#FF512F', endColor: '#DD2475', blendRatio: 50, position: 100 },
    ],
  },
  {
    name: '极光渐变',
    nodes: [
      { startColor: '#11998E', endColor: '#38EF7D', blendRatio: 50, position: 0 },
      { startColor: '#FF6B6B', endColor: '#FFE66D', blendRatio: 50, position: 33 },
      { startColor: '#FF512F', endColor: '#DD2475', blendRatio: 50, position: 66 },
      { startColor: '#4ECDC4', endColor: '#556270', blendRatio: 50, position: 100 },
    ],
  },
  {
    name: '日落渐变',
    nodes: [
      { startColor: '#FF512F', endColor: '#DD2475', blendRatio: 50, position: 0 },
      { startColor: '#4ECDC4', endColor: '#556270', blendRatio: 50, position: 33 },
      { startColor: '#11998E', endColor: '#38EF7D', blendRatio: 50, position: 66 },
      { startColor: '#FF6B6B', endColor: '#FFE66D', blendRatio: 50, position: 100 },
    ],
  },
];

function recomputeCSS(state: { nodes: GradientNode[]; direction: GradientDirection; scrollProgress: number }): string {
  try {
    const { nodeA, nodeB, localT } = mapScrollToNodes(state.scrollProgress, state.nodes);
    const blendedA = computeBlendedColors(nodeA);
    const blendedB = computeBlendedColors(nodeB);
    const interpolated = interpolateNode(
      { ...nodeA, startColor: blendedA.startColor, endColor: blendedA.endColor },
      { ...nodeB, startColor: blendedB.startColor, endColor: blendedB.endColor },
      localT,
    );
    return generateGradientCSS(interpolated.startColor, interpolated.endColor, state.direction);
  } catch {
    return generateGradientCSS('#000', '#000', state.direction);
  }
}

const defaultPreset = PRESETS[0];
const defaultNodes: GradientNode[] = defaultPreset.nodes.map(n => ({ ...n, id: uid() }));
const defaultDirection: GradientDirection = { type: 'linear', angle: 135 };

export const useGradientStore = create<GradientState>((set, get) => ({
  nodes: defaultNodes,
  direction: defaultDirection,
  scrollProgress: 0,
  currentCSS: recomputeCSS({ nodes: defaultNodes, direction: defaultDirection, scrollProgress: 0 }),
  activeRegion: 0,
  isPanelOpen: false,

  setNodes: (nodes) => set((s) => {
    const next = { ...s, nodes };
    return { ...next, currentCSS: recomputeCSS(next) };
  }),

  updateNode: (id, patch) => set((s) => {
    const nodes = s.nodes.map(n => (n.id === id ? { ...n, ...patch } : n));
    const next = { ...s, nodes };
    return { ...next, currentCSS: recomputeCSS(next) };
  }),

  setDirection: (direction) => set((s) => {
    const next = { ...s, direction };
    return { ...next, currentCSS: recomputeCSS(next) };
  }),

  setScrollProgress: (scrollProgress) => set((s) => {
    const region = Math.min(3, Math.max(0, Math.floor(scrollProgress * 4)));
    const next = { ...s, scrollProgress, activeRegion: region };
    return { ...next, currentCSS: recomputeCSS(next) };
  }),

  setCurrentCSS: (currentCSS) => set({ currentCSS }),

  setActiveRegion: (activeRegion) => set({ activeRegion }),

  loadPreset: (preset) => {
    const nodes: GradientNode[] = preset.nodes.map(n => ({ ...n, id: uid() }));
    set((s) => {
      const next = { ...s, nodes };
      return { ...next, currentCSS: recomputeCSS(next) };
    });
  },

  randomize: () => {
    const positions = [0, 33, 66, 100];
    const nodes: GradientNode[] = positions.map((position) => ({
      id: uid(),
      startColor: randomHslColor(),
      endColor: randomHslColor(),
      blendRatio: Math.floor(Math.random() * 100),
      position,
    }));
    set((s) => {
      const next = { ...s, nodes };
      return { ...next, currentCSS: recomputeCSS(next) };
    });
  },

  togglePanel: () => set((s) => ({ isPanelOpen: !s.isPanelOpen })),
}));
