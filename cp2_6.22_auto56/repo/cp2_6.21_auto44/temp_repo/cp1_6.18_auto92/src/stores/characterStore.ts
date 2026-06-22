import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  Character,
  Relation,
  HistoryState,
  InventoryItem,
  MAX_HISTORY_SIZE,
  MAX_INVENTORY_SIZE,
} from '../types';

interface CharacterStore {
  characters: Character[];
  relations: Relation[];
  selectedCharacterId: string | null;
  history: HistoryState[];
  historyIndex: number;
  isFlashing: boolean;
  warningMessage: string | null;

  addCharacter: (char: Omit<Character, 'id' | 'inventory'>) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  selectCharacter: (id: string | null) => void;

  addRelation: (rel: Omit<Relation, 'id'>) => void;
  deleteRelation: (id: string) => void;

  addInventoryItem: (characterId: string, item: Omit<InventoryItem, 'id'>) => boolean;
  removeInventoryItem: (characterId: string, itemId: string) => void;
  transferInventoryItem: (fromId: string, toId: string, itemId: string) => boolean;

  undo: () => void;
  redo: () => void;

  showWarning: (message: string) => void;
  clearWarning: () => void;
  triggerFlash: () => void;

  _pushHistory: () => void;
}

const createInitialCharacters = (): Character[] => [
  {
    id: uuidv4(),
    name: '星辰',
    age: 25,
    avatar: '',
    appearance: '黑色短发，眼神锐利，常穿深色斗篷',
    personality: ['勇敢', '正直', '寡言'],
    background: '来自遥远星球的流浪者，拥有神秘的星之力',
    faction: 'protagonist',
    inventory: [
      { id: uuidv4(), name: '星之剑', icon: '⚔️' },
      { id: uuidv4(), name: '护身符', icon: '🔮' },
    ],
    stats: 85,
  },
  {
    id: uuidv4(),
    name: '月影',
    age: 22,
    avatar: '',
    appearance: '银白色长发，紫色眼眸，身姿轻盈',
    personality: ['聪慧', '温柔', '神秘'],
    background: '月之神殿的守护者，掌握古老的月之魔法',
    faction: 'deuteragonist',
    inventory: [
      { id: uuidv4(), name: '月光杖', icon: '🌙' },
      { id: uuidv4(), name: '治愈药水', icon: '🧪' },
      { id: uuidv4(), name: '魔法书', icon: '📖' },
    ],
    stats: 72,
  },
  {
    id: uuidv4(),
    name: '暗影',
    age: 30,
    avatar: '',
    appearance: '全身笼罩在黑色长袍中，面容隐藏在兜帽下',
    personality: ['冷酷', '狡猾', '野心勃勃'],
    background: '曾经的光明骑士，堕入黑暗后成为暗影军团首领',
    faction: 'antagonist',
    inventory: [
      { id: uuidv4(), name: '暗影之刃', icon: '🗡️' },
      { id: uuidv4(), name: '黑暗水晶', icon: '💎' },
    ],
    stats: 92,
  },
];

const getInitialRelations = (chars: Character[]): Relation[] => [
  {
    id: uuidv4(),
    sourceId: chars[0].id,
    targetId: chars[1].id,
    type: '恋人',
    style: 'solid',
  },
  {
    id: uuidv4(),
    sourceId: chars[0].id,
    targetId: chars[2].id,
    type: '仇敌',
    style: 'dashed',
  },
  {
    id: uuidv4(),
    sourceId: chars[1].id,
    targetId: chars[2].id,
    type: '敌人',
    style: 'dashed',
  },
];

const initialCharacters = createInitialCharacters();
const initialRelations = getInitialRelations(initialCharacters);

