import { useEffect } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { useBoardStore } from '@/store/boardStore';
import BoardList from '@/board/BoardList';
import BoardColumn from '@/board/BoardColumn';
import LoadChart from '@/board/LoadChart';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';

const STATUS_ORDER: Record<string, number> = { todo: 0, inProgress: 1, done: 2 };

export default function BoardPage() {
  const { boards, currentBoardId, tasks, loading, fetchBoards, updateTask } = useBoardStore();
  const currentBoard = boards.find((b) => b.id === currentBoardId);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const task = tasks.find((t) => t.id === draggableId);
    if (!task) return;

    const newStatus = destination.droppableId as 'todo' | 'inProgress' | 'done';
    const columnTasks = tasks
      .filter((t) => t.status === newStatus && t.id !== draggableId)
      .sort((a, b) => a.order - b.order);

    if (newStatus !== task.status) {
      columnTasks.splice(destination.index, 0, { ...task, status: newStatus });
      const updates = columnTasks.map((t, i) => ({ id: t.id, order: i }));
      updateTask(draggableId, { status: newStatus, order: destination.index });
      updates.forEach((u) => {
        if (u.id !== draggableId) updateTask(u.id, { order: u.order });
      });
    } else {
      const sameColumn = [...columnTasks];
      const [moved] = sameColumn.splice(source.index, 1);
      sameColumn.splice(destination.index, 0, moved);
      sameColumn.forEach((t, i) => updateTask(t.id, { order: i }));
    }
  };

  const grouped = {
    todo: tasks.filter((t) => t.status === 'todo').sort((a, b) => a.order - b.order),
    inProgress: tasks.filter((t) => t.status === 'inProgress').sort((a, b) => a.order - b.order),
    done: tasks.filter((t) => t.status === 'done').sort((a, b) => a.order - b.order),
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <BoardList />
      <main className="flex-1 flex flex-col overflow-hidden opacity-transition">
        {loading && !currentBoard ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">加载中...</div>
        ) : currentBoard ? (
          <>
            <header className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-800">{currentBoard.name}</h1>
                <p className="text-sm text-slate-500 mt-0.5">{currentBoard.description}</p>
              </div>
              <Link
                to="/timeline"
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Clock size={16} />
                时光机
              </Link>
            </header>
            <div className="flex-1 overflow-auto p-4 md:p-6">
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  {(['todo', 'inProgress', 'done'] as const).map((status) => (
                    <BoardColumn
                      key={status}
                      status={status}
                      tasks={grouped[status]}
                      boardId={currentBoard.id}
                    />
                  ))}
                </div>
              </DragDropContext>
              <LoadChart boardId={currentBoard.id} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            请选择或创建一个看板
          </div>
        )}
      </main>
    </div>
  );
}
