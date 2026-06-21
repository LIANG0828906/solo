import { useState, useEffect, useCallback } from 'react';
import TaskTimer from '@/components/TaskTimer';
import TaskList from '@/components/TaskList';
import { getTasks, deleteTask, updateTask } from '@/api/taskApi';
import type { Task } from '../../shared/types';

export default function TimerPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    startTime: '',
    endTime: '',
  });

  const loadTasks = useCallback(async () => {
    try {
      const data = await getTasks(undefined, 10, 0);
      setTasks(data);
    } catch (e) {
      console.error('加载任务失败:', e);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleTaskComplete = () => {
    loadTasks();
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setEditForm({
      name: task.name,
      startTime: task.startTime ? new Date(task.startTime).toISOString().slice(0, 16) : '',
      endTime: task.endTime ? new Date(task.endTime).toISOString().slice(0, 16) : '',
    });
    setShowEditModal(true);
  };

  const handleDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (e) {
      console.error('删除任务失败:', e);
      alert('删除任务失败');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTask) return;
    try {
      const updated = await updateTask(editingTask.id, {
        name: editForm.name,
        startTime: new Date(editForm.startTime).toISOString(),
        endTime: new Date(editForm.endTime).toISOString(),
      });
      setTasks(tasks.map(t => t.id === updated.id ? updated : t));
      setShowEditModal(false);
      setEditingTask(null);
    } catch (e) {
      console.error('更新任务失败:', e);
      alert('更新任务失败');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">计时器</h1>
        <p className="text-gray-500 mt-1">启动计时，记录你的工作时间</p>
      </div>

      <TaskTimer onTaskComplete={handleTaskComplete} />
      
      <TaskList 
        tasks={tasks} 
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-fade-in">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">编辑任务</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  任务名称
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl 
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 
                           focus:border-primary-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  开始时间
                </label>
                <input
                  type="datetime-local"
                  value={editForm.startTime}
                  onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl 
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 
                           focus:border-primary-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  结束时间
                </label>
                <input
                  type="datetime-local"
                  value={editForm.endTime}
                  onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl 
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20 
                           focus:border-primary-500 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTask(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 
                         text-gray-600 font-medium transition-all
                         hover:bg-gray-50 active:scale-[0.95]"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                style={{ backgroundColor: '#6366F1' }}
                className="flex-1 py-2.5 px-4 rounded-xl text-white font-medium
                         transition-all hover:opacity-90 active:scale-[0.95]"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
