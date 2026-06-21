import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import axios from 'axios';
import { Board, Note, Connection, User } from '../types';

interface BoardContextType {
  currentBoard: Board | null;
  notes: Note[];
  connections: Connection[];
  users: User[];
  loading: boolean;
  setCurrentBoard: (board: Board | null) => void;
  loadBoard: (boardId: string) => Promise<void>;
  addNote: (type: 'text' | 'image' | 'todo') => Promise<void>;
  updateNote: (noteId: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  addConnection: (sourceId: string, targetId: string) => Promise<void>;
  setNoteSyncError: (noteId: string, hasError: boolean) => void;
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

const mockUsers: User[] = [
  { id: '1', name: '当前用户', color: '#3B82F6' },
  { id: '2', name: '张三', color: '#10B981' },
  { id: '3', name: '李四', color: '#F59E0B' },
];

export const BoardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [users] = useState<User[]>(mockUsers);
  const [loading, setLoading] = useState(false);

  const loadBoard = useCallback(async (boardId: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/boards/${boardId}`);
      setCurrentBoard(response.data.board);
      setNotes(response.data.notes || []);
      setConnections(response.data.connections || []);
    } catch (error) {
      console.error('加载白板失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addNote = useCallback(async (type: 'text' | 'image' | 'todo') => {
    if (!currentBoard) return;
    try {
      const baseX = 150 + Math.random() * 200;
      const baseY = 150 + Math.random() * 200;
      const response = await axios.post(`/api/boards/${currentBoard.id}/notes`, {
        type,
        x: baseX,
        y: baseY,
        width: type === 'image' ? 280 : 250,
        height: type === 'image' ? 200 : 150,
      });
      setNotes((prev) => [...prev, response.data]);
    } catch (error) {
      console.error('添加便签失败:', error);
    }
  }, [currentBoard]);

  const updateNote = useCallback(async (noteId: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, ...updates } : n))
    );
    try {
      await axios.put(`/api/notes/${noteId}`, updates);
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, syncError: false } : n))
      );
    } catch (error) {
      console.error('更新便签失败:', error);
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, syncError: true } : n))
      );
    }
  }, []);

  const deleteNote = useCallback(async (noteId: string) => {
    try {
      await axios.delete(`/api/notes/${noteId}`);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      setConnections((prev) =>
        prev.filter((c) => c.sourceId !== noteId && c.targetId !== noteId)
      );
    } catch (error) {
      console.error('删除便签失败:', error);
    }
  }, []);

  const addConnection = useCallback(async (sourceId: string, targetId: string) => {
    if (!currentBoard || sourceId === targetId) return;
    const exists = connections.some(
      (c) =>
        (c.sourceId === sourceId && c.targetId === targetId) ||
        (c.sourceId === targetId && c.targetId === sourceId)
    );
    if (exists) return;
    try {
      const response = await axios.post(
        `/api/boards/${currentBoard.id}/connections`,
        { sourceId, targetId }
      );
      setConnections((prev) => [...prev, response.data]);
    } catch (error) {
      console.error('添加连接线失败:', error);
    }
  }, [currentBoard, connections]);

  const setNoteSyncError = useCallback((noteId: string, hasError: boolean) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, syncError: hasError } : n))
    );
  }, []);

  return (
    <BoardContext.Provider
      value={{
        currentBoard,
        notes,
        connections,
        users,
        loading,
        setCurrentBoard,
        loadBoard,
        addNote,
        updateNote,
        deleteNote,
        addConnection,
        setNoteSyncError,
      }}
    >
      {children}
    </BoardContext.Provider>
  );
};

export const useBoard = () => {
  const context = useContext(BoardContext);
  if (context === undefined) {
    throw new Error('useBoard must be used within a BoardProvider');
  }
  return context;
};
