import { Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import TimelinePanel from './components/TimelinePanel';
import MapPanel from './components/MapPanel';
import EditModal from './components/EditModal';
import { useMemoryStore } from './store/memoryStore';

function App() {
  const fetchMemories = useMemoryStore((s) => s.fetchMemories);
  const addMemory = useMemoryStore((s) => s.addMemory);
  const exportToHTML = useMemoryStore((s) => s.exportToHTML);
  const importMemories = useMemoryStore((s) => s.importMemories);
  const memories = useMemoryStore((s) => s.memories);
  const editingId = useMemoryStore((s) => s.editingId);
  const setEditingId = useMemoryStore((s) => s.setEditingId);

  const [showMobilePanel, setShowMobilePanel] = useState<'timeline' | 'map'>('timeline');

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const handleAddMemory = () => {
    const now = new Date().toISOString().split('T')[0];
    addMemory({
      date: now,
      title: '新的旅行记忆',
      description: '点击编辑按钮添加这段旅行的故事...',
      lat: 39.9042,
      lng: 116.4074,
      imageUrl: '',
    });
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (Array.isArray(data)) importMemories(data);
        } catch (err) {
          alert('导入失败：文件格式不正确');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const navButtonStyle = (isLast = false) => ({
    padding: '8px 20px',
    borderRadius: '9999px',
    border: 'none',
    backgroundColor: '#f0f0f0',
    color: '#1a1a2e',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    marginRight: isLast ? 0 : '8px',
    backdropFilter: 'blur(8px)',
  }) as React.CSSProperties;

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div
            style={{
              width: '100%',
              height: '100vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#fdf6e3',
              overflow: 'hidden',
            }}
          >
            <nav
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 24px',
                backgroundColor: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderBottom: '1px solid #e5e5e5',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>✈️</span>
                <span
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#2d6a4f',
                    letterSpacing: '0.5px',
                  }}
                >
                  旅行记忆时间轴
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button
                  onClick={handleImport}
                  style={navButtonStyle()}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#d8f3dc';
                    e.currentTarget.style.color = '#2d6a4f';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f0f0';
                    e.currentTarget.style.color = '#1a1a2e';
                  }}
                >
                  📥 导入数据
                </button>
                <button
                  onClick={handleAddMemory}
                  style={navButtonStyle()}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#d8f3dc';
                    e.currentTarget.style.color = '#2d6a4f';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f0f0';
                    e.currentTarget.style.color = '#1a1a2e';
                  }}
                >
                  ➕ 添加记忆
                </button>
                <button
                  onClick={exportToHTML}
                  style={navButtonStyle(true)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#d8f3dc';
                    e.currentTarget.style.color = '#2d6a4f';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f0f0';
                    e.currentTarget.style.color = '#1a1a2e';
                  }}
                >
                  📤 导出故事
                </button>
              </div>
            </nav>

            <div
              className="main-container"
              style={{
                flex: 1,
                display: 'flex',
                gap: '20px',
                padding: '20px',
                overflow: 'hidden',
                minHeight: 0,
              }}
            >
              <div
                className="mobile-toggle"
                style={{
                  display: 'none',
                  position: 'absolute',
                  top: '72px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 50,
                  background: 'white',
                  borderRadius: '9999px',
                  padding: '4px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                }}
              >
                <button
                  onClick={() => setShowMobilePanel('timeline')}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '9999px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    backgroundColor: showMobilePanel === 'timeline' ? '#2d6a4f' : 'transparent',
                    color: showMobilePanel === 'timeline' ? 'white' : '#4a4a6a',
                    transition: 'all 0.2s',
                  }}
                >
                  时间轴
                </button>
                <button
                  onClick={() => setShowMobilePanel('map')}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '9999px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    backgroundColor: showMobilePanel === 'map' ? '#2d6a4f' : 'transparent',
                    color: showMobilePanel === 'map' ? 'white' : '#4a4a6a',
                    transition: 'all 0.2s',
                  }}
                >
                  地图
                </button>
              </div>

              <div
                data-panel="timeline"
                style={{
                  width: '360px',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                }}
              >
                <TimelinePanel />
              </div>
              <div
                data-panel="map"
                style={{
                  flex: 1,
                  minWidth: 0,
                  minHeight: 0,
                }}
              >
                <MapPanel />
              </div>
            </div>

            {editingId && (
              <EditModal
                memory={memories.find((m) => m.id === editingId)!}
                onClose={() => setEditingId(null)}
              />
            )}

            <style>{`
              @media (max-width: 768px) {
                .main-container {
                  flex-direction: column !important;
                  padding: 60px 12px 12px 12px !important;
                  gap: 12px !important;
                }
                .main-container > [data-panel="timeline"] {
                  width: 100% !important;
                  min-height: 50vh !important;
                  height: 50vh !important;
                  display: ${showMobilePanel === 'timeline' ? 'flex' : 'none'} !important;
                }
                .main-container > [data-panel="map"] {
                  min-height: 50vh !important;
                  height: 50vh !important;
                  display: ${showMobilePanel === 'map' ? 'block' : 'none'} !important;
                }
                .mobile-toggle {
                  display: flex !important;
                }
                nav {
                  padding: 10px 12px !important;
                }
                nav > div:first-child span:nth-child(2) {
                  font-size: 16px !important;
                }
                nav button {
                  padding: 6px 12px !important;
                  font-size: 12px !important;
                }
              }
            `}</style>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
