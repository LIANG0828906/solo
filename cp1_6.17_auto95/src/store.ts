import { create } from 'zustand';
import type { AppStore, SpriteData, AnimationClip } from './types';
import { spriteManager } from './SpriteManager';

const loadSpritesJson = async (): Promise<any[]> => {
  const response = await fetch('/sprites.json');
  if (!response.ok) {
    throw new Error('Failed to load sprites.json');
  }
  return response.json();
};

export const useAppStore = create<AppStore>((set, get) => ({
  sprites: new Map(),
  currentSpriteId: null,
  currentAnimationId: null,
  currentFrameIndex: 0,
  isPlaying: false,
  playSpeed: 1,
  zoom: 3,
  isLoading: false,
  expandedAnimations: new Set<string>(),

  loadSprites: async () => {
    set({ isLoading: true });
    try {
      const spritesMetadata = await loadSpritesJson();
      const spriteMap = new Map<string, SpriteData>();

      for (const metadata of spritesMetadata) {
        const spriteData = await spriteManager.loadSprite(metadata);
        spriteMap.set(metadata.id, spriteData);
      }

      const firstSpriteId = spritesMetadata[0]?.id || null;
      const firstSprite = firstSpriteId ? spriteMap.get(firstSpriteId) : null;
      const firstAnimId = firstSprite?.metadata.animations[0]?.id || null;

      const expanded = new Set<string>();
      if (firstAnimId) {
        expanded.add(firstAnimId);
      }

      set({
        sprites: spriteMap,
        currentSpriteId: firstSpriteId,
        currentAnimationId: firstAnimId,
        currentFrameIndex: 0,
        isLoading: false,
        expandedAnimations: expanded,
      });
    } catch (error) {
      console.error('Failed to load sprites:', error);
      set({ isLoading: false });
    }
  },

  setCurrentSprite: (id: string) => {
    const { sprites } = get();
    const sprite = sprites.get(id);
    if (!sprite) return;

    const firstAnimId = sprite.metadata.animations[0]?.id || null;
    const expanded = new Set<string>();
    if (firstAnimId) {
      expanded.add(firstAnimId);
    }

    set({
      currentSpriteId: id,
      currentAnimationId: firstAnimId,
      currentFrameIndex: 0,
      isPlaying: false,
      expandedAnimations: expanded,
    });
  },

  setCurrentAnimation: (id: string) => {
    set({ currentAnimationId: id, currentFrameIndex: 0 });
  },

  setCurrentFrameIndex: (index: number) => {
    set({ currentFrameIndex: index });
  },

  setIsPlaying: (playing: boolean) => {
    set({ isPlaying: playing });
  },

  setPlaySpeed: (speed: number) => {
    set({ playSpeed: speed });
  },

  setZoom: (zoom: number) => {
    set({ zoom: Math.max(2, Math.min(4, zoom)) });
  },

  toggleAnimationExpanded: (id: string) => {
    const { expandedAnimations } = get();
    const next = new Set(expandedAnimations);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    set({ expandedAnimations: next });
  },

  updateAnimationFrameDuration: (animId: string, frameIdx: number, duration: number) => {
    const { sprites, currentSpriteId } = get();
    const sprite = currentSpriteId ? sprites.get(currentSpriteId) : null;
    if (!sprite) return;

    const animIndex = sprite.metadata.animations.findIndex((a) => a.id === animId);
    if (animIndex === -1) return;

    const newAnimations = [...sprite.metadata.animations];
    const anim = { ...newAnimations[animIndex] };
    const newFrames = [...anim.frames];
    newFrames[frameIdx] = { ...newFrames[frameIdx], duration: Math.max(50, Math.min(500, duration)) };
    anim.frames = newFrames;
    newAnimations[animIndex] = anim;

    const newMetadata = { ...sprite.metadata, animations: newAnimations };
    const newSprite = { ...sprite, metadata: newMetadata };

    const newSprites = new Map(sprites);
    newSprites.set(currentSpriteId!, newSprite);
    set({ sprites: newSprites });
  },

  reorderAnimationFrames: (animId: string, fromIndex: number, toIndex: number) => {
    const { sprites, currentSpriteId, currentFrameIndex } = get();
    const sprite = currentSpriteId ? sprites.get(currentSpriteId) : null;
    if (!sprite) return;

    const animIndex = sprite.metadata.animations.findIndex((a) => a.id === animId);
    if (animIndex === -1) return;

    const newAnimations = [...sprite.metadata.animations];
    const anim = { ...newAnimations[animIndex] };
    const frames = [...anim.frames];
    const [removed] = frames.splice(fromIndex, 1);
    frames.splice(toIndex, 0, removed);
    anim.frames = frames;
    newAnimations[animIndex] = anim;

    const newMetadata = { ...sprite.metadata, animations: newAnimations };
    const newSprite = { ...sprite, metadata: newMetadata };

    const newSprites = new Map(sprites);
    newSprites.set(currentSpriteId!, newSprite);

    let newFrameIndex = currentFrameIndex;
    if (animId === get().currentAnimationId) {
      const totalFrames = frames.length;
      if (currentFrameIndex >= totalFrames) {
        newFrameIndex = totalFrames - 1;
      }
    }

    set({ sprites: newSprites, currentFrameIndex: newFrameIndex });
  },

  resetAnimations: () => {
    const { currentSpriteId, sprites } = get();
    const sprite = currentSpriteId ? sprites.get(currentSpriteId) : null;
    if (!sprite) return;

    const defaultDuration = 100;
    const newAnimations = sprite.metadata.animations.map((anim) => ({
      ...anim,
      frames: anim.frames.map((f, i) => ({
        ...f,
        frameIndex: sprite.metadata.animations
          .find((a) => a.id === anim.id)!
          .frames.map((_, idx) => idx)[i],
        duration: defaultDuration,
      })),
    }));

    const newMetadata = { ...sprite.metadata, animations: newAnimations };
    const newSprite = { ...sprite, metadata: newMetadata };

    const newSprites = new Map(sprites);
    newSprites.set(currentSpriteId!, newSprite);

    set({ sprites: newSprites, currentFrameIndex: 0 });
  },

  exportGif: () => {
    alert('GIF导出功能演示 - 实际项目中可使用gif.js库实现');
  },

  nextFrame: () => {
    const { currentSpriteId, currentAnimationId, currentFrameIndex, sprites } = get();
    const sprite = currentSpriteId ? sprites.get(currentSpriteId) : null;
    const anim = sprite?.metadata.animations.find((a) => a.id === currentAnimationId);
    if (!anim || anim.frames.length === 0) return;

    const nextIndex = (currentFrameIndex + 1) % anim.frames.length;
    set({ currentFrameIndex: nextIndex });
  },

  prevFrame: () => {
    const { currentSpriteId, currentAnimationId, currentFrameIndex, sprites } = get();
    const sprite = currentSpriteId ? sprites.get(currentSpriteId) : null;
    const anim = sprite?.metadata.animations.find((a) => a.id === currentAnimationId);
    if (!anim || anim.frames.length === 0) return;

    const prevIndex = (currentFrameIndex - 1 + anim.frames.length) % anim.frames.length;
    set({ currentFrameIndex: prevIndex });
  },
}));

export const getCurrentSprite = (state: AppStore): SpriteData | undefined => {
  return state.currentSpriteId ? state.sprites.get(state.currentSpriteId) : undefined;
};

export const getCurrentAnimation = (state: AppStore): AnimationClip | undefined => {
  const sprite = getCurrentSprite(state);
  return sprite?.metadata.animations.find((a) => a.id === state.currentAnimationId);
};