export const useCharacterStore = create<CharacterStore>((set, get) => ({
  characters: initialCharacters,
  relations: initialRelations,
  selectedCharacterId: initialCharacters[0].id,
  history: [{ characters: initialCharacters, relations: initialRelations }],
  historyIndex: 0,
  isFlashing: false,
  warningMessage: null,

  addCharacter: (char) => {
    get()._pushHistory();
    const newChar: Character = {
      ...char,
      id: uuidv4(),
      inventory: [],
    };
    set((state) => ({
      characters: [...state.characters, newChar],
      selectedCharacterId: newChar.id,
    }));
    get().triggerFlash();
  },

  updateCharacter: (id, updates) => {
    get()._pushHistory();
    set((state) => ({
      characters: state.characters.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  },

  deleteCharacter: (id) => {
    get()._pushHistory();
    set((state) => ({
      characters: state.characters.filter((c) => c.id !== id),
      relations: state.relations.filter(
        (r) => r.sourceId !== id && r.targetId !== id
      ),
      selectedCharacterId:
        state.selectedCharacterId === id
          ? state.characters.find((c) => c.id !== id)?.id || null
          : state.selectedCharacterId,
    }));
  },

  selectCharacter: (id) => {
    set({ selectedCharacterId: id });
  },

  addRelation: (rel) => {
    get()._pushHistory();
    const newRel: Relation = {
      ...rel,
      id: uuidv4(),
    };
    set((state) => ({
      relations: [...state.relations, newRel],
    }));
  },

  deleteRelation: (id) => {
    get()._pushHistory();
    set((state) => ({
      relations: state.relations.filter((r) => r.id !== id),
    }));
  },

  addInventoryItem: (characterId, item) => {
    const state = get();
    const char = state.characters.find((c) => c.id === characterId);
    if (!char || char.inventory.length >= MAX_INVENTORY_SIZE) {
      get().showWarning('背包已满，无法添加物品！');
      return false;
    }
    get()._pushHistory();
    const newItem: InventoryItem = {
      ...item,
      id: uuidv4(),
    };
    set((s) => ({
      characters: s.characters.map((c) =>
        c.id === characterId
          ? { ...c, inventory: [...c.inventory, newItem] }
          : c
      ),
    }));
    return true;
  },

  removeInventoryItem: (characterId, itemId) => {
    get()._pushHistory();
    set((state) => ({
      characters: state.characters.map((c) =>
        c.id === characterId
          ? { ...c, inventory: c.inventory.filter((i) => i.id !== itemId) }
          : c
      ),
    }));
  },

  transferInventoryItem: (fromId, toId, itemId) => {
    const state = get();
    const toChar = state.characters.find((c) => c.id === toId);
    if (!toChar || toChar.inventory.length >= MAX_INVENTORY_SIZE) {
      get().showWarning('目标角色背包已满！');
      return false;
    }
    const fromChar = state.characters.find((c) => c.id === fromId);
    const item = fromChar?.inventory.find((i) => i.id === itemId);
    if (!item) return false;

    get()._pushHistory();
    set((s) => ({
      characters: s.characters.map((c) => {
        if (c.id === fromId) {
          return { ...c, inventory: c.inventory.filter((i) => i.id !== itemId) };
        }
        if (c.id === toId) {
          return { ...c, inventory: [...c.inventory, item] };
        }
        return c;
      }),
    }));
    return true;
  },

  undo: () => {
    set((state) => {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      const historyState = state.history[newIndex];
      return {
        ...state,
        characters: historyState.characters,
        relations: historyState.relations,
        historyIndex: newIndex,
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      const historyState = state.history[newIndex];
      return {
        ...state,
        characters: historyState.characters,
        relations: historyState.relations,
        historyIndex: newIndex,
      };
    });
  },

  showWarning: (message) => {
    set({ warningMessage: message });
    setTimeout(() => {
      get().clearWarning();
    }, 2000);
  },

  clearWarning: () => {
    set({ warningMessage: null });
  },

  triggerFlash: () => {
    set({ isFlashing: true });
    setTimeout(() => {
      set({ isFlashing: false });
    }, 300);
  },

  _pushHistory: () => {
    set((state) => {
      const currentState = {
        characters: JSON.parse(JSON.stringify(state.characters)),
        relations: JSON.parse(JSON.stringify(state.relations)),
      };
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(currentState);
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift();
      }
      return {
        ...state,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },
}));
