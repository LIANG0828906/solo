import React, { useEffect } from 'react';
import { useBoardStore } from './store/boardStore';
import BoardList from './components/BoardList';
import BoardCanvas from './components/BoardCanvas';
import SyncLogPanel from './components/SyncLogPanel';

const App: React.FC = () => {
  const currentBoardId = useBoardStore((s) => s.currentBoardId);
  const setCurrentBoard = useBoardStore((s) => s.setCurrentBoard);
  const boards = useBoardStore((s) => s.boards);
  const loadFromDB = useBoardStore((s) => s.loadFromDB);

  useEffect(() => {
    loadFromDB();
  }, [loadFromDB]);

  const currentBoard = boards.find((b) => b.id === currentBoardId);

  if (currentBoardId && currentBoard) {
    return (
      <div className="app-board-view">
        <nav className="board-nav">
          <button className="nav-back-btn" onClick={() => setCurrentBoard(null)}>
            ← 返回
          </button>
          <h2 className="nav-board-name">{currentBoard.name}</h2>
        </nav>
        <BoardCanvas boardId={currentBoardId} />
        <SyncLogPanel />
      </div>
    );
  }

  return (
    <div className="app-list-view">
      <BoardList onOpenBoard={(id) => setCurrentBoard(id)} />
      <SyncLogPanel />
    </div>
  );
};

export default App;
