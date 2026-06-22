import { useState, useEffect, useCallback } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { SprintHeader } from './components/SprintHeader';
import { Board } from './components/Board';
import { StandupLog } from './components/StandupLog';
import { ReportPage } from './components/ReportPage';
import { StandupModal } from './components/StandupModal';
import { TaskEditModal } from './components/TaskEditModal';
import { SprintModal } from './components/SprintModal';
import { getSprintData, setSprintData, getStandupLog, appendStandupEntry } from './utils/storage';
import type {
  TabType,
  Sprint,
  Task,
  TaskColumn,
  StandupEntry,
  SprintData,
} from './types';
import { v4 as uuidv4 } from 'uuid';

function createDefaultSprint(): Sprint {
  const today = new Date();
  const endDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

  const sampleTasks: Task[] = [
    {
      id: uuidv4(),
      title: '设计用户登录页面',
      description: '完成登录页面的UI设计和原型',
      estimateHours: 4,
      priority: 'high',
      assignee: '张三',
      column: 'done',
      order: 0,
      actualHours: 4,
      createdAt: today.toISOString(),
    },
    {
      id: uuidv4(),
      title: '实现用户认证API',
      description: '后端登录接口和JWT token生成',
      estimateHours: 6,
      priority: 'high',
      assignee: '李四',
      column: 'testing',
      order: 1,
      actualHours: 5,
      createdAt: today.toISOString(),
    },
    {
      id: uuidv4(),
      title: '编写单元测试',
      description: '为核心模块添加单元测试覆盖',
      estimateHours: 3,
      priority: 'medium',
      assignee: '王五',
      column: 'in-progress',
      order: 0,
      actualHours: 0,
      createdAt: today.toISOString(),
    },
    {
      id: uuidv4(),
      title: '优化首页加载性能',
      description: '图片懒加载、代码分割、缓存策略',
      estimateHours: 5,
      priority: 'medium',
      assignee: '张三',
      column: 'backlog',
      order: 0,
      actualHours: 0,
      createdAt: today.toISOString(),
    },
    {
      id: uuidv4(),
      title: '修复移动端布局问题',
      description: '修复小屏幕下的布局错乱',
      estimateHours: 2,
      priority: 'low',
      assignee: '赵六',
      column: 'backlog',
      order: 1,
      actualHours: 0,
      createdAt: today.toISOString(),
    },
    {
      id: uuidv4(),
      title: '文档更新',
      description: '更新API文档和用户手册',
      estimateHours: 2,
      priority: 'low',
      assignee: '王五',
      column: 'backlog',
      order: 2,
      actualHours: 0,
      createdAt: today.toISOString(),
    },
  ];

  return {
    id: uuidv4(),
    name: 'Sprint 1',
    startDate: today.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    tasks: sampleTasks,
    dailySnapshots: [],
  };
}

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('board');
  const [sprintData, setSprintDataState] = useState<SprintData>({
    sprints: [],
    activeSprintId: null,
  });
  const [standupEntries, setStandupEntries] = useState<StandupEntry[]>([]);
  const [isStandupModalOpen, setIsStandupModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingStandup, setEditingStandup] = useState<StandupEntry | null>(null);
  const [defaultTaskColumn, setDefaultTaskColumn] = useState<TaskColumn>('backlog');

  useEffect(() => {
    const savedSprintData = getSprintData();
    const savedStandupLog = getStandupLog();

    if (savedSprintData.sprints.length === 0) {
      const defaultSprint = createDefaultSprint();
      const newSprintData: SprintData = {
        sprints: [defaultSprint],
        activeSprintId: defaultSprint.id,
      };
      setSprintDataState(newSprintData);
      setSprintData(newSprintData);
    } else {
      setSprintDataState(savedSprintData);
    }

    setStandupEntries(savedStandupLog);
  }, []);

  const activeSprint = sprintData.sprints.find((s) => s.id === sprintData.activeSprintId) || null;

  const updateSprintData = useCallback((newData: SprintData) => {
    setSprintDataState(newData);
    setSprintData(newData);
  }, []);

  const updateActiveSprint = useCallback(
    (sprint: Sprint) => {
      const newSprintData: SprintData = {
        ...sprintData,
        sprints: sprintData.sprints.map((s) =>
          s.id === sprint.id ? sprint : s
        ),
      };
      updateSprintData(newSprintData);
    },
    [sprintData, updateSprintData]
  );

  const handleTaskMove = useCallback(
    (taskId: string, newColumn: TaskColumn, newIndex: number) => {
      if (!activeSprint) return;

      const updatedTasks = activeSprint.tasks.map((task) => {
        if (task.id === taskId) {
          const wasDone = task.column === 'done';
          const isNowDone = newColumn === 'done';
          let actualHours = task.actualHours;

          if (!wasDone && isNowDone) {
            actualHours = task.actualHours > 0 ? task.actualHours : 1;
          }

          return {
            ...task,
            column: newColumn,
            order: newIndex,
            actualHours,
          };
        }
        return task;
      });

      const columnTasks = updatedTasks
        .filter((t) => t.column === newColumn)
        .filter((t) => t.id !== taskId);

      const task = updatedTasks.find((t) => t.id === taskId);
      if (task) {
        const finalTasks = [...columnTasks];
        finalTasks.splice(newIndex, 0, task);
        finalTasks.forEach((t, i) => {
          const idx = updatedTasks.findIndex((ut) => ut.id === t.id);
          if (idx !== -1) {
            updatedTasks[idx] = { ...updatedTasks[idx], order: i };
          }
        });
      }

      updateActiveSprint({
        ...activeSprint,
        tasks: updatedTasks,
      });
    },
    [activeSprint, updateActiveSprint]
  );

  const handleTaskReorder = useCallback(
    (column: TaskColumn, oldIndex: number, newIndex: number) => {
      if (!activeSprint) return;

      let columnTasks = activeSprint.tasks
        .filter((t) => t.column === column)
        .sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          const pa = priorityOrder[a.priority];
          const pb = priorityOrder[b.priority];
          if (pa !== pb) return pa - pb;
          return a.order - b.order;
        });

      const [movedTask] = columnTasks.splice(oldIndex, 1);
      columnTasks.splice(newIndex, 0, movedTask);

      const priorityGroups: Record<string, Task[]> = {
        high: [],
        medium: [],
        low: [],
      };
      columnTasks.forEach((t) => priorityGroups[t.priority].push(t));

      let order = 0;
      const updatedTaskMap = new Map<string, number>();
      ['high', 'medium', 'low'].forEach((p) => {
        priorityGroups[p].forEach((t) => {
          updatedTaskMap.set(t.id, order++);
        });
      });

      const updatedTasks = activeSprint.tasks.map((t) => {
        if (updatedTaskMap.has(t.id)) {
          return { ...t, order: updatedTaskMap.get(t.id)! };
        }
        return t;
      });

      updateActiveSprint({
        ...activeSprint,
        tasks: updatedTasks,
      });
    },
    [activeSprint, updateActiveSprint]
  );

  const handleTaskSave = useCallback(
    (task: Task) => {
      if (!activeSprint) return;

      const exists = activeSprint.tasks.some((t) => t.id === task.id);
      let updatedTasks: Task[];

      if (exists) {
        updatedTasks = activeSprint.tasks.map((t) =>
          t.id === task.id ? task : t
        );
      } else {
        const maxOrder = Math.max(
          0,
          ...activeSprint.tasks
            .filter((t) => t.column === task.column)
            .map((t) => t.order)
        );
        updatedTasks = [
          ...activeSprint.tasks,
          { ...task, order: maxOrder + 1 },
        ];
      }

      updateActiveSprint({
        ...activeSprint,
        tasks: updatedTasks,
      });
    },
    [activeSprint, updateActiveSprint]
  );

  const handleTaskDelete = useCallback(
    (taskId: string) => {
      if (!activeSprint) return;
      const updatedTasks = activeSprint.tasks.filter((t) => t.id !== taskId);
      updateActiveSprint({
        ...activeSprint,
        tasks: updatedTasks,
      });
    },
    [activeSprint, updateActiveSprint]
  );

  const handleAddTask = useCallback(
    (column: TaskColumn) => {
      setEditingTask(null);
      setDefaultTaskColumn(column);
      setIsTaskModalOpen(true);
    },
    []
  );

  const handleEditTask = useCallback(
    (task: Task) => {
      setEditingTask(task);
      setIsTaskModalOpen(true);
    },
    []
  );

  const handleStandupSubmit = useCallback((entry: StandupEntry) => {
    appendStandupEntry(entry);
    setStandupEntries(getStandupLog());
  }, []);

  const handleStandupEdit = useCallback((entry: StandupEntry) => {
    setEditingStandup(entry);
    setIsStandupModalOpen(true);
  }, []);

  const handleOpenStandup = useCallback(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayEntry = standupEntries.find((e) => e.date === todayStr);
    setEditingStandup(todayEntry || null);
    setIsStandupModalOpen(true);
  }, [standupEntries]);

  const handleSprintSave = useCallback(
    (sprint: Sprint) => {
      const exists = sprintData.sprints.some((s) => s.id === sprint.id);
      let newSprintData: SprintData;

      if (exists) {
        newSprintData = {
          ...sprintData,
          sprints: sprintData.sprints.map((s) =>
            s.id === sprint.id ? sprint : s
          ),
        };
      } else {
        newSprintData = {
          sprints: [...sprintData.sprints, sprint],
          activeSprintId: sprint.id,
        };
      }

      updateSprintData(newSprintData);
    },
    [sprintData, updateSprintData]
  );

  const handleSprintSelect = useCallback(
    (sprintId: string) => {
      const newSprintData = {
        ...sprintData,
        activeSprintId: sprintId,
      };
      updateSprintData(newSprintData);
    },
    [sprintData, updateSprintData]
  );

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="main-content">
        {activeSprint && (
          <div className="sprint-header-wrapper">
            <SprintHeader sprint={activeSprint} />
            <button
              className="manage-sprint-btn"
              onClick={() => setIsSprintModalOpen(true)}
            >
              管理冲刺
            </button>
          </div>
        )}

        {activeTab === 'board' && activeSprint && (
          <Board
            sprint={activeSprint}
            onTaskMove={handleTaskMove}
            onTaskReorder={handleTaskReorder}
            onTaskEdit={handleEditTask}
            onAddTask={handleAddTask}
          />
        )}

        {activeTab === 'standup' && (
          <StandupLog entries={standupEntries} onEdit={handleStandupEdit} />
        )}

        {activeTab === 'report' && activeSprint && (
          <ReportPage sprint={activeSprint} />
        )}

        {!activeSprint && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
            }}
          >
            <p style={{ color: '#64748B', fontSize: '14px' }}>暂无冲刺，创建一个开始吧</p>
            <button
              className="btn btn-primary"
              onClick={() => setIsSprintModalOpen(true)}
            >
              创建冲刺
            </button>
          </div>
        )}
      </main>

      <button className="standup-fab" onClick={handleOpenStandup} title="今日站会">
        <MessageSquarePlus size={24} />
      </button>

      <StandupModal
        isOpen={isStandupModalOpen}
        onClose={() => {
          setIsStandupModalOpen(false);
          setEditingStandup(null);
        }}
        onSubmit={handleStandupSubmit}
        initialEntry={editingStandup}
      />

      <TaskEditModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleTaskSave}
        onDelete={handleTaskDelete}
        initialTask={editingTask}
        defaultColumn={defaultTaskColumn}
      />

      <SprintModal
        isOpen={isSprintModalOpen}
        onClose={() => setIsSprintModalOpen(false)}
        onSave={handleSprintSave}
      />
    </div>
  );
}

export default App;
