import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppState, AppAction, Recipe, InventoryItem, EventType } from './types';
import { eventBus } from './eventBus';

const mockRecipes: Recipe[] = [
  {
    id: '1',
    name: '番茄炒蛋',
    cookTime: '15分钟',
    likes: 42,
    image: '',
    ingredients: [
      { name: '番茄', amount: '2个' },
      { name: '鸡蛋', amount: '3个' },
      { name: '葱花', amount: '适量' },
      { name: '盐', amount: '少许' },
      { name: '白糖', amount: '1勺' },
    ],
    steps: [
      '番茄洗净切块，鸡蛋打散加少许盐搅匀',
      '热锅放油，倒入蛋液炒至凝固盛出',
      '锅中再加少许油，放入番茄翻炒出汁',
      '加入白糖和盐调味，倒入炒好的鸡蛋',
      '翻炒均匀，撒上葱花即可出锅',
    ],
    editors: [
      { name: '小明', avatar: '', editTime: new Date('2026-06-18') },
      { name: '小红', avatar: '', editTime: new Date('2026-06-17') },
      { name: '小刚', avatar: '', editTime: new Date('2026-06-15') },
    ],
  },
  {
    id: '2',
    name: '红烧肉',
    cookTime: '90分钟',
    likes: 78,
    image: '',
    ingredients: [
      { name: '五花肉', amount: '500g' },
      { name: '冰糖', amount: '30g' },
      { name: '生抽', amount: '2勺' },
      { name: '老抽', amount: '1勺' },
      { name: '料酒', amount: '2勺' },
      { name: '八角', amount: '2个' },
      { name: '桂皮', amount: '1小块' },
    ],
    steps: [
      '五花肉切块，冷水下锅焯水去血沫',
      '锅中放少许油，加入冰糖小火炒出糖色',
      '放入五花肉翻炒均匀上色',
      '加入生抽、老抽、料酒调味',
      '加入八角、桂皮和适量热水，大火烧开转小火炖60分钟',
      '大火收汁，汤汁浓稠即可出锅',
    ],
    editors: [
      { name: '大厨', avatar: '', editTime: new Date('2026-06-18') },
      { name: '美食家', avatar: '', editTime: new Date('2026-06-16') },
      { name: '吃货', avatar: '', editTime: new Date('2026-06-14') },
    ],
  },
  {
    id: '3',
    name: '清炒时蔬',
    cookTime: '10分钟',
    likes: 35,
    image: '',
    ingredients: [
      { name: '青菜', amount: '300g' },
      { name: '蒜末', amount: '3瓣' },
      { name: '盐', amount: '适量' },
      { name: '鸡精', amount: '少许' },
    ],
    steps: [
      '青菜洗净沥干水分',
      '热锅放油，爆香蒜末',
      '放入青菜大火快炒',
      '加盐和鸡精调味，翻炒均匀即可',
    ],
    editors: [
      { name: '健康达人', avatar: '', editTime: new Date('2026-06-17') },
      { name: '素食者', avatar: '', editTime: new Date('2026-06-15') },
      { name: '营养师', avatar: '', editTime: new Date('2026-06-13') },
    ],
  },
  {
    id: '4',
    name: '酸辣土豆丝',
    cookTime: '20分钟',
    likes: 56,
    image: '',
    ingredients: [
      { name: '土豆', amount: '2个' },
      { name: '干辣椒', amount: '5个' },
      { name: '花椒', amount: '少许' },
      { name: '白醋', amount: '2勺' },
      { name: '盐', amount: '适量' },
    ],
    steps: [
      '土豆去皮切丝，清水浸泡去淀粉',
      '热锅放油，爆香花椒和干辣椒',
      '捞出花椒，放入土豆丝大火翻炒',
      '加入白醋和盐调味，炒至断生即可',
    ],
    editors: [
      { name: '川菜爱好者', avatar: '', editTime: new Date('2026-06-18') },
      { name: '土豆控', avatar: '', editTime: new Date('2026-06-16') },
      { name: '新手厨师', avatar: '', editTime: new Date('2026-06-14') },
    ],
  },
  {
    id: '5',
    name: '豆腐煲',
    cookTime: '30分钟',
    likes: 48,
    image: '',
    ingredients: [
      { name: '嫩豆腐', amount: '1盒' },
      { name: '香菇', amount: '5朵' },
      { name: '虾仁', amount: '100g' },
      { name: '火腿', amount: '50g' },
      { name: '蚝油', amount: '1勺' },
      { name: '淀粉', amount: '适量' },
    ],
    steps: [
      '豆腐切块，香菇泡发切片，火腿切丁',
      '砂锅底部铺上豆腐，撒上香菇、火腿和虾仁',
      '加入高汤和蚝油，大火烧开转小火炖20分钟',
      '水淀粉勾芡，撒上葱花即可',
    ],
    editors: [
      { name: '粤菜师傅', avatar: '', editTime: new Date('2026-06-17') },
      { name: '煲汤达人', avatar: '', editTime: new Date('2026-06-15') },
      { name: '豆腐控', avatar: '', editTime: new Date('2026-06-13') },
    ],
  },
  {
    id: '6',
    name: '可乐鸡翅',
    cookTime: '40分钟',
    likes: 89,
    image: '',
    ingredients: [
      { name: '鸡翅中', amount: '8个' },
      { name: '可乐', amount: '1罐' },
      { name: '生抽', amount: '2勺' },
      { name: '老抽', amount: '1勺' },
      { name: '料酒', amount: '1勺' },
      { name: '姜片', amount: '3片' },
    ],
    steps: [
      '鸡翅两面划刀，冷水下锅焯水去腥',
      '锅中放少许油，放入鸡翅煎至两面金黄',
      '加入姜片、生抽、老抽、料酒调味',
      '倒入可乐，大火烧开转小火炖20分钟',
      '大火收汁，汤汁浓稠裹满鸡翅即可',
    ],
    editors: [
      { name: '快手厨师', avatar: '', editTime: new Date('2026-06-18') },
      { name: '可乐控', avatar: '', editTime: new Date('2026-06-16') },
      { name: '新手妈妈', avatar: '', editTime: new Date('2026-06-14') },
    ],
  },
];

