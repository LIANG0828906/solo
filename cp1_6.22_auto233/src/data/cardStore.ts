import { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type CardType = 'character' | 'scene' | 'swatch';

export interface BaseCard {
  id: string;
  type: CardType;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  title: string;
  description: string;
  tags: string[];
  createdAt: number;
}

export interface CharacterCard extends BaseCard {
  type: 'character';
  primaryColor: string;
  secondaryColor: string;
}

export interface SceneCard extends BaseCard {
  type: 'scene';
  patternSeed: number;
}

export interface SwatchCard extends BaseCard {
  type: 'swatch';
  colors: string[];
}

export type Card = CharacterCard | SceneCard | SwatchCard;

export interface Connection {
  id: string;
  fromCardId: string;
  toCardId: string;
}

export interface BoardState {
  cards: Card[];
  connections: Connection[];
  projectName: string;
  swimlaneView: boolean;
  zoom: number;
  panX: number;
  panY: number;
  selectedCardId: string | null;
  editingCardId: string | null;
  history: Card[][];
  historyIndex: number;
}

type Action =
  | { type: 'ADD_CARD'; payload: Card }
  | { type: 'DELETE_CARD'; payload: string }
  | { type: 'UPDATE_CARD'; payload: Card }
  | { type: 'MOVE_CARD'; payload: { id: string; x: number; y: number } }
  | { type: 'SET_TARGET_POSITION'; payload: { id: string; targetX: number; targetY: number } }
  | { type: 'SELECT_CARD'; payload: string | null }
  | { type: 'EDIT_CARD'; payload: string | null }
  | { type: 'ADD_CONNECTION'; payload: Connection }
  | { type: 'DELETE_CONNECTION'; payload: string }
  | { type: 'TOGGLE_SWIMLANE' }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_PAN'; payload: { x: number; y: number } }
  | { type: 'SET_PROJECT_NAME'; payload: string }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'PUSH_HISTORY' };

const initialCards: Card[] = [
  {
    id: uuidv4(),
    type: 'character',
    x: 100,
    y: 100,
    targetX: 100,
    targetY: 100,
    title: '暗夜精灵',
    description: '来自月影森林的神秘守护者，擅长使用月光魔法，性格内敛但内心温柔。',
    tags: ['主角', '精灵族', '魔法'],
    createdAt: Date.now() - 5000,
    primaryColor: '#7C6FBA',
    secondaryColor: '#A277D1',
  } as CharacterCard,
  {
    id: uuidv4(),
    type: 'character',
    x: 380,
    y: 120,
    targetX: 380,
    targetY: 120,
    title: '烈焰战士',
    description: '火山部落的勇士，拥有操控火焰的能力，性格豪爽直率。',
    tags: ['主角', '人族', '战士'],
    createdAt: Date.now() - 4000,
    primaryColor: '#E57373',
    secondaryColor: '#FFB74D',
  } as CharacterCard,
  {
    id: uuidv4(),
    type: 'scene',
    x: 150,
    y: 450,
    targetX: 150,
    targetY: 450,
    title: '月影森林',
    description: '终年被月光笼罩的神秘森林，是精灵族的圣地。',
    tags: ['场景', '森林', '夜景'],
    createdAt: Date.now() - 3000,
    patternSeed: 42,
  } as SceneCard,
  {
    id: uuidv4(),
    type: 'swatch',
    x: 500,
    y: 400,
    targetX: 500,
    targetY: 400,
    title: '暮色紫霞',
    description: '黄昏时分的天空色调',
    tags: ['配色', '紫色系'],
    createdAt: Date.now() - 2000,
    colors: ['#1E1B2E', '#2D283E', '#413D57', '#7C6FBA', '#A277D1', '#D3CDE0'],
  } as SwatchCard,
  {
    id: uuidv4(),
    type: 'swatch',
    x: 720,
    y: 180,
    targetX: 720,
    targetY: 180,
    title: '烈焰橙红',
    description: '火山与火焰的配色',
    tags: ['配色', '暖色系'],
    createdAt: Date.now() - 1000,
    colors: ['#5D1A1A', '#8B2B2B', '#C0392B', '#E74C3C', '#FF6B35', '#FFAA00'],
  } as SwatchCard,
];

