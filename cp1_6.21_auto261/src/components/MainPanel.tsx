import React, { useState, useEffect, useCallback } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimelineEvent, Annotation, TimeRange } from '@/types';
import Timeline from './Timeline';
import EventList from './EventList';
import UploadPanel from './UploadPanel';

interface RawDataRecord {
  [key: string]: unknown;
}

interface MainPanelProps {
  events: TimelineEvent[];
  annotations: Annotation[];
  headers: string[];
  rawData: RawDataRecord[];
  timeRange: TimeRange | null;
  setTimeRange: (range: TimeRange | null) => void;
  searchKeyword: string;
  setSearchKeyword: (keyword: string) => void;
  theme: 'light' | 'dark';
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  onParseSuccess: (result: {
    events: TimelineEvent[];
    headers: string[];
    rawData: RawDataRecord[];
  }) => void;
  onAddAnnotation: (annotation: Annotation) => void;
  onUpdateAnnotation: (id: string, text: string) => void;
  onDeleteAnnotation: (id: string) => void;
  onError: (message: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const MainPanel: React.FC<MainPanelProps> = ({
  events,
  annotations,
  headers: _headers,
  rawData: _rawData,
  timeRange,
  setTimeRange,
  searchKeyword,
  setSearchKeyword,
  theme,
  selectedEventId,
  setSelectedEventId,
  onParseSuccess,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onError,
  sidebarOpen,
  setSidebarOpen,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleEventClick = useCallback(
    (event: TimelineEvent) => {
      setSelectedEventId(event.id);
    },
    [setSelectedEventId]
  );

  const handleParseSuccess = useCallback(
    (result: {
      events: TimelineEvent[];
      headers: string[];
      rawData: RawDataRecord[];
    }) => {
      onParseSuccess(result);
      if (result.events.length > 0) {
        const minDate = result.events.reduce(
          (min, e) => (e.date < min ? e.date : min),
          result.events[0].date
        );
        const maxDate = result.events.reduce(
          (max, e) => (e.date > max ? e.date : max),
          result.events[0].date
        );
        setTimeRange({ start: minDate, end: maxDate });
      }
    },
    [onParseSuccess, setTimeRange]
  );

  const handleRangeChange = useCallback(
    (value: [Date, Date]) => {
      setTimeRange({ start: value[0], end: value[1] });
    },
    [setTimeRange]
  );

  const handleExportPNG = useCallback(() => {
    onError('导出PNG失败，请重试');
  }, [onError]);

  const hasData = events.length > 0;

  const leftPanelContent = (
    <div
      className={cn(
        'flex flex-col h-full p-4 overflow-hidden',
        theme === 'dark' ? 'bg-slate-800' : 'bg-white'
      )}
      style={{
        minWidth: isMobile ? '100%' : '280px',
        maxWidth: isMobile ? '100%' : '560px',
        width: isMobile ? '100%' : 'clamp(320px, 30vw, 480px)',
      }}
    >
      {isMobile && (
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {hasData ? '事件列表' : '上传数据'}
          </h2>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      )}

      {!hasData ? (
        <div className="flex-1 flex items-center justify-center">
          <UploadPanel onParseSuccess={handleParseSuccess} onError={onError} />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <EventList
            events={events}
            selectedId={selectedEventId || undefined}
            onEventClick={handleEventClick}
          />
        </div>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        'flex w-full h-full overflow-hidden',
        theme === 'dark' ? 'bg-slate-900' : 'bg-gray-50'
      )}
    >
      {!isMobile && (
        <div
          className="flex-shrink-0 border-r border-gray-200 dark:border-gray-700"
          style={{
            minWidth: '280px',
            maxWidth: '560px',
            width: 'clamp(320px, 30vw, 480px)',
          }}
        >
          {leftPanelContent}
        </div>
      )}

      {isMobile && drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative w-full max-w-[320px] h-full shadow-xl">
            {leftPanelContent}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {isMobile && hasData && (
          <div
            className={cn(
              'flex items-center px-4 py-3 border-b',
              theme === 'dark'
                ? 'bg-slate-800 border-gray-700'
                : 'bg-white border-gray-200'
            )}
          >
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Menu size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
            <h2 className="ml-3 text-lg font-semibold text-gray-800 dark:text-gray-100">
              时间线
            </h2>
          </div>
        )}

        <div className="flex-1 p-4 overflow-auto">
          <Timeline
            events={events}
            annotations={annotations}
            timeRange={timeRange}
            searchKeyword={searchKeyword}
            theme={theme}
            onSearchChange={setSearchKeyword}
            onRangeChange={handleRangeChange}
            onAddAnnotation={onAddAnnotation}
            onUpdateAnnotation={onUpdateAnnotation}
            onDeleteAnnotation={onDeleteAnnotation}
            onExportPNG={handleExportPNG}
          />
        </div>
      </div>
    </div>
  );
};

MainPanel.displayName = 'MainPanel';

export default MainPanel;
