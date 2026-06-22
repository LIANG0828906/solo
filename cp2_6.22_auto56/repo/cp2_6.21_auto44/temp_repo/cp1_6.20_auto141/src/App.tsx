import React from 'react';
import Board from './Board';
import TaskDetail from './TaskDetail';

const TEAM_MEMBERS = ['张三', '李四', '王五', '赵六'];

interface Task {
  id: string;
  name: string;
  description: string;
  assignee: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  subtasks: { id: string; name: string; completed: boolean }[];
}

interface BoardSummary {
  id: string;
  name: string;
}

interface BoardData {
  id: string;
  name: string;
  lists: {
    todo: Task[];
    inProgress: Task[];
    done: Task[];
  };
}

interface ShowDetail {
  taskId: string;
  listId: string;
}

function App() {
  const [boards, setBoards] = React.useState<BoardSummary[]>([]);
  const [currentBoardId, setCurrentBoardId] = React.useState<string | null>(null);
  const [boardData, setBoardData] = React.useState<BoardData | null>(null);
  const [showDetail, setShowDetail] = React.useState<ShowDetail | null>(null);
  const [fadeKey, setFadeKey] = React.useState(0);
  const [fadeIn, setFadeIn] = React.useState(true);

  const loadBoards = React.useCallback(async () => {
    try {
      const res = await fetch('/api/boards');
      const data = await res.json();
      setBoards(data);
    } catch {
      setBoards([]);
    }
  }, []);

  const loadBoard = React.useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/boards/${id}`);
      const data = await res.json();
      setBoardData(data);
    } catch {
      setBoardData(null);
    }
  }, []);

  const createBoard = React.useCallback(async () => {
    const name = prompt('请输入看板名称');
    if (!name) return;
    await fetch('/api/boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    await loadBoards();
  }, [loadBoards]);

  const deleteBoard = React.useCallback(async (id: string) => {
    await fetch(`/api/boards/${id}`, { method: 'DELETE' });
    if (currentBoardId === id) {
      setCurrentBoardId(null);
      setBoardData(null);
    }
    await loadBoards();
  }, [currentBoardId, loadBoards]);

  const updateBoard = React.useCallback(async (data: BoardData) => {
    await fetch(`/api/boards/${data.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await loadBoard(data.id);
  }, [loadBoard]);

  const switchBoard = React.useCallback((id: string) => {
    if (id === currentBoardId) return;
    setFadeIn(false);
    setTimeout(() => {
      setCurrentBoardId(id);
      setFadeKey((k) => k + 1);
      setFadeIn(true);
    }, 400);
  }, [currentBoardId]);

  const handleOpenDetail = React.useCallback((taskId: string, listId: string) => {
    setShowDetail({ taskId, listId });
  }, []);

  const handleCloseDetail = React.useCallback(() => {
    setShowDetail(null);
  }, []);

  const handleUpdateTask = React.useCallback(async (listId: string, task: Task) => {
    if (!boardData || !currentBoardId) return;
    const updatedLists = { ...boardData.lists };
    const list = [...updatedLists[listId as keyof typeof updatedLists]];
    const idx = list.findIndex((t) => t.id === task.id);
    if (idx !== -1) {
      list[idx] = task;
      updatedLists[listId as keyof typeof updatedLists] = list;
      await updateBoard({ ...boardData, lists: updatedLists });
    }
  }, [boardData, currentBoardId, updateBoard]);

  React.useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  React.useEffect(() => {
    if (currentBoardId) {
      loadBoard(currentBoardId);
    } else {
      setBoardData(null);
    }
  }, [currentBoardId, loadBoard]);

  const computeStats = React.useCallback(() => {
    if (!boardData) return { total: 0, completed: 0, overdue: 0 };
    const allLists = Object.values(boardData.lists);
    const total = allLists.reduce((sum, list) => sum + list.length, 0);
    const completed = boardData.lists.done.length;
    const today = new Date().toISOString().split('T')[0];
    const overdue = allLists
      .flatMap((list) => list)
      .filter(
        (task) =>
          task.dueDate &&
          task.dueDate < today &&
          !boardData.lists.done.some((t) => t.id === task.id)
      ).length;
    return { total, completed, overdue };
  }, [boardData]);

  const stats = computeStats();

  const detailTask = React.useMemo(() => {
    if (!showDetail || !boardData) return null;
    const list = boardData.lists[showDetail.listId as keyof typeof boardData.lists];
    return list?.find((t) => t.id === showDetail.taskId) ?? null;
  }, [showDetail, boardData]);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-title">看板</div>
        <button className="sidebar-create-btn" onClick={createBoard}>
          + 新建看板
        </button>
        <div className="board-list">
          {boards.map((board) => (
            <div
              key={board.id}
              className={`board-list-item ${board.id === currentBoardId ? 'active' : 'inactive'}`}
              onClick={() => switchBoard(board.id)}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {board.name}
              </span>
              {board.id === currentBoardId && (
                <button
                  className="board-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteBoard(board.id);
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </aside>

      <main className="main-area">
        <div
          key={fadeKey}
          className="main-content"
          style={{ opacity: fadeIn ? 1 : 0, transition: 'opacity 400ms ease-in-out' }}
        >
          {boardData && (
            <>
              <div className="stats-row">
                <StatCard label="总任务" value={stats.total} color="#4a90d9" />
                <StatCard label="已完成" value={stats.completed} color="#27ae60" />
                <StatCard label="已逾期" value={stats.overdue} color="#e74c3c" />
              </div>
              <Board
                boardData={boardData}
                onUpdateBoard={updateBoard}
                onOpenDetail={handleOpenDetail}
                teamMembers={TEAM_MEMBERS}
              />
            </>
          )}

          {!boardData && (
            <div className="empty-state" style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              请选择或创建一个看板
            </div>
          )}
        </div>

        {showDetail && detailTask && (
          <TaskDetail
            task={detailTask}
            listId={showDetail.listId}
            boardId={currentBoardId!}
            onClose={handleCloseDetail}
            onUpdateTask={handleUpdateTask}
            teamMembers={TEAM_MEMBERS}
          />
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const [displayValue, setDisplayValue] = React.useState(value);
  const [animating, setAnimating] = React.useState(false);

  React.useEffect(() => {
    if (displayValue !== value) {
      setAnimating(true);
      const timer = setTimeout(() => {
        setDisplayValue(value);
        setAnimating(false);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [value, displayValue]);

  return (
    <div className="stat-card">
      <div className={`stat-card-bar ${color === '#4a90d9' ? 'blue' : color === '#27ae60' ? 'green' : 'red'}`} />
      <div className="stat-card-info">
        <div className="stat-card-number" style={{ opacity: animating ? 0.3 : 1 }}>
          {displayValue}
        </div>
        <div className="stat-card-label">{label}</div>
      </div>
    </div>
  );
}

export default App;
