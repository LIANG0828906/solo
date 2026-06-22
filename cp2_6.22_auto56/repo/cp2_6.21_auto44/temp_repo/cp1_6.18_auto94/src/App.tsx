import { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { GardenBoard } from './components/GardenBoard';
import { WeeklyCalendar } from './components/WeeklyCalendar';
import { notificationService } from './scheduler/notificationService';
import { useGardenStore } from './garden/gardenStore';
import type { ZoneType, PlantStatus } from './types';

function App() {
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneType, setNewZoneType] = useState<ZoneType>('vegetable');
  const [newZoneStatus, setNewZoneStatus] = useState<PlantStatus>('healthy');
  const addZone = useGardenStore((state) => state.addZone);

  useEffect(() => {
    notificationService.start();

    return () => {
      notificationService.stop();
    };
  }, []);

  const handleAddZone = () => {
    if (!newZoneName.trim()) return;
    
    addZone(newZoneName.trim(), newZoneType);
    
    setNewZoneName('');
    setNewZoneType('vegetable');
    setNewZoneStatus('healthy');
    setShowAddModal(false);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ minHeight: '100vh', backgroundColor: '#1A1A2E', display: 'flex', flexDirection: 'column' }}>
        <nav
          style={{
            height: '56px',
            backgroundColor: '#16213E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🌿</span>
            <h1
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: 'white',
                margin: 0,
              }}
            >
              指尖花园
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'white',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
            >
              📅 周历
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 500,
                border: 'none',
                borderRadius: '8px',
                backgroundColor: '#4ECDC4',
                color: 'white',
                cursor: 'pointer',
                transition: 'filter 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
            >
              + 添加区域
            </button>
          </div>
        </nav>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <GardenBoard />
          </div>
          <WeeklyCalendar isOpen={showCalendar} onClose={() => setShowCalendar(false)} />
        </div>

        {showAddModal && (
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
            onClick={() => setShowAddModal(false)}
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
                    boxSizing: 'border-box',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddZone();
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
                    boxSizing: 'border-box',
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
                  onChange={(e) => setNewZoneStatus(e.target.value as 'healthy' | 'thirsty' | 'pest')}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="healthy">🌿 健康</option>
                  <option value="thirsty">💧 缺水</option>
                  <option value="pest">🐛 虫害</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowAddModal(false)}
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

        <style>{`
          @media (max-width: 768px) {
            /* 移动端适配 */
          }
        `}</style>
      </div>
    </DndProvider>
  );
}

export default App;
