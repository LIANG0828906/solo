import { v4 as uuidv4 } from 'uuid';

export type CardType = 'note' | 'bookmark' | 'inspiration';

export interface Card {
  id: string;
  title: string;
  content: string;
  tags: string[];
  type: CardType;
  createdAt: number;
  updatedAt: number;
}

export interface TagNode {
  id: string;
  name: string;
  parentId: string | null;
  children: TagNode[];
}

export interface SearchFilters {
  keyword: string;
  tags: string[];
  type?: CardType | 'all';
  dateFrom?: number;
  dateTo?: number;
}

interface InvertedIndex {
  [term: string]: Set<string>;
}

const CARDS_KEY = 'kb_cards';
const TAGS_KEY = 'kb_tags';

let cardsCache: Card[] | null = null;
let tagsCache: TagNode[] | null = null;
let invertedIndex: InvertedIndex = {};
let indexedCardIds: Set<string> = new Set();

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function loadCards(): Card[] {
  if (cardsCache) return deepClone(cardsCache);
  try {
    const raw = localStorage.getItem(CARDS_KEY);
    cardsCache = raw ? JSON.parse(raw) : [];
  } catch {
    cardsCache = [];
  }
  return deepClone(cardsCache);
}

function saveCards(cards: Card[]): void {
  cardsCache = deepClone(cards);
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
}

export function loadTags(): TagNode[] {
  if (tagsCache) return deepClone(tagsCache);
  try {
    const raw = localStorage.getItem(TAGS_KEY);
    tagsCache = raw ? JSON.parse(raw) : getDefaultTags();
  } catch {
    tagsCache = getDefaultTags();
  }
  return deepClone(tagsCache);
}

function getDefaultTags(): TagNode[] {
  return [
    {
      id: 'tag-work',
      name: '工作',
      parentId: null,
      children: [
        { id: 'tag-work-meeting', name: '会议', parentId: 'tag-work', children: [] },
        { id: 'tag-work-project', name: '项目', parentId: 'tag-work', children: [] },
      ],
    },
    {
      id: 'tag-life',
      name: '生活',
      parentId: null,
      children: [
        { id: 'tag-life-travel', name: '旅行', parentId: 'tag-life', children: [] },
        { id: 'tag-life-food', name: '美食', parentId: 'tag-life', children: [] },
      ],
    },
    {
      id: 'tag-tech',
      name: '技术',
      parentId: null,
      children: [
        {
          id: 'tag-tech-frontend',
          name: '前端',
          parentId: 'tag-tech',
          children: [
            { id: 'tag-tech-react', name: 'React', parentId: 'tag-tech-frontend', children: [] },
            { id: 'tag-tech-ts', name: 'TypeScript', parentId: 'tag-tech-frontend', children: [] },
          ],
        },
        { id: 'tag-tech-backend', name: '后端', parentId: 'tag-tech', children: [] },
      ],
    },
  ];
}

function saveTags(tags: TagNode[]): void {
  tagsCache = deepClone(tags);
  localStorage.setItem(TAGS_KEY, JSON.stringify(tags));
}

export function findTagById(tags: TagNode[], id: string): TagNode | null {
  for (const tag of tags) {
    if (tag.id === id) return tag;
    const found = findTagById(tag.children, id);
    if (found) return found;
  }
  return null;
}

export function findTagPath(tags: TagNode[], id: string, path: TagNode[] = []): TagNode[] | null {
  for (const tag of tags) {
    const currentPath = [...path, tag];
    if (tag.id === id) return currentPath;
    const found = findTagPath(tag.children, id, currentPath);
    if (found) return found;
  }
  return null;
}

export function addTag(parentId: string | null, name: string): TagNode[] {
  const tags = loadTags();
  const newTag: TagNode = {
    id: 'tag-' + uuidv4().slice(0, 8),
    name,
    parentId,
    children: [],
  };
  if (parentId === null) {
    tags.push(newTag);
  } else {
    const parent = findTagById(tags, parentId);
    if (parent) {
      if (getTagDepth(tags, parentId) >= 2) return tags;
      parent.children.push(newTag);
    } else {
      tags.push(newTag);
    }
  }
  saveTags(tags);
  return tags;
}

function getTagDepth(tags: TagNode[], id: string, depth: number = 0): number {
  for (const tag of tags) {
    if (tag.id === id) return depth;
    const d = getTagDepth(tag.children, id, depth + 1);
    if (d >= 0) return d;
  }
  return -1;
}

export function deleteTag(id: string): TagNode[] {
  const tags = loadTags();
  const cards = loadCards();
  const tagIdsToRemove = collectTagIdsById(tags, id);
  const updatedCards = cards.map((c) => ({
    ...c,
    tags: c.tags.filter((t) => !tagIdsToRemove.has(t)),
  }));
  saveCards(updatedCards);
  cardsCache = updatedCards;
  rebuildIndex(updatedCards);
  const result = removeTagById(tags, id);
  saveTags(result);
  return result;
}

