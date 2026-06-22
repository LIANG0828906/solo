import { useState, useCallback, useEffect } from 'react';
import Header from '@/components/Header';
import MainPanel from '@/components/MainPanel';
import Toast from '@/components/Toast';
import { useTheme } from '@/hooks/useTheme';
import type { TimelineEvent, Annotation, TimeRange } from '@/types';

export default function App() {
  const { theme, toggleTheme } = useTheme();

  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const showError = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  }, []);

  const handleParseSuccess = useCallback((result: {
    events: TimelineEvent[];
    headers: string[];
    rawData: any[];
  }) => {
    setEvents(result.events);
    setHeaders(result.headers);
    setRawData(result.rawData);
    setAnnotations([]);
    if (result.events.length > 0) {
      const sortedEvents = [...result.events].sort((a, b) => a.date.getTime() - b.date.getTime());
      setTimeRange({
        start: sortedEvents[0].date,
        end: sortedEvents[sortedEvents.length - 1].date,
      });
    }
  }, []);

  const handleAddAnnotation = useCallback((annotation: Annotation) => {
    setAnnotations(prev => [...prev, annotation]);
  }, []);

  const handleUpdateAnnotation = useCallback((id: string, text: string) => {
    setAnnotations(prev =>
      prev.map(a => (a.id === id ? { ...a, text } : a))
    );
  }, []);

  const handleDeleteAnnotation = useCallback((id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
  }, []);

  const handleMenuClick = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-300 ease-in-out"
      style={{
        backgroundColor: 'var(--bg-color)',
        color: 'var(--text-color)',
      }}
    >
      <Header
        theme={theme}
        onThemeToggle={toggleTheme}
        onMenuClick={handleMenuClick}
      />

      <main className="flex-1 flex overflow-hidden">
        <MainPanel
          events={events}
          annotations={annotations}
          headers={headers}
          rawData={rawData}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          searchKeyword={searchKeyword}
          setSearchKeyword={setSearchKeyword}
          theme={theme}
          selectedEventId={selectedEventId}
          setSelectedEventId={setSelectedEventId}
          onParseSuccess={handleParseSuccess}
          onAddAnnotation={handleAddAnnotation}
          onUpdateAnnotation={handleUpdateAnnotation}
          onDeleteAnnotation={handleDeleteAnnotation}
          onError={showError}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      </main>

      <Toast
        message={toastMessage}
        visible={toastVisible}
        duration={2500}
        onClose={() => setToastVisible(false)}
      />
    </div>
  );
}
