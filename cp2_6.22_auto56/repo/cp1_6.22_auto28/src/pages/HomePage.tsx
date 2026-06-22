import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Task } from '@/lib/api';
import { fetchTasks, createTask, completeTask, deleteTask } from '@/lib/api';
import TaskForm from '@/components/TaskForm';
import TaskList from '@/components/TaskList';
import MapView from '@/components/MapView';

type FilterType = 'all' | 'active' | 'completed';

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [filterKey, setFilterKey] = useState(0);

  useEffect(() => {
    fetchTasks()
      .then(setTasks)
      .catch(console.error)
      .finally(() => setLoading(false));

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPickedLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {}
      );
    }
  }, []);

  const handleCreateTask = useCallback(
    async (data: { description: string; type: Task['type']; lat: number; lng: number }) => {
      try {
        const newTask = await createTask(data);
        setTasks((prev) => [newTask, ...prev]);
        setPickedLocation(null);
        setIsPickingLocation(false);
      } catch (err) {
        console.error(err);
      }
    },
    []
  );

  const handleCompleteTask = useCallback(async (id: string) => {
    try {
      const updated = await completeTask(id);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleDeleteTask = useCallback(async (id: string) => {
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleLocationPick = useCallback((lat: number, lng: number) => {
    setPickedLocation({ lat, lng });
  }, []);

  const handlePickLocationClick = useCallback(() => {
    setIsPickingLocation((prev) => !prev);
  }, []);

  const handleFilterChange = useCallback((newFilter: FilterType) => {
    setFilter(newFilter);
    setFilterKey((k) => k + 1);
  }, []);

  const filteredTasks = useMemo(() => {
    switch (filter) {
      case 'active':
        return tasks.filter((t) => !t.completed);
      case 'completed':
        return tasks.filter((t) => t.completed);
      default:
        return tasks;
    }
  }, [tasks, filter]);

  const activeCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  const filterTabs: Array<{ key: FilterType; label: string; count: number }> = [
    { key: 'all', label: '全部', count: tasks.length },
    { key: 'active', label: '未完成', count: activeCount },
    { key: 'completed', label: '已完成', count: completedCount },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        maxWidth: '1400px',
        margin: '0 auto',
      }}
    >
      <header
        style={{
          textAlign: 'center',
          marginBottom: '20px',
          padding: '16px 0',
        }}
      >
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: 'white',
            textShadow: '0 2px 8px rgba(0,0,0,0.2)',
            letterSpacing: '1px',
          }}
        >
          🎒 口袋清单
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.75)',
            marginTop: '4px',
          }}
        >
          记录日常小任务，在地图上标记完成位置
        </p>
      </header>

      <div
        style={{
          display: 'flex',
          gap: '16px',
          flex: 1,
          minHeight: 0,
          flexDirection: 'row',
        }}
        className="main-layout"
      >
        <div
          className="left-panel"
          style={{
            width: '40%',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            minHeight: 0,
          }}
        >
          <TaskForm
            onSubmit={handleCreateTask}
            onPickLocation={handlePickLocationClick}
            pickedLocation={pickedLocation}
            isPickingLocation={isPickingLocation}
          />

          <div
            style={{
              display: 'flex',
              gap: '4px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '8px',
              padding: '4px',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleFilterChange(tab.key)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: filter === tab.key ? 'rgba(255,255,255,0.3)' : 'transparent',
                  color: filter === tab.key ? 'white' : 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: filter === tab.key ? 600 : 400,
                  transition: 'all 0.2s',
                  transform: 'scale(1)',
                }}
                onMouseDown={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
                }}
                onMouseUp={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                }}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <div
            key={filterKey}
            className="task-list-fade"
            style={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.7)' }}>
                加载中...
              </div>
            ) : (
              <TaskList
                tasks={filteredTasks}
                onComplete={handleCompleteTask}
                onDelete={handleDeleteTask}
              />
            )}
          </div>
        </div>

        <div
          className="right-panel"
          style={{
            width: '60%',
            minHeight: '500px',
            position: 'relative',
          }}
        >
          <MapView
            tasks={tasks}
            pickedLocation={pickedLocation}
            isPickingLocation={isPickingLocation}
            onLocationPick={handleLocationPick}
          />
          {isPickingLocation && (
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(230,126,34,0.9)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 500,
                zIndex: 1000,
                backdropFilter: 'blur(8px)',
                boxShadow: '0 2px 12px rgba(230,126,34,0.4)',
                animation: 'popIn 0.3s ease-out',
                pointerEvents: 'none',
              }}
            >
              点击地图或拖动标记选择位置
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .main-layout {
            flex-direction: column !important;
          }
          .left-panel, .right-panel {
            width: 100% !important;
          }
          .right-panel {
            min-height: 350px !important;
          }
          .left-panel {
            max-height: 50vh;
          }
        }
      `}</style>
    </div>
  );
}
