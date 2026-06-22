export interface PostStation {
  id: number;
  name: string;
  x: number;
  y: number;
}

export interface Horse {
  id: number;
  name: string;
  speedLevel: 1 | 2 | 3 | 4 | 5;
  maxDistance: number;
  stationId: number;
  available: boolean;
}

export interface Courier {
  id: number;
  name: string;
  stamina: number;
  totalMileage: number;
  stationId: number;
  available: boolean;
}

export interface Letter {
  id: number;
  sender: string;
  receiver: string;
  fromStationId: number;
  toStationId: number;
  type: 'urgent' | 'normal';
  status: 'pending' | 'transit' | 'delivered';
  currentStationIndex: number;
  path: PostStation[];
  horseId?: number;
  courierId?: number;
  createdAt: Date;
  dispatchedAt?: Date;
  deliveredAt?: Date;
  estimatedArrival?: Date;
}

export type WebSocketMessageType = 'letter_update' | 'letter_created' | 'letter_delivered' | 'init';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
}
