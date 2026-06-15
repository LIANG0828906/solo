import React, { useMemo } from 'react';
import { X, GitCompare } from 'lucide-react';
import { useTimelineStore } from '../store';
import { CATEGORIES } from '../types';

export const ComparePanel: React.FC = () => {
  const { compareList, getCompareEvents, toggleCompare } = useTimelineStore();

  const compareEvents = useMemo(() => getCompareEvents(), [getCompareEvents]);
  const isVisible = compareList.length > 0;

  const handleRemove = (eventId: string) => {
    toggleCompare(eventId);
  };

  const rows = [
    { key: 'year', label: '年份' },
    { key: 'category', label: '类别' },
    { key: 'title', label: '标题' },
    { key: 'description', label: '描述' },
  ];

  const getCellContent = (event: typeof compareEvents[0], key: string) => {
    switch (key) {
      case 'year':
        return event.year;
      case 'category':
        return CATEGORIES.find((c) => c.value === event.category)?.label || '';
      case 'title':
        return event.title;
      case 'description':
        return event.description;
      default:
        return '';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`compare-panel ${isVisible ? 'visible' : ''}`}>
      <div className="compare-header">
        <div className="compare-title">
          <GitCompare size={20} />
          <h3>事件对比</h3>
          <span className="compare-count">
            {compareList.length}/3
          </span>
        </div>
        <button
          className="close-btn"
          onClick={() => {
            compareList.forEach((id) => toggleCompare(id));
          }}
        >
          <X size={18} />
        </button>
      </div>

      <div className="compare-table-container">
        <table className="compare-table">
          <thead>
            <tr>
              <th className="sticky-col">属性</th>
              {compareEvents.map((event) => (
                <th key={event.id}>
                  <div className="compare-header-cell">
                    <div className="compare-color-dots">
                      {event.colors.slice(0, 2).map((color, i) => (
                        <span
                          key={i}
                          className="color-dot"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <span className="compare-event-title">{event.title}</span>
                    <button
                      className="remove-compare-btn"
                      onClick={() => handleRemove(event.id)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </th>
              ))}
              {Array.from({ length: 3 - compareEvents.length }).map((_, i) => (
                <th key={`empty-${i}`} className="empty-col">
                  <div className="empty-slot">
                    <span>待添加</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.key} className={rowIndex % 2 === 0 ? 'even-row' : 'odd-row'}>
                <td className="sticky-col row-label">{row.label}</td>
                {compareEvents.map((event) => (
                  <td key={event.id}>
                    {row.key === 'description' ? (
                      <div className="description-cell">
                        {event.description.split('\n').map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                      </div>
                    ) : (
                      getCellContent(event, row.key)
                    )}
                  </td>
                ))}
                {Array.from({ length: 3 - compareEvents.length }).map((_, i) => (
                  <td key={`empty-${i}`} className="empty-cell">
                    —
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
