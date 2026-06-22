import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import {
  GardenGrid,
  DetailModal,
  AddPlantModal,
  type Plant,
} from './plantCard';
import { TaskTimeline } from './taskTimeline';
import {
  type CareTask,
  type GrowthRecord,
  type CalendarDay,
  generateCalendarGrid,
  checkDueNotifications,
  getTaskTypeLabel,
} from './calendarEngine';
import './index.css';

type ViewMode = 'garden' | 'tasks' | 'records';

const API = '/api';

function App() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [view, setView] = useState<ViewMode>('garden');
  const [allRecords, setAllRecords] = useState<GrowthRecord[]>([]);
  const [showAddPlant, setShowAddPlant] = useState(false);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);
  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set());

  const fetchPlants = useCallback(async () => {
    try {
      const res = await fetch(`${API}/plants`);
      const data = await res.json();
      setPlants(data);
    } catch (e) {
      console.error('Failed to fetch plants:', e);
    }
  }, []);

  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch(`${API}/records`);
      const data = await res.json();
      setAllRecords(data);
    } catch (e) {
      console.error('Failed to fetch records:', e);
    }
  }, []);

  const fetchPlantDetail = useCallback(async (plantId: string) => {
    try {
      const res = await fetch(`${API}/plants/${plantId}`);
      const data = await res.json();
      setSelectedPlant(data);
    } catch (e) {
      console.error('Failed to fetch plant detail:', e);
    }
  }, []);

  useEffect(() => {
    fetchPlants();
    fetchRecords();
    requestNotificationPermission();
  }, [fetchPlants, fetchRecords]);

  useEffect(() => {
    const interval = setInterval(() => {
      checkAndNotify();
    }, 60000);
    checkAndNotify();
    return () => clearInterval(interval);
  }, [plants, notifiedIds]);

  async function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  async function checkAndNotify() {
    try {
      const res = await fetch(`${API}/notifications`);
      const dueTasks: Array<CareTask & { plantName?: string }> = await res.json();
      dueTasks.forEach(task => {
        if (!notifiedIds.has(task.id) && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('花园养护提醒 🌿', {
            body: `${task.plantName || '植物'}需要${getTaskTypeLabel(task.type)}了！`,
            icon: '🌿',
          });
          setNotifiedIds(prev => new Set(prev).add(task.id));
        }
      });
    } catch (e) {
      console.error('Notification check failed:', e);
    }
  }

  async function handleCompleteTask(taskId: string) {
    try {
      await fetch(`${API}/tasks/${taskId}/complete`, { method: 'POST' });
      await fetchPlants();
      if (selectedPlant) {
        await fetchPlantDetail(selectedPlant.id);
      }
    } catch (e) {
      console.error('Failed to complete task:', e);
    }
  }

  async function handlePostponeTask(taskId: string) {
    try {
      await fetch(`${API}/tasks/${taskId}/postpone`, { method: 'POST' });
      await fetchPlants();
      if (selectedPlant) {
        await fetchPlantDetail(selectedPlant.id);
      }
    } catch (e) {
      console.error('Failed to postpone task:', e);
    }
  }

  async function handleAddPlant(data: {
    name: string;
    variety: string;
    photoColor: string;
    careSchedules: Array<{ type: 'water' | 'fertilize' | 'prune'; intervalDays: number }>;
  }) {
    try {
      await fetch(`${API}/plants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await fetchPlants();
    } catch (e) {
      console.error('Failed to add plant:', e);
    }
  }

  async function handleDeletePlant(plantId: string) {
    try {
      await fetch(`${API}/plants/${plantId}`, { method: 'DELETE' });
      await fetchPlants();
      await fetchRecords();
    } catch (e) {
      console.error('Failed to delete plant:', e);
    }
  }

  async function handleAddRecord(plantId: string, notes: string) {
    try {
      await fetch(`${API}/plants/${plantId}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      if (selectedPlant) {
        await fetchPlantDetail(selectedPlant.id);
      }
      await fetchRecords();
    } catch (e) {
      console.error('Failed to add record:', e);
    }
  }

  function handleSelectPlant(plant: Plant) {
    setSelectedPlant(plant);
    fetchPlantDetail(plant.id);
  }

  const allTasks: Array<CareTask & { plantName?: string }> = plants.flatMap(plant =>
    plant.tasks.map(t => ({
      ...t,
      plantName: plant.name,
    }))
  );

  const calendarGrid: CalendarDay[] = generateCalendarGrid(calendarYear, calendarMonth, allRecords);

  function prevMonth() {
    if (calendarMonth === 1) {
      setCalendarMonth(12);
      setCalendarYear(y => y - 1);
    } else {
      setCalendarMonth(m => m - 1);
    }
  }

  function nextMonth() {
    if (calendarMonth === 12) {
      setCalendarMonth(1);
      setCalendarYear(y => y + 1);
    } else {
      setCalendarMonth(m => m + 1);
    }
  }

  const pendingCount = allTasks.filter(t => !t.completed).length;

  return (
    <div style={{ minHeight: '100vh', background: '#EFEBE9' }}>
      <header
        style={{
          background: 'white',
          borderBottom: '1px solid #E0E0E0',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>🌿</span>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#2E7D32' }}>花园追踪器</h1>
            <p style={{ fontSize: '11px', color: '#999' }}>植物养护提醒与生长记录</p>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: '4px', background: '#F5F5F5', borderRadius: '12px', padding: '3px' }}>
          {([
            { key: 'garden' as ViewMode, label: '🌸 花园', count: plants.length },
            { key: 'tasks' as ViewMode, label: '📋 任务', count: pendingCount },
            { key: 'records' as ViewMode, label: '📅 记录', count: allRecords.length },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              style={{
                border: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: view === tab.key ? 600 : 400,
                background: view === tab.key ? '#66BB6A' : 'transparent',
                color: view === tab.key ? 'white' : '#666',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {tab.label}
              <span
                style={{
                  fontSize: '11px',
                  background: view === tab.key ? 'rgba(255,255,255,0.3)' : '#E0E0E0',
                  borderRadius: '8px',
                  padding: '1px 6px',
                  color: view === tab.key ? 'white' : '#888',
                }}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </nav>

        <button
          className="btn-primary"
          onClick={() => setShowAddPlant(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <span>＋</span> 添加植物
        </button>
      </header>

      <main>
        {view === 'garden' && (
          <div>
            {plants.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '80px 20px',
                  color: '#999',
                }}
              >
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🌱</div>
                <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#666', marginBottom: '8px' }}>
                  你的花园还是空的
                </h2>
                <p style={{ fontSize: '14px', marginBottom: '20px' }}>
                  点击右上角「添加植物」开始创建你的植物库吧
                </p>
                <button className="btn-primary" onClick={() => setShowAddPlant(true)}>
                  添加第一棵植物
                </button>
              </div>
            ) : (
              <GardenGrid plants={plants} onSelect={handleSelectPlant} />
            )}
          </div>
        )}

        {view === 'tasks' && (
          <TaskTimeline
            tasks={allTasks}
            onComplete={handleCompleteTask}
            onPostpone={handlePostponeTask}
          />
        )}

        {view === 'records' && (
          <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px' }}>
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <button
                  className="btn-secondary"
                  onClick={prevMonth}
                  style={{ padding: '6px 12px' }}
                >
                  ◀
                </button>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#333' }}>
                  {calendarYear}年{calendarMonth}月
                </h3>
                <button
                  className="btn-secondary"
                  onClick={nextMonth}
                  style={{ padding: '6px 12px' }}
                >
                  ▶
                </button>
              </div>

              <div className="calendar-grid">
                {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                  <div
                    key={d}
                    style={{
                      textAlign: 'center',
                      fontSize: '12px',
                      color: '#999',
                      fontWeight: 600,
                      padding: '8px 0',
                    }}
                  >
                    {d}
                  </div>
                ))}
                {calendarGrid.map((day, idx) => (
                  <div
                    key={idx}
                    className="calendar-day"
                    style={{
                      background: day.isToday
                        ? '#E8F5E9'
                        : day.isCurrentMonth
                        ? '#FAFAFA'
                        : '#F5F5F5',
                      border: day.isToday ? '2px solid #66BB6A' : '1px solid #EEE',
                      color: day.isCurrentMonth ? '#333' : '#BBB',
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: day.isToday ? 700 : 400 }}>
                      {day.dayOfMonth}
                    </div>
                    {day.records.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {day.records.slice(0, 2).map(r => (
                          <div
                            key={r.id}
                            className="calendar-thumbnail"
                            style={{
                              background: r.photoColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '8px',
                            }}
                          >
                            🌿
                          </div>
                        ))}
                        {day.records.length > 2 && (
                          <span style={{ fontSize: '9px', color: '#999' }}>
                            +{day.records.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {allRecords.length > 0 && (
                <div style={{ marginTop: '20px', borderTop: '1px solid #EEE', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#666', marginBottom: '12px' }}>
                    最近记录
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                    {allRecords
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .slice(0, 10)
                      .map(record => {
                        const plant = plants.find(p => p.id === record.plantId);
                        return (
                          <div
                            key={record.id}
                            style={{
                              display: 'flex',
                              gap: '10px',
                              padding: '8px',
                              borderRadius: '10px',
                              background: '#FAFAFA',
                              border: '1px solid #EEE',
                            }}
                          >
                            <div
                              style={{
                                width: '40px',
                                height: '30px',
                                borderRadius: '6px',
                                background: record.photoColor,
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                              }}
                            >
                              📷
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '11px', color: '#999' }}>
                                {record.date}
                                {plant && ` · ${plant.name}`}
                              </div>
                              <div style={{ fontSize: '12px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {record.notes}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {selectedPlant && (
        <DetailModal
          plant={selectedPlant}
          onClose={() => setSelectedPlant(null)}
          onCompleteTask={handleCompleteTask}
          onPostponeTask={handlePostponeTask}
          onAddRecord={handleAddRecord}
          onDeletePlant={handleDeletePlant}
        />
      )}

      {showAddPlant && (
        <AddPlantModal
          onClose={() => setShowAddPlant(false)}
          onAdd={handleAddPlant}
        />
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
