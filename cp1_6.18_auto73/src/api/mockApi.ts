import { v4 as uuidv4 } from 'uuid';
import type { Card, Relation } from '@/shared/cardTypes';

const STORAGE_KEYS = {
  CARDS: 'inspireflow_cards',
  RELATIONS: 'inspireflow_relations',
};

function loadCards(): Card[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CARDS);
    return data ? JSON.parse(data) : getDefaultCards();
  } catch {
    return getDefaultCards();
  }
}

function loadRelations(): Relation[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.RELATIONS);
    return data ? JSON.parse(data) : getDefaultRelations();
  } catch {
    return getDefaultRelations();
  }
}

function saveCards(cards: Card[]): void {
  localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
}

function saveRelations(relations: Relation[]): void {
  localStorage.setItem(STORAGE_KEYS.RELATIONS, JSON.stringify(relations));
}

function getDefaultCards(): Card[] {
  const now = Date.now();
  return [
    {
      id: 'card-1',
      title: '界面设计灵感',
      description: '探索深色主题与渐变色的结合，用金色作为强调色点亮整体视觉效果',
      tags: ['设计', 'UI'],
      createdAt: now - 86400000 * 3,
    },
    {
      id: 'card-2',
      title: '数据可视化方案',
      description: '使用Canvas API实现高性能节点图渲染，支持拖拽和缩放交互',
      tags: ['技术', '可视化'],
      createdAt: now - 86400000 * 2,
    },
    {
      id: 'card-3',
      title: '用户体验优化',
      description: '通过微动画和即时反馈提升交互感知，所有操作响应低于100ms',
      tags: ['UX', '设计'],
      createdAt: now - 86400000,
    },
    {
      id: 'card-4',
      title: '移动端适配策略',
      description: '768px以下视口采用底部抽屉式面板，保持核心功能的可用性',
      tags: ['技术', 'UX'],
      createdAt: now - 3600000,
    },
    {
      id: 'card-5',
      title: '关联图谱概念',
      description: '灵感之间不是孤立的，通过可视化关联线展示创意之间的内在联系',
      tags: ['可视化', '设计'],
      createdAt: now,
    },
  ];
}

function getDefaultRelations(): Relation[] {
  return [
    { id: 'rel-1', sourceId: 'card-1', targetId: 'card-3', createdAt: Date.now() - 86400000 },
    { id: 'rel-2', sourceId: 'card-2', targetId: 'card-5', createdAt: Date.now() - 43200000 },
    { id: 'rel-3', sourceId: 'card-3', targetId: 'card-4', createdAt: Date.now() - 21600000 },
    { id: 'rel-4', sourceId: 'card-1', targetId: 'card-5', createdAt: Date.now() },
  ];
}

export async function fetchCards(): Promise<Card[]> {
  return loadCards();
}

export async function createCard(data: Omit<Card, 'id' | 'createdAt'>): Promise<Card> {
  const cards = loadCards();
  const card: Card = {
    id: uuidv4(),
    title: data.title,
    description: data.description,
    tags: data.tags,
    createdAt: Date.now(),
  };
  cards.unshift(card);
  saveCards(cards);
  return card;
}

export async function updateCard(id: string, data: Partial<Card>): Promise<Card> {
  const cards = loadCards();
  const index = cards.findIndex(c => c.id === id);
  if (index === -1) throw new Error('Card not found');
  cards[index] = { ...cards[index], ...data };
  saveCards(cards);
  return cards[index];
}

export async function deleteCard(id: string): Promise<void> {
  const cards = loadCards().filter(c => c.id !== id);
  const relations = loadRelations().filter(r => r.sourceId !== id && r.targetId !== id);
  saveCards(cards);
  saveRelations(relations);
}

export async function fetchRelations(): Promise<Relation[]> {
  return loadRelations();
}

export async function createRelation(sourceId: string, targetId: string): Promise<Relation> {
  const relations = loadRelations();
  const exists = relations.some(
    r => (r.sourceId === sourceId && r.targetId === targetId) ||
         (r.sourceId === targetId && r.targetId === sourceId)
  );
  if (exists) throw new Error('Relation already exists');
  const relation: Relation = {
    id: uuidv4(),
    sourceId,
    targetId,
    createdAt: Date.now(),
  };
  relations.push(relation);
  saveRelations(relations);
  return relation;
}

export async function deleteRelation(id: string): Promise<void> {
  const relations = loadRelations().filter(r => r.id !== id);
  saveRelations(relations);
}
