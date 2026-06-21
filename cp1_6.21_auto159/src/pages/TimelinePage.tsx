import { useEffect } from 'react';
import { useBoardStore } from '@/store/boardStore';
import BoardList from '@/board/BoardList';
import TimelineView from '@/board/TimelineView';
import { Link } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';

export default function TimelinePage() {
  const { boards, currentBoardId, fetchBoards } = useBoardStore();
  const currentBoard = boards.find((b) => b.id === currentBoardId);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  return (
    <div className="flex h-screen bg-gradient-to-b from-white to-slate-50">
      <BoardList />
      <main className="flex-1 flex flex-col overflow-hidden opacity-transition">
        <header className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">时光机</h1>
            {currentBoard && (
              <p className="text-sm text-slate-500 mt-0.5">{currentBoard.name}</p>
            )}
          </div>
          <Link
            to="/"
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <LayoutGrid size={16} />
            看板
          </Link>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {currentBoardId ? (
            <TimelineView boardId={currentBoardId} />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              请选择一个看板
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
