import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity } from '@/utils/api';
import { cityCoordinates, getCityColor } from '@/utils/cities';
import { Plus, X, Edit3, Trash2 } from 'lucide-react';

interface TimelineProps {
  activities: Activity[];
  onAdd: (payload: { date: string; city: string; summary: string; imageUrl?: string }) => Promise<void>;
  onReorder: (next: Activity[]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

interface ContextMenuState {
  id: string;
  x: number;
  y: number;
}

interface DeletingState {
  id: string;
}

const cityList = Object.keys(cityCoordinates).sort();

export default function Timeline({ activities, onAdd, onReorder, onDelete }: TimelineProps) {
  const [showModal, setShowModal] = useState(false);
  const [formCity, setFormCity] = useState(cityList[0]);
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formSummary, setFormSummary] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [deleting, setDeleting] = useState<DeletingState | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = () => setContextMenu(null);
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  const sorted = useMemo(
    () => [...activities].sort((a, b) => a.order - b.order),
    [activities],
  );

  const openModal = () => {
    setFormCity(cityList[0]);
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormSummary('');
    setShowModal(true);
  };

  const submitForm = async () => {
    if (!formCity || !formDate || !formSummary.trim()) return;
    await onAdd({
      city: formCity,
      date: formDate,
      summary: formSummary.trim(),
    });
    setShowModal(false);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverIndex(index);
  };

  const handleDragEnd = () => {
    setDragId(null);
    setOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!dragId) return;
    const fromIndex = sorted.findIndex(a => a.id === dragId);
    if (fromIndex === targetIndex || fromIndex === -1) {
      handleDragEnd();
      return;
    }
    const next = [...sorted];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(targetIndex, 0, moved);
    next.forEach((a, i) => (a.order = i));
    handleDragEnd();
    await onReorder(next);
  };

