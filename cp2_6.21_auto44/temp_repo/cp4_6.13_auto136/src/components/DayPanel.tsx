import { useState, useRef, useCallback } from 'react';

type Preference = 'food' | 'history' | 'nature' | 'shopping';

interface Spot {
  id: string;
  name: string;
  category: Preference;
  description: string;
  fullDescription: string;
  duration: number;
  lat: number;
  lng: number;
}

interface DayPlan {
  day: number;
  spots: Spot[];
}

interface DayPanelProps {
  plan: DayPlan;
  dayColor: string;
  isExpanded: boolean;
  expandedSpots: Set<string>;
  onToggleDay: () => void;
  onToggleSpot: (spotId: string) => void;
  onMoveSpot: (fromDay: number, fromIndex: number, toDay: number, toIndex: number) => void;
  totalDays: number;
}

const CAT_ICONS: Record<Preference, { icon: string; color: string }> = {
  food: { icon: '🍜', color: '#FF6B6B' },
  history: { icon: '🏛️', color: '#9C27B0' },
  nature: { icon: '🌿', color: '#4CAF50' },
  shopping: { icon: '🛍️', color: '#FF9800' },
};

const CAT_LABELS: Record<Preference, string> = {
  food: '美食',
  history: '历史',
  nature: '自然',
  shopping: '购物',
};

export default function DayPanel({
  plan,
  dayColor,
  isExpanded,
  expandedSpots,
  onToggleDay,
  onToggleSpot,
  onMoveSpot,
  totalDays,
}: DayPanelProps) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragOverDay, setIsDragOverDay] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const dropAnimateRef = useRef<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, spotIndex: number) => {
    const target = e.currentTarget as HTMLElement;
    setTimeout(() => target.classList.add('dragging'), 0);
    e.dataTransfer.setData('application/json', JSON.stringify({
      spotId: plan.spots[spotIndex].id,
      fromDay: plan.day,
      fromIndex: spotIndex,
    }));
    e.dataTransfer.effectAllowed = 'move';
  }, [plan.day, plan.spots]);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).classList.remove('dragging');
    setDragOverIndex(null);
    setIsDragOverDay(false);
  }, []);

  const handleSpotDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDayDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOverDay(true);
  }, []);

  const handleDayDragLeave = useCallback((e: React.DragEvent) => {
    if (cardRef.current && !cardRef.current.contains(e.relatedTarget as Node)) {
      setIsDragOverDay(false);
      setDragOverIndex(null);
    }
  }, []);

  const handleSpotDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      onMoveSpot(data.fromDay, data.fromIndex, plan.day, toIndex);
      dropAnimateRef.current = data.spotId;
      setTimeout(() => { dropAnimateRef.current = null; }, 250);
    } catch { /* ignore */ }
    setDragOverIndex(null);
    setIsDragOverDay(false);
  }, [onMoveSpot, plan.day]);

  const handleDayDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      onMoveSpot(data.fromDay, data.fromIndex, plan.day, plan.spots.length);
      dropAnimateRef.current = data.spotId;
      setTimeout(() => { dropAnimateRef.current = null; }, 250);
    } catch { /* ignore */ }
    setDragOverIndex(null);
    setIsDragOverDay(false);
  }, [onMoveSpot, plan.day, plan.spots.length]);

  const formatDuration = (min: number) => {
    if (min < 60) return `${min}分钟`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}小时${m}分钟` : `${h}小时`;
  };

  return (
    <div
      ref={cardRef}
      className={`day-card ${isDragOverDay ? 'drag-over' : ''}`}
      onDragOver={handleDayDragOver}
      onDragLeave={handleDayDragLeave}
      onDrop={handleDayDrop}
    >
      <div
        className="day-header"
        style={{ '--day-color': dayColor } as React.CSSProperties}
        onClick={onToggleDay}
      >
        <div className="day-header-left">
          <div className="day-number" style={{ backgroundColor: dayColor }}>
            {plan.day}
          </div>
          <div>
            <span className="day-title">第{plan.day}天</span>
            <span className="day-spot-count">{plan.spots.length}个景点</span>
          </div>
        </div>
        <div className={`day-toggle ${isExpanded ? 'expanded' : ''}`}>
          ▼
        </div>
      </div>

      <div className={`day-content ${isExpanded ? 'expanded' : ''}`}>
        <div className="day-spots">
          {plan.spots.map((spot, index) => {
            const catInfo = CAT_ICONS[spot.category];
            const isExpanded = expandedSpots.has(spot.id);
            const isDragOver = dragOverIndex === index;

            return (
              <div
                key={spot.id}
                className={`spot-card ${isDragOver ? 'drag-over-spot' : ''} ${dropAnimateRef.current === spot.id ? 'drop-animate' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleSpotDragOver(e, index)}
                onDrop={(e) => handleSpotDrop(e, index)}
              >
                <div className="spot-card-header">
                  <div className="spot-left">
                    <div
                      className="spot-category-icon"
                      style={{ backgroundColor: catInfo.color }}
                    >
                      {catInfo.icon}
                    </div>
                    <span className="spot-name">{spot.name}</span>
                  </div>
                  <div className="spot-duration">
                    ⏱ {formatDuration(spot.duration)}
                  </div>
                </div>

                <div className="spot-description">
                  {spot.description}
                  <span
                    className="spot-expand-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSpot(spot.id);
                    }}
                  >
                    {isExpanded ? '收起' : '详情'}
                  </span>
                </div>

                {isExpanded && (
                  <div className="spot-detail">
                    {spot.fullDescription}
                    <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                      📍 {CAT_LABELS[spot.category]} · ⏱ {formatDuration(spot.duration)} · 📌 {spot.lat.toFixed(4)}, {spot.lng.toFixed(4)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
