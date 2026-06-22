import React, { useState, useEffect } from 'react';
import {
  type CareTask,
  type GrowthRecord,
  isUrgent,
  formatCountdown,
  getTaskTypeLabel,
  getTaskTypeEmoji,
  renderSimpleMarkdown,
} from './calendarEngine';

export interface Plant {
  id: string;
  name: string;
  variety: string;
  photoColor: string;
  createdAt: string;
  tasks: CareTask[];
  records?: GrowthRecord[];
}

interface PlantCardProps {
  plant: Plant;
  onClick: () => void;
}

function Countdown({ task }: { task: CareTask }) {
  const [countdown, setCountdown] = useState(formatCountdown(task.nextDue));
  const [urgent, setUrgent] = useState(isUrgent(task.nextDue));

  useEffect(() => {
    const update = () => {
      setCountdown(formatCountdown(task.nextDue));
      setUrgent(isUrgent(task.nextDue));
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [task.nextDue]);

  return (
    <div
      className={urgent ? 'countdown-urgent' : ''}
      style={{
        padding: '4px 10px',
        borderRadius: '8px',
        background: urgent ? '#FFCDD2' : '#C8E6C9',
        fontSize: '12px',
        color: urgent ? '#C62828' : '#2E7D32',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      <span>{getTaskTypeEmoji(task.type)}</span>
      <span>{getTaskTypeLabel(task.type)}: {countdown}</span>
    </div>
  );
}

export function PlantCard({ plant, onClick }: PlantCardProps) {
  const pendingTasks = plant.tasks.filter(t => !t.completed);
  return (
    <div className="plant-card" onClick={onClick}>
      <div
        style={{
          width: '100%',
          aspectRatio: '4/3',
          borderRadius: '12px',
          background: plant.photoColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '56px',
          marginBottom: '10px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ fontSize: '56px', lineHeight: 1 }}>🌿</div>
        {pendingTasks.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: '#FF7043',
              color: 'white',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            {pendingTasks.length}
          </div>
        )}
      </div>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#333', marginBottom: '2px' }}>
        {plant.name}
      </h3>
      <p style={{ color: '#888', fontSize: '13px', marginBottom: '8px' }}>{plant.variety}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {plant.tasks.slice(0, 3).map(task => (
          <Countdown key={task.id} task={task} />
        ))}
        {plant.tasks.length > 3 && (
          <span style={{ fontSize: '11px', color: '#999' }}>
            +{plant.tasks.length - 3} 项养护任务
          </span>
        )}
      </div>
    </div>
  );
}

export function GardenGrid({
  plants,
  onSelect,
}: {
  plants: Plant[];
  onSelect: (p: Plant) => void;
}) {
  return (
    <div className="garden-grid">
      {plants.map(plant => (
        <PlantCard key={plant.id} plant={plant} onClick={() => onSelect(plant)} />
      ))}
    </div>
  );
}

interface DetailModalProps {
  plant: Plant;
  onClose: () => void;
  onCompleteTask: (taskId: string) => void;
  onPostponeTask: (taskId: string) => void;
  onAddRecord: (plantId: string, notes: string) => void;
  onDeletePlant: (plantId: string) => void;
}

export function DetailModal({
  plant,
  onClose,
  onCompleteTask,
  onPostponeTask,
  onAddRecord,
  onDeletePlant,
}: DetailModalProps) {
  const [activeTab, setActiveTab] = useState<'tasks' | 'records'>('tasks');
  const [newNote, setNewNote] = useState('');

  const handleAddRecord = () => {
    if (newNote.trim()) {
      onAddRecord(plant.id, newNote.trim());
      setNewNote('');
    }
  };

  const sortedTasks = [...plant.tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime();
  });

  const plantRecords = plant.records || [];

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div
        className="modal-content"
        style={{
          width: '600px',
          background: 'white',
          borderRadius: '12px',
          padding: '0',
        }}
      >
        <div
          style={{
            background: plant.photoColor,
            borderRadius: '12px 12px 0 0',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            position: 'relative',
          }}
        >
          <div style={{ fontSize: '64px', lineHeight: 1 }}>🌿</div>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#333' }}>{plant.name}</h2>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '2px' }}>{plant.variety}</p>
            <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
              添加于 {plant.createdAt}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(0,0,0,0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontSize: '16px',
              color: '#555',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            borderBottom: '2px solid #E0E0E0',
            padding: '0 24px',
          }}
        >
          <button
            className={activeTab === 'tasks' ? 'tab-active' : 'tab-inactive'}
            onClick={() => setActiveTab('tasks')}
            style={{
              border: 'none',
              padding: '12px 20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: '12px 12px 0 0',
              transition: 'all 0.3s',
            }}
          >
            养护任务 ({plant.tasks.length})
          </button>
          <button
            className={activeTab === 'records' ? 'tab-active' : 'tab-inactive'}
            onClick={() => setActiveTab('records')}
            style={{
              border: 'none',
              padding: '12px 20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: '12px 12px 0 0',
              transition: 'all 0.3s',
            }}
          >
            生长记录 ({plantRecords.length})
          </button>
        </div>

        <div style={{ padding: '20px 24px', maxHeight: '400px', overflowY: 'auto' }}>
          {activeTab === 'tasks' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sortedTasks.map(task => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: task.completed ? '#F5F5F5' : '#FAFAFA',
                    border: '1px solid #E0E0E0',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: task.completed ? '#B0BEC5' : '#66BB6A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      flexShrink: 0,
                    }}
                  >
                    {getTaskTypeEmoji(task.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        textDecoration: task.completed ? 'line-through' : 'none',
                        color: task.completed ? '#999' : '#333',
                      }}
                    >
                      {getTaskTypeLabel(task.type)}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: task.completed ? '#BBB' : '#888',
                        textDecoration: task.completed ? 'line-through' : 'none',
                      }}
                    >
                      每{task.intervalDays}天 · {task.completed ? '已完成' : formatCountdown(task.nextDue)}
                    </div>
                  </div>
                  {!task.completed && (
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button
                        className="btn-primary"
                        onClick={() => onCompleteTask(task.id)}
                        style={{ padding: '4px 12px', fontSize: '12px' }}
                      >
                        完成
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => onPostponeTask(task.id)}
                        style={{ padding: '4px 12px', fontSize: '12px' }}
                      >
                        推迟1天
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'records' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '16px',
                  alignItems: 'flex-end',
                }}
              >
                <textarea
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="记录植物状态（支持**粗体**和*斜体*）..."
                  style={{
                    flex: 1,
                    resize: 'vertical',
                    minHeight: '60px',
                    borderRadius: '12px',
                    border: '1px solid #A5D6A7',
                    padding: '8px 12px',
                    fontSize: '13px',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
                <button className="btn-primary" onClick={handleAddRecord}>
                  添加记录
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {plantRecords.map(record => (
                  <div
                    key={record.id}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '10px',
                      borderRadius: '12px',
                      background: '#FAFAFA',
                      border: '1px solid #E0E0E0',
                    }}
                  >
                    <div
                      style={{
                        width: '60px',
                        height: '45px',
                        borderRadius: '8px',
                        background: record.photoColor,
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                      }}
                    >
                      📷
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '11px', color: '#999', marginBottom: '2px' }}>
                        {record.date}
                      </div>
                      <div
                        style={{ fontSize: '13px', color: '#555', lineHeight: 1.5 }}
                        dangerouslySetInnerHTML={{
                          __html: renderSimpleMarkdown(record.notes),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid #EEE',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            className="btn-secondary"
            style={{ color: '#E53935', borderColor: '#E53935' }}
            onClick={() => {
              onDeletePlant(plant.id);
              onClose();
            }}
          >
            删除植物
          </button>
        </div>
      </div>
    </>
  );
}

interface AddPlantModalProps {
  onClose: () => void;
  onAdd: (data: {
    name: string;
    variety: string;
    photoColor: string;
    careSchedules: Array<{ type: 'water' | 'fertilize' | 'prune'; intervalDays: number }>;
  }) => void;
}

export function AddPlantModal({ onClose, onAdd }: AddPlantModalProps) {
  const [name, setName] = useState('');
  const [variety, setVariety] = useState('');
  const [schedules, setSchedules] = useState<
    Array<{ type: 'water' | 'fertilize' | 'prune'; intervalDays: number }>
  >([{ type: 'water', intervalDays: 3 }]);

  const warmColors = ['#EF9A9A', '#A5D6A7', '#CE93D8', '#FFCC80', '#FFF59D', '#81D0B8'];

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      variety: variety.trim() || '未知品种',
      photoColor: warmColors[Math.floor(Math.random() * warmColors.length)],
      careSchedules: schedules.filter(s => s.intervalDays > 0),
    });
    onClose();
  };

  const addSchedule = () => {
    setSchedules([...schedules, { type: 'fertilize', intervalDays: 30 }]);
  };

  const removeSchedule = (idx: number) => {
    setSchedules(schedules.filter((_, i) => i !== idx));
  };

  const updateSchedule = (
    idx: number,
    field: 'type' | 'intervalDays',
    value: string | number
  ) => {
    const updated = [...schedules];
    if (field === 'type') {
      updated[idx] = { ...updated[idx], type: value as 'water' | 'fertilize' | 'prune' };
    } else {
      updated[idx] = { ...updated[idx], intervalDays: Number(value) || 1 };
    }
    setSchedules(updated);
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div
        className="modal-content"
        style={{
          width: '480px',
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: '#333' }}>
          添加新植物
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '13px', color: '#666', marginBottom: '4px', display: 'block' }}>
              植物名称 *
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例如：玫瑰"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#666', marginBottom: '4px', display: 'block' }}>
              品种
            </label>
            <input
              value={variety}
              onChange={e => setVariety(e.target.value)}
              placeholder="例如：大马士革"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <label style={{ fontSize: '13px', color: '#666' }}>养护计划</label>
              <button className="btn-secondary" onClick={addSchedule} style={{ fontSize: '12px', padding: '3px 10px' }}>
                + 添加
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {schedules.map((s, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select
                    value={s.type}
                    onChange={e => updateSchedule(idx, 'type', e.target.value)}
                    style={{ flex: 1 }}
                  >
                    <option value="water">💧 浇水</option>
                    <option value="fertilize">🌱 施肥</option>
                    <option value="prune">✂️ 修剪</option>
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={s.intervalDays}
                    onChange={e => updateSchedule(idx, 'intervalDays', e.target.value)}
                    style={{ width: '80px' }}
                  />
                  <span style={{ fontSize: '13px', color: '#888', whiteSpace: 'nowrap' }}>天/次</span>
                  {schedules.length > 1 && (
                    <button
                      onClick={() => removeSchedule(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#E53935',
                        cursor: 'pointer',
                        fontSize: '16px',
                        padding: '0 4px',
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
          <button className="btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={!name.trim()}>
            添加植物
          </button>
        </div>
      </div>
    </>
  );
}
