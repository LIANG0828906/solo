import React from 'react';
import type { TimelineEvent } from '@/types';

interface EventListProps {
  events: TimelineEvent[];
  selectedId?: string;
  onEventClick: (event: TimelineEvent) => void;
}

export default function EventList({ events, selectedId, onEventClick }: EventListProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3 px-1">
        事件列表
      </h3>
      <div
        className="overflow-y-auto space-y-2 pr-1"
        style={{ maxHeight: '400px' }}
      >
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-sm">暂无事件数据</p>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              onClick={() => onEventClick(event)}
              className={`cursor-pointer border-2 transition-all duration-200 ${
                selectedId === event.id
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-transparent hover:bg-slate-100'
              }`}
              style={{
                borderRadius: '8px',
                padding: '12px',
                borderColor: selectedId === event.id ? '#3B82F6' : undefined,
                backgroundColor: selectedId === event.id ? '#EFF6FF' : undefined,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium truncate ${
                      selectedId === event.id ? 'text-blue-700' : 'text-gray-800'
                    }`}
                  >
                    {event.eventName || '未命名事件'}
                  </p>
                  {event.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedId === event.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <svg
                      className="w-3 h-3 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {formatDate(event.date)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {events.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            共 {events.length} 条事件
          </p>
        </div>
      )}
    </div>
  );
}
