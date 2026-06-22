export interface PlacedFurniture {
  id: string;
  furnitureId: string;
  name: string;
  category: 'sofa' | 'table' | 'chair' | 'lamp' | 'carpet' | 'painting';
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface DesignState {
  placedFurniture: PlacedFurniture[];
  roomImage: string | null;
  style: string;
}

type Subscriber = (state: DesignState) => void;

let state: DesignState = {
  placedFurniture: [],
  roomImage: null,
  style: 'modern',
};

const subscribers: Set<Subscriber> = new Set();

export const getDesignState = (): Readonly<DesignState> => state;

export const subscribe = (callback: Subscriber): (() => void) => {
  subscribers.add(callback);
  callback(state);
  return () => subscribers.delete(callback);
};

export const unsubscribe = (callback: Subscriber): void => {
  subscribers.delete(callback);
};

export const addFurniture = (furniture: Omit<PlacedFurniture, 'id'>): void => {
  state = {
    ...state,
    placedFurniture: [
      ...state.placedFurniture,
      { ...furniture, id: `f_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` },
    ],
  };
  notifySubscribers();
};

export const removeFurniture = (id: string): void => {
  state = {
    ...state,
    placedFurniture: state.placedFurniture.filter((f) => f.id !== id),
  };
  notifySubscribers();
};

export const updateFurniture = (
  id: string,
  updates: Partial<Omit<PlacedFurniture, 'id' | 'furnitureId'>>,
): void => {
  state = {
    ...state,
    placedFurniture: state.placedFurniture.map((f) =>
      f.id === id ? { ...f, ...updates } : f,
    ),
  };
  notifySubscribers();
};

export const setRoomImage = (image: string | null): void => {
  state = { ...state, roomImage: image };
  notifySubscribers();
};

export const setStyle = (style: string): void => {
  state = { ...state, style };
  notifySubscribers();
};

const notifySubscribers = (): void => {
  subscribers.forEach((cb) => cb(state));
};
