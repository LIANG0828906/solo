import { useState } from 'react';
import { InspirationEntry, RoomType } from '../shared/types';
import { ROOM_LAYOUTS } from '../shared/data';

interface InspirationBoardProps {
  inspirations: InspirationEntry[];
  onCreateRoom: (roomType: RoomType, name: string) => void;
  onEdit: (entry: InspirationEntry) => void;
  onDelete: (id: string) => void;
}

export default function InspirationBoard({ inspirations, onCreateRoom, onEdit, onDelete }: InspirationBoardProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType>('living');
  const [roomName, setRoomName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = inspirations.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    onCreateRoom(selectedRoomType, roomName);
    setShowCreateModal(false);
    setRoomName('');
  };

  const roomOptions: { type: RoomType; icon: string; desc: string }[] = [
    { type: 'living', icon: '🛋️', desc: '宽敞的会客空间' },
    { type: 'bedroom', icon: '🛏️', desc: '舒适的休憩空间' },
    { type: 'kitchen', icon: '🍳', desc: '美味的烹饪空间' },
    { type: 'study', icon: '📚', desc: '专注的工作空间' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#FAF3EB' }}>
      <header style={{
        background: 'linear-gradient(135deg, #5D4037 0%, #8B5E3C 50%, #A0522D 100%)',
        padding: '60px 48px 48px',
        color: '#fff'
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 8 }}>
            🏡 家居灵感板
          </h1>
          <p style={{ fontSize: 16, opacity: 0.9, marginBottom: 28 }}>
            收集家居布置灵感，拖拽家具打造属于你的梦想空间
          </p>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                background: '#E8A87C',
                color: '#fff',
                padding: '14px 32px',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                boxShadow: '0 4px 16px rgba(232,168,124,0.4)'
              }}
            >
              ✨ 创建新方案
            </button>
            <div style={{
              background: 'rgba(255,255,255,0.12)',
              borderRadius: 10,
              padding: '4px',
              display: 'flex'
            }}>
              {(['grid', 'list'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 8,
                    background: viewMode === mode ? 'rgba(255,255,255,0.25)' : 'transparent',
                    color: '#fff',
                    fontSize: 14
                  }}
                >
                  {mode === 'grid' ? '⊞ 网格' : '☰ 列表'}
                </button>
              ))}
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.12)',
              borderRadius: 10,
              padding: '4px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span>🔍</span>
              <input
                type="text"
                placeholder="搜索方案..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#fff',
                  fontSize: 14,
                  padding: '8px 4px',
                  width: 200
                }}
              />
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: 40, display: viewMode === 'grid' ? 'flex' : 'block' }}>
        {viewMode === 'grid' ? (
          <div style={{
            columns: `3`,
            columnGap: 24,
            width: '100%'
          }}>
            {filtered.map(entry => (
              <div
                key={entry.id}
                className="animate-fade-in"
                onClick={() => onEdit(entry)}
                style={{
                  breakInside: 'avoid',
                  marginBottom: 24,
                  background: '#fff',
                  borderRadius: 16,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: '0 2px 12px rgba(139,94,60,0.1)',
                  transition: 'all 0.25s ease',
                  display: 'inline-block',
                  width: '100%'
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(139,94,60,0.2)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(139,94,60,0.1)';
                }}
              >
                <div style={{
                  height: 220,
                  background: entry.thumbnail 
                    ? `url(${entry.thumbnail}) center/cover no-repeat` 
                    : 'linear-gradient(135deg, #F5E6D3, #E8A87C)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 64
                }}>
                  {!entry.thumbnail && ROOM_LAYOUTS[entry.floorPlan.roomType]?.type === 'living' && '🛋️'}
                  {!entry.thumbnail && ROOM_LAYOUTS[entry.floorPlan.roomType]?.type === 'bedroom' && '🛏️'}
                  {!entry.thumbnail && ROOM_LAYOUTS[entry.floorPlan.roomType]?.type === 'kitchen' && '🍳'}
                  {!entry.thumbnail && ROOM_LAYOUTS[entry.floorPlan.roomType]?.type === 'study' && '📚'}
                </div>
                <div style={{ padding: 20 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#3E2723' }}>
                    {entry.name}
                  </h3>
                  {entry.description && (
                    <p style={{ 
                      fontSize: 13, 
                      color: '#795548', 
                      marginBottom: 12,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {entry.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ 
                        background: '#F5E6D3', 
                        padding: '4px 12px', 
                        borderRadius: 20, 
                        fontSize: 12,
                        color: '#8B5E3C',
                        fontWeight: 500
                      }}>
                        📦 {entry.materials.length} 件家具
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('确定要删除此方案吗？')) onDelete(entry.id);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: '#FFEBEE',
                        color: '#E57373',
                        fontSize: 12
                      }}
                    >
                      🗑️ 删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
            {filtered.map(entry => (
              <div
                key={entry.id}
                onClick={() => onEdit(entry)}
                style={{
                  display: 'flex',
                  background: '#fff',
                  borderRadius: 16,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: '0 2px 12px rgba(139,94,60,0.1)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateX(4px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateX(0)';
                }}
              >
                <div style={{
                  width: 200,
                  height: 140,
                  background: entry.thumbnail 
                    ? `url(${entry.thumbnail}) center/cover no-repeat` 
                    : 'linear-gradient(135deg, #F5E6D3, #E8A87C)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 48,
                  flexShrink: 0
                }}>
                  {!entry.thumbnail && '🏠'}
                </div>
                <div style={{ padding: 20, flex: 1 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#3E2723' }}>
                    {entry.name}
                  </h3>
                  <p style={{ fontSize: 13, color: '#795548', marginBottom: 12 }}>
                    {entry.description || '暂无描述'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ 
                      background: '#F5E6D3', 
                      padding: '4px 12px', 
                      borderRadius: 20, 
                      fontSize: 12,
                      color: '#8B5E3C'
                    }}>
                      📦 {entry.materials.length} 件家具
                    </span>
                    <span style={{ fontSize: 12, color: '#9E9E9E' }}>
                      创建于 {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div style={{ padding: 20, display: 'flex', alignItems: 'center' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('确定要删除此方案吗？')) onDelete(entry.id);
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      background: '#FFEBEE',
                      color: '#E57373',
                      fontSize: 13
                    }}
                  >
                    🗑️ 删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: 80,
            color: '#A1887F'
          }}>
            <div style={{ fontSize: 80, marginBottom: 24 }}>🎨</div>
            <h2 style={{ fontSize: 24, marginBottom: 12, color: '#5D4037' }}>
              {searchTerm ? '未找到匹配的方案' : '还没有任何方案'}
            </h2>
            <p style={{ fontSize: 15, marginBottom: 32 }}>
              点击上方"创建新方案"按钮，开始打造你的梦想空间
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                background: '#E8A87C',
                color: '#fff',
                padding: '14px 32px',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600
              }}
            >
              立即开始 ✨
            </button>
          </div>
        )}
      </main>

      {showCreateModal && (
        <div 
          className="animate-fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(62,39,35,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 24
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            className="animate-bounce-in"
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 24,
              padding: 40,
              maxWidth: 600,
              width: '100%',
              boxShadow: '0 24px 64px rgba(0,0,0,0.25)'
            }}
          >
            <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8, color: '#3E2723' }}>
              创建新方案
            </h2>
            <p style={{ fontSize: 14, color: '#795548', marginBottom: 28 }}>
              选择一个房间类型，开始布置设计
            </p>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#5D4037' }}>
                方案名称
              </label>
              <input
                type="text"
                placeholder="给你的方案起个名字..."
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: '2px solid #EFEBE9',
                  fontSize: 15,
                  transition: 'border 0.2s ease'
                }}
                onFocus={e => (e.target.style.borderColor = '#E8A87C')}
                onBlur={e => (e.target.style.borderColor = '#EFEBE9')}
              />
            </div>

            <div style={{ marginBottom: 32 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#5D4037' }}>
                房间类型
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {roomOptions.map(opt => (
                  <button
                    key={opt.type}
                    onClick={() => setSelectedRoomType(opt.type)}
                    style={{
                      padding: 20,
                      borderRadius: 16,
                      border: selectedRoomType === opt.type 
                        ? '3px solid #E8A87C' 
                        : '2px solid #EFEBE9',
                      background: selectedRoomType === opt.type ? '#FFF8F0' : '#FAFAFA',
                      textAlign: 'left',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontSize: 36, marginBottom: 8 }}>{opt.icon}</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#3E2723', marginBottom: 4 }}>
                      {ROOM_LAYOUTS[opt.type].name}
                    </div>
                    <div style={{ fontSize: 12, color: '#8D6E63' }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: 12,
                  background: '#EFEBE9',
                  color: '#5D4037',
                  fontSize: 15,
                  fontWeight: 500
                }}
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #E8A87C, #D7955F)',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  boxShadow: '0 4px 16px rgba(232,168,124,0.4)'
                }}
              >
                开始设计 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
