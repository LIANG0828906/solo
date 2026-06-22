import { useState, useRef, useEffect } from 'react';
import { List, X, Calendar, MapPin, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import type { ItineraryItem } from '@/types';

export default function Itinerary() {
  const itinerary = useAppStore((state) => state.itinerary);
  const showItineraryPanel = useAppStore((state) => state.showItineraryPanel);
  const toggleItineraryPanel = useAppStore((state) => state.toggleItineraryPanel);
  const removeFromItinerary = useAppStore((state) => state.removeFromItinerary);
  const reorderItinerary = useAppStore((state) => state.reorderItinerary);
  const getItineraryStats = useAppStore((state) => state.getItineraryStats);

  const [pressedCardId, setPressedCardId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stats = getItineraryStats();

  useEffect(() => {
    return () => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
      }
    };
  }, []);

  const handlePressStart = (id: string) => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
    pressTimerRef.current = setTimeout(() => {
      setPressedCardId(id);
    }, 800);
  };

  const handlePressEnd = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const handleRemove = (id: string) => {
    removeFromItinerary(id);
    setPressedCardId(null);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === toIndex) {
      setDraggedIndex(null);
      return;
    }
    reorderItinerary(draggedIndex, toIndex);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  if (!showItineraryPanel) {
    return (
      <button
        onClick={() => toggleItineraryPanel(true)}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full',
          'bg-brand-orange text-white shadow-card-hover transition-transform hover:scale-110',
          'active:scale-95'
        )}
      >
        <List size={24} />
        {stats.totalItems > 0 && (
          <span className={cn(
            'absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center',
            'rounded-full bg-red-500 px-1 text-xs font-bold text-white'
          )}>
            {stats.totalItems > 99 ? '99+' : stats.totalItems}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className={cn(
        'itinerary-panel fixed bottom-6 right-6 z-50 flex w-80 max-h-[70vh] flex-col',
        'rounded-2xl bg-white shadow-card-hover animate-slide-in-left'
      )}
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-text-dark">我的行程</h3>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <List size={14} />
              {stats.totalItems}项
            </span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {stats.totalDays}天
            </span>
          </div>
        </div>
        <button
          onClick={() => toggleItineraryPanel(false)}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full',
            'text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600'
          )}
        >
          <X size={18} />
        </button>
      </div>

      <div className={cn(
        'flex-1 overflow-y-auto custom-scrollbar p-3',
        itinerary.length === 0 ? 'min-h-32' : ''
      )}>
        {itinerary.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-8 text-gray-400">
            <Calendar size={36} strokeWidth={1.5} />
            <p className="text-sm">暂无行程，快去添加吧</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {itinerary.map((item: ItineraryItem, index: number) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onMouseDown={() => handlePressStart(item.id)}
                onMouseUp={handlePressEnd}
                onMouseLeave={handlePressEnd}
                onTouchStart={() => handlePressStart(item.id)}
                onTouchEnd={handlePressEnd}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl border border-gray-100',
                  'bg-white p-2 shadow-card transition-all animate-slide-in-left',
                  'cursor-grab active:cursor-grabbing',
                  draggedIndex === index ? 'opacity-50 scale-95' : '',
                  pressedCardId === item.id ? 'border-red-300 bg-red-50' : 'hover:shadow-card-hover'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center text-gray-300">
                  <GripVertical size={16} />
                </div>

                <img
                  src={item.image}
                  alt={item.name}
                  className="h-14 w-14 flex-shrink-0 rounded-lg object-cover"
                />

                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="truncate font-semibold text-text-dark">{item.name}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="flex items-center gap-0.5">
                      <MapPin size={12} />
                      <span className="truncate">{item.region}</span>
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Calendar size={12} />
                      {item.date}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(item.id);
                  }}
                  className={cn(
                    'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full',
                    'bg-red-500 text-white shadow-md transition-all',
                    pressedCardId === item.id
                      ? 'flex animate-bounce-soft'
                      : 'hidden'
                  )}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
