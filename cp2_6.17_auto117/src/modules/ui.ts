export interface MasonryColumn {
  height: number;
  items: Array<{ index: number; top: number; height: number }>;
}

export interface MasonryLayout {
  columns: MasonryColumn[];
  columnWidth: number;
  totalHeight: number;
  positions: Array<{ left: number; top: number; height: number; columnIndex: number }>;
}

export function calculateColumnCount(containerWidth: number, minCardWidth: number = 280, gap: number = 20): number {
  if (containerWidth <= 0) return 1;
  const available = containerWidth + gap;
  const perCol = minCardWidth + gap;
  let cols = Math.floor(available / perCol);
  if (cols < 1) cols = 1;
  if (cols > 3) cols = 3;
  return cols;
}

export function calculateMasonryLayout(
  itemHeights: number[],
  containerWidth: number,
  minCardWidth: number = 280,
  gap: number = 20,
): MasonryLayout {
  const columns = calculateColumnCount(containerWidth, minCardWidth, gap);
  const columnWidth = (containerWidth - gap * (columns - 1)) / columns;

  const colData: MasonryColumn[] = Array.from({ length: columns }, () => ({
    height: 0,
    items: [],
  }));

  const positions: MasonryLayout['positions'] = [];

  for (let i = 0; i < itemHeights.length; i++) {
    let shortestIdx = 0;
    for (let j = 1; j < columns; j++) {
      if (colData[j].height < colData[shortestIdx].height) {
        shortestIdx = j;
      }
    }
    const col = colData[shortestIdx];
    const top = col.height;
    const left = shortestIdx * (columnWidth + gap);
    col.items.push({ index: i, top, height: itemHeights[i] });
    col.height += itemHeights[i] + gap;
    positions.push({ left, top, height: itemHeights[i], columnIndex: shortestIdx });
  }

  const maxColHeight = colData.length > 0 ? Math.max(...colData.map((c) => c.height)) : 0;
  const totalHeight = Math.max(0, maxColHeight - gap);

  return {
    columns: colData,
    columnWidth,
    totalHeight,
    positions,
  };
}

export function estimateCardHeight(title: string, content: string, tagsCount: number): number {
  const base = 20 * 2;
  const titleLines = Math.ceil(title.length / 20);
  const titleHeight = titleLines * 24 + 8;
  const contentPreview = content.slice(0, 200);
  const contentLines = Math.ceil(contentPreview.length / 28) + contentPreview.split('\n').length - 1;
  const contentHeight = Math.min(contentLines * 20, 120);
  const tagsHeight = tagsCount > 0 ? 32 : 0;
  const footerHeight = 28;
  return base + titleHeight + contentHeight + tagsHeight + footerHeight + 20;
}

export function getAnimationDelay(index: number, baseDelay: number = 30): string {
  return `${index * baseDelay}ms`;
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

export function stripMarkdown(text: string): string {
  let result = text;
  result = result.replace(/```[\s\S]*?```/g, (m) => m.replace(/```\w*\n?/g, '').replace(/```/g, ''));
  result = result.replace(/`(.+?)`/g, '$1');
  result = result.replace(/\*\*(.+?)\*\*/g, '$1');
  result = result.replace(/\*(.+?)\*/g, '$1');
  result = result.replace(/\[(.+?)\]\((.+?)\)/g, '$1');
  result = result.replace(/^#{1,6}\s+(.+)$/gm, '$1');
  result = result.replace(/^[-*+]\s+/gm, '• ');
  result = result.replace(/^\d+\.\s+/gm, '');
  result = result.replace(/^>\s+/gm, '');
  return result.trim();
}

export function renderMarkdownShort(text: string): string {
  let result = text;
  result = result.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, _lang, code) => {
    return `<pre style="background:rgba(0,0,0,0.3);padding:10px 12px;border-radius:8px;overflow-x:auto;margin:8px 0;font-size:0.85em;line-height:1.5;"><code style="font-family:'SF Mono',Monaco,Consolas,monospace;color:#B0B0C0;">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
  });
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');
  result = result.replace(/`(.+?)`/g, '<code style="background:rgba(108,99,255,0.15);padding:2px 6px;border-radius:4px;font-size:0.9em;">$1</code>');
  result = result.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" style="color:#6C63FF;">$1</a>');
  result = result.replace(/^### (.+)$/gm, '<h4 style="margin:8px 0 4px;font-size:1em;color:#E0E0F0;">$1</h4>');
  result = result.replace(/^## (.+)$/gm, '<h3 style="margin:10px 0 6px;font-size:1.1em;color:#E0E0F0;">$1</h3>');
  result = result.replace(/^# (.+)$/gm, '<h2 style="margin:12px 0 8px;font-size:1.2em;color:#E0E0F0;">$1</h2>');
  result = result.replace(/^[-*+]\s+(.+)$/gm, '<li style="margin:3px 0 3px 16px;list-style:disc;">$1</li>');
  result = result.replace(/^\d+\.\s+(.+)$/gm, '<li style="margin:3px 0 3px 16px;list-style:decimal;">$1</li>');
  result = result.replace(/(<li[^>]*>.*?<\/li>\n?)+/g, (match) => `<ul style="margin:4px 0;padding:0;list-style:none;">${match}</ul>`);
  result = result.replace(/\n/g, '<br/>');
  return result;
}

export function getCardTypeLabel(type: string): { label: string; color: string } {
  switch (type) {
    case 'note':
      return { label: '笔记', color: '#6C63FF' };
    case 'bookmark':
      return { label: '书签', color: '#4ECDC4' };
    case 'inspiration':
      return { label: '灵感', color: '#FF6584' };
    default:
      return { label: '笔记', color: '#6C63FF' };
  }
}

export function getResponsiveBreakpoints(): { xs: number; sm: number; md: number; lg: number } {
  return {
    xs: 0,
    sm: 640,
    md: 960,
    lg: 1280,
  };
}

export function useDebounce<T extends (...args: any[]) => void>(fn: T, delay: number = 300): T {
  let timer: number | null = null;
  return ((...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  }) as T;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
