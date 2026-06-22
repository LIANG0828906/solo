import { useState, useRef, useEffect } from 'react';
import type { DayItinerary, DayItineraryItem } from '../types';
import { INTEREST_LABELS, CATEGORY_COLORS } from '../types';
import { useApp } from '../context/AppContext';

interface DraggingInfo {
  dayIndex: number;
  itemIndex: number;
  attractionId: string;
}

function renderStars(rating: number) {
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

function ImageLoader({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  return (
    <div className={`card-thumb ${loaded ? '' : 'loading'}`}>
      {!error ? (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          style={{ opacity: loaded ? 1 : 0 }}
          loading="lazy"
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            background:
              'linear-gradient(135deg, #e0e0e0 0%, #f0f0f0 50%, #e0e0e0 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
            fontSize: 24,
          }}
        >
          📷
        </div>
      )}
    </div>
  );
}

function AttrCard({
  item,
  dayIndex,
  itemIndex,
  isHighlight,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  item: DayItineraryItem;
  dayIndex: number;
  itemIndex: number;
  isHighlight: boolean;
  onDragStart: (info: DraggingInfo) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (toDay: number, toIdx: number) => void;
}) {
  const { handleSelectAttraction, handleOpenModal, handleHighlight, state } =
    useApp();
  const isSelected = state.selectedAttractionId === item.attractionId;
  const cardRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (isHighlight && cardRef.current) {
      cardRef.current.classList.add('highlight-pulse');
      const t = setTimeout(() => {
        cardRef.current?.classList.remove('highlight-pulse');
      }, 1300);
      return () => clearTimeout(t);
    }
  }, [isHighlight]);

  return (
    <div
      ref={cardRef}
      className={`attraction-card ${dragOver ? 'drag-over' : ''}`}
      style={{
        borderLeftColor: CATEGORY_COLORS[item.attraction.category],
        transform: isSelected ? 'translateX(4px)' : undefined,
        boxShadow: isSelected ? 'var(--shadow-md)' : undefined,
      }}
      draggable
      onMouseEnter={() => handleHighlight(item.attractionId)}
      onClick={() => {
        handleSelectAttraction(item.attractionId);
        handleOpenModal(item.attraction);
      }}
      onDragStart={(e) => {
        e.stopPropagation();
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify({ dayIndex, itemIndex, attractionId: item.attractionId }));
        onDragStart({ dayIndex, itemIndex, attractionId: item.attractionId });
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
        onDragOver(e);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        onDrop(dayIndex, itemIndex);
      }}
    >
      <ImageLoader src={item.attraction.thumbnail} alt={item.attraction.name} />
      <div className="card-info">
        <div>
          <div className="card-name">{item.attraction.name}</div>
          <div className="card-rating">
            <span className="stars">{renderStars(item.attraction.rating)}</span>
            <span className="rating-num">{item.attraction.rating.toFixed(1)}</span>
            <span
              className="category-badge"
              style={{
                background: CATEGORY_COLORS[item.attraction.category],
                marginLeft: 4,
              }}
            >
              {INTEREST_LABELS[item.attraction.category]}
            </span>
          </div>
        </div>
        <div className="card-meta">
          <span className="meta-item">🕐 {item.startTime}-{item.endTime}</span>
          <span className="meta-item">⏱ {item.attraction.stayDuration}h</span>
          {item.commuteToNext > 0 && (
            <span className="meta-item">🚶 +{item.commuteToNext}min</span>
          )}
        </div>
      </div>
      <div
        className="drag-handle"
        onMouseDown={(e) => e.stopPropagation()}
      >
        ⋮⋮
      </div>
    </div>
  );
}

