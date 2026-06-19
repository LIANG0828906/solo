import React, { useMemo } from 'react';
import {
  TimelineEvent,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  dateToYear,
  formatYear,
  CategoryFilter,
} from '../types';

interface EventListProps {
  events: TimelineEvent[];
  onEventClick: (id: string) => void;
  activeCategories: CategoryFilter;
  onCategoryToggle: (cat: string) => void;
}

export default function EventList({
  events,
  onEventClick,
  activeCategories,
  onCategoryToggle,
}: EventListProps) {
  const sorted = useMemo(() => {
    return [...events].sort((a, b) => dateToYear(b.date) - dateToYear(a.date));
  }, [events]);

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid #0f3460',
        }}
      >
        <div
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#fff',
            marginBottom: '8px',
          }}
        >
          类别筛选
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {(Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>).map((cat) => {
            const active = activeCategories.has(cat);
            return (
              <span
                key={cat}
                onClick={() => onCategoryToggle(cat)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  background: active ? CATEGORY_COLORS[cat] : 'transparent',
                  color: active ? '#fff' : CATEGORY_COLORS[cat],
                  border: `2px solid ${CATEGORY_COLORS[cat]}`,
                  transition: 'all 0.2s',
                  opacity: active ? 1 : 0.5,
                }}
              >
                {CATEGORY_LABELS[cat]}
              </span>
            );
          })}
        </div>
      </div>
      <div style={{ padding: '12px 20px' }}>
        <div
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#fff',
            marginBottom: '8px',
          }}
        >
          事件列表 ({sorted.length})
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
        {sorted.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              color: '#555',
              padding: '20px',
              fontSize: '13px',
            }}
          >
            暂无匹配事件
          </div>
        )}
        {sorted.map((ev) => (
          <div
            key={ev.id}
            onClick={() => onEventClick(ev.id)}
            style={{
              background: '#0a0a1a',
              border: '1px solid #0f3460',
              borderRadius: '8px',
              padding: '10px 12px',
              marginBottom: '8px',
              cursor: 'pointer',
              transition: 'border-color 0.2s, transform 0.15s',
              borderLeft: `3px solid ${CATEGORY_COLORS[ev.category]}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = CATEGORY_COLORS[ev.category];
              e.currentTarget.style.transform = 'translateX(4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#0f3460';
              e.currentTarget.style.borderLeftColor = CATEGORY_COLORS[ev.category];
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <div
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#fff',
                marginBottom: '4px',
              }}
            >
              {ev.title}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: '#8892b0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>{formatYear(dateToYear(ev.date))}</span>
              <span style={{ color: CATEGORY_COLORS[ev.category], fontSize: '11px' }}>
                {CATEGORY_LABELS[ev.category]}
              </span>
              <span style={{ color: '#ffd32a' }}>
                {'★'.repeat(ev.importance)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
