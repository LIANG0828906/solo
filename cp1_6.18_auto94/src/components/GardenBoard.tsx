import { useRef, useState, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import type { GardenZone, PlantStatus, Task } from '../types';
import { useTaskStore } from '../garden/taskStore';
import { useGardenStore } from '../garden/gardenStore';
import { format } from 'date-fns';

interface ZoneCardProps {
  zone: GardenZone;
  tasks: Task[];
  onAddTask: (zoneId: string) => void;
  onEditZone: (zone: GardenZone) => void;
  onDeleteZone: (zoneId: string) => void;
  onWaterZone: (zoneId: string) => void;
}

const statusColors: Record<PlantStatus, { bg: string; text: string; label: string }> = {
  healthy: { bg: '#27AE60', text: '#ffffff', label: '健康' },
  thirsty: { bg: '#F39C12', text: '#ffffff', label: '缺水' },
  pest: { bg: '#E74C3C', text: '#ffffff', label: '虫害' },
};

const typeColors = {
  vegetable: '#4ECDC4',
  flower: '#FFE66D',
  fruit: '#FF6B6B',
};

const ItemTypes = {
  TASK: 'task',
};

interface DragItem {
  id: string;
  type: string;
  zoneId: string;
}

function TaskCard({ task, index }: { task: Task; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const completeTask = useTaskStore((state) => state.completeTask);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TASK,
    item: { id: task.id, type: ItemTypes.TASK, zoneId: task.zoneId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [task.id, task.zoneId]);

  drag(ref);

  const isCompleted = task.status === 'completed';

  return (
    <div
      ref={ref}
      style={{
        padding: '10px 12px',
        marginBottom: '8px',
        backgroundColor: isCompleted ? '#f5f5f5' : '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        cursor: 'grab',
        opacity: isDragging ? 0.8 : 1,
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.15s ease-out, opacity 0.15s ease-out',
        boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={() => completeTask(task.id)}
          style={{
            marginTop: '2px',
            cursor: 'pointer',
            width: '16px',
            height: '16px',
            accentColor: '#4ECDC4',
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: isCompleted ? '#999' : '#333',
              textDecoration: isCompleted ? 'line-through' : 'none',
              wordBreak: 'break-word',
            }}
          >
            {task.name}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: isCompleted ? '#bbb' : '#888',
              marginTop: '4px',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>👤 {task.assignee || '未分配'}</span>
            <span>⏰ {format(new Date(task.deadline), 'MM-dd HH:mm')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ZoneCard({ zone, tasks, onAddTask, onEditZone, onDeleteZone, onWaterZone }: ZoneCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reorderTask = useTaskStore((state) => state.reorderTask);
  const statusInfo = statusColors[zone.status];

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.TASK,
    drop: (item: DragItem, monitor) => {
      const targetIndex = tasks.filter(t => t.status === 'pending').length;
      if (item.zoneId !== zone.id) {
        reorderTask(item.id, zone.id, Math.max(targetIndex, 1));
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [zone.id, tasks.length]);

  drop(ref);

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  return (
    <div
      ref={ref}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderLeft: `4px solid ${typeColors[zone.type]}`,
        padding: '16px',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
        outline: isOver ? '2px dashed #4ECDC4' : 'none',
        outlineOffset: '-4px',
        transition: 'outline 0.15s ease-out',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: 0 }}>
          {zone.name}
        </h3>
        <span
          style={{
            backgroundColor: statusInfo.bg,
            color: statusInfo.text,
            fontSize: '12px',
            padding: '2px 8px',
            borderRadius: '4px',
            fontWeight: 500,
          }}
        >
          {statusInfo.label}
        </span>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>植物列表</div>
        {zone.plants.length === 0 ? (
          <div style={{ fontSize: '13px', color: '#bbb', fontStyle: 'italic' }}>暂无植物</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {zone.plants.map((plant) => (
              <span
                key={plant.id}
                style={{
                  fontSize: '12px',
                  padding: '3px 8px',
                  backgroundColor: '#f0f8ff',
                  borderRadius: '4px',
                  color: '#555',
                }}
              >
                🌱 {plant.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
          待办任务 ({pendingTasks.length})
        </div>
        {pendingTasks.length === 0 && completedTasks.length === 0 ? (
          <div style={{ fontSize: '13px', color: '#bbb', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
            暂无任务
          </div>
        ) : (
          <>
            {pendingTasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))}
            {completedTasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={pendingTasks.length + index} />
            ))}
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button
          onClick={() => onWaterZone(zone.id)}
          style={{
            flex: 1,
            padding: '6px 12px',
            fontSize: '12px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: '#3498DB',
            color: 'white',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2980B9')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3498DB')}
        >
          💧 已浇水
        </button>
        <button
          onClick={() => onAddTask(zone.id)}
          style={{
            flex: 1,
            padding: '6px 12px',
            fontSize: '12px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: '#4ECDC4',
            color: 'white',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#45b7aa')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#4ECDC4')}
        >
          + 添加任务
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button
          onClick={() => onEditZone(zone)}
          style={{
            flex: 1,
            padding: '4px 8px',
            fontSize: '11px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: 'white',
            color: '#666',
            cursor: 'pointer',
          }}
        >
          编辑区域
        </button>
        <button
          onClick={() => onDeleteZone(zone.id)}
          style={{
            flex: 1,
            padding: '4px 8px',
            fontSize: '11px',
            border: '1px solid #ffcccc',
            borderRadius: '4px',
            backgroundColor: '#fff5f5',
            color: '#e74c3c',
            cursor: 'pointer',
          }}
        >
          删除区域
        </button>
      </div>
    </div>
  );
}

export function GardenBoard() {
  const zones = useGardenStore((state) => state.zones);
  const getTasksByZone = useTaskStore((state) => state.getTasksByZone);
  const addTask = useTaskStore((state) => state.addTask);
  const deleteZone = useGardenStore((state) => state.deleteZone);
  const addWateringLog = useGardenStore((state) => state.addWateringLog);
  const updateZone = useGardenStore((state) => state.updateZone);
  const addPlant = useGardenStore((state) => state.addPlant);
  const removePlant = useGardenStore((state) => state.removePlant);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [showAddZoneModal, setShowAddZoneModal] = useState(false);
  const [editingZone, setEditingZone] = useState<GardenZone | null>(null);
  const [selectedZoneForTask, setSelectedZoneForTask] = useState<string | null>(null);

  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneType, setNewZoneType] = useState<'vegetable' | 'flower' | 'fruit'>('vegetable');
  const [newZoneStatus, setNewZoneStatus] = useState<PlantStatus>('healthy');

  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');

  const [newPlantName, setNewPlantName] = useState('');

  const handleAddZone = () => {
    if (!newZoneName.trim()) return;
    
    const addZone = useGardenStore.getState().addZone;
    addZone(newZoneName.trim(), newZoneType);
    
    setNewZoneName('');
    setNewZoneType('vegetable');
    setNewZoneStatus('healthy');
    setShowAddZoneModal(false);
  };

  const handleEditZone = (zone: GardenZone) => {
    setEditingZone(zone);
    setNewZoneName(zone.name);
    setNewZoneType(zone.type);
    setNewZoneStatus(zone.status);
    setNewPlantName('');
  };

  const handleSaveEditZone = () => {
    if (!editingZone || !newZoneName.trim()) return;
    
    updateZone(editingZone.id, {
      name: newZoneName.trim(),
      type: newZoneType,
      status: newZoneStatus,
    });
    
    setEditingZone(null);
    setNewZoneName('');
    setNewPlantName('');
  };

  const handleAddPlant = () => {
    if (!editingZone || !newPlantName.trim()) return;
    addPlant(editingZone.id, newPlantName.trim());
    setNewPlantName('');
  };

  const handleDeleteZone = (zoneId: string) => {
    if (window.confirm('确定要删除这个区域吗？相关的任务和浇水记录也会被删除。')) {
      deleteZone(zoneId);
    }
  };

  const handleWaterZone = (zoneId: string) => {
    addWateringLog(zoneId);
  };

  const handleAddTask = (zoneId: string) => {
    setSelectedZoneForTask(zoneId);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setNewTaskDeadline(tomorrow.toISOString().slice(0, 16));
  };

  const handleSaveTask = () => {
    if (!selectedZoneForTask || !newTaskName.trim()) return;

    addTask(
      selectedZoneForTask,
      newTaskName.trim(),
      new Date(newTaskDeadline).getTime(),
      newTaskAssignee.trim()
    );

    setNewTaskName('');
    setNewTaskDeadline('');
    setNewTaskAssignee('');
    setSelectedZoneForTask(null);
  };

  const vegetableZones = zones.filter((z) => z.type === 'vegetable');
  const flowerZones = zones.filter((z) => z.type === 'flower');
  const fruitZones = zones.filter((z) => z.type === 'fruit');

  const renderZoneColumn = (title: string, zones: GardenZone[], type: 'vegetable' | 'flower' | 'fruit') => (
    <div style={{ minWidth: isMobile ? '100%' : '350px', flexShrink: 0, width: isMobile ? '100%' : 'auto' }}>
      <div
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'white',
          marginBottom: '12px',
          paddingLeft: '8px',
          borderLeft: `3px solid ${typeColors[type]}`,
        }}
      >
        {title} ({zones.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {zones.map((zone) => (
          <ZoneCard
            key={zone.id}
            zone={zone}
            tasks={getTasksByZone(zone.id)}
            onAddTask={handleAddTask}
            onEditZone={handleEditZone}
            onDeleteZone={handleDeleteZone}
            onWaterZone={handleWaterZone}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1, overflowX: isMobile ? 'hidden' : 'auto', padding: isMobile ? '12px' : '20px' }}>
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '20px', minWidth: isMobile ? 'auto' : 'min-content' }}>
        {renderZoneColumn('🥬 菜畦区', vegetableZones, 'vegetable')}
        {renderZoneColumn('🌸 花坛区', flowerZones, 'flower')}
        {renderZoneColumn('🍎 果树区', fruitZones, 'fruit')}
      </div>

      {showAddZoneModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowAddZoneModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              width: '400px',
              maxWidth: '90vw',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '20px', color: '#333' }}>添加花园区域</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#555' }}>
                区域名称
              </label>
              <input
                type="text"
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                placeholder="请输入区域名称"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#555' }}>
                区域类型
              </label>
              <select
                value={newZoneType}
                onChange={(e) => setNewZoneType(e.target.value as 'vegetable' | 'flower' | 'fruit')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              >
                <option value="vegetable">🥬 菜畦</option>
                <option value="flower">🌸 花坛</option>
                <option value="fruit">🍎 果树区</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#555' }}>
                初始状态
              </label>
              <select
                value={newZoneStatus}
                onChange={(e) => setNewZoneStatus(e.target.value as PlantStatus)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              >
                <option value="healthy">🌿 健康</option>
                <option value="thirsty">💧 缺水</option>
                <option value="pest">🐛 虫害</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddZoneModal(false)}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                取消
              </button>
              <button
                onClick={handleAddZone}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#4ECDC4',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {editingZone && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setEditingZone(null)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              width: '400px',
              maxWidth: '90vw',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '20px', color: '#333' }}>编辑花园区域</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#555' }}>
                区域名称
              </label>
              <input
                type="text"
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#555' }}>
                区域类型
              </label>
              <select
                value={newZoneType}
                onChange={(e) => setNewZoneType(e.target.value as 'vegetable' | 'flower' | 'fruit')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              >
                <option value="vegetable">🥬 菜畦</option>
                <option value="flower">🌸 花坛</option>
                <option value="fruit">🍎 果树区</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#555' }}>
                植物状态
              </label>
              <select
                value={newZoneStatus}
                onChange={(e) => setNewZoneStatus(e.target.value as PlantStatus)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              >
                <option value="healthy">🌿 健康</option>
                <option value="thirsty">💧 缺水</option>
                <option value="pest">🐛 虫害</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#555' }}>
                植物列表
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                {editingZone.plants.map((plant) => (
                  <span
                    key={plant.id}
                    style={{
                      fontSize: '12px',
                      padding: '4px 10px',
                      backgroundColor: '#f0f8ff',
                      borderRadius: '4px',
                      color: '#555',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    🌱 {plant.name}
                    <button
                      onClick={() => removePlant(editingZone.id, plant.id)}
                      style={{
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: '#999',
                        fontSize: '14px',
                        padding: 0,
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={newPlantName}
                  onChange={(e) => setNewPlantName(e.target.value)}
                  placeholder="植物名称"
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddPlant();
                  }}
                />
                <button
                  onClick={handleAddPlant}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#4ECDC4',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  添加
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditingZone(null)}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                取消
              </button>
              <button
                onClick={handleSaveEditZone}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#4ECDC4',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedZoneForTask && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedZoneForTask(null)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              width: '400px',
              maxWidth: '90vw',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '20px', color: '#333' }}>添加任务</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#555' }}>
                任务名称
              </label>
              <input
                type="text"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder="例如：浇水、施肥、修剪"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#555' }}>
                截止时间
              </label>
              <input
                type="datetime-local"
                value={newTaskDeadline}
                onChange={(e) => setNewTaskDeadline(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#555' }}>
                责任人
              </label>
              <input
                type="text"
                value={newTaskAssignee}
                onChange={(e) => setNewTaskAssignee(e.target.value)}
                placeholder="志愿者姓名"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedZoneForTask(null)}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                取消
              </button>
              <button
                onClick={handleSaveTask}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#4ECDC4',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
