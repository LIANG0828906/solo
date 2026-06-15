export interface User {
  id: string;
  nickname: string;
  avatar: string;
  community: string;
  taste: {
    spicyLevel: number;
    eatCilantro: boolean;
    isVegetarian: boolean;
  };
  bio: string;
}

export interface Participant {
  userId: string;
  user: User;
  bringDish?: string;
  joinType: 'dish' | 'share';
  joinedAt: Date;
}

export interface TableRequest {
  id: string;
  hostId: string;
  host: User;
  time: Date;
  maxPeople: number;
  participants: Participant[];
  costPerPerson: number;
  invitationText: string;
  foodImage: string;
  status: 'open' | 'full';
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  tableId: string;
  userId: string;
  user: User;
  content: string;
  timestamp: Date;
}

export type AppView = 'register' | 'hall' | 'detail';

export interface AppState {
  currentUser: User | null;
  currentView: AppView;
  selectedTableId: string | null;
  tables: TableRequest[];
  messages: Record<string, ChatMessage[]>;
}

export type AppAction =
  | { type: 'REGISTER_USER'; payload: User }
  | { type: 'SET_VIEW'; payload: AppView }
  | { type: 'SELECT_TABLE'; payload: string | null }
  | { type: 'CREATE_TABLE'; payload: TableRequest }
  | { type: 'JOIN_TABLE'; payload: { tableId: string; participant: Participant } }
  | { type: 'SEND_MESSAGE'; payload: ChatMessage };
