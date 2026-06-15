import { useState, useRef, useEffect, useCallback } from 'react';
import { Circle, Play, Move, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import type { Material } from '@/utils/helpers';

interface TimelineViewProps {
  materials: Material[];
  onSelectMaterial: (id: string) => void;
  selectedId: string | null;
  readOnly?: boolean;
}

const GRADIENT_COLORS = [
  '#667eea', '#7c6fe0', '#8f65d9', '#a15ad3', '#b14fcd',
  '#c045c6', '#ce3bbe', '#db32b5', '#e52cac', '#ef28a0',
  '#f5576c', '#fa709a',
];

export default function TimelineView({ materials, onSelectMaterial, selectedId, readOnly }: TimelineViewProps) {
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [isVertical, setIsVertical] = useState(false);
  const [pointerPosition, setPointerPosition] = useState(0);
  const [isDraggingPointer, setIsDraggingPointer] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragStartPos = useRef(0);

  useEffect(() => {
    const check = () => setIsVertical(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (selectedId && materials.length > 0) {
      const idx = materials.findIndex((m) => m.id === selectedId);
      if (idx >= 0) {
        setPointerPosition(Math.max(0, Math.min(100, (idx / Math.max(1, materials.length - 1)) * 100)));
      }
    }
  }, [selectedId, materials]);

  const getNodeColor = (idx: number) => GRADIENT_COLORS[idx % GRADIENT_COLORS.length];

  const handleNodeClick = useCallback((id: string, idx: number) => {
    onSelectMaterial(id);
    setActiveNote(activeNote === id ? null : id);
    if (materials.length > 1) {
      setPointerPosition((idx / (materials.length - 1)) * 100);
    }
  }, [activeNote, materials.length, onSelectMaterial]);

  const handlePointerDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (materials.length < 2) return;
    e.preventDefault();
    setIsDraggingPointer(true);
    if ('touches' in e) {
      dragStartX.current = e.touches[0].clientX;
      dragStartY.current = e.touches[0].clientY;
    } else {
      dragStartX.current = e.clientX;
      dragStartY.current = e.clientY;
    }
    dragStartPos.current = pointerPosition;
  };

  const handlePointerDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDraggingPointer || !trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    let newPos: number;
    if (isVertical) {
      const deltaY = clientY - dragStartY.current;
      const deltaPct = (deltaY / rect.height) * 100;
      newPos = Math.max(0, Math.min(100, dragStartPos.current + deltaPct));
    } else {
      const deltaX = clientX - dragStartX.current;
      const deltaPct = (deltaX / rect.width) * 100;
      newPos = Math.max(0, Math.min(100, dragStartPos.current + deltaPct));
    }
    setPointerPosition(newPos);

    if (materials.length > 1) {
      const idx = Math.round((newPos / 100) * (materials.length - 1));
      const clampedIdx = Math.max(0, Math.min(materials.length - 1, idx));
      const mat = materials[clampedIdx];
      if (mat && mat.id !== selectedId) {
        onSelectMaterial(mat.id);
        setActiveNote(mat.id);
        if (containerRef.current) {
          const el = containerRef.current.querySelector(`[data-node-id="${mat.id}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }
        }
      }
    }
  }, [isDraggingPointer, isVertical, materials, onSelectMaterial, selectedId]);

  const handlePointerDragEnd = useCallback(() => {
    setIsDraggingPointer(false);
  }, []);

  useEffect(() => {
    if (isDraggingPointer) {
      window.addEventListener('mousemove', handlePointerDragMove);
      window.addEventListener('mouseup', handlePointerDragEnd);
      window.addEventListener('touchmove', handlePointerDragMove, { passive: false });
      window.addEventListener('touchend', handlePointerDragEnd);
      return () => {
        window.removeEventListener('mousemove', handlePointerDragMove);
        window.removeEventListener('mouseup', handlePointerDragEnd);
        window.removeEventListener('touchmove', handlePointerDragMove);
        window.removeEventListener('touchend', handlePointerDragEnd);
      };
    }
  }, [isDraggingPointer, handlePointerDragMove, handlePointerDragEnd]);

  const handleTrackClick = (e: React.MouseEvent) => {
    if (!trackRef.current || materials.length < 2) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = isVertical
      ? ((e.clientY - rect.top) / rect.height) * 100
      : ((e.clientX - rect.left) / rect.width) * 100;
    const clamped = Math.max(0, Math.min(100, pct));
    setPointerPosition(clamped);
    const idx = Math.round((clamped / 100) * (materials.length - 1));
    const mat = materials[Math.max(0, Math.min(materials.length - 1, idx))];
    if (mat) {
      handleNodeClick(mat.id, idx);
    }
  };

  const navigateNode = (direction: 'prev' | 'next') => {
    if (materials.length === 0) return;
    const currentIdx = selectedId ? materials.findIndex((m) => m.id === selectedId) : (direction === 'next' ? -1 : 0);
    const targetIdx = direction === 'next'
      ? Math.min(materials.length - 1, currentIdx + 1)
      : Math.max(0, currentIdx - 1);
    const mat = materials[targetIdx];
    if (mat) {
      handleNodeClick(mat.id, targetIdx);
      if (containerRef.current) {
        const el = containerRef.current.querySelector(`[data-node-id="${mat.id}"]`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  };

  if (materials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 sm:py-28 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#667eea]/10 to-[#764ba2]/10 flex items-center justify-center mb-4">
          <Circle size={26} className="text-purple-400 opacity-60" />
        </div>
        <p className="text-gray-400 text-sm font-light" style={{ fontFamily: 'Noto Sans SC, sans-serif' }}>
          添加素材后将在此展示时间轴视图
        </p>
        <p className="text-gray-600 text-xs mt-1">切换回「自由」模式添加第一张素材</p>
      </div>
    );
  }

  if (isVertical) {
    return (
      <div className="relative py-2" ref={containerRef}>
        <div className="flex gap-2 sm:gap-4">
          <div className="flex flex-col items-center" style={{ width: '52px' }}>
            <button
              onClick={() => navigateNode('prev')}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-all mb-2"
            >
              <ChevronUp size={16} />
            </button>

            <div
              ref={trackRef}
              className="relative w-2 flex-1 cursor-pointer rounded-full bg-white/5"
              onClick={handleTrackClick}
              style={{ minHeight: `${Math.max(300, materials.length * 140)}px` }}
            >
              <div
                className="absolute inset-x-0 top-0 rounded-full"
                style={{
                  height: `${pointerPosition}%`,
                  background: `linear-gradient(to bottom, ${GRADIENT_COLORS.slice(0, 6).join(', ')})`,
                  opacity: 0.7,
                  transition: isDraggingPointer ? 'none' : 'all 0.2s ease',
                }}
              />

              {materials.map((_, idx) => {
                const pct = materials.length > 1 ? (idx / (materials.length - 1)) * 100 : 50;
                return (
                  <div
                    key={`tick-${idx}`}
                    className="absolute left-1/2 -translate-x-1/2 w-3 h-0.5 bg-white/20 rounded-full"
                    style={{ top: `${pct}%` }}
                  />
                );
              })}

              <div
                className="absolute left-1/2 -translate-x-1/2 z-30 cursor-grab active:cursor-grabbing"
                style={{
                  top: `calc(${pointerPosition}% - 14px)`,
                  transition: isDraggingPointer ? 'none' : 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
                onMouseDown={handlePointerDragStart}
                onTouchStart={handlePointerDragStart}
              >
                <div
                  className={`relative w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition-all ${
                    isDraggingPointer ? 'scale-110' : 'hover:scale-105'
                  }`}
                  style={{
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    boxShadow: '0 0 20px rgba(118, 75, 162, 0.5)',
                  }}
                >
                  <Move size={12} className="text-white rotate-90" />
                  {isDraggingPointer && (
                    <span className="absolute inset-0 rounded-full animate-ping bg-purple-400 opacity-40" />
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => navigateNode('next')}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-all mt-2"
            >
              <ChevronDown size={16} />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            {materials.map((mat, idx) => {
              const color = getNodeColor(idx);
              const isSelected = selectedId === mat.id;
              const pct = materials.length > 1 ? (idx / (materials.length - 1)) * 100 : 50;
              return (
                <div
                  key={mat.id}
                  data-node-id={mat.id}
                  className="relative flex items-start mb-8 last:mb-0"
                  style={{
                    minHeight: '120px',
                    opacity: isSelected ? 1 : 0.92,
                    transition: 'all 0.3s ease',
                  }}
                >
                  <div
                    className="absolute left-[-44px] top-6 -translate-x-1/2 z-10"
                  >
                    <button
                      onClick={() => handleNodeClick(mat.id, idx)}
                      className={`relative flex items-center justify-center transition-all duration-300 ${
                        isSelected ? 'scale-130' : 'hover:scale-115'
                      }`}
                    >
                      {isSelected && (
                        <span
                          className="absolute w-7 h-7 rounded-full animate-ping opacity-30"
                          style={{ backgroundColor: color }}
                        />
                      )}
                      <span
                        className="relative w-3.5 h-3.5 rounded-full border-[3px] border-[#0f0f1a] shadow-md"
                        style={{
                          backgroundColor: color,
                          boxShadow: isSelected ? `0 0 16px ${color}90` : undefined,
                        }}
                      />
                    </button>
                  </div>

                  {idx < materials.length - 1 && (
                    <svg
                      className="absolute left-[-44px] top-8 -translate-x-1/2 z-0 pointer-events-none"
                      width="2"
                      height="calc(100% + 8px)"
                      style={{ top: '38px', height: 'calc(100% - 6px)' }}
                    >
                      <defs>
                        <linearGradient id={`vgrad-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor={getNodeColor(idx)} stopOpacity="0.5" />
                          <stop offset="100%" stopColor={getNodeColor(idx + 1)} stopOpacity="0.5" />
                        </linearGradient>
                      </defs>
                      <line
                        x1="1"
                        y1="0"
                        x2="1"
                        y2="100%"
                        stroke={`url(#vgrad-${idx})`}
                        strokeWidth="2"
                        strokeDasharray="4 6"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}

                  <div
                    className={`w-full rounded-2xl overflow-hidden bg-[#1a1a2e] shadow-md transition-all duration-300 cursor-pointer group ${
                      isSelected
                        ? 'ring-2 ring-purple-400/50 shadow-xl -translate-y-0.5'
                        : 'hover:-translate-y-1 hover:shadow-xl'
                    }`}
                    onClick={() => handleNodeClick(mat.id, idx)}
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={mat.imageUrl}
                        alt=""
                        className="w-full h-40 sm:h-48 object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        draggable={false}
                      />
                      <div
                        className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-medium text-white shadow-md backdrop-blur-sm"
                        style={{
                          backgroundColor: `${color}dd`,
                        }}
                      >
                        #{String(idx + 1).padStart(2, '0')}
                      </div>
                    </div>
                    {mat.note && (
                      <div className="px-4 py-3 bg-gradient-to-b from-[#1a1a2e] to-[#141424] border-t border-white/5">
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                          {mat.note}
                        </p>
                      </div>
                    )}
                  </div>

                  {activeNote === mat.id && (
                    <div className="mt-3 p-4 rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#15152a] border border-purple-500/20 animate-slideUp text-sm text-gray-300 shadow-xl">
                      <div className="flex items-start gap-2">
                        <Play size={14} className="text-purple-400 shrink-0 mt-0.5" />
                        <div className="flex-1 leading-relaxed">
                          {mat.note || '暂无备注内容'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 px-14 py-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-[11px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <Move size={12} />
            拖动滑块快速定位节点
          </span>
          <span>
            {selectedId
              ? `#${String((materials.findIndex((m) => m.id === selectedId) + 1)).padStart(2, '0')} / ${String(materials.length).padStart(2, '0')}`
              : `共 ${materials.length} 个节点`}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative py-4" ref={containerRef}>
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          onClick={() => navigateNode('prev')}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
          title="上一个节点"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex items-center gap-2 text-[11px] text-gray-500">
          <Move size={12} />
          <span className="hidden sm:inline">拖动滑块快速定位 ·</span>
          <span className="text-purple-300/80 font-medium">
            {selectedId
              ? `节点 #${String((materials.findIndex((m) => m.id === selectedId) + 1)).padStart(2, '0')}`
              : `${materials.length} 个节点`}
          </span>
        </div>

        <button
          onClick={() => navigateNode('next')}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
          title="下一个节点"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div
        ref={trackRef}
        className="relative h-14 rounded-2xl bg-white/[0.02] border border-white/5 cursor-pointer mb-10 overflow-hidden"
        onClick={handleTrackClick}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-l-2xl"
          style={{
            width: `${pointerPosition}%`,
            background: `linear-gradient(90deg, ${GRADIENT_COLORS.slice(0, 6).join(', ')})`,
            opacity: 0.25,
            transition: isDraggingPointer ? 'none' : 'all 0.2s ease',
          }}
        />

        <div
          className="absolute inset-y-2 left-4 right-4 flex items-center gap-1 pointer-events-none"
          style={{ justifyContent: 'space-between' }}
        >
          {materials.map((_, idx) => {
            const color = getNodeColor(idx);
            const pct = materials.length > 1 ? (idx / (materials.length - 1)) * 100 : 50;
            return (
              <div
                key={`indicator-${idx}`}
                className="absolute w-2 h-2 rounded-full transition-all"
                style={{
                  left: `calc(${pct}% - 4px)`,
                  backgroundColor: color,
                  opacity: selectedId === materials[idx].id ? 1 : 0.6,
                  transform: selectedId === materials[idx].id ? 'scale(1.5)' : 'scale(1)',
                  boxShadow: selectedId === materials[idx].id ? `0 0 10px ${color}90` : undefined,
                }}
              />
            );
          })}
        </div>

        <div
          className="absolute top-1/2 -translate-y-1/2 z-30 cursor-grab active:cursor-grabbing select-none"
          style={{
            left: `calc(${pointerPosition}% - 18px)`,
            transition: isDraggingPointer ? 'none' : 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
          onMouseDown={handlePointerDragStart}
          onTouchStart={handlePointerDragStart}
        >
          <div
            className={`relative w-9 h-9 rounded-xl flex items-center justify-center shadow-2xl transition-all ${
              isDraggingPointer ? 'scale-115 rotate-3' : 'hover:scale-110'
            }`}
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              boxShadow: '0 8px 24px rgba(118, 75, 162, 0.5)',
            }}
          >
            <Move size={14} className="text-white" />
            {isDraggingPointer && (
              <span className="absolute inset-0 rounded-xl animate-ping bg-purple-400 opacity-30" />
            )}
          </div>
          <div
            className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-1 h-4 rounded-full"
            style={{
              background: 'linear-gradient(180deg, #764ba2aa, transparent)',
            }}
          />
        </div>
      </div>

      <div className="relative overflow-x-auto pb-4 -mx-2 sm:mx-0 px-2 sm:px-0">
        <div
          className="relative flex items-start gap-4 sm:gap-6 py-2"
          style={{ minWidth: `${Math.max(100, materials.length * 220)}px`, paddingBottom: '12px' }}
        >
          {materials.length > 1 && (
            <svg
              className="absolute pointer-events-none"
              style={{
                top: '17px',
                left: '88px',
                width: `calc(100% - 176px)`,
                height: '4px',
              }}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="main-timeline-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  {GRADIENT_COLORS.slice(0, 8).map((c, i) => (
                    <stop
                      key={c}
                      offset={`${(i / 7) * 100}%`}
                      stopColor={c}
                      stopOpacity="0.7"
                    />
                  ))}
                </linearGradient>
              </defs>
              <line
                x1="0"
                y1="2"
                x2="100%"
                y2="2"
                stroke="url(#main-timeline-grad)"
                strokeWidth="3"
                strokeDasharray="6 8"
                strokeLinecap="round"
              />
            </svg>
          )}

          {materials.map((mat, idx) => {
            const color = getNodeColor(idx);
            const isSelected = selectedId === mat.id;
            return (
              <div
                key={mat.id}
                data-node-id={mat.id}
                className={`relative flex flex-col items-center shrink-0 transition-all duration-500 ${
                  isSelected ? 'z-10 scale-100' : 'z-0 scale-[0.98]'
                }`}
                style={{ width: '180px' }}
              >
                <button
                  onClick={() => handleNodeClick(mat.id, idx)}
                  className={`relative z-20 mb-5 flex items-center justify-center transition-all duration-300 ${
                    isSelected ? 'scale-140' : 'hover:scale-125'
                  }`}
                >
                  {isSelected && (
                    <>
                      <span
                        className="absolute w-8 h-8 rounded-full animate-ping opacity-30"
                        style={{ backgroundColor: color }}
                      />
                      <span
                        className="absolute w-10 h-10 rounded-full animate-pulse opacity-20"
                        style={{ backgroundColor: color }}
                      />
                    </>
                  )}
                  <div
                    className="relative w-5 h-5 rounded-full border-[3px] border-[#0f0f1a] z-10"
                    style={{
                      backgroundColor: color,
                      boxShadow: isSelected
                        ? `0 0 0 3px ${color}40, 0 0 24px ${color}90`
                        : `0 2px 8px ${color}40`,
                    }}
                  />
                </button>

                <div
                  className={`w-full rounded-2xl overflow-hidden bg-[#1a1a2e] shadow-md transition-all duration-300 cursor-pointer group ${
                    isSelected
                      ? 'ring-2 shadow-xl ring-purple-400/40 -translate-y-1'
                      : 'hover:-translate-y-1.5 hover:shadow-xl'
                  }`}
                  onClick={() => handleNodeClick(mat.id, idx)}
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={mat.imageUrl}
                      alt=""
                      className="w-full h-28 object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      draggable={false}
                      loading="lazy"
                    />
                    <div
                      className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-md"
                      style={{
                        backgroundColor: `${color}e6`,
                        letterSpacing: '0.03em',
                      }}
                    >
                      #{String(idx + 1).padStart(2, '0')}
                    </div>
                    {mat.note && (
                      <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-purple-500/90 flex items-center justify-center shadow-md">
                        <span className="text-[9px] text-white font-bold">✎</span>
                      </div>
                    )}
                  </div>
                  {mat.note && (
                    <div className="px-3 py-2.5 bg-gradient-to-b from-[#1a1a2e] to-[#141424] border-t border-white/5">
                      <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                        {mat.note}
                      </p>
                    </div>
                  )}
                </div>

                {activeNote === mat.id && (
                  <div
                    className="absolute top-full left-0 right-0 mt-3 p-4 rounded-2xl border shadow-2xl animate-slideUp z-30"
                    style={{
                      background: `linear-gradient(135deg, ${color}15, #1a1a2e 60%)`,
                      borderColor: `${color}40`,
                    }}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: `${color}30` }}
                      >
                        <Play size={12} fill={color} style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-medium mb-1" style={{ color }}>
                          节点备注
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
                          {mat.note || '暂无备注，点击卡片可添加'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 px-2 sm:px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1">
            <div className="w-6 h-0.5 rounded-full" style={{ backgroundImage: `linear-gradient(90deg, ${GRADIENT_COLORS.slice(0, 4).join(', ')})` }} />
            时间主线
          </span>
          <span className="opacity-30">|</span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-purple-400" />
            节点位置
          </span>
        </div>
        <div className="text-purple-300/60">
          共 {materials.length} 张素材 · 点击节点查看详情
        </div>
      </div>
    </div>
  );
}
