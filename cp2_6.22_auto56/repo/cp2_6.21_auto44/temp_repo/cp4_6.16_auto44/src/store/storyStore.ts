import { create } from 'zustand';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import type { Scene, Character, Prop } from '@/types';

interface StoryState {
  scenes: Scene[];
  characters: Character[];
  props: Prop[];
  selectedSceneId: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  addScene: (x: number, y: number) => void;
  updateScene: (id: string, updates: Partial<Scene>) => void;
  deleteScene: (id: string) => void;
  moveScene: (id: string, x: number, y: number) => void;
  commitScenePosition: (id: string, x: number, y: number) => void;
  selectScene: (id: string | null) => void;
  addCharacter: (name: string, avatarUrl: string, color: string) => void;
  addProp: (name: string, icon: string, color: string) => void;
  linkCharacterToScene: (characterId: string, sceneId: string) => void;
  unlinkCharacterFromScene: (characterId: string, sceneId: string) => void;
  linkPropToScene: (propId: string, sceneId: string) => void;
  unlinkPropFromScene: (propId: string, sceneId: string) => void;
  linkScenes: (fromId: string, toId: string) => void;
  unlinkScenes: (fromId: string, toId: string) => void;
  loadFromDB: () => Promise<void>;
  saveToDB: () => void;
}

const CHARACTER_COLORS = [
  '#4da6ff',
  '#ff6b6b',
  '#4ecdc4',
  '#ffe66d',
  '#95e1d3',
  '#f38181',
  '#aa96da',
  '#fcbad3',
];

const PROP_ICONS = ['📦', '⚔️', '🔮', '📜', '🗝️', '💎', '🎭', '🖼️'];

const defaultScenes = (): Scene[] => {
  const s1: Scene = {
    id: uuidv4(),
    title: '开场',
    description: '故事的开始，主角登场。',
    x: 100,
    y: 150,
    characterIds: [],
    propIds: [],
    createdAt: Date.now(),
    order: 0,
    nextSceneIds: [],
  };
  const s2: Scene = {
    id: uuidv4(),
    title: '发展',
    description: '情节逐渐展开，冲突出现。',
    x: 400,
    y: 200,
    characterIds: [],
    propIds: [],
    createdAt: Date.now() + 1000,
    order: 1,
    nextSceneIds: [],
  };
  s1.nextSceneIds = [s2.id];
  return [s1, s2];
};

const defaultCharacters = (): Character[] => [
  { id: uuidv4(), name: '主角', avatarUrl: '', color: '#4da6ff' },
  { id: uuidv4(), name: '配角', avatarUrl: '', color: '#ff6b6b' },
];

const defaultProps = (): Prop[] => [
  { id: uuidv4(), name: '宝剑', icon: '⚔️', color: '#0f3460' },
  { id: uuidv4(), name: '魔法书', icon: '📜', color: '#0f3460' },
];

