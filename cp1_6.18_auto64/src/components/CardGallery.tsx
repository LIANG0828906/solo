import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import LogCard from './LogCard';
import {
  type Emotion,
  allEmotions,
  emotionColors,
  emotionIcons,
  emotionLabels,
  getAverageEmotionColor,
  getDateKey,
} from '../utils/emotionColors';

const PAGE_SIZE = 10;
const INITIAL_COUNT = 50;

const CalendarView: React.FC<{
  expanded: boolean;
  onToggle: () => void;
  onDateSelect: (dateKey: string | null) => void;
  selectedDate: string | null;
}> = ({ expanded, onToggle, onDateSelect, selectedDate }) => {
  const logs = useAppStore((s) => s.logs);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const dayLogsMap = useMemo(() => {
    const map: Record<string, Emotion[]> = {};
    logs.forEach((log) => {
      const key = getDateKey(log.date);
      if (!map[key]) map[key] = [];
      map[key].push(log.emotion);
    });
    return map;
  }, [logs]);

  const monthLabel = `${year}年${month + 1}月`;
  const weekLabels = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <div style={{ marginBottom: '20px' }}>
      <button
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          color: '#B0B0CC',
          fontSize: '14px',
          cursor: 'pointer',
          padding: '8px 0',
          fontWeight: 500,
          transition: 'color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.color = '#D0D0EE';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.color = '#B0B0CC';
        }}
      >
        <span
          style={{
            display: 'inline-block',
            transition: 'transform 0.3s ease',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          ▸
        </span>
        📅 情绪日历 · {monthLabel}
      </button>

      {expanded && (
        <div
          style={{
            background: '#2A2A44',
            borderRadius: '12px',
            padding: '20px',
            height: '320px',
            overflow: 'auto',
            animation: 'fadeIn 0.4s ease-in-out',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 40px)',
              gap: '6px',
              justifyContent: 'center',
            }}
          >
            {weekLabels.map((label) => (
              <div
                key={label}
                style={{
                  width: '40px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: '#8888AA',
                  fontWeight: 500,
                }}
              >
                {label}
              </div>
            ))}
            {Array.from({ length: offset }, (_, i) => (
              <div key={`blank-${i}`} style={{ width: '40px', height: '40px' }} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const emotions = dayLogsMap[dateKey] || [];
              const bgColor = emotions.length > 0 ? getAverageEmotionColor(emotions) : '#3A3A5C';
              const isSelected = selectedDate === dateKey;

              return (
                <div
                  key={day}
                  onClick={() => onDateSelect(isSelected ? null : dateKey)}
                  title={emotions.length > 0 ? `${day}日 · ${emotions.length}条日志` : `${day}日 · 无日志`}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    color: emotions.length > 0 ? '#fff' : '#666688',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: isSelected ? '2px solid #fff' : '2px solid transparent',
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.filter = 'brightness(1.3)';
                    (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.filter = 'brightness(1)';
                    (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                  }}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

function useColumnCount() {
  const [columns, setColumns] = useState(3);
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1200) setColumns(3);
      else if (window.innerWidth >= 768) setColumns(2);
      else setColumns(1);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return columns;
}

const CardGallery: React.FC = () => {
  const logs = useAppStore((s) => s.logs);
  const emotionFilter = useAppStore((s) => s.emotionFilter);
  const sortOrder = useAppStore((s) => s.sortOrder);
  const setEmotionFilter = useAppStore((s) => s.setEmotionFilter);
  const setSortOrder = useAppStore((s) => s.setSortOrder);

  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const columns = useColumnCount();

  const filteredLogs = useMemo(() => {
    let result = [...logs];

    if (emotionFilter) {
      result = result.filter((log) => log.emotion === emotionFilter);
    }

    if (selectedDate) {
      result = result.filter((log) => getDateKey(log.date) === selectedDate);
    }

    result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [logs, emotionFilter, selectedDate, sortOrder]);

  const visibleLogs = useMemo(() => {
    return filteredLogs.slice(0, visibleCount);
  }, [filteredLogs, visibleCount]);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && visibleCount < filteredLogs.length) {
        setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredLogs.length));
      }
    },
    [visibleCount, filteredLogs.length],
  );

  useEffect(() => {
    const option = { root: null, rootMargin: '200px', threshold: 0 };
    const observer = new IntersectionObserver(handleObserver, option);
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  useEffect(() => {
    setVisibleCount(INITIAL_COUNT);
  }, [emotionFilter, selectedDate, sortOrder]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 24px 60px' }}>
      <CalendarView
        expanded={calendarExpanded}
        onToggle={() => setCalendarExpanded(!calendarExpanded)}
        onDateSelect={setSelectedDate}
        selectedDate={selectedDate}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setEmotionFilter(null)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: emotionFilter === null ? '2px solid #fff' : '2px solid #3A3A5C',
              background: emotionFilter === null ? '#5A5A8A' : 'rgba(58,58,92,0.5)',
              color: emotionFilter === null ? '#fff' : '#8888AA',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease-out',
              transform: emotionFilter === null ? 'scale(1.2)' : 'scale(1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            全
          </button>
          {allEmotions.map((emotion) => (
            <button
              key={emotion}
              onClick={() => setEmotionFilter(emotionFilter === emotion ? null : emotion)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border:
                  emotionFilter === emotion
                    ? `2px solid ${emotionColors[emotion]}`
                    : '2px solid #3A3A5C',
                background:
                  emotionFilter === emotion
                    ? emotionColors[emotion]
                    : 'rgba(58,58,92,0.5)',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s ease-out',
                transform: emotionFilter === emotion ? 'scale(1.2)' : 'scale(1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}
              title={emotionLabels[emotion]}
            >
              {emotionIcons[emotion]}
            </button>
          ))}

          {selectedDate && (
            <span
              style={{
                fontSize: '12px',
                color: '#B0B0CC',
                background: '#2A2A44',
                padding: '4px 10px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              📅 {selectedDate}
              <button
                onClick={() => setSelectedDate(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8888AA',
                  cursor: 'pointer',
                  fontSize: '14px',
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ×
              </button>
            </span>
          )}
        </div>

        <button
          onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
          style={{
            padding: '6px 14px',
            borderRadius: '10px',
            border: '1px solid #3A3A5C',
            background: '#1E1E2E',
            color: '#B0B0CC',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = '#6B6B9C';
            (e.currentTarget as HTMLElement).style.filter = 'brightness(1.2)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = '#3A3A5C';
            (e.currentTarget as HTMLElement).style.filter = 'brightness(1)';
          }}
        >
          {sortOrder === 'newest' ? '⬇ 最新优先' : '⬆ 最旧优先'}
        </button>
      </div>

      {visibleLogs.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#666688',
            fontSize: '15px',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌙</div>
          暂无匹配的情绪日志
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: '16px',
          }}
        >
          {visibleLogs.map((log, index) => (
            <div
              key={log.id}
              style={{
                animation: `fadeIn 0.4s ease-in-out ${Math.min(index * 0.03, 0.5)}s both`,
              }}
            >
              <LogCard log={log} />
            </div>
          ))}
        </div>
      )}

      {visibleCount < filteredLogs.length && (
        <div ref={sentinelRef} style={{ height: '40px', margin: '20px 0' }} />
      )}

      {visibleCount < filteredLogs.length && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666688', fontSize: '13px' }}>
          向下滚动加载更多...
        </div>
      )}
    </div>
  );
};

export default CardGallery;
