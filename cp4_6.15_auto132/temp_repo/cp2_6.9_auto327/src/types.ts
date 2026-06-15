export type ItemStatus = 'available' | 'borrowed' | 'needs-repair';

export type ItemCategory = 'robe' | 'cape' | 'folded' | 'helmet' | 'accessory';

export interface Item {
  id: string;
  name: string;
  category: ItemCategory;
  color: string;
  pattern: string;
  status: ItemStatus;
  thumbnail: string;
  boxId: string;
}

export interface Actor {
  id: string;
  name: string;
  role: string;
  currentItems: string[];
  avatar: string;
}

export interface Play {
  id: string;
  title: string;
  date: string;
  cast: { actorId: string; role: string; requiredItems: string[] }[];
  lyrics: { time: number; text: string }[];
}

export interface ShowRecord {
  id: string;
  playId: string;
  playTitle: string;
  date: string;
  actorRecords: {
    actorId: string;
    actorName: string;
    role: string;
    wornItems: string[];
    correctItems: string[];
    hasMistake: boolean;
    hasDamage: boolean;
  }[];
}

export type Scene = 'backstage' | 'stage';

export interface AppState {
  scene: Scene;
  items: Item[];
  actors: Actor[];
  currentPlay: Play | null;
  showRecords: ShowRecord[];
  currentShow: ShowRecord | null;
}

export type AppAction =
  | { type: 'SET_SCENE'; payload: Scene }
  | { type: 'BORROW_ITEM'; payload: { itemId: string; actorId: string } }
  | { type: 'RETURN_ITEM'; payload: { itemId: string; actorId: string } }
  | { type: 'MARK_ITEM_REPAIR'; payload: string }
  | { type: 'START_SHOW' }
  | { type: 'END_SHOW'; payload: { hasMistake: boolean; hasDamage: boolean } }
  | { type: 'SET_PLAY'; payload: Play };
