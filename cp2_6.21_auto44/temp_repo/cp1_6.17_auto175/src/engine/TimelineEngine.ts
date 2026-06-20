import type { TimelineEvent } from '../store/useTimelineStore';

export class TimelineEngine {
  private events: TimelineEvent[] = [];
  private listeners: Set<() => void> = new Set();

  setEvents(events: TimelineEvent[]): void {
    this.events = [...events].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    this.notify();
  }

  getEvents(): TimelineEvent[] {
    return this.events;
  }

  addEvent(event: TimelineEvent): void {
    this.events.unshift(event);
    this.events.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    this.notify();
  }

  updateEvent(id: string, updates: Partial<TimelineEvent>): void {
    const index = this.events.findIndex(e => e.id === id);
    if (index !== -1) {
      this.events[index] = { ...this.events[index], ...updates };
      this.notify();
    }
  }

  deleteEvent(id: string): void {
    this.events = this.events.filter(e => e.id !== id);
    this.notify();
  }

  getEventById(id: string): TimelineEvent | undefined {
    return this.events.find(e => e.id === id);
  }

  getVisibleEvents(viewportTop: number, viewportBottom: number, itemHeight: number = 180): TimelineEvent[] {
    const startIndex = Math.max(0, Math.floor(viewportTop / itemHeight) - 2);
    const endIndex = Math.min(
      this.events.length,
      Math.ceil(viewportBottom / itemHeight) + 2
    );
    return this.events.slice(startIndex, endIndex);
  }

  searchEvents(query: string): TimelineEvent[] {
    const lowerQuery = query.toLowerCase();
    return this.events.filter(
      e =>
        e.title.toLowerCase().includes(lowerQuery) ||
        e.content.toLowerCase().includes(lowerQuery) ||
        e.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
        e.location.toLowerCase().includes(lowerQuery)
    );
  }

  filterByDateRange(startDate: string, endDate: string): TimelineEvent[] {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return this.events.filter(e => {
      const eventTime = new Date(e.date).getTime();
      return eventTime >= start && eventTime <= end;
    });
  }

  filterByTags(tags: string[]): TimelineEvent[] {
    if (tags.length === 0) return this.events;
    return this.events.filter(e => tags.some(t => e.tags.includes(t)));
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(l => l());
  }
}

export const timelineEngine = new TimelineEngine();
