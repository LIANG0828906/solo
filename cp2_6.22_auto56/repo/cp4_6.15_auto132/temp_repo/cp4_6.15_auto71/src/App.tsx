import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Board from './Board';
import { createInitialBoard } from './data';
import type { BoardContextType, Card, Subtask, Comment } from './types';

const BoardContext = createContext<BoardContextType | null>(null);

export const useBoard = (): BoardContextType => {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoard must be used within BoardProvider');
  }
  return context;
};

const App: React.FC = () => {
  const initialState = useMemo(() => createInitialBoard(), []);
  const [columns, setColumns] = useState(initialState.columns);
  const [cards, setCards] = useState<Record<string, Card>>(initialState.cards);
  const [labels] = useState(initialState.labels);
  const [projectName] = useState(initialState.projectName);
  const [projectDescription] = useState(initialState.projectDescription);
  const [activeLabelId, setActiveLabelId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const moveCard = useCallback((
    cardId: string,
    sourceColId: string,
    destColId: string,
    destIndex: number
  ) => {
    setColumns(prevCols => {
      const newCols = prevCols.map(col => ({ ...col, cardIds: [...col.cardIds] }));
      const sourceCol = newCols.find(c => c.id === sourceColId);
      const destCol = newCols.find(c => c.id === destColId);
      
      if (!sourceCol || !destCol) return prevCols;

      const sourceIndex = sourceCol.cardIds.indexOf(cardId);
      if (sourceIndex === -1) return prevCols;

      sourceCol.cardIds.splice(sourceIndex, 1);
      destCol.cardIds.splice(destIndex, 0, cardId);

      return newCols;
    });

    if (sourceColId !== destColId) {
      setCards(prevCards => ({
        ...prevCards,
        [cardId]: { ...prevCards[cardId], columnId: destColId }
      }));
    }
  }, []);

  const addCard = useCallback((
    columnId: string,
    cardData: Omit<Card, 'id' | 'columnId' | 'subtasks' | 'comments'>
  ) => {
    const newCard: Card = {
      ...cardData,
      id: uuidv4(),
      columnId,
      subtasks: [],
      comments: [],
    };

    setCards(prev => ({ ...prev, [newCard.id]: newCard }));
    setColumns(prevCols =>
      prevCols.map(col =>
        col.id === columnId
          ? { ...col, cardIds: [newCard.id, ...col.cardIds] }
          : col
      )
    );
  }, []);

  const updateCard = useCallback((cardId: string, updates: Partial<Card>) => {
    setCards(prev => ({
      ...prev,
      [cardId]: { ...prev[cardId], ...updates }
    }));
  }, []);

  const addSubtask = useCallback((cardId: string, title: string) => {
    const newSubtask: Subtask = {
      id: uuidv4(),
      title,
      completed: false,
    };

    setCards(prev => ({
      ...prev,
      [cardId]: {
        ...prev[cardId],
        subtasks: [...prev[cardId].subtasks, newSubtask]
      }
    }));
  }, []);

  const toggleSubtask = useCallback((cardId: string, subtaskId: string) => {
    setCards(prev => ({
      ...prev,
      [cardId]: {
        ...prev[cardId],
        subtasks: prev[cardId].subtasks.map(st =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        )
      }
    }));
  }, []);

  const addComment = useCallback((cardId: string, author: string, content: string) => {
    const newComment: Comment = {
      id: uuidv4(),
      author,
      content,
      createdAt: new Date(),
    };

    setCards(prev => ({
      ...prev,
      [cardId]: {
        ...prev[cardId],
        comments: [...prev[cardId].comments, newComment]
      }
    }));
  }, []);

  const updateColumnTitle = useCallback((columnId: string, title: string) => {
    setColumns(prev =>
      prev.map(col => (col.id === columnId ? { ...col, title } : col))
    );
  }, []);

  const reorderColumns = useCallback((fromIndex: number, toIndex: number) => {
    setColumns(prev => {
      const newCols = [...prev];
      const [removed] = newCols.splice(fromIndex, 1);
      newCols.splice(toIndex, 0, removed);
      return newCols;
    });
  }, []);

  const contextValue = useMemo<BoardContextType>(() => ({
    columns,
    cards,
    labels,
    projectName,
    projectDescription,
    moveCard,
    addCard,
    updateCard,
    addSubtask,
    toggleSubtask,
    addComment,
    updateColumnTitle,
    reorderColumns,
    activeLabelId,
    setActiveLabelId,
    searchQuery,
    setSearchQuery,
  }), [
    columns,
    cards,
    labels,
    projectName,
    projectDescription,
    moveCard,
    addCard,
    updateCard,
    addSubtask,
    toggleSubtask,
    addComment,
    updateColumnTitle,
    reorderColumns,
    activeLabelId,
    searchQuery,
  ]);

  return (
    <BoardContext.Provider value={contextValue}>
      <div style={appStyles}>
        <Board />
      </div>
    </BoardContext.Provider>
  );
};

const appStyles: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(180deg, #1A1A2E 0%, #16213E 100%)',
  position: 'relative',
  overflow: 'hidden',
};

export default App;
