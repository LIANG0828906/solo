import { Card, Rarity, CardValidationResult, DeckValidationResult, ManaCurvePoint, BorderPreset, IconPreset } from '@/types';

export const RARITY_LABELS: Record<Rarity, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

export const RARITY_ORDER: Rarity[] = ['common', 'rare', 'epic', 'legendary'];

export const BORDER_PRESETS: BorderPreset[] = [
  { id: 'none', name: '无', pattern: null },
  { id: 'simple', name: '简洁', pattern: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.05) 100%)' },
  { id: 'ornate', name: '华丽', pattern: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 50% 100%, rgba(255,255,255,0.08) 0%, transparent 50%)' },
  { id: 'rune', name: '符文', pattern: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 8px)' },
  { id: 'flame', name: '烈焰', pattern: 'linear-gradient(180deg, rgba(255,100,50,0.08) 0%, rgba(255,50,50,0.02) 100%)' },
  { id: 'frost', name: '寒冰', pattern: 'linear-gradient(180deg, rgba(100,200,255,0.08) 0%, rgba(50,100,255,0.02) 100%)' },
];

export const ICON_PRESETS: IconPreset[] = [
  { id: 'sword', name: '剑', svg: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M32 4L20 28L28 32L16 60L32 48L48 60L36 32L44 28L32 4Z" fill="#e94560" stroke="#ffb3c1" stroke-width="2" stroke-linejoin="round"/></svg>' },
  { id: 'shield', name: '盾', svg: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M32 4L8 16V32C8 46 20 56 32 60C44 56 56 46 56 32V16L32 4Z" fill="#42a5f5" stroke="#90caf9" stroke-width="2" stroke-linejoin="round"/></svg>' },
  { id: 'helmet', name: '头盔', svg: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 32C12 20.95 20.95 12 32 12C43.05 12 52 20.95 52 32V40H12V32Z" fill="#9c27b0" stroke="#ce93d8" stroke-width="2"/><rect x="16" y="40" width="32" height="12" rx="2" fill="#7b1fa2" stroke="#ce93d8" stroke-width="2"/></svg>' },
  { id: 'potion', name: '药水', svg: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="26" y="4" width="12" height="12" rx="2" fill="#78909c" stroke="#b0bec5" stroke-width="2"/><path d="M20 24C20 18 24 16 32 16C40 16 44 18 44 24L52 44C52 54 42 60 32 60C22 60 12 54 12 44L20 24Z" fill="#66bb6a" stroke="#a5d6a7" stroke-width="2"/></svg>' },
  { id: 'scroll', name: '卷轴', svg: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="12" y="16" width="40" height="32" rx="2" fill="#fff8e1" stroke="#ffd54f" stroke-width="2"/><circle cx="12" cy="32" r="6" fill="#ffd54f" stroke="#ff8f00" stroke-width="2"/><circle cx="52" cy="32" r="6" fill="#ffd54f" stroke="#ff8f00" stroke-width="2"/><line x1="20" y1="24" x2="44" y2="24" stroke="#8d6e63" stroke-width="2"/><line x1="20" y1="32" x2="44" y2="32" stroke="#8d6e63" stroke-width="2"/><line x1="20" y1="40" x2="36" y2="40" stroke="#8d6e63" stroke-width="2"/></svg>' },
  { id: 'gem', name: '宝石', svg: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="32,4 56,24 32,60 8,24" fill="#e91e63" stroke="#f48fb1" stroke-width="2" stroke-linejoin="round"/><polygon points="8,24 56,24 44,24 32,14 20,24" fill="#f06292" stroke="#f48fb1" stroke-width="1"/></svg>' },
  { id: 'skull', name: '骷髅', svg: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="32" cy="28" rx="22" ry="20" fill="#eceff1" stroke="#90a4ae" stroke-width="2"/><circle cx="24" cy="28" r="5" fill="#263238"/><circle cx="40" cy="28" r="5" fill="#263238"/><rect x="26" y="44" width="4" height="10" fill="#eceff1" stroke="#90a4ae" stroke-width="1"/><rect x="34" y="44" width="4" height="10" fill="#eceff1" stroke="#90a4ae" stroke-width="1"/></svg>' },
  { id: 'crown', name: '王冠', svg: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="8,48 16,20 28,36 32,8 36,36 48,20 56,48" fill="#ffd700" stroke="#ff8f00" stroke-width="2" stroke-linejoin="round"/><circle cx="16" cy="20" r="3" fill="#e91e63"/><circle cx="32" cy="8" r="3" fill="#2196f3"/><circle cx="48" cy="20" r="3" fill="#4caf50"/></svg>' },
  { id: 'dragon', name: '龙翼', svg: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M32 8C32 8 8 16 8 36C8 36 20 32 28 36C28 36 16 44 20 56C20 56 32 48 32 48C32 48 44 56 44 56C48 44 36 36 36 36C44 32 56 36 56 36C56 16 32 8 32 8Z" fill="#795548" stroke="#a1887f" stroke-width="2"/></svg>' },
  { id: 'fire', name: '火焰', svg: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M32 4C28 16 16 20 16 34C16 46 24 58 32 58C40 58 48 46 48 34C48 20 40 24 38 16C36 22 34 22 32 4Z" fill="#ff5722" stroke="#ffab40" stroke-width="2"/><path d="M32 28C30 32 26 36 26 42C26 48 28 52 32 52C36 52 38 48 38 42C38 36 34 34 32 28Z" fill="#ffeb3b" stroke="#fff176" stroke-width="1"/></svg>' },
  { id: 'star', name: '星辰', svg: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="32,4 39,24 60,24 43,36 50,58 32,46 14,58 21,36 4,24 25,24" fill="#ffc107" stroke="#ffd54f" stroke-width="2" stroke-linejoin="round"/></svg>' },
  { id: 'eye', name: '魔眼', svg: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 32C4 32 20 8 32 8C44 8 60 32 60 32C60 32 44 56 32 56C20 56 4 32 4 32Z" fill="#e1bee7" stroke="#ba68c8" stroke-width="2"/><circle cx="32" cy="32" r="14" fill="#fff" stroke="#ba68c8" stroke-width="2"/><circle cx="32" cy="32" r="8" fill="#7b1fa2"/><circle cx="32" cy="32" r="3" fill="#263238"/></svg>' },
];

export const MAX_CARD_POOL = 50;
export const MAX_DECK_SIZE = 30;
export const MAX_COPIES_PER_CARD = 2;

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function validateCard(card: Partial<Card>): CardValidationResult {
  const errors: string[] = [];

  if (!card.name || card.name.trim().length === 0) {
    errors.push('卡牌名称不能为空');
  } else if (card.name.length > 20) {
    errors.push('卡牌名称不能超过20个字符');
  }

  if (!card.rarity || !['common', 'rare', 'epic', 'legendary'].includes(card.rarity)) {
    errors.push('请选择稀有度');
  }

  if (card.cost === undefined || card.cost === null || isNaN(card.cost)) {
    errors.push('费用必须是数字');
  } else if (card.cost < 0 || card.cost > 10) {
    errors.push('费用范围应在 0-10 之间');
  }

  if (card.attack === undefined || card.attack === null || isNaN(card.attack)) {
    errors.push('攻击力必须是数字');
  } else if (card.attack < 0 || card.attack > 30) {
    errors.push('攻击力范围应在 0-30 之间');
  }

  if (card.health === undefined || card.health === null || isNaN(card.health)) {
    errors.push('生命值必须是数字');
  } else if (card.health < 1 || card.health > 30) {
    errors.push('生命值范围应在 1-30 之间');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateDeck(cardIds: string[], allCards: Card[]): DeckValidationResult {
  const errors: string[] = [];
  const cardCountMap: Record<string, number> = {};

  cardIds.forEach((id) => {
    cardCountMap[id] = (cardCountMap[id] || 0) + 1;
  });

  if (cardIds.length > MAX_DECK_SIZE) {
    errors.push(`卡组不能超过 ${MAX_DECK_SIZE} 张，当前 ${cardIds.length} 张`);
  }

  if (cardIds.length < MAX_DECK_SIZE) {
    errors.push(`卡组至少需要 ${MAX_DECK_SIZE} 张，当前 ${cardIds.length} 张`);
  }

  Object.entries(cardCountMap).forEach(([cardId, count]) => {
    if (count > MAX_COPIES_PER_CARD) {
      const card = allCards.find((c) => c.id === cardId);
      errors.push(`卡牌 "${card?.name || cardId}" 最多只能放 ${MAX_COPIES_PER_CARD} 张，当前 ${count} 张`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    totalCards: cardIds.length,
  };
}

export function getCardCountMap(cardIds: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  cardIds.forEach((id) => {
    map[id] = (map[id] || 0) + 1;
  });
  return map;
}

export function calculateManaCurve(cardIds: string[], allCards: Card[]): ManaCurvePoint[] {
  const curve: ManaCurvePoint[] = [];
  for (let cost = 0; cost <= 10; cost++) {
    curve.push({ cost, count: 0 });
  }

  cardIds.forEach((id) => {
    const card = allCards.find((c) => c.id === id);
    if (card) {
      const idx = Math.min(card.cost, 10);
      curve[idx].count++;
    }
  });

  return curve;
}

export function getPresetBorder(id: string): BorderPreset | undefined {
  return BORDER_PRESETS.find((b) => b.id === id);
}

export function getPresetIcon(id: string): IconPreset | undefined {
  return ICON_PRESETS.find((i) => i.id === id);
}

export function getRarityLabel(rarity: Rarity): string {
  return RARITY_LABELS[rarity] || rarity;
}

export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generatePresetCards(): Card[] {
  const presets: Omit<Card, 'id'>[] = [
    { name: '新兵', rarity: 'common', cost: 1, attack: 1, health: 2, borderId: 'simple', iconId: 'sword', description: '初出茅庐的战士。' },
    { name: '守卫', rarity: 'common', cost: 2, attack: 1, health: 4, borderId: 'simple', iconId: 'shield', description: '坚如磐石的防御者。' },
    { name: '剑士', rarity: 'common', cost: 3, attack: 3, health: 3, borderId: 'simple', iconId: 'sword', description: '训练有素的剑客。' },
    { name: '骑士', rarity: 'rare', cost: 4, attack: 4, health: 5, borderId: 'ornate', iconId: 'helmet', description: '荣耀与信仰并存。' },
    { name: '法师学徒', rarity: 'common', cost: 2, attack: 2, health: 2, borderId: 'simple', iconId: 'scroll', description: '正在学习奥术。' },
    { name: '火焰法师', rarity: 'rare', cost: 4, attack: 3, health: 4, borderId: 'flame', iconId: 'fire', description: '掌控烈焰之力。' },
    { name: '治疗师', rarity: 'common', cost: 3, attack: 2, health: 3, borderId: 'simple', iconId: 'potion', description: '精通治愈之道。' },
    { name: '精英战士', rarity: 'rare', cost: 5, attack: 5, health: 5, borderId: 'ornate', iconId: 'sword', description: '身经百战的老兵。' },
    { name: '宝石收集者', rarity: 'epic', cost: 3, attack: 2, health: 4, borderId: 'ornate', iconId: 'gem', description: '收集了无数珍宝。' },
    { name: '亡灵巫师', rarity: 'epic', cost: 5, attack: 4, health: 6, borderId: 'rune', iconId: 'skull', description: '操控亡者的黑暗法师。' },
    { name: '冰霜巨龙', rarity: 'legendary', cost: 8, attack: 8, health: 8, borderId: 'frost', iconId: 'dragon', description: '远古寒冰的化身。' },
    { name: '国王', rarity: 'legendary', cost: 7, attack: 6, health: 7, borderId: 'ornate', iconId: 'crown', description: '万王之王。' },
    { name: '先知', rarity: 'epic', cost: 4, attack: 3, health: 5, borderId: 'rune', iconId: 'eye', description: '洞察过去与未来。' },
    { name: '游侠', rarity: 'rare', cost: 3, attack: 4, health: 2, borderId: 'simple', iconId: 'star', description: '迅捷如风的射手。' },
    { name: '狂战士', rarity: 'epic', cost: 6, attack: 7, health: 5, borderId: 'flame', iconId: 'sword', description: '战斗到最后一刻。' },
  ];

  return presets.map((card) => ({
    ...card,
    id: generateId(),
  }));
}

export function generatePresetDeck(cardPool: Card[]): string[] {
  const deckIds: string[] = [];
  const shuffled = shuffleArray(cardPool);

  for (const card of shuffled) {
    if (deckIds.length >= MAX_DECK_SIZE) break;
    for (let i = 0; i < MAX_COPIES_PER_CARD && deckIds.length < MAX_DECK_SIZE; i++) {
      deckIds.push(card.id);
    }
  }

  return deckIds.slice(0, MAX_DECK_SIZE);
}