const initialState: BoardState = {
  cards: initialCards,
  connections: [],
  projectName: '我的灵感板',
  swimlaneView: false,
  zoom: 1,
  panX: 0,
  panY: 0,
  selectedCardId: null,
  editingCardId: null,
  history: [initialCards],
  historyIndex: 0,
};

function boardReducer(state: BoardState, action: Action): BoardState {
  switch (action.type) {
    case 'ADD_CARD': {
      const newCards = [...state.cards, action.payload];
      return {
        ...state,
        cards: newCards,
        history: [...state.history.slice(0, state.historyIndex + 1), newCards],
        historyIndex: state.historyIndex + 1,
      };
    }
    case 'DELETE_CARD': {
      const newCards = state.cards.filter((c) => c.id !== action.payload);
      const newConnections = state.connections.filter(
        (c) => c.fromCardId !== action.payload && c.toCardId !== action.payload
      );
      return {
        ...state,
        cards: newCards,
        connections: newConnections,
        selectedCardId: state.selectedCardId === action.payload ? null : state.selectedCardId,
        history: [...state.history.slice(0, state.historyIndex + 1), newCards],
        historyIndex: state.historyIndex + 1,
      };
    }
    case 'UPDATE_CARD': {
      const newCards = state.cards.map((c) =>
        c.id === action.payload.id ? action.payload : c
      );
      return {
        ...state,
        cards: newCards,
        history: [...state.history.slice(0, state.historyIndex + 1), newCards],
        historyIndex: state.historyIndex + 1,
      };
    }
    case 'MOVE_CARD': {
      const newCards = state.cards.map((c) =>
        c.id === action.payload.id
          ? { ...c, x: action.payload.x, y: action.payload.y, targetX: action.payload.x, targetY: action.payload.y }
          : c
      );
      return { ...state, cards: newCards };
    }
    case 'SET_TARGET_POSITION': {
      const newCards = state.cards.map((c) =>
        c.id === action.payload.id
          ? { ...c, targetX: action.payload.targetX, targetY: action.payload.targetY }
          : c
      );
      return { ...state, cards: newCards };
    }
    case 'SELECT_CARD':
      return { ...state, selectedCardId: action.payload };
    case 'EDIT_CARD':
      return { ...state, editingCardId: action.payload };
    case 'ADD_CONNECTION':
      return { ...state, connections: [...state.connections, action.payload] };
    case 'DELETE_CONNECTION':
      return {
        ...state,
        connections: state.connections.filter((c) => c.id !== action.payload),
      };
    case 'TOGGLE_SWIMLANE':
      return { ...state, swimlaneView: !state.swimlaneView };
    case 'SET_ZOOM':
      return { ...state, zoom: action.payload };
    case 'SET_PAN':
      return { ...state, panX: action.payload.x, panY: action.payload.y };
    case 'SET_PROJECT_NAME':
      return { ...state, projectName: action.payload };
    case 'UNDO': {
      if (state.historyIndex > 0) {
        return {
          ...state,
          cards: state.history[state.historyIndex - 1],
          historyIndex: state.historyIndex - 1,
        };
      }
      return state;
    }
    case 'REDO': {
      if (state.historyIndex < state.history.length - 1) {
        return {
          ...state,
          cards: state.history[state.historyIndex + 1],
          historyIndex: state.historyIndex + 1,
        };
      }
      return state;
    }
    case 'PUSH_HISTORY': {
      return {
        ...state,
        history: [...state.history.slice(0, state.historyIndex + 1), state.cards],
        historyIndex: state.historyIndex + 1,
      };
    }
    default:
      return state;
  }
}

interface BoardContextType {
  state: BoardState;
  dispatch: React.Dispatch<Action>;
  addCard: (type: CardType) => void;
  deleteCard: (id: string) => void;
  updateCard: (card: Card) => void;
  moveCard: (id: string, x: number, y: number) => void;
  setTargetPosition: (id: string, targetX: number, targetY: number) => void;
  selectCard: (id: string | null) => void;
  editCard: (id: string | null) => void;
  addConnection: (fromId: string, toId: string) => void;
  deleteConnection: (id: string) => void;
  toggleSwimlane: () => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  setProjectName: (name: string) => void;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  getCardsByTag: () => Map<string, Card[]>;
  getAllTags: () => string[];
}

const BoardContext = createContext<BoardContextType | null>(null);

