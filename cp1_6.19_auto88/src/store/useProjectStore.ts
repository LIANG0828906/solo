import { useReducer, useCallback, useEffect } from 'react';
import type { AppState, AppAction, Project, IdeaCard, ColorInfo } from '@/types';
import { extractColors } from '@/utils/colorExtractor';
import { loadFromStorage, saveToStorage } from '@/utils/storage';
import { generateId } from '@/utils/export';

const initialState: AppState = {
  projects: [],
  currentProjectId: null,
  undoStack: [],
};

const resolveCollisions = (
  cards: IdeaCard[],
  movedCardId: string,
  newPosition: { x: number; y: number }
): IdeaCard[] => {
  const cardWidth = 200;
  const cardHeight = 280;
  const padding = 20;

  return cards.map(card => {
    if (card.id === movedCardId) {
      return { ...card, position: newPosition };
    }

    const dx = Math.abs(card.position.x - newPosition.x);
    const dy = Math.abs(card.position.y - newPosition.y);

    if (dx < cardWidth + padding && dy < cardHeight + padding) {
      const offsetX = dx < cardWidth ? (newPosition.x > card.position.x ? -cardWidth - padding : cardWidth + padding) : 0;
      const offsetY = dy < cardHeight ? (newPosition.y > card.position.y ? -cardHeight - padding : cardHeight + padding) : 0;
      
      return {
        ...card,
        position: {
          x: Math.max(0, card.position.x + offsetX * 0.3),
          y: Math.max(0, card.position.y + offsetY * 0.3),
        },
      };
    }

    return card;
  });
};

const reducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'ADD_PROJECT': {
      const newProject: Project = {
        id: generateId(),
        name: action.payload.name,
        thumbnail: action.payload.thumbnail,
        cards: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      return {
        ...state,
        projects: [newProject, ...state.projects],
        currentProjectId: state.currentProjectId || newProject.id,
      };
    }

    case 'SET_CURRENT_PROJECT': {
      return {
        ...state,
        currentProjectId: action.payload,
      };
    }

    case 'ADD_CARD': {
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.projectId
            ? { ...project, cards: [...project.cards, action.payload.card], updatedAt: Date.now() }
            : project
        ),
      };
    }

    case 'MOVE_CARD': {
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.projectId
            ? {
                ...project,
                cards: resolveCollisions(
                  project.cards,
                  action.payload.cardId,
                  action.payload.position
                ),
                updatedAt: Date.now(),
              }
            : project
        ),
      };
    }

    case 'UPDATE_CARD_NOTE': {
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.projectId
            ? {
                ...project,
                cards: project.cards.map(card =>
                  card.id === action.payload.cardId
                    ? { ...card, note: action.payload.note }
                    : card
                ),
                updatedAt: Date.now(),
              }
            : project
        ),
      };
    }

    case 'DELETE_CARD': {
      const project = state.projects.find(p => p.id === action.payload.projectId);
      const card = project?.cards.find(c => c.id === action.payload.cardId);
      
      if (!card) return state;

      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId
            ? {
                ...p,
                cards: p.cards.filter(c => c.id !== action.payload.cardId),
                updatedAt: Date.now(),
              }
            : p
        ),
        undoStack: [...state.undoStack, { projectId: action.payload.projectId, card }],
      };
    }

    case 'RESTORE_CARD': {
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.projectId
            ? {
                ...project,
                cards: [...project.cards, action.payload.card],
                updatedAt: Date.now(),
              }
            : project
        ),
        undoStack: state.undoStack.slice(1),
      };
    }

    case 'CLEAR_BOARD': {
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload
            ? { ...project, cards: [], updatedAt: Date.now() }
            : project
        ),
      };
    }

    case 'LOAD_FROM_STORAGE': {
      return action.payload;
    }

    default:
      return state;
  }
};

export const useProjectStore = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const savedData = loadFromStorage();
    if (savedData) {
      dispatch({ type: 'LOAD_FROM_STORAGE', payload: savedData });
    }
  }, []);

  useEffect(() => {
    if (state.projects.length > 0) {
      saveToStorage(state);
    }
  }, [state]);

  const addProject = useCallback((name: string) => {
    const gradient = `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`;
    dispatch({ type: 'ADD_PROJECT', payload: { name, thumbnail: gradient } });
  }, []);

  const setCurrentProject = useCallback((id: string) => {
    dispatch({ type: 'SET_CURRENT_PROJECT', payload: id });
  }, []);

  const addCard = useCallback(
    (projectId: string, cardData: Omit<IdeaCard, 'id' | 'createdAt'>) => {
      const newCard: IdeaCard = {
        ...cardData,
        id: generateId(),
        createdAt: Date.now(),
      };
      dispatch({ type: 'ADD_CARD', payload: { projectId, card: newCard } });
    },
    []
  );

  const moveCard = useCallback(
    (projectId: string, cardId: string, position: { x: number; y: number }) => {
      dispatch({ type: 'MOVE_CARD', payload: { projectId, cardId, position } });
    },
    []
  );

  const updateCardNote = useCallback(
    (projectId: string, cardId: string, note: string) => {
      dispatch({ type: 'UPDATE_CARD_NOTE', payload: { projectId, cardId, note } });
    },
    []
  );

  const deleteCard = useCallback(
    (projectId: string, cardId: string): IdeaCard | null => {
      const project = state.projects.find(p => p.id === projectId);
      const card = project?.cards.find(c => c.id === cardId) || null;
      dispatch({ type: 'DELETE_CARD', payload: { projectId, cardId } });
      return card;
    },
    [state.projects]
  );

  const restoreCard = useCallback((projectId: string, card: IdeaCard) => {
    dispatch({ type: 'RESTORE_CARD', payload: { projectId, card } });
  }, []);

  const clearBoard = useCallback((projectId: string) => {
    dispatch({ type: 'CLEAR_BOARD', payload: projectId });
  }, []);

  const extractColorsFromImage = useCallback(
    async (imageUrl: string): Promise<ColorInfo[]> => {
      return extractColors(imageUrl);
    },
    []
  );

  return {
    state,
    dispatch,
    addProject,
    setCurrentProject,
    addCard,
    moveCard,
    updateCardNote,
    deleteCard,
    restoreCard,
    clearBoard,
    extractColors: extractColorsFromImage,
  };
};
