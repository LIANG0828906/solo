import { v4 as uuidv4 } from 'uuid';
import { InspirationCard, TagColor, TAG_COLORS } from './types';

export function generateId(): string {
  return uuidv4();
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  if (date.getFullYear() === now.getFullYear()) {
    return `${month}-${day} ${hour}:${minute}`;
  }

  return `${date.getFullYear()}-${month}-${day}`;
}

export function formatFullTime(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

export function getColorHex(color: TagColor): string {
  const found = TAG_COLORS.find(c => c.value === color);
  return found ? found.hex : '#8D99AE';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function createNewCard(
  title: string,
  content: string,
  color: TagColor,
  emoji?: string,
  column: number = 0,
  order: number = 0
): InspirationCard {
  const now = Date.now();
  return {
    id: generateId(),
    title,
    content,
    color,
    emoji,
    createdAt: now,
    updatedAt: now,
    isFavorite: false,
    column,
    order,
  };
}

export function balanceColumns(cards: InspirationCard[], columnCount: number): InspirationCard[] {
  const result = cards.map(card => ({ ...card }));
  const columns: InspirationCard[][] = Array.from({ length: columnCount }, () => []);

  result.forEach(card => {
    if (card.column >= 0 && card.column < columnCount) {
      columns[card.column].push(card);
    }
  });

  for (let col = 0; col < columnCount; col++) {
    columns[col].sort((a, b) => a.order - b.order);
  }

  let allCards: InspirationCard[] = [];
  columns.forEach(col => {
    allCards = allCards.concat(col);
  });

  allCards.sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) {
      return b.isFavorite ? 1 : -1;
    }
    return b.createdAt - a.createdAt;
  });

  const balancedColumns: InspirationCard[][] = Array.from({ length: columnCount }, () => []);
  allCards.forEach((card, index) => {
    const targetCol = index % columnCount;
    card.column = targetCol;
    card.order = balancedColumns[targetCol].length;
    balancedColumns[targetCol].push(card);
  });

  return result;
}

export function reorderCards(
  cards: InspirationCard[],
  draggedId: string,
  targetColumn: number,
  targetIndex: number
): InspirationCard[] {
  const result = cards.map(card => ({ ...card }));
  const draggedCard = result.find(c => c.id === draggedId);
  if (!draggedCard) return cards;

  const sourceColumn = draggedCard.column;
  const sourceOrder = draggedCard.order;

  const sourceCards = result
    .filter(c => c.column === sourceColumn && c.id !== draggedId)
    .sort((a, b) => a.order - b.order);

  if (sourceColumn === targetColumn) {
    sourceCards.splice(sourceOrder, 1);
    sourceCards.splice(targetIndex, 0, draggedCard);
    sourceCards.forEach((card, idx) => {
      card.order = idx;
    });
  } else {
    sourceCards.forEach((card, idx) => {
      card.order = idx;
    });

    const targetCards = result
      .filter(c => c.column === targetColumn)
      .sort((a, b) => a.order - b.order);

    targetCards.splice(targetIndex, 0, draggedCard);
    draggedCard.column = targetColumn;
    targetCards.forEach((card, idx) => {
      card.order = idx;
    });
  }

  return result;
}
