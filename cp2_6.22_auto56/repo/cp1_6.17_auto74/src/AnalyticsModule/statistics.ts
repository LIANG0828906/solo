import type { Note, TagDistribution, DailyNewNotes } from '../types';

export function getTotalCount(notes: Note[]): number {
  return notes.length;
}

export function getTagDistribution(notes: Note[]): TagDistribution[] {
  const tagCountMap = new Map<string, number>();

  notes.forEach(note => {
    note.tags.forEach(tag => {
      tagCountMap.set(tag, (tagCountMap.get(tag) || 0) + 1);
    });
  });

  return Array.from(tagCountMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export function getDailyNewNotes(notes: Note[], days: number = 7): DailyNewNotes[] {
  const result: DailyNewNotes[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);
    result.push({ date: dateStr, count: 0 });
  }

  notes.forEach(note => {
    const noteDate = new Date(note.createdAt);
    noteDate.setHours(0, 0, 0, 0);
    const dateStr = formatDate(noteDate);
    const entry = result.find(r => r.date === dateStr);
    if (entry) {
      entry.count++;
    }
  });

  return result;
}

function formatDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}`;
}

export const PIE_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#FFD93D',
  '#6BCB77',
  '#4D96FF',
  '#9B59B6',
  '#FF8C42',
  '#1ABC9C',
  '#E74C3C',
  '#3498DB'
];
