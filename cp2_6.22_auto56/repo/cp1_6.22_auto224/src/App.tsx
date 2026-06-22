import { useState, useEffect, useCallback } from 'react';
import TimelineCanvas from './components/TimelineCanvas';
import EventPanel from './components/EventPanel';
import {
  TimelineEvent,
  generateId,
  serializeEvents,
  deserializeEvents,
} from './utils/storage';

export type ViewMode = 'month' | 'year' | 'decade';

const sampleEvents: TimelineEvent[] = [
  {
    id: generateId(),
    name: '项目启动',
    date: '2024-01-15',
    description: '时间线生成器项目正式立项，开始需求分析和技术选型。',
    category: 'milestone',
  },
  {
    id: generateId(),
    name: '完成UI设计',
    date: '2024-03-01',
    description: '通过Figma完成所有界面原型设计，获得团队评审通过。',
    category: 'task',
  },
  {
    id: generateId(),
    name: '公司周年庆',
    date: '2024-06-18',
    description: '公司成立五周年庆典活动，全体员工聚餐合影。',
    category: 'anniversary',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=celebration%20anniversary%20office%20party&image_size=square',
  },
  {
    id: generateId(),
    name: '产品Beta发布',
    date: '2025-02-10',
    description: '第一个公开测试版本上线，收到500+位用户的反馈。',
    category: 'milestone',
  },
];

function App() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('year');
  const [isMobile, setIsMobile] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get('data');
    if (dataParam) {
      const parsed = deserializeEvents(dataParam);
      if (parsed && parsed.length > 0) {
        setEvents(parsed);
        return;
      }
    }
    setEvents(sampleEvents);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const addEvent = useCallback((event: Omit<TimelineEvent, 'id'>) => {
    const newEvent: TimelineEvent = { ...event, id: generateId() };
    setEvents((prev) => [...prev, newEvent]);
    return newEvent.id;
  }, []);

  const updateEvent = useCallback((id: string, updates: Partial<TimelineEvent>) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    if (selectedEventId === id) {
      setSelectedEventId(null);
    }
  }, [selectedEventId]);

  const exportPNG = useCallback(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('#timeline-canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `timeline-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  const copyShareLink = useCallback(async () => {
    const data = serializeEvents(events);
    const url = `${window.location.origin}${window.location.pathname}?data=${data}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('分享链接已复制到剪贴板！');
    } catch {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      alert('分享链接已复制到剪贴板！');
    }
  }, [events]);

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const toolbarStyle: React.CSSProperties = {
    position: 'absolute',
    top: 16,
    right: 16,
    display: 'flex',
    gap: 8,
    zIndex: 10,
  };

  const viewToggleStyle: React.CSSProperties = {
    position: 'absolute',
    top: 16,
    left: 16,
    display: 'flex',
    gap: 4,
    background: 'rgba(255,255,255,0.95)',
    borderRadius: 8,
    padding: 4,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    zIndex: 10,
  };

  const viewBtn = (mode: ViewMode, label: string) => ({
    padding: '6px 14px',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: viewMode === mode ? 600 : 400,
    background: viewMode === mode ? '#3B82F6' : 'transparent',
    color: viewMode === mode ? '#fff' : '#1E3A5F',
    transition: 'all 0.2s',
  });

  const actionBtn: React.CSSProperties = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    background: 'rgba(255,255,255,0.95)',
    color: '#1E3A5F',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    transition: 'all 0.2s',
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          position: 'relative',
          flex: isMobile ? 1 : '0 0 70%',
          background: '#F3F4F6',
          overflow: 'hidden',
        }}
      >
        <div style={viewToggleStyle}>
          <button style={viewBtn('month', '月')} onClick={() => setViewMode('month')}>
            月视图
          </button>
          <button style={viewBtn('year', '年')} onClick={() => setViewMode('year')}>
            年视图
          </button>
          <button style={viewBtn('decade', '十年')} onClick={() => setViewMode('decade')}>
            十年视图
          </button>
        </div>
        <div style={toolbarStyle}>
          <button
            style={actionBtn}
            onClick={exportPNG}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#E2E8F0')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.95)')}
          >
            导出PNG
          </button>
          <button
            style={actionBtn}
            onClick={copyShareLink}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#E2E8F0')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.95)')}
          >
            分享链接
          </button>
        </div>
        <TimelineCanvas
          events={sortedEvents}
          viewMode={viewMode}
          selectedEventId={selectedEventId}
          onSelectEvent={setSelectedEventId}
        />
      </div>

      {isMobile ? (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            background: '#FFFFFF',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            boxShadow: '0 -4px 20px rgba(0,0,0,0.12)',
            transform: panelOpen ? 'translateY(0)' : 'translateY(calc(100% - 48px))',
            transition: 'transform 0.3s ease',
            maxHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            style={{
              width: '100%',
              height: 48,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: panelOpen ? '1px solid #E2E8F0' : 'none',
            }}
          >
            <div
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                background: '#CBD5E1',
                transform: panelOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease',
              }}
            />
          </button>
          {panelOpen && (
            <div style={{ flex: 1, overflow: 'auto' }}>
              <EventPanel
                events={sortedEvents}
                selectedEventId={selectedEventId}
                onSelectEvent={setSelectedEventId}
                onAddEvent={addEvent}
                onUpdateEvent={updateEvent}
                onDeleteEvent={deleteEvent}
              />
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            flex: '0 0 30%',
            background: '#FFFFFF',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}
        >
          <EventPanel
            events={sortedEvents}
            selectedEventId={selectedEventId}
            onSelectEvent={setSelectedEventId}
            onAddEvent={addEvent}
            onUpdateEvent={updateEvent}
            onDeleteEvent={deleteEvent}
          />
        </div>
      )}
    </div>
  );
}

export default App;