const mockInventory: InventoryItem[] = [
  { id: '1', name: '番茄', quantity: 3, maxQuantity: 10, freshnessDays: 2, lastUpdated: new Date() },
  { id: '2', name: '鸡蛋', quantity: 8, maxQuantity: 30, freshnessDays: 5, lastUpdated: new Date() },
  { id: '3', name: '五花肉', quantity: 1, maxQuantity: 5, freshnessDays: 1, lastUpdated: new Date() },
  { id: '4', name: '土豆', quantity: 2, maxQuantity: 8, freshnessDays: 7, lastUpdated: new Date() },
  { id: '5', name: '青菜', quantity: 1, maxQuantity: 5, freshnessDays: 0.5, lastUpdated: new Date() },
  { id: '6', name: '豆腐', quantity: 0, maxQuantity: 4, freshnessDays: 3, lastUpdated: new Date() },
  { id: '7', name: '鸡翅中', quantity: 4, maxQuantity: 16, freshnessDays: 2, lastUpdated: new Date() },
  { id: '8', name: '香菇', quantity: 3, maxQuantity: 10, freshnessDays: 4, lastUpdated: new Date() },
];

const initialState: AppState = {
  recipes: mockRecipes,
  inventory: mockInventory,
};

function appReducer(state: AppState, action: AppAction): AppState {
  let newState: AppState;

  switch (action.type) {
    case 'ADD_RECIPE':
      newState = { ...state, recipes: [...state.recipes, action.payload] };
      break;
    case 'DELETE_RECIPE':
      newState = { ...state, recipes: state.recipes.filter(r => r.id !== action.payload) };
      break;
    case 'UPDATE_RECIPE':
      newState = {
        ...state,
        recipes: state.recipes.map(r => (r.id === action.payload.id ? action.payload : r)),
      };
      break;
    case 'LIKE_RECIPE':
      newState = {
        ...state,
        recipes: state.recipes.map(r =>
          r.id === action.payload ? { ...r, likes: r.likes + 1 } : r
        ),
      };
      eventBus.emit(EventType.RECIPE_LIKED, action.payload);
      break;
    case 'ADD_INVENTORY':
      newState = { ...state, inventory: [...state.inventory, action.payload] };
      eventBus.emit(EventType.INVENTORY_UPDATED, newState.inventory);
      break;
    case 'UPDATE_INVENTORY':
      newState = {
        ...state,
        inventory: state.inventory.map(item =>
          item.id === action.payload.id
            ? {
                ...item,
                quantity: action.payload.quantity ?? item.quantity,
                freshnessDays: action.payload.freshnessDays ?? item.freshnessDays,
                lastUpdated: new Date(),
              }
            : item
        ),
      };
      eventBus.emit(EventType.INVENTORY_UPDATED, newState.inventory);
      break;
    case 'DELETE_INVENTORY':
      newState = {
        ...state,
        inventory: state.inventory.filter(item => item.id !== action.payload),
      };
      eventBus.emit(EventType.INVENTORY_UPDATED, newState.inventory);
      break;
    case 'INCREMENT_INVENTORY': {
      const existingItem = state.inventory.find(item => item.name === action.payload.name);
      if (existingItem) {
        newState = {
          ...state,
          inventory: state.inventory.map(item =>
            item.id === existingItem.id
              ? {
                  ...item,
                  quantity: Math.min(
                    item.quantity + (action.payload.amount ?? 1),
                    item.maxQuantity
                  ),
                  lastUpdated: new Date(),
                }
              : item
          ),
        };
      } else {
        const newItem: InventoryItem = {
          id: Date.now().toString(),
          name: action.payload.name,
          quantity: action.payload.amount ?? 1,
          maxQuantity: 10,
          freshnessDays: 5,
          lastUpdated: new Date(),
        };
        newState = { ...state, inventory: [...state.inventory, newItem] };
      }
      eventBus.emit(EventType.INVENTORY_UPDATED, newState.inventory);
      break;
    }
    case 'DECREMENT_INVENTORY': {
      const existingItem = state.inventory.find(item => item.id === action.payload);
      if (existingItem && existingItem.quantity > 0) {
        newState = {
          ...state,
          inventory: state.inventory.map(item =>
            item.id === action.payload
              ? { ...item, quantity: item.quantity - 1, lastUpdated: new Date() }
              : item
          ),
        };
        eventBus.emit(EventType.INVENTORY_UPDATED, newState.inventory);
      } else {
        newState = state;
      }
      break;
    }
    default:
      newState = state;
  }

  return newState;
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
