import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import Board from './components/Board';
import { fetchAllData, createTask, createLane, deleteLane, deleteTask, updateLane } from './api/tasks';
import type { Task, Lane, WSMessage, Note } from './types';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchAllData();
        setTasks(data.tasks);
        setLanes(data.lanes);
      } catch (error) {
        toast.error('加载数据失败');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('WebSocket连接已建立');
    };

    websocket.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        handleWSMessage(message);
      } catch (e) {
        console.error('解析WebSocket消息失败', e);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket错误:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket连接已关闭');
    };

    return () => {
      websocket.close();
    };
  }, []);

  const triggerHighlight = (taskId: string) => {
    setHighlightedTaskId(taskId);
    setTimeout(() => setHighlightedTaskId(null), 1000);
  };

  const handleWSMessage = useCallback((message: WSMessage) => {
    switch (message.type) {
      case 'task_updated': {
        const updatedTask = message.data as Task;
        setTasks((prev) => {
          const exists = prev.some((t) => t.id === updatedTask.id);
          if (exists) {
            return prev.map((t) => (t.id === updatedTask.id ? updatedTask : t));
          }
          return [...prev, updatedTask];
        });
        triggerHighlight(updatedTask.id);
        break;
      }
      case 'task_created': {
        const newTask = message.data as Task;
        setTasks((prev) => [...prev, newTask]);
        triggerHighlight(newTask.id);
        break;
      }
      case 'task_deleted': {
        const deletedTask = message.data as Task;
        setTasks((prev) => prev.filter((t) => t.id !== deletedTask.id));
        break;
      }
      case 'lane_updated': {
        const updatedLane = message.data as Lane;
        setLanes((prev) =>
          prev.map((l) => (l.id === updatedLane.id ? updatedLane : l))
        );
        break;
      }
      case 'lane_created': {
        const newLane = message.data as Lane;
        setLanes((prev) => [...prev, newLane]);
        break;
      }
      case 'lane_deleted': {
        const deletedLane = message.data as Lane;
        setLanes((prev) => prev.filter((l) => l.id !== deletedLane.id));
        setTasks((prev) => prev.filter((t) => t.status !== deletedLane.id));
        break;
      }
      case 'note_added': {
        const note = message.data as Note & { taskId: string };
        setTasks((prev) =>
          prev.map((t) =>
            t.id === (note as any).taskId
              ? {
                  ...t,
                  notes: [note, ...t.notes].sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                  ),
                }
              : t
          )
        );
        triggerHighlight((note as any).taskId);
        break;
      }
    }
  }, []);

  const handleTaskUpdate = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
  }, []);

  const handleCreateTask = async (title: string, status: string) => {
    try {
      await createTask(title, status, 'medium');
      toast.success('任务创建成功');
    } catch (error) {
      toast.error('创建任务失败');
      console.error(error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      toast.success('任务删除成功');
    } catch (error) {
      toast.error('删除任务失败');
      console.error(error);
    }
  };

  const handleCreateLane = async (title: string) => {
    try {
      await createLane(title);
      toast.success('泳道创建成功');
    } catch (error) {
      toast.error('创建泳道失败');
      console.error(error);
    }
  };

  const handleUpdateLane = async (laneId: string, title: string) => {
    try {
      await updateLane(laneId, title);
    } catch (error) {
      toast.error('更新泳道失败');
      console.error(error);
    }
  };

  const handleDeleteLane = async (laneId: string) => {
    try {
      await deleteLane(laneId);
      toast.success('泳道删除成功');
    } catch (error) {
      toast.error('删除泳道失败');
      console.error(error);
    }
  };

  const allTags = Array.from(new Set(tasks.flatMap((t) => t.tags)));

  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (selectedTag) {
      result = result.filter((t) => t.tags.includes(selectedTag));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query)
      );
    }

    return result;
  }, [tasks, selectedTag, searchQuery]);

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingSpinner} />
        <span style={{ marginLeft: 12 }}>加载中...</span>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>团队任务看板</h1>
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="🔍 搜索任务标题或描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={styles.searchClearBtn}
              >
                ×
              </button>
            )}
          </div>
          <div style={styles.tagFilter}>
            <span style={styles.tagLabel}>标签筛选:</span>
            <div style={styles.tagList}>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  style={{
                    ...styles.tagButton,
                    ...(selectedTag === tag ? styles.tagButtonActive : {}),
                    borderColor: selectedTag === tag
                      ? getTagColor(tag)
                      : 'transparent',
                    backgroundColor: selectedTag === tag
                      ? getTagColor(tag)
                      : 'rgba(255,255,255,0.1)',
                  }}
                >
                  {tag}
                </button>
              ))}
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag(null)}
                  style={styles.clearFilter}
                >
                  清除筛选
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <Board
          tasks={filteredTasks}
          allTasks={tasks}
          lanes={lanes}
          onTaskUpdate={handleTaskUpdate}
          onCreateTask={handleCreateTask}
          onDeleteTask={handleDeleteTask}
          onCreateLane={handleCreateLane}
          onUpdateLane={handleUpdateLane}
          onDeleteLane={handleDeleteLane}
          selectedTag={selectedTag}
          highlightedTaskId={highlightedTaskId}
          searchQuery={searchQuery}
        />
      </main>
    </div>
  );
}

function getTagColor(tag: string): string {
  const colors = [
    '#e94560',
    '#0f3460',
    '#533483',
    '#e58e26',
    '#2ecc71',
    '#3498db',
  ];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg-primary)',
  },
  header: {
    background: 'linear-gradient(90deg, var(--accent-start), var(--accent-end))',
    padding: '20px 32px',
    boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
  },
  headerContent: {
    maxWidth: '1800px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#fff',
    letterSpacing: 0.5,
  },
  tagFilter: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  tagLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: 500,
  },
  tagList: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  tagButton: {
    padding: '6px 14px',
    borderRadius: 20,
    border: '2px solid transparent',
    color: '#fff',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all ease-out 0.3s',
  },
  tagButtonActive: {
    transform: 'scale(1.05)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
  },
  clearFilter: {
    padding: '6px 14px',
    borderRadius: 20,
    border: 'none',
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all ease-out 0.3s',
  },
  searchContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    minWidth: 320,
  },
  searchInput: {
    width: '100%',
    padding: '10px 40px 10px 14px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    transition: 'all ease-out 0.3s',
  },
  searchClearBtn: {
    position: 'absolute',
    right: 8,
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#fff',
    fontSize: 18,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all ease-out 0.3s',
  },
  main: {
    flex: 1,
    padding: 24,
    overflow: 'hidden',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    color: '#fff',
    fontSize: 18,
  },
  loadingSpinner: {
    width: 32,
    height: 32,
    border: '3px solid rgba(233, 69, 96, 0.3)',
    borderTopColor: '#e94560',
    borderRadius: '50%',
  },
};

export default App;