function collectTagIdsById(tags: TagNode[], id: string): Set<string> {
  const set = new Set<string>();
  function traverse(nodes: TagNode[]): boolean {
    for (const node of nodes) {
      if (node.id === id) {
        addAllIds(node, set);
        return true;
      }
      if (traverse(node.children)) return true;
    }
    return false;
  }
  function addAllIds(node: TagNode, s: Set<string>) {
    s.add(node.id);
    node.children.forEach((c) => addAllIds(c, s));
  }
  traverse(tags);
  return set;
}

function removeTagById(tags: TagNode[], id: string): TagNode[] {
  return tags
    .filter((t) => t.id !== id)
    .map((t) => ({
      ...t,
      children: removeTagById(t.children, id),
    }));
}

export function createCard(data: Partial<Card> & { title: string; content: string }): Card {
  const cards = loadCards();
  const now = Date.now();
  const card: Card = {
    id: 'card-' + uuidv4().slice(0, 12),
    title: data.title,
    content: data.content,
    tags: data.tags || [],
    type: data.type || 'note',
    createdAt: now,
    updatedAt: now,
  };
  cards.push(card);
  saveCards(cards);
  indexCard(card);
  return deepClone(card);
}

export function updateCard(id: string, data: Partial<Card>): Card | null {
  const cards = loadCards();
  const idx = cards.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const now = Date.now();
  cards[idx] = {
    ...cards[idx],
    ...data,
    id: cards[idx].id,
    createdAt: cards[idx].createdAt,
    updatedAt: now,
  };
  saveCards(cards);
  indexedCardIds.delete(id);
  indexCard(cards[idx]);
  return deepClone(cards[idx]);
}

export function deleteCard(id: string): boolean {
  const cards = loadCards();
  const idx = cards.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  cards.splice(idx, 1);
  saveCards(cards);
  indexedCardIds.delete(id);
  for (const term in invertedIndex) {
    invertedIndex[term].delete(id);
    if (invertedIndex[term].size === 0) delete invertedIndex[term];
  }
  return true;
}

export function addTagToCard(cardId: string, tagId: string): Card | null {
  const cards = loadCards();
  const idx = cards.findIndex((c) => c.id === cardId);
  if (idx === -1) return null;
  if (!cards[idx].tags.includes(tagId)) {
    cards[idx].tags.push(tagId);
    cards[idx].updatedAt = Date.now();
    saveCards(cards);
    indexedCardIds.delete(cardId);
    indexCard(cards[idx]);
  }
  return deepClone(cards[idx]);
}

export function removeTagFromCard(cardId: string, tagId: string): Card | null {
  const cards = loadCards();
  const idx = cards.findIndex((c) => c.id === cardId);
  if (idx === -1) return null;
  cards[idx].tags = cards[idx].tags.filter((t) => t !== tagId);
  cards[idx].updatedAt = Date.now();
  saveCards(cards);
  indexedCardIds.delete(cardId);
  indexCard(cards[idx]);
  return deepClone(cards[idx]);
}

function tokenize(text: string): string[] {
  const lower = text.toLowerCase();
  const tokens: string[] = [];
  const cjkRegex = /[\u4e00-\u9fa5]/g;
  const wordRegex = /[a-zA-Z0-9_]+/g;
  let match;
  while ((match = cjkRegex.exec(lower)) !== null) {
    tokens.push(match[0]);
  }
  while ((match = wordRegex.exec(lower)) !== null) {
    tokens.push(match[0]);
    if (match[0].length >= 2) {
      for (let i = 0; i <= match[0].length - 2; i++) {
        tokens.push(match[0].slice(i, i + 2));
      }
    }
  }
  return Array.from(new Set(tokens));
}

function indexCard(card: Card): void {
  if (indexedCardIds.has(card.id)) return;
  const text = `${card.title} ${card.content} ${card.tags.join(' ')}`;
  const tokens = tokenize(text);
  for (const token of tokens) {
    if (!invertedIndex[token]) invertedIndex[token] = new Set();
    invertedIndex[token].add(card.id);
  }
  indexedCardIds.add(card.id);
}

function rebuildIndex(cards: Card[]): void {
  invertedIndex = {};
  indexedCardIds = new Set();
  for (const card of cards) {
    indexCard(card);
  }
}

export function ensureIndexBuilt(): void {
  if (cardsCache === null) loadCards();
  if (!cardsCache) return;
  for (const card of cardsCache) {
    indexCard(card);
  }
}

function searchByKeyword(keyword: string): Set<string> {
  ensureIndexBuilt();
  if (!keyword.trim()) return new Set((cardsCache || []).map((c) => c.id));
  const queryTokens = tokenize(keyword);
  if (queryTokens.length === 0) return new Set();
  const resultSets: Set<string>[] = [];
  for (const token of queryTokens) {
    if (invertedIndex[token]) {
      resultSets.push(invertedIndex[token]);
    } else {
      return new Set();
    }
  }
  if (resultSets.length === 0) return new Set();
  let result = new Set(resultSets[0]);
  for (let i = 1; i < resultSets.length; i++) {
    result = new Set([...result].filter((x) => resultSets[i].has(x)));
  }
  return result;
}

