export enum DocumentLevel {
  NORMAL = 'normal',
  URGENT = 'urgent',
  EXPRESS = 'express'
}

export enum HorseSpeed {
  THREE_HUNDRED = 300,
  FIVE_HUNDRED = 500,
  EIGHT_HUNDRED = 800
}

export interface Horse {
  id: string;
  name: string;
  speed: HorseSpeed;
  stamina: number;
  distanceRun: number;
  isResting: boolean;
  isExhausted: boolean;
}

export interface Station {
  id: string;
  name: string;
  position: number;
  horses: Horse[];
  maxHorses: number;
  forage: number;
  maxForage: number;
  staff: number;
  pendingDocuments: Document[];
}

export interface Document {
  id: string;
  title: string;
  level: DocumentLevel;
  fromStation: string;
  toStation: string;
  currentStationId?: string;
  startTime: number;
  elapsedHours: number;
  totalDistance: number;
  currentDistance: number;
  assignedHorseId?: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'delayed';
  sealVerified: boolean;
}

export interface DispatchRequest {
  documentId: string;
  fromStationId: string;
  toStationId: string;
  horseId: string;
}

export interface FeedRequest {
  stationId: string;
  horseId: string;
}

export interface GameState {
  stations: Station[];
  documents: Document[];
  inTransitDocuments: InTransitDocument[];
  score: number;
  salary: number;
  currentTime: number;
}

export interface InTransitDocument {
  document: Document;
  horse: Horse;
  fromPosition: number;
  toPosition: number;
  progress: number;
  startTime: number;
}
