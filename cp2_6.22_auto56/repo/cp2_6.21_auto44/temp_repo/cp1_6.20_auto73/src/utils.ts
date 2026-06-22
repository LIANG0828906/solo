import { v4 as uuidv4 } from 'uuid';
import type { CardTag, ConnectionType, Priority, Card, Connection, ProjectData } from './types';

export const generateId = (): string => uuidv4();

export const highlightText = (text: string, keyword: string): string => {
  if (!keyword.trim()) return text;
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="highlight">$1</mark>');
};

export const filterCards = (
  cards: Card[],
  keyword: string,
  selectedTags: CardTag[]
): Card[] => {
  return cards.filter(card => {
    const matchesKeyword = keyword.trim() === '' ||
      card.title.toLowerCase().includes(keyword.toLowerCase()) ||
      card.content.toLowerCase().includes(keyword.toLowerCase());
    
    const matchesTag = selectedTags.length === 0 ||
      selectedTags.some(tag => card.tags.includes(tag));
    
    return matchesKeyword && matchesTag;
  });
};

export const getTagColor = (tags: CardTag[]): string => {
  if (tags.length === 0) return '#16213e';
  const colorMap: Record<CardTag, string> = {
    '人物': 'rgba(231, 76, 60, 0.3)',
    '事件': 'rgba(52, 152, 219, 0.3)',
    '地点': 'rgba(46, 204, 113, 0.3)',
    '物品': 'rgba(243, 156, 18, 0.3)',
  };
  return colorMap[tags[0]];
};

export const getConnectionColor = (type: ConnectionType): string => {
  const colorMap: Record<ConnectionType, string> = {
    '关联': '#888888',
    '因果': '#ff6b6b',
    '时序': '#4dabf7',
    '并列': '#51cf66',
    '对比': '#cc5de8',
  };
  return colorMap[type];
};

export const getPriorityColor = (priority: Priority): string => {
  const colorMap: Record<Priority, string> = {
    'P0': '#ff4757',
    'P1': '#ffa502',
    'P2': '#70a1ff',
    'P3': '#a4b0be',
  };
  return colorMap[priority];
};

export const createBezierPath = (
  x1: number, y1: number, x2: number, y2: number
): string => {
  const dx = x2 - x1;
  const controlOffset = Math.min(Math.abs(dx) * 0.5, 100);
  return `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;
};

export const createArrowMarker = (color: string): string => {
  return `url(#arrow-${color.replace('#', '')})`;
};

export const exportToJson = (data: ProjectData): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `creative-cards-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const readJsonFile = (file: File): Promise<ProjectData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as ProjectData;
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

export const validateProjectData = (data: unknown): data is ProjectData => {
  if (typeof data !== 'object' || data === null) return false;
  
  const d = data as ProjectData;
  if (typeof d.version !== 'string') return false;
  if (typeof d.timestamp !== 'number') return false;
  if (!Array.isArray(d.cards)) return false;
  if (!Array.isArray(d.connections)) return false;
  
  return true;
};

export const debounce = <T extends (...args: unknown[]) => unknown>(
  fn: T, delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};
