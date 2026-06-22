import type { StoryCard, Connection, CardType } from '../types';

const typeOrder: Record<CardType, number> = {
  scene: 0,
  character: 1,
  object: 2,
  event: 3,
};

const introTemplates: Record<CardType, string[]> = {
  scene: [
    '在{name}的深处，',
    '传说中，{name}隐藏着不为人知的秘密。',
    '那是一个被遗忘的年代，{name}静静矗立在世界的边缘。',
  ],
  character: [
    '我们的故事要从{name}说起。',
    '{name}，一个名字在大陆上流传已久的存在。',
    '很久以前，{name}踏上了一段未知的旅程。',
  ],
  object: [
    '传说世间存在一件神器——{name}。',
    '{name}，它的力量足以撼动天地。',
  ],
  event: [
    '一切都始于那场{name}。',
    '当{name}发生之时，世界的命运便已注定。',
  ],
};

const transitionTemplates = [
  '与此同时，',
  '然而命运的齿轮从未停止转动，',
  '就在这时，',
  '不久之后，',
  '仿佛是命运的安排，',
  '更令人震惊的是，',
];

const connectionTemplates: Record<string, string[]> = {
  'character-scene': ['{from}来到了{to}。', '{from}的身影出现在{to}之中。'],
  'scene-character': ['在{from}，{to}正等待着时机。', '{from}深处，{to}独自伫立。'],
  'character-object': ['{from}手中紧握着{to}。', '{from}终于找到了传说中的{to}。'],
  'object-character': ['凭借{from}的力量，{to}变得前所未有的强大。'],
  'character-event': ['{from}触发了{to}。', '{from}成为了{to}的关键。'],
  'event-character': ['随着{from}的展开，{to}的命运被彻底改变。'],
  'scene-event': ['{from}成为了{to}的舞台。'],
  'event-scene': ['{from}之后，{to}不复从前。'],
  'object-event': ['{from}引发了{to}。'],
  'event-object': ['经过{from}，{to}终于显现出真正的力量。'],
  'character-character': ['{from}与{to}宿命般地相遇了。', '{from}和{to}并肩而立。'],
  'scene-scene': ['从{from}到{to}，旅途仍在继续。'],
  'object-object': ['{from}与{to}产生了奇异的共鸣。'],
  'event-event': ['{from}之后，{to}接踵而至。'],
};

const endingTemplates = [
  '就这样，一个属于勇者的传说被永久地铭刻在历史之中。',
  '故事至此告一段落，但属于这个世界的传奇，还远未结束...',
  '当一切尘埃落定，新的篇章又将开启。',
  '而那之后的故事，就留给时间去诉说吧。',
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] || `{${key}}`);
}

function getCardName(cards: StoryCard[], id: string): string {
  const card = cards.find((c) => c.id === id);
  return card ? card.name : '未知';
}

function topologicalSort(cards: StoryCard[], connections: Connection[]): StoryCard[] {
  const idToCard = new Map(cards.map((c) => [c.id, c]));
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  cards.forEach((c) => {
    inDegree.set(c.id, 0);
    adjacency.set(c.id, []);
  });

  connections.forEach((conn) => {
    if (adjacency.has(conn.fromId) && inDegree.has(conn.toId)) {
      adjacency.get(conn.fromId)!.push(conn.toId);
      inDegree.set(conn.toId, inDegree.get(conn.toId)! + 1);
    }
  });

  const queue: string[] = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });

  queue.sort((a, b) => {
    const ca = idToCard.get(a)!;
    const cb = idToCard.get(b)!;
    return typeOrder[ca.type] - typeOrder[cb.type];
  });

  const result: StoryCard[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const card = idToCard.get(id);
    if (card) result.push(card);

    adjacency.get(id)!.forEach((neighbor) => {
      inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    });

    queue.sort((a, b) => {
      const ca = idToCard.get(a)!;
      const cb = idToCard.get(b)!;
      return typeOrder[ca.type] - typeOrder[cb.type];
    });
  }

  const remaining = cards.filter((c) => !result.find((r) => r.id === c.id));
  remaining.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);
  return [...result, ...remaining];
}

export function buildStory(cards: StoryCard[], connections: Connection[]): string {
  if (cards.length === 0) {
    return '请先从左侧拖拽一些故事卡片到编辑区，再点击"生成故事"按钮，开启你的奇幻之旅...';
  }

  const sorted = topologicalSort(cards, connections);
  const parts: string[] = [];

  const firstCard = sorted[0];
  const introTpls = introTemplates[firstCard.type];
  let intro = fillTemplate(pickRandom(introTpls), { name: firstCard.name });
  intro += firstCard.description.replace(/^./, (c) => c.toLowerCase());
  parts.push(intro);

  const connectedPairs = new Set<string>();
  connections.forEach((c) => {
    connectedPairs.add(`${c.fromId}-${c.toId}`);
    connectedPairs.add(`${c.toId}-${c.fromId}`);
  });

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const pairKey = `${prev.id}-${curr.id}`;

    let transition = '';
    if (connectedPairs.has(pairKey)) {
      const typePair1 = `${prev.type}-${curr.type}`;
      const typePair2 = `${curr.type}-${prev.type}`;
      const tpls =
        connectionTemplates[typePair1] ||
        connectionTemplates[typePair2] ||
        transitionTemplates;
      if (connectionTemplates[typePair1] || connectionTemplates[typePair2]) {
        transition = fillTemplate(pickRandom(tpls), {
          from: prev.name,
          to: curr.name,
        });
      } else {
        transition = pickRandom(tpls);
      }
    } else {
      transition = pickRandom(transitionTemplates);
    }

    let sentence = transition;
    sentence += curr.description.replace(/^./, (c) => c.toLowerCase());
    parts.push(sentence);
  }

  connections.forEach((conn) => {
    const fromName = getCardName(cards, conn.fromId);
    const toName = getCardName(cards, conn.toId);
    const fromCard = cards.find((c) => c.id === conn.fromId);
    const toCard = cards.find((c) => c.id === conn.toId);
    if (!fromCard || !toCard) return;

    const typePair1 = `${fromCard.type}-${toCard.type}`;
    const typePair2 = `${toCard.type}-${fromCard.type}`;
    const tpls = connectionTemplates[typePair1] || connectionTemplates[typePair2];
    if (tpls && Math.random() > 0.5) {
      const fromIdx = sorted.findIndex((c) => c.id === conn.fromId);
      const toIdx = sorted.findIndex((c) => c.id === conn.toId);
      if (Math.abs(fromIdx - toIdx) > 1) {
        parts.push(fillTemplate(pickRandom(tpls), { from: fromName, to: toName }));
      }
    }
  });

  parts.push(pickRandom(endingTemplates));

  return parts.join('\n\n');
}
