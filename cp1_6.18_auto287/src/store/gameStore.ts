import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { StoryCard, Connection } from '../types';
import { buildStory } from '../utils/storyBuilder';

const initialCards: StoryCard[] = [
  {
    id: uuidv4(),
    type: 'character',
    name: '神秘魔法师',
    description: '一位披着星辰斗篷的古老魔法师，掌握着失落已久的时空魔法，他的眼中闪烁着千年的智慧与秘密。',
  },
  {
    id: uuidv4(),
    type: 'character',
    name: '远古巨龙',
    description: '沉睡在火山深处的远古巨龙，鳞片如熔岩般赤红，它的一声咆哮可以撼动整片大陆。',
  },
  {
    id: uuidv4(),
    type: 'character',
    name: '月光精灵',
    description: '只在满月之夜现身的精灵，银发在月光下泛着银光，她是古老森林的守护者。',
  },
  {
    id: uuidv4(),
    type: 'character',
    name: '流浪勇者',
    description: '背负着神秘使命的年轻勇者，手持一把残缺的圣剑，行走在危机四伏的大陆上。',
  },
  {
    id: uuidv4(),
    type: 'scene',
    name: '古老森林',
    description: '参天巨树直插云霄，林间弥漫着淡淡的魔法雾气，据说这里居住着世间最古老的生灵。',
  },
  {
    id: uuidv4(),
    type: 'scene',
    name: '云端城堡',
    description: '漂浮在万丈高空的魔法城堡，由纯净的云朵和水晶构成，只有纯净心灵之人才能找到入口。',
  },
  {
    id: uuidv4(),
    type: 'scene',
    name: '神秘洞穴',
    description: '隐藏在瀑布后面的幽深洞穴，墙壁上刻满了失传的古老符文，深处传来若有若无的低语。',
  },
  {
    id: uuidv4(),
    type: 'scene',
    name: '魔法城堡',
    description: '拥有九百九十九座尖塔的魔法学院城堡，每一扇窗户都闪烁着不同颜色的魔法光辉。',
  },
  {
    id: uuidv4(),
    type: 'event',
    name: '时空裂缝',
    description: '天空中突然撕开一道紫色裂缝，来自不同时空的奇异事物开始涌入这个世界。',
  },
  {
    id: uuidv4(),
    type: 'event',
    name: '古老仪式',
    description: '在星辰对齐的夜晚，一场被遗忘千年的神秘仪式即将举行，命运的齿轮开始转动。',
  },
  {
    id: uuidv4(),
    type: 'event',
    name: '宝藏发现',
    description: '冒险者在废墟深处发现了传说中的宝藏，但随之而来的是守护宝藏的古老诅咒。',
  },
  {
    id: uuidv4(),
    type: 'event',
    name: '正邪对决',
    description: '光明与黑暗的最终决战即将爆发，整个世界的命运都悬于一线之间。',
  },
  {
    id: uuidv4(),
    type: 'object',
    name: '魔法水晶',
    description: '蕴含着无尽魔力的七彩水晶，据说它是创世之时从神界掉落的碎片。',
  },
  {
    id: uuidv4(),
    type: 'object',
    name: '远古卷轴',
    description: '用龙皮书写的古老卷轴，上面记载着足以颠覆世界的禁咒。',
  },
  {
    id: uuidv4(),
    type: 'object',
    name: '传说圣剑',
    description: '只有真正的勇者才能拔出的圣剑，剑刃上流动着金色的神圣光芒。',
  },
  {
    id: uuidv4(),
    type: 'object',
    name: '神秘药剂',
    description: '装在古老水晶瓶中的荧光药剂，饮下它的人将获得预知未来的能力，但代价是...',
  },
];

interface GameStore {
  cards: StoryCard[];
  connections: Connection[];
  storyText: string;
  displayedStoryText: string;
  isDragging: boolean;
  selectedCardId: string | null;
  connectingFromId: string | null;
  isGenerating: boolean;
  addCardToEditor: (cardId: string, x: number, y: number) => void;
  moveCard: (cardId: string, x: number, y: number) => void;
  removeCard: (cardId: string) => void;
  addConnection: (fromId: string, toId: string) => void;
  removeConnection: (connectionId: string) => void;
  generateStory: () => void;
  setDisplayedStoryText: (text: string) => void;
  setSelectedCardId: (id: string | null) => void;
  setConnectingFromId: (id: string | null) => void;
  setIsDragging: (dragging: boolean) => void;
  setIsGenerating: (generating: boolean) => void;
  resetAll: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  cards: initialCards,
  connections: [],
  storyText: '',
  displayedStoryText: '',
  isDragging: false,
  selectedCardId: null,
  connectingFromId: null,
  isGenerating: false,

  addCardToEditor: (cardId: string, x: number, y: number) => {
    set((state) => ({
      cards: state.cards.map((c) =>
        c.id === cardId ? { ...c, x, y, placedInEditor: true } : c
      ),
    }));
  },

  moveCard: (cardId: string, x: number, y: number) => {
    set((state) => ({
      cards: state.cards.map((c) =>
        c.id === cardId ? { ...c, x, y } : c
      ),
    }));
  },

  removeCard: (cardId: string) => {
    set((state) => ({
      cards: state.cards.map((c) =>
        c.id === cardId ? { ...c, placedInEditor: false, x: undefined, y: undefined } : c
      ),
      connections: state.connections.filter(
        (conn) => conn.fromId !== cardId && conn.toId !== cardId
      ),
    }));
  },

  addConnection: (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const { connections } = get();
    const exists = connections.some(
      (c) =>
        (c.fromId === fromId && c.toId === toId) ||
        (c.fromId === toId && c.toId === fromId)
    );
    if (exists) return;
    set((state) => ({
      connections: [...state.connections, { id: uuidv4(), fromId, toId }],
    }));
  },

  removeConnection: (connectionId: string) => {
    set((state) => ({
      connections: state.connections.filter((c) => c.id !== connectionId),
    }));
  },

  generateStory: () => {
    const { cards, connections } = get();
    const placedCards = cards.filter((c) => c.placedInEditor);
    const story = buildStory(placedCards, connections);
    set({ storyText: story, displayedStoryText: '', isGenerating: true });
  },

  setDisplayedStoryText: (text: string) => {
    set({ displayedStoryText: text });
  },

  setSelectedCardId: (id: string | null) => {
    set({ selectedCardId: id });
  },

  setConnectingFromId: (id: string | null) => {
    set({ connectingFromId: id });
  },

  setIsDragging: (dragging: boolean) => {
    set({ isDragging: dragging });
  },

  setIsGenerating: (generating: boolean) => {
    set({ isGenerating: generating });
  },

  resetAll: () => {
    set((state) => ({
      cards: state.cards.map((c) => ({
        ...c,
        placedInEditor: false,
        x: undefined,
        y: undefined,
      })),
      connections: [],
      storyText: '',
      displayedStoryText: '',
      selectedCardId: null,
      connectingFromId: null,
      isGenerating: false,
    }));
  },
}));
