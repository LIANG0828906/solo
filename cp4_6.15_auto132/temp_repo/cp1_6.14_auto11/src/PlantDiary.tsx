import { useState, useMemo, useCallback } from 'react';
import CalendarView from './components/CalendarView';
import VirtualPlantList from './components/VirtualPlantList';
import TaskItem from './components/TaskItem';
import PlantForm from './components/PlantForm';
import PlantDetail from './components/PlantDetail';
import { usePlants, useWeekTasks, useCompletionRates } from './hooks';
import { plantApi, taskApi } from './api';
import type { Plant, Task, PlantStatus, CareRules } from './types';

export default function PlantDiary() {
  const { plants, loading: plantsLoading, refresh: refreshPlants, setPlants } =
    usePlants();
  const { tasks, loading: _tasksLoading, refresh: refreshTasks, setTasks } =
    useWeekTasks();
  const { rates, loading: _ratesLoading } = useCompletionRates();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);

  const todayTasks = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    return tasks.filter(
      (t) => t.dueDate >= start.getTime() && t.dueDate <= end.getTime()
    );
  }, [tasks]);

  const stats = useMemo(() => {
    const last30Days = rates.slice(-30);
    const totalTasks = last30Days.reduce((sum, r) => sum + r.total, 0);
    const totalCompleted = last30Days.reduce((sum, r) => sum + r.completed, 0);
    const rate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
    return {
      totalPlants: plants.length,
      todayTasks: todayTasks.length,
      completionRate: rate,
    };
  }, [plants, todayTasks, rates]);

  const handleAddPlant = useCallback(
    async (
      data: {
        name: string;
        species: string;
        plantDate: number;
        status: PlantStatus;
        careRules: CareRules;
      },
      photoBlob?: Blob
    ) => {
      try {
        const newPlant = await plantApi.create(data);

        if (photoBlob) {
          try {
            const photoData = await plantApi.uploadPhoto(newPlant.id, photoBlob);
            newPlant.photo = {
              id: photoData.id,
              url: photoData.url,
              timestamp: photoData.timestamp,
            };
          } catch (photoErr) {
            console.error('照片上传失败', photoErr);
          }
        }

        setPlants((prev) => [...prev, newPlant]);
        setShowAddModal(false);
        refreshTasks();
      } catch (err) {
        console.error('添加植物失败', err);
        alert('添加失败，请稍后重试');
      }
    },
    [setPlants, refreshTasks]
  );

  const handleEditPlant = useCallback(
    async (
      data: {
        name: string;
        species: string;
        plantDate: number;
        status: PlantStatus;
        careRules: CareRules;
      },
      photoBlob?: Blob
    ) => {
      if (!editingPlant) return;
      try {
        let updated = await plantApi.update(editingPlant.id, data);

        if (photoBlob) {
          try {
            const photoData = await plantApi.uploadPhoto(updated.id, photoBlob);
            updated.photo = {
              id: photoData.id,
              url: photoData.url,
              timestamp: photoData.timestamp,
            };
            updated = await plantApi.update(updated.id, { photo: updated.photo });
          } catch (photoErr) {
            console.error('照片上传失败', photoErr);
          }
        }

        setPlants((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setEditingPlant(null);
        setSelectedPlant(updated);
        refreshTasks();
      } catch (err) {
        console.error('更新植物失败', err);
        alert('更新失败，请稍后重试');
      }
    },
    [editingPlant, setPlants, refreshTasks]
  );

  const handleTaskComplete = useCallback(
    async (taskId: string) => {
      try {
        await taskApi.markComplete(taskId);
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, completed: true, completedAt: Date.now() }
              : t
          )
        );
        refreshPlants();
      } catch (err) {
        console.error('标记完成失败', err);
        alert('操作失败');
      }
    },
    [setTasks, refreshPlants]
  );

  const handleTaskPostpone = useCallback(
    async (taskId: string, days: number) => {
      try {
        await taskApi.postpone(taskId, days);
        refreshTasks();
        refreshPlants();
      } catch (err) {
        console.error('延期失败', err);
        alert('操作失败');
      }
    },
    [refreshTasks, refreshPlants]
  );

  const handleTaskClick = useCallback((task: Task) => {
    if (!task.completed) {
      handleTaskComplete(task.id);
    }
  }, [handleTaskComplete]);

  const handlePlantClick = useCallback((plant: Plant) => {
    setSelectedPlant(plant);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedPlant(null);
  }, []);

  const handleEditFromDetail = useCallback(() => {
    if (selectedPlant) {
      setEditingPlant(selectedPlant);
      setSelectedPlant(null);
    }
  }, [selectedPlant]);

  return (
    <div className="app">
      <header className="header">
        <h1>🌿 植物日记</h1>
        <p>记录每一株植物的成长，守护每一片绿叶</p>
      </header>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{stats.totalPlants}</div>
          <div className="stat-label">我的植物</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.todayTasks}</div>
          <div className="stat-label">今日待办</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.completionRate}%</div>
          <div className="stat-label">30天完成率</div>
        </div>
      </div>

      <div className="dashboard">
        <div>
          <CalendarView tasks={tasks} onTaskClick={handleTaskClick} />

          <div className="card" style={{ marginTop: 24 }}>
            <h2 className="section-title">✅ 今日待办</h2>
            {todayTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🎉</div>
                今天没有待办任务，享受闲暇时光吧！
              </div>
            ) : (
              todayTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isToday={true}
                  onComplete={handleTaskComplete}
                  onPostpone={handleTaskPostpone}
                />
              ))
            )}
          </div>
        </div>

        <div className="card" style={{ height: 700, display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <h2 className="section-title" style={{ margin: 0 }}>
              🌱 我的植物
            </h2>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              + 添加
            </button>
          </div>
          {plantsLoading ? (
            <div className="empty-state">
              <div className="empty-state-icon">⏳</div>
              加载中...
            </div>
          ) : plants.length === 0 ? (
            <div className="empty-state" style={{ flex: 1 }}>
              <div className="empty-state-icon">🪴</div>
              还没有添加植物
              <div style={{ marginTop: 12 }}>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowAddModal(true)}
                >
                  添加第一株植物
                </button>
              </div>
            </div>
          ) : (
            <VirtualPlantList plants={plants} onPlantClick={handlePlantClick} />
          )}
        </div>
      </div>

      <button className="add-btn" onClick={() => setShowAddModal(true)}>
        +
      </button>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <PlantForm
              onSubmit={handleAddPlant}
              onCancel={() => setShowAddModal(false)}
            />
          </div>
        </div>
      )}

      {editingPlant && (
        <div className="modal-overlay" onClick={() => setEditingPlant(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <PlantForm
              plant={editingPlant}
              onSubmit={handleEditPlant}
              onCancel={() => setEditingPlant(null)}
            />
          </div>
        </div>
      )}

      {selectedPlant && (
        <PlantDetail
          plant={selectedPlant}
          onClose={handleCloseDetail}
          onUpdated={refreshPlants}
          onEdit={handleEditFromDetail}
        />
      )}
    </div>
  );
}
