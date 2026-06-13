export interface Card {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface TagInfo {
  name: string;
  color: string;
  count: number;
}

const CARDS_KEY = 'knowledge_cards';
const TAG_COLORS_KEY = 'knowledge_tag_colors';

export const TAG_COLORS = [
  '#E07A5F',
  '#3D405B',
  '#81B29A',
  '#F2CC8F',
  '#5B8E7D',
  '#C17A74',
  '#8E7AA3',
  '#6D9DC5',
];

export function extractTitle(content: string): string {
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^#{1,6}\s+(.+)/);
    if (match) return match[1].trim();
  }
  const stripped = content.replace(/[#*_`>\-\[\]()]/g, '').trim();
  return stripped.slice(0, 20).trim() || '无标题';
}

export function loadCards(): Card[] {
  try {
    const data = localStorage.getItem(CARDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveCards(cards: Card[]): void {
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
}

export function saveCard(card: Card): void {
  const cards = loadCards();
  const index = cards.findIndex((c) => c.id === card.id);
  if (index >= 0) {
    cards[index] = card;
  } else {
    cards.unshift(card);
  }
  saveCards(cards);
}

export function deleteCard(id: string): void {
  const cards = loadCards().filter((c) => c.id !== id);
  saveCards(cards);
}

export function searchByTag(tag: string): Card[] {
  return loadCards().filter((c) => c.tags.includes(tag));
}

export function findBacklinks(cardId: string): Card[] {
  const cards = loadCards();
  const current = cards.find((c) => c.id === cardId);
  if (!current) return [];
  return cards.filter((c) => {
    if (c.id === cardId) return false;
    return c.content.includes(current.title) || c.title.includes(current.title);
  });
}

function loadTagColors(): Record<string, string> {
  try {
    const data = localStorage.getItem(TAG_COLORS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveTagColors(colors: Record<string, string>): void {
  localStorage.setItem(TAG_COLORS_KEY, JSON.stringify(colors));
}

export function getTagColor(tagName: string): string {
  const colors = loadTagColors();
  if (colors[tagName]) return colors[tagName];

  const allTags = Object.keys(colors);
  const colorIndex = allTags.length % TAG_COLORS.length;
  colors[tagName] = TAG_COLORS[colorIndex];
  saveTagColors(colors);
  return colors[tagName];
}

export function getAllTags(): TagInfo[] {
  const cards = loadCards();
  const tagMap = new Map<string, { name: string; color: string; count: number }>();

  cards.forEach((card) => {
    card.tags.forEach((tag) => {
      const existing = tagMap.get(tag);
      if (existing) {
        existing.count++;
      } else {
        tagMap.set(tag, { name: tag, color: getTagColor(tag), count: 1 });
      }
    });
  });

  return Array.from(tagMap.values()).sort((a, b) => b.count - a.count);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
