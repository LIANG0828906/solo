import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, ClipboardList, CheckCircle, Clock } from 'lucide-react';
import Board from './Board';
import { api } from './api';
import type { Board as BoardType, BoardWithTasks } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'list' | 'board'>('list');
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [selectedBoardName, setSelectedBoardName] = useState<string>('');
  const [boards, setBoards] = useState<BoardType[]>([]);
  const [boardDetails, setBoardDetails] = useState<Map<string, BoardWithTasks>>(
    new Map()
  );
  const [newBoardName, setNewBoardName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortControllerRef.current = new AbortController();

    const fetchBoards = async () => {
      try {
        const data = await api.getBoards();
        setBoards(data);

        const detailsPromises = data.map((board) => api.getBoard(board.id));
        const details = await Promise.all(detailsPromises);
        const detailsMap = new Map<string, BoardWithTasks>();
        details.forEach((board) => detailsMap.set(board.id, board));
        setBoardDetails(detailsMap);
      } catch (err) {
        console.error('Failed to fetch boards:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoards();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleCreateBoard = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!newBoardName.trim()) return;

      setIsCreating(true);
      try {
        const newBoard = await api.createBoard(newBoardName.trim());
        setBoards((prev) => [newBoard, ...prev]);
        setBoardDetails((prev) => {
          const newMap = new Map(prev);
          newMap.set(newBoard.id, { ...newBoard, tasks: [] });
          return newMap;
        });
        setNewBoardName('');
      } catch (err) {
        console.error('Failed to create board:', err);
      } finally {
        setIsCreating(false);
      }
    },
    [newBoardName]
  );

  const handleBoardClick = useCallback(
    (board: BoardType) => {
      setSelectedBoardId(board.id);
      setSelectedBoardName(board.name);
      setCurrentView('board');
    },
    []
  );

  const handleBackToList = useCallback(() => {
    setCurrentView('list');
    setSelectedBoardId(null);
    setSelectedBoardName('');
  }, []);

  const getTaskCounts = useCallback(
    (boardId: string) => {
      const board = boardDetails.get(boardId);
      if (!board) return { todo: 0, inProgress: 0, done: 0 };

      return {
        todo: board.tasks.filter((t) => t.status === 'todo').length,
        inProgress: board.tasks.filter((t) => t.status === 'inProgress').length,
        done: board.tasks.filter((t) => t.status === 'done').length,
      };
    },
    [boardDetails]
  );

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-left">
          <h1>📋 任务协作看板</h1>
          {currentView === 'list' && (
            <form
              className="create-board-form"
              onSubmit={handleCreateBoard}
            >
              <input
                type="text"
                placeholder="输入看板名称..."
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                disabled={isCreating}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isCreating || !newBoardName.trim()}
              >
                {isCreating ? (
                  <>
                    <span className="btn-loading"></span>
                    创建中
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    创建看板
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </nav>

      <main className="content">
        {currentView === 'list' && (
          <>
            {isLoading ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-text">加载看板列表...</div>
              </div>
            ) : boards.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <div className="empty-state-text">还没有看板</div>
                <div className="empty-state-hint">
                  在顶部输入框中输入名称来创建第一个看板
                </div>
              </div>
            ) : (
              <div className="boards-grid">
                {boards.map((board) => {
                  const counts = getTaskCounts(board.id);
                  return (
                    <div
                      key={board.id}
                      className="board-card"
                      onClick={() => handleBoardClick(board)}
                    >
                      <div>
                        <h3>{board.name}</h3>
                        <div className="board-card-info">
                          创建于 {formatDate(board.createdAt)}
                        </div>
                      </div>
                      <div className="board-card-meta">
                        <div className="task-count">
                          <span>
                            <Clock size={12} /> {counts.todo}
                          </span>
                          <span>
                            <ClipboardList size={12} /> {counts.inProgress}
                          </span>
                          <span>
                            <CheckCircle size={12} /> {counts.done}
                          </span>
                        </div>
                        <div className="board-card-info">
                          共 {counts.todo + counts.inProgress + counts.done} 个任务
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {currentView === 'board' && selectedBoardId && (
          <Board
            boardId={selectedBoardId}
            boardName={selectedBoardName}
            onBack={handleBackToList}
          />
        )}
      </main>
    </div>
  );
};

export default App;
