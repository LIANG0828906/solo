import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  AnimatableElement,
  KeyframeNode,
  BezierControlPoints,
  AnimationTimeline,
  PlayState,
  PlaybackSpeed,
  PropertyValue,
  PropertyMap,
} from '@/types';
import {
  ELEMENT_COLORS,
  DEFAULT_EASING,
  PROPERTY_INPUT_TYPES,
} from '@/types';

interface AnimationStoreState {
  elements: AnimatableElement[];
  selectedElementId: string | null;
  keyframes: KeyframeNode[];
  selectedKeyframeId: string | null;
  timeline: AnimationTimeline;
  durationHandleId: string | null;
  addElement: () => void;
  selectElement: (id: string) => void;
  addKeyframe: (elementId: string, time: number, properties?: PropertyMap) => void;
  updateKeyframe: (id: string, updates: Partial<KeyframeNode>) => void;
  deleteKeyframe: (id: string) => void;
  selectKeyframe: (id: string | null) => void;
  setTimelineDuration: (ms: number) => void;
  setCurrentTime: (ms: number) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
  addProperty: (keyframeId: string, name: string, value: PropertyValue) => void;
  updateProperty: (keyframeId: string, name: string, value: PropertyValue) => void;
  deleteProperty: (keyframeId: string, name: string) => void;
  setKeyframeEasing: (id: string, easing: BezierControlPoints) => void;
  resetAll: () => void;
}

function createInitialElement(index: number): AnimatableElement {
  const color = ELEMENT_COLORS[index % ELEMENT_COLORS.length];
  return {
    id: uuidv4(),
    name: `Element ${index + 1}`,
    color,
    initialStyles: {
      width: 200,
      height: 200,
      backgroundColor: color,
      borderRadius: 12,
    },
  };
}

function cloneMap(p: PropertyMap): PropertyMap {
  return { ...p };
}

const firstEl = createInitialElement(0);

const initialState: Omit<
  AnimationStoreState,
  | 'addElement'
  | 'selectElement'
  | 'addKeyframe'
  | 'updateKeyframe'
  | 'deleteKeyframe'
  | 'selectKeyframe'
  | 'setTimelineDuration'
  | 'setCurrentTime'
  | 'play'
  | 'pause'
  | 'stop'
  | 'setPlaybackSpeed'
  | 'addProperty'
  | 'updateProperty'
  | 'deleteProperty'
  | 'setKeyframeEasing'
  | 'resetAll'
> = {
  elements: [firstEl],
  selectedElementId: firstEl.id,
  keyframes: [],
  selectedKeyframeId: null,
  timeline: {
    duration: 3000,
    currentTime: 0,
    playState: 'stopped',
    playbackSpeed: 1,
  },
  durationHandleId: null,
};

export const useAnimationStore = create<AnimationStoreState>((set, get) => ({
  ...initialState,

  addElement: () => {
    const { elements } = get();
    if (elements.length >= 5) return;
    const newEl = createInitialElement(elements.length);
    set({
      elements: [...elements, newEl],
      selectedElementId: newEl.id,
    });
  },

  selectElement: (id: string) => {
    set({ selectedElementId: id, selectedKeyframeId: null });
  },

  addKeyframe: (elementId: string, time: number, properties?: PropertyMap) => {
    const { keyframes, elements } = get();
    const element = elements.find((e) => e.id === elementId);
    if (!element) return;

    const elFrames = keyframes
      .filter((k) => k.elementId === elementId)
      .sort((a, b) => a.time - b.time);

    let props: PropertyMap = properties ?? {};
    if (!properties) {
      let prev: KeyframeNode | null = null;
      for (const k of elFrames) {
        if (k.time <= time) prev = k;
      }
      if (prev) {
        props = cloneMap(prev.properties);
      } else if (elFrames.length > 0) {
        props = cloneMap(elFrames[0].properties);
      } else {
        props = {
          'transform.translateX': 0,
          'transform.translateY': 0,
          'transform.rotate': 0,
          opacity: 1,
          'background-color': element.color,
        };
      }
    }

    const id = uuidv4();
    const node: KeyframeNode = {
      id,
      elementId,
      time,
      properties: props,
      easing: { ...DEFAULT_EASING },
    };
    set({
      keyframes: [...keyframes, node],
      selectedKeyframeId: id,
    });
  },

  updateKeyframe: (id: string, updates: Partial<KeyframeNode>) => {
    set((state) => ({
      keyframes: state.keyframes.map((k) =>
        k.id === id ? { ...k, ...updates } : k,
      ),
    }));
  },

  deleteKeyframe: (id: string) => {
    set((state) => ({
      keyframes: state.keyframes.filter((k) => k.id !== id),
      selectedKeyframeId:
        state.selectedKeyframeId === id ? null : state.selectedKeyframeId,
    }));
  },

  selectKeyframe: (id: string | null) => {
    set({ selectedKeyframeId: id });
  },

  setTimelineDuration: (ms: number) => {
    const clamped = Math.max(1000, Math.min(10000, ms));
    set((state) => ({
      timeline: { ...state.timeline, duration: clamped },
    }));
  },

  setCurrentTime: (ms: number) => {
    set((state) => {
      const clamped = Math.max(0, Math.min(state.timeline.duration, ms));
      return { timeline: { ...state.timeline, currentTime: clamped } };
    });
  },

  play: () => {
    set((state) => ({
      timeline: { ...state.timeline, playState: 'playing' as PlayState },
    }));
  },

  pause: () => {
    set((state) => ({
      timeline: { ...state.timeline, playState: 'paused' as PlayState },
    }));
  },

  stop: () => {
    set((state) => ({
      timeline: {
        ...state.timeline,
        playState: 'stopped' as PlayState,
        currentTime: 0,
      },
    }));
  },

  setPlaybackSpeed: (speed: PlaybackSpeed) => {
    set((state) => ({
      timeline: { ...state.timeline, playbackSpeed: speed },
    }));
  },

  addProperty: (keyframeId: string, name: string, value: PropertyValue) => {
    set((state) => ({
      keyframes: state.keyframes.map((k) =>
        k.id === keyframeId
          ? { ...k, properties: { ...k.properties, [name]: value } }
          : k,
      ),
    }));
  },

  updateProperty: (keyframeId: string, name: string, value: PropertyValue) => {
    set((state) => ({
      keyframes: state.keyframes.map((k) =>
        k.id === keyframeId
          ? { ...k, properties: { ...k.properties, [name]: value } }
          : k,
      ),
    }));
  },

  deleteProperty: (keyframeId: string, name: string) => {
    set((state) => ({
      keyframes: state.keyframes.map((k) => {
        if (k.id !== keyframeId) return k;
        const next = { ...k.properties };
        delete next[name];
        return { ...k, properties: next };
      }),
    }));
  },

  setKeyframeEasing: (id: string, easing: BezierControlPoints) => {
    set((state) => ({
      keyframes: state.keyframes.map((k) =>
        k.id === id ? { ...k, easing } : k,
      ),
    }));
  },

  resetAll: () => {
    const el = createInitialElement(0);
    set({
      elements: [el],
      selectedElementId: el.id,
      keyframes: [],
      selectedKeyframeId: null,
      timeline: {
        duration: 3000,
        currentTime: 0,
        playState: 'stopped',
        playbackSpeed: 1,
      },
    });
  },
}));

export { PROPERTY_INPUT_TYPES };