export function BoardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(boardReducer, initialState);

  const addCard = useCallback((type: CardType) => {
    const baseCard = {
      id: uuidv4(),
      x: 200 + Math.random() * 200,
      y: 200 + Math.random() * 200,
      targetX: 0,
      targetY: 0,
      title: '',
      description: '',
      tags: [],
      createdAt: Date.now(),
    };
    baseCard.targetX = baseCard.x;
    baseCard.targetY = baseCard.y;

    let newCard: Card;
    if (type === 'character') {
      newCard = {
        ...baseCard,
        type: 'character',
        title: '新角色',
        description: '点击编辑角色描述...',
        primaryColor: '#A277D1',
        secondaryColor: '#7C6FBA',
      } as CharacterCard;
    } else if (type === 'scene') {
      newCard = {
        ...baseCard,
        type: 'scene',
        title: '新场景',
        description: '点击编辑场景描述...',
        patternSeed: Math.floor(Math.random() * 1000),
      } as SceneCard;
    } else {
      newCard = {
        ...baseCard,
        type: 'swatch',
        title: '新色票',
        description: '点击编辑色票描述...',
        colors: ['#1E1B2E', '#7C6FBA', '#A277D1', '#D3CDE0'],
      } as SwatchCard;
    }
    dispatch({ type: 'ADD_CARD', payload: newCard });
  }, []);

  const deleteCard = useCallback((id: string) => {
    dispatch({ type: 'DELETE_CARD', payload: id });
  }, []);

  const updateCard = useCallback((card: Card) => {
    dispatch({ type: 'UPDATE_CARD', payload: card });
  }, []);

  const moveCard = useCallback((id: string, x: number, y: number) => {
    dispatch({ type: 'MOVE_CARD', payload: { id, x, y } });
  }, []);

  const setTargetPosition = useCallback((id: string, targetX: number, targetY: number) => {
    dispatch({ type: 'SET_TARGET_POSITION', payload: { id, targetX, targetY } });
  }, []);

  const selectCard = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_CARD', payload: id });
  }, []);

  const editCard = useCallback((id: string | null) => {
    dispatch({ type: 'EDIT_CARD', payload: id });
  }, []);

  const addConnection = useCallback((fromId: string, toId: string) => {
    const connection: Connection = {
      id: uuidv4(),
      fromCardId: fromId,
      toCardId: toId,
    };
    dispatch({ type: 'ADD_CONNECTION', payload: connection });
  }, []);

  const deleteConnection = useCallback((id: string) => {
    dispatch({ type: 'DELETE_CONNECTION', payload: id });
  }, []);

  const toggleSwimlane = useCallback(() => {
    dispatch({ type: 'TOGGLE_SWIMLANE' });
  }, []);

  const setZoom = useCallback((zoom: number) => {
    dispatch({ type: 'SET_ZOOM', payload: Math.min(3, Math.max(0.3, zoom)) });
  }, []);

  const setPan = useCallback((x: number, y: number) => {
    dispatch({ type: 'SET_PAN', payload: { x, y } });
  }, []);

  const setProjectName = useCallback((name: string) => {
    dispatch({ type: 'SET_PROJECT_NAME', payload: name });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const pushHistory = useCallback(() => {
    dispatch({ type: 'PUSH_HISTORY' });
  }, []);

  const getCardsByTag = useCallback(() => {
    const map = new Map<string, Card[]>();
    state.cards.forEach((card) => {
      if (card.tags.length === 0) {
        if (!map.has('未分类')) {
          map.set('未分类', []);
        }
        map.get('未分类')!.push(card);
      } else {
        card.tags.forEach((tag) => {
          if (!map.has(tag)) {
            map.set(tag, []);
          }
          map.get(tag)!.push(card);
        });
      }
    });
    return map;
  }, [state.cards]);

  const getAllTags = useCallback(() => {
    const tagSet = new Set<string>();
    state.cards.forEach((card) => {
      card.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }, [state.cards]);

  return (
    <BoardContext.Provider
      value={{
        state,
        dispatch,
        addCard,
        deleteCard,
        updateCard,
        moveCard,
        setTargetPosition,
        selectCard,
        editCard,
        addConnection,
        deleteConnection,
        toggleSwimlane,
        setZoom,
        setPan,
        setProjectName,
        undo,
        redo,
        pushHistory,
        getCardsByTag,
        getAllTags,
      }}
    >
      {children}
    </BoardContext.Provider>
  );
}

export function useBoard() {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoard must be used within a BoardProvider');
  }
  return context;
}