function DaySection({
  day,
  dayIndex,
  isHighlight,
  onDragStart,
  onDragEnd,
  onReorder,
  onMoveItem,
  dragging,
}: {
  day: DayItinerary;
  dayIndex: number;
  isHighlight: (attrId: string) => boolean;
  onDragStart: (info: DraggingInfo) => void;
  onDragEnd: () => void;
  onReorder: (dayIndex: number, from: number, to: number) => void;
  onMoveItem: (fromDay: number, fromIdx: number, toDay: number, toIdx: number) => void;
  dragging: DraggingInfo | null;
}) {
  const handleDrop = (toDay: number, toIdx: number) => {
    if (!dragging) return;
    if (dragging.dayIndex === toDay) {
      let finalTo = toIdx;
      if (dragging.itemIndex < toIdx) finalTo = toIdx;
      if (dragging.itemIndex === finalTo) return;
      onReorder(toDay, dragging.itemIndex, finalTo);
    } else {
      onMoveItem(dragging.dayIndex, dragging.itemIndex, toDay, toIdx);
    }
  };

  return (
    <div className="day-section">
      <div className="day-header">
        <div className="day-dot" />
        <span className="day-number">Day {day.day}</span>
        <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
          {day.date}
        </span>
        <div className="day-summary">
          <span>⏱ {day.totalDuration.toFixed(1)}h</span>
          <span>💰 ¥{day.totalCost}</span>
        </div>
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (!dragging) return;
          if (dragging.dayIndex !== dayIndex) {
            onMoveItem(dragging.dayIndex, dragging.itemIndex, dayIndex, day.items.length);
          }
        }}
      >
        {day.items.map((item, idx) => (
          <AttrCard
            key={item.attractionId + '-' + dayIndex}
            item={item}
            dayIndex={dayIndex}
            itemIndex={idx}
            isHighlight={isHighlight(item.attractionId)}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOver={() => {}}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  );
}

function ThemeSwitcher() {
  const { state, setTheme } = useApp();
  const themes: { value: 'coast' | 'forest' | 'neon'; label: string }[] = [
    { value: 'coast', label: '阳光海岸' },
    { value: 'forest', label: '森林秘境' },
    { value: 'neon', label: '都市霓虹' },
  ];
  return (
    <div className="theme-switcher" title="主题配色">
      {themes.map((t) => (
        <button
          key={t.value}
          type="button"
          className={`theme-btn ${state.theme === t.value ? 'active' : ''}`}
          data-theme-value={t.value}
          onClick={() => setTheme(t.value)}
          title={t.label}
        />
      ))}
    </div>
  );
}

function InputForm() {
  const { state, setCity, setDays, toggleInterest, handleGenerate } = useApp();
  const interests: { key: 'nature' | 'culture' | 'food' | 'shopping'; label: string; emoji: string }[] = [
    { key: 'nature', label: '自然风光', emoji: '🌿' },
    { key: 'culture', label: '历史文化', emoji: '🏛️' },
    { key: 'food', label: '美食探索', emoji: '🍜' },
    { key: 'shopping', label: '购物休闲', emoji: '🛍️' },
  ];
  const cities = ['北京', '上海', '成都', '杭州', '西安', '厦门', '广州', '苏州'];

  return (
    <div className="input-form">
      <div className="form-group">
        <label className="form-label">出发城市</label>
        <select
          className="form-select"
          value={state.city}
          onChange={(e) => setCity(e.target.value)}
        >
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">旅行天数</label>
        <div className="days-slider">
          <input
            type="range"
            min={1}
            max={14}
            value={state.days}
            onChange={(e) => setDays(Number(e.target.value))}
          />
          <span className="days-value">{state.days}天</span>
        </div>
      </div>

      <div className="form-group" style={{ minWidth: 280 }}>
        <label className="form-label">兴趣偏好</label>
        <div className="interests-group">
          {interests.map((it) => (
            <span
              key={it.key}
              className={`interest-tag ${state.interests.includes(it.key) ? 'active' : ''}`}
              onClick={() => toggleInterest(it.key)}
              role="button"
              tabIndex={0}
            >
              {it.emoji} {it.label}
            </span>
          ))}
        </div>
      </div>

      <button
        className="generate-btn"
        onClick={handleGenerate}
        disabled={state.isGenerating || state.interests.length === 0}
        style={{ marginLeft: 'auto', alignSelf: 'flex-end' }}
      >
        {state.isGenerating ? '✨ 生成中...' : '🚀 生成行程'}
      </button>
    </div>
  );
}

function SummaryBar() {
  const { state, handleExportPdf } = useApp();
  const s = state.itinerary?.summary;
  return (
    <div className="summary-bar">
      <div className="summary-stats">
        <div className="stat-block">
          <span className="stat-label">总时长</span>
          <span className="stat-value">{s ? s.totalDuration.toFixed(1) : '0'}h</span>
        </div>
        <div className="stat-block">
          <span className="stat-label">总花费</span>
          <span className="stat-value">¥{s?.totalCost ?? 0}</span>
        </div>
        <div className="stat-block">
          <span className="stat-label">景点数</span>
          <span className="stat-value">{s?.totalAttractions ?? 0}</span>
        </div>
      </div>
      <button
        className="export-btn"
        onClick={handleExportPdf}
        disabled={!state.itinerary || state.isExporting}
      >
        {state.isExporting ? '生成中...' : '📄 导出PDF'}
      </button>
    </div>
  );
}

export default function ItineraryPanel() {
  const { state, handleReorder, handleMoveItem } = useApp();
  const [dragging, setDragging] = useState<DraggingInfo | null>(null);

  const isHighlight = (attrId: string) => state.highlightAttractionId === attrId;

  return (
    <>
      <div className="app-header">
        <div className="app-title">智游图 · Trip Planner</div>
        <ThemeSwitcher />
      </div>

      <InputForm />

      {state.error && (
        <div
          style={{
            padding: '10px 20px',
            background: 'rgba(255,82,82,0.12)',
            color: '#ff5252',
            borderBottom: '1px solid rgba(255,82,82,0.3)',
            fontSize: 13,
          }}
        >
          ⚠️ {state.error}
        </div>
      )}

      <div className="main-layout">
        <MapViewWrapper />

        <div className="itinerary-panel">
          <div className="panel-header">
            <span className="panel-title">📅 我的行程</span>
            {state.itinerary && (
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                {state.itinerary.city} · {state.itinerary.days}天
              </span>
            )}
          </div>
          <div className="panel-content" style={{ position: 'relative' }}>
            {state.itinerary ? (
              state.itinerary.dayPlans.map((day, idx) => (
                <DaySection
                  key={day.day}
                  day={day}
                  dayIndex={idx}
                  isHighlight={isHighlight}
                  onDragStart={setDragging}
                  onDragEnd={() => setDragging(null)}
                  onReorder={handleReorder}
                  onMoveItem={handleMoveItem}
                  dragging={dragging}
                />
              ))
            ) : (
              <div className="empty-state" style={{ height: 'auto', padding: 60 }}>
                <div className="empty-icon">✈️</div>
                <div className="empty-title">还没有行程</div>
                <div className="empty-text">
                  调整上方参数并点击「生成行程」，为您智能规划最佳路线
                </div>
              </div>
            )}
            <SummaryBar />
          </div>
        </div>
      </div>
    </>
  );
}

import MapView from './MapView';
function MapViewWrapper() {
  return <MapView />;
}
