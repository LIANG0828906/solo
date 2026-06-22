export interface ColorInfo {
  hex: string;
  isReadable: boolean;
}

export interface IdeaCard {
  id: string;
  imageUrl: string;
  imageName: string;
  colors: ColorInfo[];
  note: string;
  position: { x: number; y: number };
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  thumbnail: string;
  cards: IdeaCard[];
  createdAt: number;
  updatedAt: number;
}

export interface AppState {
  projects: Project[];
  currentProjectId: string | null;
  undoStack: { projectId: string; card: IdeaCard }[];
}

export type AppAction =
  | { type: 'ADD_PROJECT'; payload: { name: string; thumbnail: string } }
  | { type: 'SET_CURRENT_PROJECT'; payload: string }
  | { type: 'ADD_CARD'; payload: { projectId: string; card: IdeaCard } }
  | { type: 'MOVE_CARD'; payload: { projectId: string; cardId: string; position: { x: number; y: number } } }
  | { type: 'UPDATE_CARD_NOTE'; payload: { projectId: string; cardId: string; note: string } }
  | { type: 'DELETE_CARD'; payload: { projectId: string; cardId: string } }
  | { type: 'RESTORE_CARD'; payload: { projectId: string; card: IdeaCard } }
  | { type: 'CLEAR_BOARD'; payload: string }
  | { type: 'LOAD_FROM_STORAGE'; payload: AppState };

export interface ProjectContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  addProject: (name: string) => void;
  setCurrentProject: (id: string) => void;
  addCard: (projectId: string, card: Omit<IdeaCard, 'id' | 'createdAt'>) => void;
  moveCard: (projectId: string, cardId: string, position: { x: number; y: number }) => void;
  updateCardNote: (projectId: string, cardId: string, note: string) => void;
  deleteCard: (projectId: string, cardId: string) => IdeaCard | null;
  restoreCard: (projectId: string, card: IdeaCard) => void;
  clearBoard: (projectId: string) => void;
  extractColors: (imageUrl: string) => Promise<ColorInfo[]>;
}