  const onLongPressStart = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    const point = 'touches' in e ? e.touches[0] : e;
    const { clientX, clientY } = point as { clientX: number; clientY: number };
    longPressTimer.current = setTimeout(() => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContextMenu({
          id,
          x: Math.min(clientX - rect.left, rect.width - 140),
          y: clientY - rect.top,
        });
      }
    }, 2000);
  };

  const onLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDeleteClick = async (id: string) => {
    setContextMenu(null);
    setDeleting({ id });
    setTimeout(async () => {
      await onDelete(id);
      setDeleting(null);
    }, 300);
  };

  return (
    <div ref={containerRef} className="h-full w-full relative">
      <div className="h-full w-full overflow-y-auto scrollbar-thin px-10 py-8">
        <div className="mb-6">
          <div className="text-xl font-semibold" style={{ color: '#333' }}>
            行程时间轴
          </div>
          <div className="text-sm mt-1" style={{ color: '#9E9E9E' }}>
            共 {sorted.length} 条记录 · 长按卡片可编辑或删除 · 拖拽调整顺序
          </div>
        </div>

        {sorted.length === 0 ? (
          <div
            className="mt-20 flex flex-col items-center gap-3"
            style={{ color: '#9E9E9E' }}
          >
            <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <div className="text-base">还没有行程，点击右下角按钮添加</div>
          </div>
        ) : (
          <div className="relative pl-3">
            <div
              className="absolute left-[7px] top-1 bottom-1"
              style={{ width: 2, background: '#E0E0E0' }}
            />
            {sorted.map((activity, index) => {
              const color = getCityColor(activity.city, sorted);
              const isDragging = dragId === activity.id;
              const showDropAbove = overIndex === index && dragId && dragId !== activity.id;
              const isDeleting = deleting?.id === activity.id;
              return (
                <div
                  key={activity.id}
                  className={`relative ${isDeleting ? 'animate-slide-left-out' : ''}`}
                  draggable={!isDeleting}
                  onDragStart={e => handleDragStart(e, activity.id)}
                  onDragOver={e => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onDrop={e => handleDrop(e, index)}
                  onMouseDown={e => onLongPressStart(e, activity.id)}
                  onMouseUp={onLongPressEnd}
                  onMouseLeave={onLongPressEnd}
                  onTouchStart={e => onLongPressStart(e, activity.id)}
                  onTouchEnd={onLongPressEnd}
                  onTouchCancel={onLongPressEnd}
                  onContextMenu={e => {
                    e.preventDefault();
                    if (containerRef.current) {
                      const rect = containerRef.current.getBoundingClientRect();
                      setContextMenu({
                        id: activity.id,
                        x: Math.min(e.clientX - rect.left, rect.width - 140),
                        y: e.clientY - rect.top,
                      });
                    }
                  }}
                  style={{
                    opacity: isDragging ? 0.7 : 1,
                    transform: isDragging ? 'translateY(5px)' : 'none',
                    transition: 'transform 0.2s ease, opacity 0.2s ease',
                    cursor: 'grab',
                  }}
                >
                  {showDropAbove && (
                    <div
                      className="absolute left-0 right-0 -top-1 rounded"
                      style={{ height: 4, background: '#4CAF50' }}
                    />
                  )}
                  <div
                    className="absolute rounded-full animate-pop-in"
                    style={{
                      width: 14,
                      height: 14,
                      background: color,
                      border: '2px solid #fff',
                      left: 0,
                      top: 33,
                      transform: 'translate(-50%, -50%)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                      zIndex: 2,
                    }}
                  />
                  <div
                    className="ml-6 mb-4 rounded-2xl bg-white overflow-hidden flex"
                    style={{
                      minHeight: 80,
                      boxShadow: '0 2px 8px #0000000D, 0 4px 16px #0000000A',
                      transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                    }}
                  >
                    <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium" style={{ color: '#9E9E9E' }}>
                          {activity.date}
                        </span>
                        <span
                          className="text-[16px] font-semibold truncate"
                          style={{ color: '#333' }}
                        >
                          {activity.city}
                        </span>
                      </div>
                      <div
                        className="mt-1 text-sm leading-snug line-clamp-2"
                        style={{ color: '#757575', fontSize: 14 }}
                      >
                        {activity.summary.length > 50
                          ? activity.summary.slice(0, 50) + '...'
                          : activity.summary}
                      </div>
                    </div>
                    <div className="p-3 flex items-center justify-center">
                      <img
                        src={activity.imageUrl}
                        alt={activity.city}
                        style={{
                          width: 80,
                          height: 60,
                          borderRadius: 4,
                          objectFit: 'cover',
                          background: '#f0f0f0',
                        }}
                        onError={e => {
                          (e.currentTarget as HTMLImageElement).src =
                            `https://source.unsplash.com/featured/160x120/?${encodeURIComponent(activity.city)}`;
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {contextMenu && (
        <div
          onClick={e => e.stopPropagation()}
          className="absolute z-50 rounded-lg py-1 animate-fade-in"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            background: '#424242',
            boxShadow: '0 6px 18px #0000003D',
            minWidth: 120,
          }}
        >
          <button
            onClick={() => {
              const a = activities.find(x => x.id === contextMenu.id);
              if (a) {
                setFormCity(a.city);
                setFormDate(a.date);
                setFormSummary(a.summary);
                setShowModal(true);
              }
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 flex items-center gap-2 text-sm text-white transition-colors"
            style={{ fontSize: 14 }}
            onMouseEnter={e => (e.currentTarget.style.background = '#616161')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Edit3 size={14} />
            编辑
          </button>
          <button
            onClick={() => handleDeleteClick(contextMenu.id)}
            className="w-full px-4 py-2 flex items-center gap-2 text-sm text-white transition-colors"
            style={{ fontSize: 14 }}
            onMouseEnter={e => (e.currentTarget.style.background = '#616161')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Trash2 size={14} />
            删除
          </button>
        </div>
      )}

      <button
        onClick={openModal}
        onMouseDown={e => {
          const btn = e.currentTarget;
          btn.style.transform = 'scale(0.95)';
          setTimeout(() => {
            btn.style.transform = 'scale(1)';
          }, 150);
        }}
        className="absolute bottom-6 right-6 text-white flex items-center justify-center shadow-lg"
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#4CAF50',
          transition: 'transform 0.3s ease, box-shadow 0.2s ease',
          boxShadow: '0 6px 18px rgba(76,175,80,0.4)',
          zIndex: 40,
        }}
      >
        <Plus size={24} />
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in"
          style={{ background: '#00000055' }}
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white"
            style={{
              width: 'min(500px, 90%)',
              borderRadius: 16,
              boxShadow: '0 10px 40px #0000001A',
              padding: 24,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-semibold" style={{ color: '#333' }}>
                添加行程
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full transition-colors"
                onMouseEnter={e => (e.currentTarget.style.background = '#F5F5F5')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <X size={18} style={{ color: '#9E9E9E' }} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1.5" style={{ color: '#616161' }}>
                  城市
                </label>
                <div className="relative">
                  <select
                    value={formCity}
                    onChange={e => setFormCity(e.target.value)}
                    className="w-full appearance-none bg-white outline-none text-sm pr-8"
                    style={{
                      height: 44,
                      borderRadius: 8,
                      border: '1px solid #E0E0E0',
                      color: '#333',
                      padding: '0 12px',
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#4CAF50')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#E0E0E0')}
                  >
                    {cityList.map(c => (
                      <option
                        key={c}
                        value={c}
                        onMouseEnter={e => ((e.currentTarget as HTMLOptionElement).style.background = '#E8F5E9')}
                      >
                        {c}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="absolute right-3 top-1/2 pointer-events-none"
                    style={{ transform: 'translateY(-50%)', color: '#9E9E9E' }}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1.5" style={{ color: '#616161' }}>
                  日期
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="w-full outline-none text-sm"
                  style={{
                    height: 44,
                    borderRadius: 8,
                    border: '1px solid #E0E0E0',
                    color: '#333',
                    padding: '0 12px',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#4CAF50')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#E0E0E0')}
                />
              </div>

              <div>
                <label className="block text-sm mb-1.5" style={{ color: '#616161' }}>
                  行程摘要
                </label>
                <textarea
                  value={formSummary}
                  onChange={e => setFormSummary(e.target.value)}
                  placeholder="描述一下这一天的精彩行程..."
                  className="w-full outline-none text-sm resize-none p-3"
                  style={{
                    height: 120,
                    borderRadius: 8,
                    border: '1px solid #E0E0E0',
                    color: '#333',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = '#4CAF50';
                    e.currentTarget.style.setProperty('--ph', '#BDBDBD');
                  }}
                  onBlur={e => (e.currentTarget.style.borderColor = '#E0E0E0')}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 text-sm font-medium"
                style={{
                  height: 40,
                  borderRadius: 8,
                  color: '#616161',
                  background: '#F5F5F5',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#EEEEEE')}
                onMouseLeave={e => (e.currentTarget.style.background = '#F5F5F5')}
              >
                取消
              </button>
              <button
                onClick={submitForm}
                disabled={!formCity || !formDate || !formSummary.trim()}
                className="px-5 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  height: 40,
                  borderRadius: 8,
                  background: '#4CAF50',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.background = '#43A047')}
                onMouseLeave={e => (e.currentTarget.style.background = '#4CAF50')}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