export const useStoryStore = create<StoryState>((set, get) => ({
  scenes: [],
  characters: [],
  props: [],
  selectedSceneId: null,
  isLoading: true,
  isInitialized: false,

  addScene: (x: number, y: number) => {
    if (!get().isInitialized) return;
    const { scenes, saveToDB } = get();
    const newScene: Scene = {
      id: uuidv4(),
      title: `场景 ${scenes.length + 1}`,
      description: '',
      x,
      y,
      characterIds: [],
      propIds: [],
      createdAt: Date.now(),
      order: scenes.length,
      nextSceneIds: [],
    };
    set({ scenes: [...scenes, newScene], selectedSceneId: newScene.id });
    saveToDB();
  },

  updateScene: (id: string, updates: Partial<Scene>) => {
    if (!get().isInitialized) return;
    const { scenes, saveToDB } = get();
    set({
      scenes: scenes.map((scene) =>
        scene.id === id ? { ...scene, ...updates } : scene
      ),
    });
    saveToDB();
  },

  deleteScene: (id: string) => {
    if (!get().isInitialized) return;
    const { scenes, selectedSceneId, saveToDB } = get();
    const newScenes = scenes
      .filter((s) => s.id !== id)
      .map((s) => ({
        ...s,
        nextSceneIds: s.nextSceneIds.filter((nid) => nid !== id),
      }));
    set({
      scenes: newScenes,
      selectedSceneId: selectedSceneId === id ? null : selectedSceneId,
    });
    saveToDB();
  },

  moveScene: (id: string, x: number, y: number) => {
    if (!get().isInitialized) return;
    const { scenes } = get();
    set({
      scenes: scenes.map((scene) =>
        scene.id === id ? { ...scene, x, y } : scene
      ),
    });
  },

  commitScenePosition: (id: string, x: number, y: number) => {
    if (!get().isInitialized) return;
    const { scenes, saveToDB } = get();
    set({
      scenes: scenes.map((scene) =>
        scene.id === id ? { ...scene, x, y } : scene
      ),
    });
    saveToDB();
  },

  selectScene: (id: string | null) => {
    set({ selectedSceneId: id });
  },

  addCharacter: (name: string, avatarUrl: string, color: string) => {
    if (!get().isInitialized) return;
    const { characters, saveToDB } = get();
    const newCharacter: Character = {
      id: uuidv4(),
      name,
      avatarUrl,
      color: color || CHARACTER_COLORS[characters.length % CHARACTER_COLORS.length],
    };
    set({ characters: [...characters, newCharacter] });
    saveToDB();
  },

  addProp: (name: string, icon: string, color: string) => {
    if (!get().isInitialized) return;
    const { props, saveToDB } = get();
    const newProp: Prop = {
      id: uuidv4(),
      name,
      icon: icon || PROP_ICONS[props.length % PROP_ICONS.length],
      color: color || '#0f3460',
    };
    set({ props: [...props, newProp] });
    saveToDB();
  },

  linkCharacterToScene: (characterId: string, sceneId: string) => {
    if (!get().isInitialized) return;
    const { scenes, saveToDB } = get();
    set({
      scenes: scenes.map((scene) =>
        scene.id === sceneId && !scene.characterIds.includes(characterId)
          ? { ...scene, characterIds: [...scene.characterIds, characterId] }
          : scene
      ),
    });
    saveToDB();
  },

  unlinkCharacterFromScene: (characterId: string, sceneId: string) => {
    if (!get().isInitialized) return;
    const { scenes, saveToDB } = get();
    set({
      scenes: scenes.map((scene) =>
        scene.id === sceneId
          ? { ...scene, characterIds: scene.characterIds.filter((id) => id !== characterId) }
          : scene
      ),
    });
    saveToDB();
  },

  linkPropToScene: (propId: string, sceneId: string) => {
    if (!get().isInitialized) return;
    const { scenes, saveToDB } = get();
    set({
      scenes: scenes.map((scene) =>
        scene.id === sceneId && !scene.propIds.includes(propId)
          ? { ...scene, propIds: [...scene.propIds, propId] }
          : scene
      ),
    });
    saveToDB();
  },

  unlinkPropFromScene: (propId: string, sceneId: string) => {
    if (!get().isInitialized) return;
    const { scenes, saveToDB } = get();
    set({
      scenes: scenes.map((scene) =>
        scene.id === sceneId
          ? { ...scene, propIds: scene.propIds.filter((id) => id !== propId) }
          : scene
      ),
    });
    saveToDB();
  },

  linkScenes: (fromId: string, toId: string) => {
    if (!get().isInitialized) return;
    const { scenes, saveToDB } = get();
    set({
      scenes: scenes.map((scene) =>
        scene.id === fromId && !scene.nextSceneIds.includes(toId)
          ? { ...scene, nextSceneIds: [...scene.nextSceneIds, toId] }
          : scene
      ),
    });
    saveToDB();
  },

  unlinkScenes: (fromId: string, toId: string) => {
    if (!get().isInitialized) return;
    const { scenes, saveToDB } = get();
    set({
      scenes: scenes.map((scene) =>
        scene.id === fromId
          ? { ...scene, nextSceneIds: scene.nextSceneIds.filter((id) => id !== toId) }
          : scene
      ),
    });
    saveToDB();
  },

  loadFromDB: async () => {
    try {
      const [scenesData, charactersData, propsData] = await Promise.all([
        idbGet('storyboard_scenes'),
        idbGet('storyboard_characters'),
        idbGet('storyboard_props'),
      ]);

      const scenes = (scenesData as Scene[] | undefined) || defaultScenes();
      const characters = (charactersData as Character[] | undefined) || defaultCharacters();
      const props = (propsData as Prop[] | undefined) || defaultProps();

      set({ scenes, characters, props, isLoading: false, isInitialized: true });
    } catch (error) {
      console.error('Failed to load from IndexedDB:', error);
      set({
        scenes: defaultScenes(),
        characters: defaultCharacters(),
        props: defaultProps(),
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  saveToDB: () => {
    if (!get().isInitialized) return;
    const { scenes, characters, props } = get();
    idbSet('storyboard_scenes', scenes).catch((e) =>
      console.error('Failed to save scenes:', e)
    );
    idbSet('storyboard_characters', characters).catch((e) =>
      console.error('Failed to save characters:', e)
    );
    idbSet('storyboard_props', props).catch((e) =>
      console.error('Failed to save props:', e)
    );
  },
}));

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

const originalSaveToDB = useStoryStore.getState().saveToDB;
useStoryStore.setState({
  saveToDB: () => {
    if (!useStoryStore.getState().isInitialized) return;
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(() => {
      originalSaveToDB();
    }, 500);
  },
});
