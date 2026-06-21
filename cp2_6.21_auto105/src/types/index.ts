export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
  attractionId?: string;
  dayPlanId?: string;
}

export interface Attraction {
  id: string;
  name: string;
  description?: string;
  lat: number;
  lng: number;
  duration?: number;
  notes?: string;
  transportMode?: TransportMode;
  order: number;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export type TransportMode = 'walk' | 'car' | 'bus' | 'plane';

export interface DayPlan {
  id: string;
  date: string;
  dayNumber: number;
  attractions: Attraction[];
  accommodation?: string;
  transportation?: string;
  notes?: string;
}

export interface Trip {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  days: DayPlan[];
  ownerId: string;
  collaborators: User[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export type WSMessageType = 
  | 'attraction_add'
  | 'attraction_update'
  | 'attraction_delete'
  | 'attraction_move'
  | 'comment_add'
  | 'trip_update'
  | 'user_join'
  | 'user_leave'
  | 'cursor_move';

export interface WSMessage<T = unknown> {
  type: WSMessageType;
  tripId: string;
  userId: string;
  data: T;
  timestamp: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface TripStoreState {
  trip: Trip | null;
  selectedAttractionId: string | null;
  selectedDayId: string | null;
  isEditing: boolean;
  undoStack: Trip[];
  redoStack: Trip[];
  isLoading: boolean;
  error: string | null;
}

export interface TripStoreActions {
  setTrip: (trip: Trip | null) => void;
  setSelectedAttraction: (id: string | null) => void;
  setSelectedDay: (id: string | null) => void;
  setIsEditing: (editing: boolean) => void;
  addAttraction: (dayId: string, attraction: Attraction) => void;
  updateAttraction: (dayId: string, attractionId: string, updates: Partial<Attraction>) => void;
  deleteAttraction: (dayId: string, attractionId: string) => void;
  moveAttraction: (fromDayId: string, toDayId: string, attractionId: string, toIndex: number) => void;
  addComment: (dayId: string, attractionId: string, comment: Comment) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  saveToUndoStack: () => void;
  fetchTrip: (tripId: string) => Promise<void>;
  syncWithAPI: () => Promise<void>;
}