export function searchCards(filters: SearchFilters): Card[] {
  ensureIndexBuilt();
  const allCards = cardsCache || [];
  const keywordMatchIds = searchByKeyword(filters.keyword);
  let result = allCards.filter((c) => keywordMatchIds.has(c.id));
  if (filters.type && filters.type !== 'all') {
    result = result.filter((c) => c.type === filters.type);
  }
  if (filters.tags && filters.tags.length > 0) {
    result = result.filter((c) => filters.tags.every((t) => c.tags.includes(t)));
  }
  if (filters.dateFrom) {
    result = result.filter((c) => c.createdAt >= filters.dateFrom!);
  }
  if (filters.dateTo) {
    result = result.filter((c) => c.createdAt <= filters.dateTo!);
  }
  return deepClone(result.sort((a, b) => b.updatedAt - a.updatedAt));
}

export function getCardById(id: string): Card | null {
  const cards = loadCards();
  const found = cards.find((c) => c.id === id);
  return found ? deepClone(found) : null;
}

export function exportCards(cardIds: string[]): string {
  const cards = loadCards();
  const tags = loadTags();
  const selectedCards = cardIds.length > 0 ? cards.filter((c) => cardIds.includes(c.id)) : cards;
  const tagIdsUsed = new Set<string>();
  for (const c of selectedCards) c.tags.forEach((t) => tagIdsUsed.add(t));
  const usedTags = collectUsedTags(tags, tagIdsUsed);
  return JSON.stringify({ cards: selectedCards, tags: usedTags }, null, 2);
}

function collectUsedTags(tags: TagNode[], usedIds: Set<string>): TagNode[] {
  const result: TagNode[] = [];
  for (const tag of tags) {
    const children = collectUsedTags(tag.children, usedIds);
    if (usedIds.has(tag.id) || children.length > 0) {
      result.push({ ...tag, children });
    }
  }
  return result;
}

export interface ImportResult {
  added: Card[];
  updated: Card[];
  duplicates: Card[];
}

export function importCards(jsonString: string, onDuplicate?: (card: Card) => 'overwrite' | 'skip'): ImportResult {
  const parsed = JSON.parse(jsonString);
  const importedCards: Card[] = Array.isArray(parsed) ? parsed : parsed.cards || [];
  const importedTags: TagNode[] = parsed.tags || [];
  const result: ImportResult = { added: [], updated: [], duplicates: [] };
  if (importedTags.length > 0) {
    const existingTags = loadTags();
    const merged = mergeTags(existingTags, importedTags);
    saveTags(merged);
  }
  const cards = loadCards();
  const titleIndex = new Map<string, number>();
  cards.forEach((c, i) => titleIndex.set(c.title, i));
  for (const imp of importedCards) {
    if (!imp.title || !imp.content) continue;
    const existingIdx = titleIndex.get(imp.title);
    if (existingIdx !== undefined) {
      result.duplicates.push(imp);
      const action = onDuplicate ? onDuplicate(imp) : 'skip';
      if (action === 'overwrite') {
        cards[existingIdx] = {
          ...cards[existingIdx],
          content: imp.content,
          tags: imp.tags || cards[existingIdx].tags,
          type: imp.type || cards[existingIdx].type,
          updatedAt: Date.now(),
        };
        result.updated.push(cards[existingIdx]);
      }
    } else {
      const newCard: Card = {
        id: imp.id && !cards.find((c) => c.id === imp.id) ? imp.id : 'card-' + uuidv4().slice(0, 12),
        title: imp.title,
        content: imp.content,
        tags: imp.tags || [],
        type: imp.type || 'note',
        createdAt: imp.createdAt || Date.now(),
        updatedAt: imp.updatedAt || Date.now(),
      };
      cards.push(newCard);
      titleIndex.set(newCard.title, cards.length - 1);
      result.added.push(newCard);
    }
  }
  saveCards(cards);
  rebuildIndex(cards);
  return result;
}

function mergeTags(existing: TagNode[], imported: TagNode[]): TagNode[] {
  const result = deepClone(existing);
  const nameMap = new Map<string, TagNode>();
  function buildMap(nodes: TagNode[]) {
    nodes.forEach((n) => {
      nameMap.set(n.name, n);
      buildMap(n.children);
    });
  }
  buildMap(result);
  function addImported(nodes: TagNode[], parentId: string | null, parentChildren: TagNode[]) {
    for (const imp of nodes) {
      let target = nameMap.get(imp.name);
      if (!target) {
        target = {
          id: 'tag-' + uuidv4().slice(0, 8),
          name: imp.name,
          parentId,
          children: [],
        };
        parentChildren.push(target);
        nameMap.set(target.name, target);
      }
      addImported(imp.children, target.id, target.children);
    }
  }
  addImported(imported, null, result);
  return result;
}
