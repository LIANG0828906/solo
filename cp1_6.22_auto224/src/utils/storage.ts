export interface TimelineEvent {
  id: string;
  name: string;
  date: string;
  description: string;
  category: 'milestone' | 'task' | 'anniversary';
  imageUrl?: string;
}

export const categoryColors: Record<TimelineEvent['category'], string> = {
  milestone: '#EF4444',
  task: '#10B981',
  anniversary: '#8B5CF6',
};

export const categoryLabels: Record<TimelineEvent['category'], string> = {
  milestone: '里程碑',
  task: '任务',
  anniversary: '纪念日',
};

export function serializeEvents(events: TimelineEvent[]): string {
  const json = JSON.stringify(events);
  return encodeURIComponent(btoa(unescape(encodeURIComponent(json))));
}

export function deserializeEvents(encoded: string): TimelineEvent[] | null {
  try {
    const json = decodeURIComponent(escape(atob(decodeURIComponent(encoded))));
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (e) =>
          e &&
          typeof e.id === 'string' &&
          typeof e.name === 'string' &&
          typeof e.date === 'string' &&
          typeof e.description === 'string' &&
          ['milestone', 'task', 'anniversary'].includes(e.category)
      );
    }
    return null;
  } catch {
    return null;
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}
