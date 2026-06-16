import { useState } from 'react';
import { FiTrash2, FiEdit2 } from 'react-icons/fi';
import type { BrewRecord } from '../types';

interface Props {
  records: BrewRecord[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onEdit: (record: BrewRecord) => void;
  onDelete: (id: string) => void;
}

const renderStars = (rating: number) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span
        key={i}
        style={{
          color: i <= rating ? '#D4A373' : '#C8BFB5',
          fontSize: 16,
          lineHeight: 1,
        }}
      >
        ★
      </span>
    );
  }
  return stars;
};

export default function BrewList({ records, selectedId, onSelect, onEdit, onDelete }: Props) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const selectedRecord = records.find((r) => r.id === selectedId) || null;

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = (id: string) => {
    onDelete(id);
    setConfirmDeleteId(null);
    if (selectedId === id) {
      onSelect(null);
    }
  };

  if (records.length === 0) {
    return (
      <div
        style={{
          padding: 48,
          textAlign: 'center',
          color: '#A67B5B',
          fontSize: 14,
          backgroundColor: '#FAF5EF',
          borderRadius: 12,
        }}
      >
        暂无冲泡记录，开始记录你的第一杯手冲咖啡吧 ☕
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h3 style={{ fontSize: 16, color: '#4A3525', fontWeight: 600, marginBottom: 4 }}>
        冲泡历史
      </h3>

      <div style={{ maxHeight: 480, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
        {records.map((r) => {
          const isSelected = r.id === selectedId;
          return (
            <div key={r.id}>
              <div
                onClick={() => onSelect(isSelected ? null : r.id)}
                style={{
                  height: 64,
                  padding: '0 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  backgroundColor: isSelected ? '#FFF8F0' : '#FAF5EF',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease-out',
                  border: isSelected ? '1px solid #D4A373' : '1px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = '#FFF8F0';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = '#FAF5EF';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  flex: 1,
                  minWidth: 0,
                  flexWrap: 'wrap',
                }}>
                  <span style={{
                    fontSize: 13,
                    color: '#A67B5B',
                    fontFamily: 'monospace',
                    minWidth: 96,
                  }}>
                    {r.date}
                  </span>
                  <span style={{
                    fontSize: 15,
                    color: '#4A3525',
                    fontWeight: 600,
                    minWidth: 100,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {r.bean}
                  </span>
                  <span style={{
                    fontSize: 13,
                    color: '#6F4E37',
                    fontFamily: 'monospace',
                    minWidth: 50,
                  }}>
                    ⏱ {r.duration}
                  </span>
                  <div style={{ display: 'flex', gap: 1 }}>{renderStars(r.rating)}</div>
                </div>
              </div>

              {isSelected && selectedRecord && (
                <div
                  style={{
                    width: '100%',
                    padding: 24,
                    backgroundColor: '#FAF5EF',
                    borderRadius: 12,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    marginTop: 8,
                    marginBottom: 8,
                    animation: 'expandIn 0.3s ease-out',
                  }}
                >
                  <style>{`
                    @keyframes expandIn {
                      from { opacity: 0; transform: translateY(-8px); }
                      to { opacity: 1; transform: translateY(0); }
                    }
                  `}</style>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px 24px',
                  }}>
                    {[
                      ['日期', r.date],
                      ['咖啡豆名称', r.bean],
                      ['烘焙度', `${r.roast}烘焙`],
                      ['研磨度', `${r.grind} 格`],
                      ['水温', `${r.temp}°C`],
                      ['注水方式', r.method || '-'],
                      ['总时长', r.duration],
                      ['粉重', `${r.coffeeWeight}g`],
                      ['水量', `${r.waterWeight}g`],
                      ['粉水比', r.coffeeWeight > 0 ? `1:${(r.waterWeight / r.coffeeWeight).toFixed(1)}` : '-'],
                    ].map(([label, value]) => (
                      <div key={label as string} style={{
                        display: 'flex',
                        gap: 8,
                        fontSize: 14,
                      }}>
                        <span style={{ fontWeight: 700, color: '#4A3525', minWidth: 88 }}>
                          {label}：
                        </span>
                        <span style={{ color: '#6F4E37' }}>{value}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#4A3525', minWidth: 88 }}>评分：</span>
                      <div style={{ display: 'flex', gap: 1 }}>{renderStars(r.rating)}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(r);
                      }}
                      style={{
                        height: 40,
                        padding: '0 16px',
                        backgroundColor: '#A67B5B',
                        color: '#FAF5EF',
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.2s ease-out',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#8B6343')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#A67B5B')}
                      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      <FiEdit2 size={16} />
                      编辑
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, r.id)}
                      style={{
                        height: 40,
                        padding: '0 16px',
                        backgroundColor: 'transparent',
                        color: '#C0392B',
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        border: '1px solid #C0392B',
                        transition: 'all 0.2s ease-out',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(192, 57, 43, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      <FiTrash2 size={16} />
                      删除
                    </button>
                  </div>
                </div>
              )}

              {confirmDeleteId === r.id && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(74, 53, 37, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    animation: 'fadeIn 0.2s ease-out',
                  }}
                >
                  <style>{`
                    @keyframes fadeIn {
                      from { opacity: 0; }
                      to { opacity: 1; }
                    }
                  `}</style>
                  <div style={{
                    backgroundColor: '#FAF5EF',
                    padding: 24,
                    borderRadius: 12,
                    minWidth: 280,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                    animation: 'popIn 0.2s ease-out',
                  }}>
                    <style>{`
                      @keyframes popIn {
                        from { opacity: 0; transform: scale(0.95); }
                        to { opacity: 1; transform: scale(1); }
                      }
                    `}</style>
                    <p style={{ fontSize: 15, color: '#4A3525', marginBottom: 20 }}>
                      确定要删除这条冲泡记录吗？
                    </p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: 'transparent',
                          color: '#6F4E37',
                          borderRadius: 8,
                          fontSize: 14,
                          border: '1px solid #A67B5B',
                          transition: 'all 0.2s ease-out',
                        }}
                        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      >
                        取消
                      </button>
                      <button
                        onClick={() => handleConfirmDelete(r.id)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#C0392B',
                          color: '#fff',
                          borderRadius: 8,
                          fontSize: 14,
                          fontWeight: 500,
                          transition: 'all 0.2s ease-out',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#A93226')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#C0392B')}
                        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      >
                        确认删除
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
