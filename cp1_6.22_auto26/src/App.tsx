import React, { useState, useEffect, useCallback } from 'react';
import { SocketProvider, useSocket } from './context/SocketContext';
import { BoardList } from './components/BoardList';
import { BoardView } from './components/BoardView';
import type { RecipeBoard, RecipeCard, WsAction, BoardData } from './types';
import {
  fetchBoards,
  fetchBoard,
  createBoard as apiCreateBoard,
  updateBoard as apiUpdateBoard,
  deleteBoard as apiDeleteBoard,
  createCard as apiCreateCard,
  updateCard as apiUpdateCard,
  deleteCard as apiDeleteCard,
  moveCard as apiMoveCard,
} from './utils/dataStore';
import './App.css';

const wsHandlerRef: { current: (action: WsAction) => void } = {
  current: () => {},
};

function AppContent() {
  const [boards, setBoards] = useState<RecipeBoard[]>([]);
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null);
  const [currentBoardData, setCurrentBoardData] = useState<BoardData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { sendMessage, isConnected } = useSocket();

  const loadBoards = useCallback(async () => {
    try {
      const data = await fetchBoards();
      setBoards(data);
    } catch (error) {
      console.error('Failed to load boards:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBoard = useCallback(async (boardId: string) => {
    try {
      const data = await fetchBoard(boardId);
      setCurrentBoardData(data);
    } catch (error) {
      console.error('Failed to load board:', error);
    }
  }, []);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  const handleWsMessage = useCallback((action: WsAction) => {
    switch (action.type) {
      case 'BOARD_CREATED':
        setBoards((prev) => {
          if (prev.some((b) => b.id === action.board.id)) return prev;
          return [action.board, ...prev];
        });
        break;
      case 'BOARD_UPDATED':
        setBoards((prev) =>
          prev.map((b) => (b.id === action.board.id ? action.board : b))
        );
        setCurrentBoardData((prev) =>
          prev && prev.board.id === action.board.id
            ? { ...prev, board: action.board }
            : prev
        );
        break;
      case 'BOARD_DELETED':
        setBoards((prev) => prev.filter((b) => b.id !== action.boardId));
        setCurrentBoardId((prev) => (prev === action.boardId ? null : prev));
        setCurrentBoardData((prev) =>
          prev && prev.board.id === action.boardId ? null : prev
        );
        break;
      case 'CARD_CREATED':
        setCurrentBoardData((prev) => {
          if (!prev || prev.board.id !== action.card.boardId) return prev;
          if (prev.cards.some((c) => c.id === action.card.id)) return prev;
          return {
            ...prev,
            cards: [...prev.cards, action.card],
            board: {
              ...prev.board,
              cardOrder: [...prev.board.cardOrder, action.card.id],
            },
          };
        });
        setBoards((prev) =>
          prev.map((b) =>
            b.id === action.card.boardId
              ? { ...b, cardOrder: [...b.cardOrder, action.card.id] }
              : b
          )
        );
        break;
      case 'CARD_UPDATED':
        setCurrentBoardData((prev) => {
          if (!prev || prev.board.id !== action.card.boardId) return prev;
          return {
            ...prev,
            cards: prev.cards.map((c) =>
              c.id === action.card.id ? action.card : c
            ),
          };
        });
        break;
      case 'CARD_DELETED':
        setCurrentBoardData((prev) => {
          if (!prev || prev.board.id !== action.boardId) return prev;
          return {
            ...prev,
            cards: prev.cards.filter((c) => c.id !== action.cardId),
            board: {
              ...prev.board,
              cardOrder: prev.board.cardOrder.filter((id) => id !== action.cardId),
            },
          };
        });
        setBoards((prev) =>
          prev.map((b) =>
            b.id === action.boardId
              ? { ...b, cardOrder: b.cardOrder.filter((id) => id !== action.cardId) }
              : b
          )
        );
        break;
      case 'CARD_MOVED':
        setCurrentBoardData((prev) => {
          if (!prev) return prev;
          if (prev.board.id === action.fromBoardId) {
            return {
              ...prev,
              cards: prev.cards.filter((c) => c.id !== action.cardId),
              board: {
                ...prev.board,
                cardOrder: prev.board.cardOrder.filter((id) => id !== action.cardId),
              },
            };
          }
          return prev;
        });
        setBoards((prev) =>
          prev.map((b) => {
            if (b.id === action.fromBoardId) {
              return { ...b, cardOrder: b.cardOrder.filter((id) => id !== action.cardId) };
            }
            if (b.id === action.toBoardId) {
              return { ...b, cardOrder: [...b.cardOrder, action.cardId] };
            }
            return b;
          })
        );
        break;
    }
  }, []);

  useEffect(() => {
    wsHandlerRef.current = handleWsMessage;
  }, [handleWsMessage]);

  const handleBoardClick = (boardId: string) => {
    setCurrentBoardId(boardId);
    loadBoard(boardId);
  };

  const handleBack = () => {
    setCurrentBoardId(null);
    setCurrentBoardData(null);
    loadBoards();
  };

  const handleCreateBoard = async (name: string) => {
    try {
      const board = await apiCreateBoard(name);
      setBoards((prev) => [board, ...prev]);
      sendMessage({ type: 'BOARD_CREATED', board });
    } catch (error) {
      console.error('Failed to create board:', error);
    }
  };

  const handleUpdateBoard = async (boardId: string, data: Partial<RecipeBoard>) => {
    try {
      const updated = await apiUpdateBoard(boardId, data);
      setBoards((prev) => prev.map((b) => (b.id === boardId ? updated : b)));
      setCurrentBoardData((prev) =>
        prev && prev.board.id === boardId ? { ...prev, board: updated } : prev
      );
      sendMessage({ type: 'BOARD_UPDATED', board: updated });
    } catch (error) {
      console.error('Failed to update board:', error);
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    try {
      await apiDeleteBoard(boardId);
      setBoards((prev) => prev.filter((b) => b.id !== boardId));
      if (currentBoardId === boardId) {
        setCurrentBoardId(null);
        setCurrentBoardData(null);
      }
      sendMessage({ type: 'BOARD_DELETED', boardId });
    } catch (error) {
      console.error('Failed to delete board:', error);
    }
  };

  const handleCreateCard = async (data: Omit<RecipeCard, 'id' | 'order' | 'boardId'>) => {
    if (!currentBoardId) return;
    try {
      const card = await apiCreateCard(currentBoardId, data);
      setCurrentBoardData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          cards: [...prev.cards, card],
          board: {
            ...prev.board,
            cardOrder: [...prev.board.cardOrder, card.id],
          },
        };
      });
      sendMessage({ type: 'CARD_CREATED', card });
    } catch (error) {
      console.error('Failed to create card:', error);
    }
  };

  const handleUpdateCard = async (cardId: string, data: Partial<RecipeCard>) => {
    try {
      const updated = await apiUpdateCard(cardId, data);
      setCurrentBoardData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          cards: prev.cards.map((c) => (c.id === cardId ? updated : c)),
        };
      });
      sendMessage({ type: 'CARD_UPDATED', card: updated });
    } catch (error) {
      console.error('Failed to update card:', error);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!currentBoardId) return;
    try {
      await apiDeleteCard(cardId);
      setCurrentBoardData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          cards: prev.cards.filter((c) => c.id !== cardId),
          board: {
            ...prev.board,
            cardOrder: prev.board.cardOrder.filter((id) => id !== cardId),
          },
        };
      });
      sendMessage({ type: 'CARD_DELETED', cardId, boardId: currentBoardId });
    } catch (error) {
      console.error('Failed to delete card:', error);
    }
  };

  const handleMoveCard = async (cardId: string, toBoardId: string, newIndex: number) => {
    if (!currentBoardId) return;
    try {
      const result = await apiMoveCard(cardId, toBoardId, newIndex);
      if (toBoardId !== currentBoardId) {
        setCurrentBoardData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            cards: prev.cards.filter((c) => c.id !== cardId),
            board: {
              ...prev.board,
              cardOrder: prev.board.cardOrder.filter((id) => id !== cardId),
            },
          };
        });
      }
      setBoards((prev) =>
        prev.map((b) => {
          if (b.id === currentBoardId) {
            return { ...b, cardOrder: b.cardOrder.filter((id) => id !== cardId) };
          }
          if (b.id === toBoardId) {
            return { ...b, cardOrder: [...b.cardOrder, cardId] };
          }
          return b;
        })
      );
      sendMessage({
        type: 'CARD_MOVED',
        cardId,
        fromBoardId: result.fromBoardId,
        toBoardId: result.toBoardId,
        newOrder: [],
      });
    } catch (error) {
      console.error('Failed to move card:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p className="loading-text">加载中...</p>
      </div>
    );
  }

  return (
    <>
      {currentBoardId && currentBoardData ? (
        <BoardView
          board={currentBoardData.board}
          cards={currentBoardData.cards}
          allBoards={boards}
          onBack={handleBack}
          onUpdateBoard={handleUpdateBoard}
          onCreateCard={handleCreateCard}
          onUpdateCard={handleUpdateCard}
          onDeleteCard={handleDeleteCard}
          onMoveCard={handleMoveCard}
        />
      ) : (
        <BoardList
          boards={boards}
          onBoardClick={handleBoardClick}
          onCreateBoard={handleCreateBoard}
          onDeleteBoard={handleDeleteBoard}
          onUpdateBoard={handleUpdateBoard}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      )}
      <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? '● 实时同步中' : '○ 连接断开'}
      </div>
    </>
  );
}

function App() {
  const handleWsMessage = useCallback((action: WsAction) => {
    wsHandlerRef.current(action);
  }, []);

  return (
    <SocketProvider onMessage={handleWsMessage}>
      <AppContent />
    </SocketProvider>
  );
}

export default App;
