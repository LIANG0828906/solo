export interface CardData {
  id: string;
  title: string;
  description: string;
  color: string;
  icon: string;
  x: number;
  y: number;
  rating: number;
  relatedSentences: string[];
}

export interface ConnectionData {
  id: string;
  fromCardId: string;
  toCardId: string;
  strength: number;
  description: string;
}

export interface CanvasState {
  cards: CardData[];
  connections: ConnectionData[];
  zoom: number;
  panX: number;
  panY: number;
  lastSaved: number;
}

const CARD_COLORS = ['#E3F2FD', '#F3E5F5', '#E8F5E9'];
const CARD_ICONS = ['💡', '📌', '🔑', '⭐', '🎯', '📚', '🧠', '⚡', '🔗', '🎨'];
const STORAGE_KEY = 'knowledge-card-wall';
const GRID_SIZE = 20;

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function getRandomColor(): string {
  return CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)];
}

export function getRandomIcon(): string {
  return CARD_ICONS[Math.floor(Math.random() * CARD_ICONS.length)];
}

export function snapToGrid(value: number, gridSize: number = GRID_SIZE): number {
  return Math.round(value / gridSize) * gridSize;
}

export function extractKeywords(text: string, maxCount: number = 10): string[] {
  if (!text.trim()) return [];

  const cleanText = text.replace(/[#*_`~\[\]()>-]/g, ' ');
  
  const sentences = cleanText.split(/[。！？.!?\n]+/).filter(s => s.trim().length > 0);
  
  const wordFreq: Record<string, number> = {};
  const wordSentences: Record<string, string[]> = {};

  const cnPattern = /[\u4e00-\u9fa5]{2,6}/g;
  const enPattern = /\b[A-Za-z][a-zA-Z]{2,}\b/g;

  sentences.forEach((sentence) => {
    const cnMatches = sentence.match(cnPattern) || [];
    const enMatches = sentence.match(enPattern) || [];
    const allWords = [...cnMatches, ...enMatches];

    allWords.forEach(word => {
      const lowerWord = word.toLowerCase();
      if (isStopWord(lowerWord)) return;
      
      wordFreq[lowerWord] = (wordFreq[lowerWord] || 0) + 1;
      if (!wordSentences[lowerWord]) {
        wordSentences[lowerWord] = [];
      }
      if (!wordSentences[lowerWord].includes(sentence.trim())) {
        wordSentences[lowerWord].push(sentence.trim());
      }
    });
  });

  const scoredWords = Object.entries(wordFreq).map(([word, freq]) => {
    let score = freq;
    if (text.indexOf(word) < text.length * 0.3) score += 2;
    if (/[\u4e00-\u9fa5]/.test(word)) {
      if (word.length >= 2 && word.length <= 4) score += 1;
    } else {
      if (word.length >= 4 && word.length <= 10) score += 1;
    }
    return { word, score, freq };
  });

  scoredWords.sort((a, b) => b.score - a.score);

  const result: string[] = [];
  const seen = new Set<string>();
  
  for (const item of scoredWords) {
    if (result.length >= maxCount) break;
    if (item.freq < 1) continue;
    
    const lowerWord = item.word.toLowerCase();
    let isDuplicate = false;
    for (const existing of seen) {
      if (existing.includes(lowerWord) || lowerWord.includes(existing)) {
        isDuplicate = true;
        break;
      }
    }
    if (!isDuplicate) {
      result.push(item.word);
      seen.add(lowerWord);
    }
  }

  if (result.length < 3 && sentences.length > 0) {
    const firstFew = sentences.slice(0, 3).map(s => s.trim().substring(0, 12));
    for (const phrase of firstFew) {
      if (result.length < 3 && !result.includes(phrase)) {
        result.push(phrase);
      }
    }
  }

  return result.slice(0, maxCount);
}

function isStopWord(word: string): boolean {
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'shall', 'this', 'that', 'these', 'those',
    'it', 'its', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from',
    'as', 'and', 'or', 'but', 'not', 'no', 'so', 'if', 'then', 'than',
    '我们', '你们', '他们', '它们', '这个', '那个', '这些', '那些',
    '就是', '还是', '但是', '因为', '所以', '虽然', '如果', '那么',
    '一个', '一些', '什么', '怎么', '怎样', '如何', '可以', '能够',
    '进行', '通过', '使用', '利用', '提供', '实现', '完成', '需要',
    '可能', '应该', '必须', '已经', '正在', '将会', '曾经',
    '非常', '十分', '比较', '更加', '越来越', '的话', '而已',
    '以及', '等等', '之类', '以上', '以下', '以内', '以外',
  ]);
  return stopWords.has(word.toLowerCase());
}

export function getRelatedSentences(text: string, keyword: string): string[] {
  const sentences = text.split(/[。！？.!?\n]+/).filter(s => s.trim().length > 0);
  return sentences
    .filter(s => s.toLowerCase().includes(keyword.toLowerCase()))
    .map(s => s.trim())
    .slice(0, 3);
}

