import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { Task, Member, Priority, TaskStatus } from './data';
import KanbanColumn from './components/KanbanColumn';
import TaskDetail from './components/TaskDetail';
import MemberPanel from './components/MemberPanel';

const columns: { id: TaskStatus; title: string }[] = [
  { id: 'todo', title: '待办' },
  { id: 'in-progress', title: '进行中' },
  { id: 'done', title: '已完成' },
];

const priorities: Priority[] = ['high', 'medium', 'low'];
const priorityLabels: Record<Priority, string> = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
};

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterKeyword, setFilterKeyword] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, membersRes] = await Promise.all([
          fetch('/api/tasks'),
          fetch('/api/members'),
        ]);
        const tasksData = await tasksRes.json();
        const membersData = await membersRes.json();
        setTasks(tasksData);
        setMembers(membersData);
      } catch (error) {
        console.error('获取数据失败:', error);
      }
    };
    fetchData();
  }, []);

  const visibleTaskIds = useMemo(() => {
    const visible = new Set<string>();
    tasks.forEach((task) => {
      const matchPriority = filterPriority === 'all' || task.priority === filterPriority;
      const matchAssignee = filterAssignee === 'all' || task.assigneeId === filterAssignee;
      const matchKeyword =
        filterKeyword === '' ||
        task.title.toLowerCase().includes(filterKeyword.toLowerCase()) ||
        task.description.toLowerCase().includes(filterKeyword.toLowerCase());
      if (matchPriority && matchAssignee && matchKeyword) {
        visible.add(task.id);
      }
    });
    return visible;
  }, [tasks, filterPriority, filterAssignee, filterKeyword]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as TaskStatus;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === draggableId
          ? { ...t, status: newStatus, statusChangedAt: Date.now() }
          : t
      )
    );
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleCloseDetail = () => {
    setSelectedTask(null);
  };

  const handleAddComment = async (taskId: string, content: string) => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: '我', content }),
      });
      const newComment = await response.json();
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, comments: [...t.comments, newComment] } : t
        )
      );
      setSelectedTask((prev) =>
        prev && prev.id === taskId
          ? { ...prev, comments: [...prev.comments, newComment] }
          : prev
      );
    } catch (error) {
      console.error('添加评论失败:', error);
    }
  };

  const handleGenerateReport = async (memberId: string): Promise<string> => {
    try {
      const response = await fetch(`/api/members/${memberId}/report`);
      const data = await response.json();
      return data.report;
    } catch (error) {
      console.error('生成报告失败:', error);
      return '生成报告失败';
    }
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((t) => t.status === status);
  };

  const clearFilters = () => {
    setFilterPriority('all');
    setFilterAssignee('all');
    setFilterKeyword('');
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">团队任务协作看板</h1>
        <div className="filter-bar">
          <div className="filter-group">
            <span className="filter-label">优先级：</span>
            <div className="filter-options">
              <button
                className={`filter-btn ${filterPriority === 'all' ? 'active' : ''}`}
                onClick={() => setFilterPriority('all')}
              >
                全部
              </button>
              {priorities.map((p) => (
                <button
                  key={p}
                  className={`filter-btn ${filterPriority === p ? 'active' : ''}`}
                  onClick={() => setFilterPriority(p)}
                >
                  {priorityLabels[p]}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">负责人：</span>
            <select
              className="filter-select"
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
            >
              <option value="all">全部</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <input
              type="text"
              className="filter-input"
              placeholder="搜索任务..."
              value={filterKeyword}
              onChange={(e) => setFilterKeyword(e.target.value)}
            />
          </div>

          {(filterPriority !== 'all' || filterAssignee !== 'all' || filterKeyword) && (
            <button className="clear-btn" onClick={clearFilters}>
              清除筛选
            </button>
          )}
        </div>
      </header>

      <main className="main-content">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="kanban-board">
            {columns.map((col) => (
              <KanbanColumn
                key={col.id}
                columnId={col.id}
                title={col.title}
                tasks={getTasksByStatus(col.id)}
                onTaskClick={handleTaskClick}
                visibleTaskIds={visibleTaskIds}
              />
            ))}
          </div>
        </DragDropContext>

        <MemberPanel
          members={members}
          tasks={tasks}
          isOpen={panelOpen}
          onToggle={() => setPanelOpen(!panelOpen)}
          onGenerateReport={handleGenerateReport}
        />
      </main>

      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={handleCloseDetail}
          onAddComment={handleAddComment}
        />
      )}
    </div>
  );
};

export default App;
