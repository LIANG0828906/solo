import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, X, Calendar, CheckSquare } from "lucide-react";
import { useWorkshopStore, getParticipantId, type TaskItem, type TaskStatus, type SubTask } from "@/store/workshop";
import TaskCard from "@/components/TaskCard";

const columnConfig: Record<TaskStatus, { title: string; color: string; headerBg: string }> = {
  todo: { title: "待办", color: "text-gray-700", headerBg: "bg-gray-100" },
  inProgress: { title: "进行中", color: "text-primary", headerBg: "bg-primary/10" },
  done: { title: "已完成", color: "text-green-600", headerBg: "bg-green-50" },
};

export default function TaskBoardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentWorkshop, tasks, fetchWorkshopDetail, fetchTasks, generateTasks, updateTask, addSubtask } =
    useWorkshopStore();
  const [topN, setTopN] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [detailTask, setDetailTask] = useState<TaskItem | null>(null);
  const [newSubtask, setNewSubtask] = useState("");
  const [dueDate, setDueDate] = useState("");
  const dragItem = useRef<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchWorkshopDetail(id);
      fetchTasks(id);
    }
  }, [id, fetchWorkshopDetail, fetchTasks]);

  const handleGenerate = async () => {
    if (!id) return;
    setGenerating(true);
    try {
      await generateTasks(id, topN);
    } catch (err) {
      alert(err instanceof Error ? err.message : "生成任务失败");
    } finally {
      setGenerating(false);
    }
  };

  const handleDragStart = (taskId: string) => {
    dragItem.current = taskId;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (status: TaskStatus) => {
    if (!dragItem.current) return;
    try {
      await updateTask(dragItem.current, { status });
    } catch (err) {
      alert(err instanceof Error ? err.message : "更新失败");
    }
    dragItem.current = null;
  };

  const handleAddSubtask = async () => {
    if (!detailTask || !newSubtask.trim()) return;
    try {
      await addSubtask(detailTask.id, newSubtask.trim());
      const updated = useWorkshopStore.getState().tasks.find((t) => t.id === detailTask.id);
      if (updated) setDetailTask(updated);
      setNewSubtask("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "添加子任务失败");
    }
  };

  const handleToggleSubtask = async (subtasks: SubTask[], subtaskId: string) => {
    if (!detailTask) return;
    const updatedSubtasks = subtasks.map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    try {
      await updateTask(detailTask.id, { subtasks: updatedSubtasks });
      const updated = useWorkshopStore.getState().tasks.find((t) => t.id === detailTask.id);
      if (updated) setDetailTask(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : "更新失败");
    }
  };

  const handleDueDateChange = async (date: string) => {
    if (!detailTask) return;
    setDueDate(date);
    try {
      await updateTask(detailTask.id, { dueDate: date });
    } catch (err) {
      alert(err instanceof Error ? err.message : "更新失败");
    }
  };

  const grouped: Record<TaskStatus, TaskItem[]> = {
    todo: tasks.filter((t) => t.status === "todo"),
    inProgress: tasks.filter((t) => t.status === "inProgress"),
    done: tasks.filter((t) => t.status === "done"),
  };

  if (!currentWorkshop) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">加载中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gradient-to-r from-primary to-primary-dark text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(`/workshop/${id}`)} className="hover:text-white/80">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold">任务看板 - {currentWorkshop.name}</h1>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {tasks.length === 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6 text-center">
            <CheckSquare size={48} className="mx-auto mb-3 text-primary opacity-50" />
            <p className="text-gray-500 mb-4">还没有任务，一键从投票结果生成任务</p>
            <div className="flex items-center justify-center gap-3">
              <label className="text-sm text-gray-600">前</label>
              <input
                type="number"
                min={1}
                max={20}
                value={topN}
                onChange={(e) => setTopN(Math.max(1, Math.min(20, Number(e.target.value))))}
                className="w-16 border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <label className="text-sm text-gray-600">个创意</label>
              <button onClick={handleGenerate} disabled={generating} className="btn-accent disabled:opacity-50">
                <Plus size={16} className="inline mr-1" />
                {generating ? "生成中..." : "生成任务"}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(columnConfig) as TaskStatus[]).map((status) => {
            const config = columnConfig[status];
            return (
              <div
                key={status}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(status)}
                className="min-h-[300px]"
              >
                <div className={`${config.headerBg} rounded-t-xl px-4 py-3`}>
                  <h3 className={`font-semibold ${config.color}`}>{config.title}</h3>
                  <span className="text-xs text-gray-400">{grouped[status].length} 个任务</span>
                </div>
                <div className="bg-gray-50/50 rounded-b-xl p-3 space-y-3 border border-t-0 border-gray-100 min-h-[200px]">
                  {grouped[status].map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => {
                        setDetailTask(task);
                        setDueDate(task.dueDate || "");
                      }}
                      onDragStart={() => handleDragStart(task.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {detailTask && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setDetailTask(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">{detailTask.title}</h2>
              <button onClick={() => setDetailTask(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600">{detailTask.description}</p>

              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-500">负责人:</span>
                <span className="font-medium">{detailTask.assignee}</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar size={14} className="inline mr-1" />
                  截止日期
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => handleDueDateChange(e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">子任务</label>
                <div className="space-y-2">
                  {detailTask.subtasks.map((st) => (
                    <label key={st.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={st.completed}
                        onChange={() => handleToggleSubtask(detailTask.subtasks, st.id)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className={st.completed ? "line-through text-gray-400" : "text-gray-700"}>{st.title}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="添加子任务"
                    onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                  />
                  <button onClick={handleAddSubtask} className="btn-primary text-sm px-3">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
