import React, { useState, useEffect, useCallback, useRef } from 'react';
import EventForm from './components/EventForm';
import MapView from './components/MapView';
import Timeline from './components/Timeline';
import EventList from './components/EventList';
import {
  TimelineEvent,
  TimeRange,
  CategoryFilter,
  dateToYear,
} from './types';
import './index.css';

const CATEGORY_OPTIONS = ['war', 'culture', 'tech', 'politics'];

function App() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>({ min: -3000, max: 2025 });
  const [fullRange, setFullRange] = useState<TimeRange>({ min: -3000, max: 2025 });
  const [activeCategories, setActiveCategories] = useState<CategoryFilter>(
    new Set(CATEGORY_OPTIONS)
  );
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      setEvents(data);
      if (data.length > 0) {
        const years = data.map((e: TimelineEvent) => dateToYear(e.date));
        const minY = Math.min(...years);
        const maxY = Math.max(...years);
        setFullRange({ min: Math.min(minY - 50, -3000), max: Math.max(maxY + 50, 2025) });
        setTimeRange({ min: Math.min(minY - 50, -3000), max: Math.max(maxY + 50, 2025) });
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleEventAdded = useCallback(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleTimeChange = useCallback((range: TimeRange) => {
    setTimeRange(range);
  }, []);

  const handleCategoryToggle = useCallback((cat: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }, []);

  const handleEventClick = useCallback((id: string) => {
    setHighlightedId(id);
  }, []);

  const filteredEvents = events.filter((e) => {
    const year = dateToYear(e.date);
    const inRange = year >= timeRange.min && year <= timeRange.max;
    const inCategory = activeCategories.has(e.category);
    return inRange && inCategory;
  });

  return (
    <div className="app-layout">
      <button
        className="hamburger-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        ☰
      </button>
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <EventForm onEventAdded={handleEventAdded} />
        <EventList
          events={filteredEvents}
          onEventClick={handleEventClick}
          activeCategories={activeCategories}
          onCategoryToggle={handleCategoryToggle}
        />
      </div>
      <div className="main-area">
        <MapView
          events={filteredEvents}
          highlightedId={highlightedId}
          onHighlightClear={() => setHighlightedId(null)}
        />
        <Timeline
          fullRange={fullRange}
          onTimeChange={handleTimeChange}
        />
      </div>
    </div>
  );
}

export default App;
