const GAP = 20;

interface ColumnInfo {
  height: number;
}

export interface WaterfallOptions {
  columns?: number;
  gap?: number;
  cardWidth?: number;
}

let columnHeights: ColumnInfo[] = [];
let currentColumns = 4;
let containerWidth = 0;
let cardWidth = 0;
let gap = GAP;

export function initWaterfall(
  container: HTMLElement,
  columns: number = 4,
  options: WaterfallOptions = {}
): void {
  currentColumns = columns;
  gap = options.gap ?? GAP;
  columnHeights = Array.from({ length: columns }, () => ({ height: 0 }));
  updateContainerWidth(container);
}

function updateContainerWidth(container: HTMLElement): void {
  containerWidth = container.clientWidth;
  cardWidth = (containerWidth - gap * (currentColumns - 1)) / currentColumns;
}

function findShortestColumn(): number {
  let minIndex = 0;
  let minHeight = columnHeights[0]!.height;

  for (let i = 1; i < columnHeights.length; i++) {
    if (columnHeights[i]!.height < minHeight) {
      minHeight = columnHeights[i]!.height;
      minIndex = i;
    }
  }

  return minIndex;
}

export function renderCards(
  container: HTMLElement,
  cards: HTMLElement[],
  columns: number = currentColumns
): void {
  currentColumns = columns;
  columnHeights = Array.from({ length: columns }, () => ({ height: 0 }));
  updateContainerWidth(container);

  cards.forEach((card) => {
    positionCard(card);
  });

  const maxHeight = Math.max(...columnHeights.map((c) => c.height));
  container.style.height = `${maxHeight}px`;
}

export function appendCards(
  container: HTMLElement,
  cards: HTMLElement[]
): void {
  cards.forEach((card) => {
    positionCard(card);
  });

  const maxHeight = Math.max(...columnHeights.map((c) => c.height));
  container.style.height = `${maxHeight}px`;
}

function positionCard(card: HTMLElement): void {
  const colIndex = findShortestColumn();
  const top = columnHeights[colIndex]!.height;
  const left = colIndex * (cardWidth + gap);

  card.style.width = `${cardWidth}px`;
  card.style.left = `${left}px`;
  card.style.top = `${top}px`;
  card.style.position = 'absolute';

  const cardHeight = card.offsetHeight;
  columnHeights[colIndex]!.height += cardHeight + gap;
}

export function reflow(
  container: HTMLElement,
  cards: HTMLElement[],
  columns: number
): void {
  currentColumns = columns;
  renderCards(container, cards, columns);
}

export function getCurrentColumns(): number {
  return currentColumns;
}

export function getCardWidth(): number {
  return cardWidth;
}

export function resetHeights(): void {
  columnHeights = Array.from({ length: currentColumns }, () => ({ height: 0 }));
}