export function generateCardsFromText(
  text: string,
  canvasWidth: number,
  canvasHeight: number,
  cardWidth: number = 200,
  cardHeight: number = 120
): CardData[] {
  const keywords = extractKeywords(text, 10);
  if (keywords.length === 0) return [];

  const cards: CardData[] = [];
  const padding = 60;
  const cols = Math.ceil(Math.sqrt(keywords.length));
  const rows = Math.ceil(keywords.length / cols);

  const totalWidth = cols * (cardWidth + padding);
  const totalHeight = rows * (cardHeight + padding);
  const startX = (canvasWidth - totalWidth) / 2 + padding / 2;
  const startY = (canvasHeight - totalHeight) / 2 + padding / 2;

  keywords.forEach((keyword, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    const x = snapToGrid(startX + col * (cardWidth + padding));
    const y = snapToGrid(startY + row * (cardHeight + padding));
    
    const relatedSentences = getRelatedSentences(text, keyword);
    
    cards.push({
      id: generateId(),
      title: keyword.length > 20 ? keyword.substring(0, 20) + '...' : keyword,
      description: relatedSentences[0]?.substring(0, 50) + '...' || '',
      color: getRandomColor(),
      icon: CARD_ICONS[index % CARD_ICONS.length],
      x,
      y,
      rating: 0,
      relatedSentences,
    });
  });

  return cards;
}

export function calculateConnectionStrength(
  card1: CardData,
  card2: CardData,
  text: string
): number {
  let strength = 0;
  const sentences = text.split(/[。！？.!?\n]+/).filter(s => s.trim().length > 0);
  
  for (const sentence of sentences) {
    if (sentence.includes(card1.title) && sentence.includes(card2.title)) {
      strength += 2;
    }
  }
  
  if (strength === 0) {
    strength = Math.floor(Math.random() * 3) + 1;
  }
  
  return Math.min(strength, 5);
}

export function generateConnections(
  cards: CardData[],
  text: string
): ConnectionData[] {
  if (cards.length < 2) return [];
  
  const connections: ConnectionData[] = [];
  
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const strength = calculateConnectionStrength(cards[i], cards[j], text);
      if (strength >= 1) {
        connections.push({
          id: generateId(),
          fromCardId: cards[i].id,
          toCardId: cards[j].id,
          strength,
          description: `${cards[i].title} — ${cards[j].title}`,
        });
      }
    }
  }
  
  return connections;
}

export function getWeakConnectionOpacity(
  connections: ConnectionData[],
  threshold: number = 20
): Record<string, number> {
  const opacityMap: Record<string, number> = {};
  
  if (connections.length <= threshold) {
    connections.forEach(c => {
      opacityMap[c.id] = 1;
    });
    return opacityMap;
  }
  
  const sorted = [...connections].sort((a, b) => b.strength - a.strength);
  
  sorted.forEach((conn, index) => {
    opacityMap[conn.id] = index < threshold ? 1 : 0.2;
  });
  
  return opacityMap;
}

export function interpolateColor(color1: string, color2: string): string {
  const hex = (c: string) => parseInt(c, 16);
  const r1 = hex(color1.slice(1, 3));
  const g1 = hex(color1.slice(3, 5));
  const b1 = hex(color1.slice(5, 7));
  const r2 = hex(color2.slice(1, 3));
  const g2 = hex(color2.slice(3, 5));
  const b2 = hex(color2.slice(5, 7));
  
  const r = Math.round((r1 + r2) / 2);
  const g = Math.round((g1 + g2) / 2);
  const b = Math.round((b1 + b2) / 2);
  
  return `rgb(${r}, ${g}, ${b})`;
}

export function saveToLocalStorage(state: CanvasState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      lastSaved: Date.now(),
    }));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

export function loadFromLocalStorage(): CanvasState | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data) as CanvasState;
    }
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
  }
  return null;
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function computeBezierControlPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  avoidCards: { x: number; y: number; width: number; height: number }[] = []
): { cp1x: number; cp1y: number; cp2x: number; cp2y: number } {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  const offset = dist * 0.3;
  
  let perpX = -dy / dist * offset;
  let perpY = dx / dist * offset;
  
  for (const card of avoidCards) {
    const cardCenterX = card.x + card.width / 2;
    const cardCenterY = card.y + card.height / 2;
    
    const lineToCardX = cardCenterX - midX;
    const lineToCardY = cardCenterY - midY;
    const dot = perpX * lineToCardX + perpY * lineToCardY;
    
    if (dot > 0) {
      perpX = -perpX;
      perpY = -perpY;
      break;
    }
  }
  
  return {
    cp1x: x1 + dx * 0.3 + perpX,
    cp1y: y1 + dy * 0.3 + perpY,
    cp2x: x1 + dx * 0.7 + perpX,
    cp2y: y1 + dy * 0.7 + perpY,
  };
}
