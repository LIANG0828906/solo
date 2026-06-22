export interface CardData {
  id: number;
  title: string;
  description: string;
  tag: string;
  likes: number;
  emoji: string;
}

const TAGS = ['设计', '科技', '艺术', '生活方式', '教育', '娱乐'];

const EMOJIS_BY_TAG: Record<string, string[]> = {
  '设计': ['🎨', '🖌️', '🎭', '🎪', '🎯', '🎲'],
  '科技': ['💻', '🚀', '🔬', '⚡', '🤖', '🛸'],
  '艺术': ['🖼️', '🎵', '🎬', '📚', '✏️', '🎻'],
  '生活方式': ['🌿', '☕', '🏡', '🌱', '🧘', '🍃'],
  '教育': ['📖', '🎓', '🔍', '💡', '📝', '🧠'],
  '娱乐': ['🎮', '🎲', '🎳', '🎯', '🎪', '🎰'],
};

const TITLES_BY_TAG: Record<string, string[]> = {
  '设计': [
    '极简主义UI设计法则',
    '色彩心理学在设计中的应用',
    '响应式设计最佳实践',
    '字体搭配的艺术',
    '微交互设计提升用户体验',
    '暗黑模式设计指南',
    '图标设计的10个原则',
    '留白的美学力量',
    '品牌视觉识别系统构建',
    '拟物化与扁平化设计对比',
  ],
  '科技': [
    'AI生成艺术的未来趋势',
    'Web3.0去中心化应用',
    '量子计算入门指南',
    '边缘计算与5G融合',
    '元宇宙社交新形态',
    '低代码开发平台对比',
    '可持续绿色科技',
    '生物识别技术演进',
    '智能穿戴设备创新',
    '区块链实际应用场景',
  ],
  '艺术': [
    '数字绘画技法分享',
    '街头艺术的文化价值',
    '极简主义摄影技巧',
    '色彩理论深度解析',
    '拼贴艺术创作思路',
    '光影在艺术中的运用',
    '抽象艺术的情感表达',
    '传统与数字艺术融合',
    '艺术收藏入门建议',
    '公共艺术空间设计',
  ],
  '生活方式': [
    '断舍离生活哲学',
    '晨间高效习惯养成',
    '居家办公空间布置',
    '慢生活方式实践',
    '数字 detox 计划',
    '极简衣橱管理法',
    '正念冥想入门',
    '环保零浪费生活',
    '自我关怀日常仪式',
    '创意手账记录法',
  ],
  '教育': [
    '费曼学习法实践',
    '在线教育互动设计',
    '记忆宫殿训练技巧',
    '项目式学习方法',
    '成长型思维培养',
    '碎片化时间利用',
    '知识体系构建方法',
    '批判性思维训练',
    '跨学科学习策略',
    '游戏化教育设计',
  ],
  '娱乐': [
    '独立游戏开发灵感',
    '沉浸式戏剧体验',
    '密室逃脱设计思路',
    '桌游机制创新点',
    '短视频创作技巧',
    '播客节目策划指南',
    '角色扮演游戏设定',
    '线下社交活动创意',
    '音乐可视化实验',
    '互动艺术装置设计',
  ],
};

const DESCRIPTIONS_BY_TAG: Record<string, string[]> = {
  '设计': [
    '探索如何通过最小的元素传达最丰富的信息，让设计回归本质。',
    '不同颜色如何影响用户情绪和行为？深入了解色彩的心理暗示。',
    '从移动端到桌面端，打造流畅一致的多端体验。',
    '好的字体搭配能让内容更具可读性和美感，这些组合值得收藏。',
    '那些容易被忽略的细节，恰恰是用户体验的关键。',
    '如何优雅地实现深色模式，同时保持品牌辨识度？',
    '从线性到面性，图标风格如何与产品调性匹配？',
    '少即是多，留白不是空白，而是内容的呼吸空间。',
    '从零开始构建一套完整的品牌视觉识别系统。',
    '两种设计风格各有千秋，如何选择适合自己产品的方向？',
  ],
  '科技': [
    'AI正在重塑创意产业，了解最新的技术进展和应用场景。',
    '去中心化应用如何改变我们与互联网的交互方式？',
    '用通俗易懂的方式理解量子计算的基本原理。',
    '当边缘计算遇上5G，将催生哪些创新应用？',
    '虚拟世界中的社交关系会是什么样子？',
    '主流低代码平台横向对比，找到最适合你的那一个。',
    '科技如何助力可持续发展，共创绿色未来。',
    '从指纹到虹膜，生物识别技术的演进之路。',
    '下一代智能穿戴设备会有哪些惊喜功能？',
    '抛开加密货币，区块链还有哪些真实落地场景？',
  ],
  '艺术': [
    '数字绘画工具和技法分享，从零开始数字艺术创作。',
    '街头艺术不仅仅是涂鸦，更是城市文化的表达。',
    '掌握这些极简摄影技巧，手机也能拍出大片感。',
    '从三原色到色彩搭配，系统学习色彩理论知识。',
    '用剪刀和胶水创造出意想不到的艺术作品。',
    '光是艺术的灵魂，学习如何运用光影创造氛围。',
    '抽象艺术如何传达情感？解读抽象作品的深层含义。',
    '当传统艺术遇上数字技术，会碰撞出怎样的火花？',
    '艺术收藏新手入门，从欣赏到收藏的进阶之路。',
    '公共艺术如何改变城市空间和社区文化？',
  ],
  '生活方式': [
    '放下多余的物质，专注真正重要的事物。',
    '一日之计在于晨，这些习惯让你的早晨更高效。',
    '打造一个既舒适又高效的居家办公环境。',
    '在快节奏的时代，学会慢下来享受生活。',
    '远离电子设备的一周，会发生什么奇妙的变化？',
    '用更少的衣服搭配出更多风格，极简衣橱指南。',
    '每天十分钟，从冥想开始你的正念练习。',
    '从小事做起，逐步实现零浪费的环保生活方式。',
    '爱自己是终身浪漫的开始，建立你的自我关怀仪式。',
    '用手账记录生活，激发创造力，留下美好回忆。',
  ],
  '教育': [
    '用教别人的方式来学习，费曼学习法深度解析。',
    '如何让在线教育更具互动性和参与感？',
    '古罗马人的记忆秘术，记忆宫殿法实战教程。',
    '通过真实项目来学习，知识掌握更牢固。',
    '培养成长型思维，相信能力可以通过努力提升。',
    '时间就像海绵里的水，碎片化时间也能大有用处。',
    '如何构建属于自己的知识体系，告别碎片化学习？',
    '训练批判性思维，不人云亦云，独立思考。',
    '打破学科边界，跨学科学习带来全新视角。',
    '将游戏元素融入教育，让学习变得有趣又有效。',
  ],
  '娱乐': [
    '一个人也能做游戏？独立游戏开发入门灵感合集。',
    '打破第四面墙，沉浸式戏剧带来的全新体验。',
    '密室逃脱关卡设计师的脑洞有多大？',
    '经典桌游机制解析，创意灵感源源不断。',
    '如何在众多创作者中脱颖而出？短视频创作秘籍。',
    '从零开始策划一档属于你的播客节目。',
    '构建属于你的幻想世界，RPG设定指南。',
    '告别尴尬，这些社交活动创意让聚会更有趣。',
    '当音乐遇上视觉艺术，会产生怎样的化学反应？',
    '互动艺术装置如何让观众成为作品的一部分？',
  ],
};

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function pickRandom<T>(arr: T[], random: () => number): T {
  return arr[Math.floor(random() * arr.length)] as T;
}

function shuffle<T>(arr: T[], random: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generateCards(count: number = 50): CardData[] {
  const random = seededRandom(42);
  const cards: CardData[] = [];
  const tagCounters: Record<string, number> = {};
  const shuffledTitles: Record<string, string[]> = {};
  const shuffledDescs: Record<string, string[]> = {};
  const shuffledEmojis: Record<string, string[]> = {};

  TAGS.forEach((tag) => {
    tagCounters[tag] = 0;
    shuffledTitles[tag] = shuffle(TITLES_BY_TAG[tag]!, random);
    shuffledDescs[tag] = shuffle(DESCRIPTIONS_BY_TAG[tag]!, random);
    shuffledEmojis[tag] = shuffle(EMOJIS_BY_TAG[tag]!, random);
  });

  const cardsPerTag = Math.ceil(count / TAGS.length);
  const tagQueues: string[] = [];

  TAGS.forEach((tag) => {
    for (let i = 0; i < cardsPerTag; i++) {
      tagQueues.push(tag);
    }
  });

  const shuffledTags = shuffle(tagQueues, random).slice(0, count);

  for (let i = 0; i < shuffledTags.length; i++) {
    const tag = shuffledTags[i]!;
    const counter = tagCounters[tag]!;
    const titleIndex = counter % shuffledTitles[tag]!.length;
    const descIndex = (counter + 2) % shuffledDescs[tag]!.length;
    const emojiIndex = counter % shuffledEmojis[tag]!.length;

    cards.push({
      id: i + 1,
      title: shuffledTitles[tag]![titleIndex]!,
      description: shuffledDescs[tag]![descIndex]!,
      tag,
      likes: Math.floor(random() * 500) + 10,
      emoji: shuffledEmojis[tag]![emojiIndex]!,
    });

    tagCounters[tag] = counter + 1;
  }

  return cards;
}

export function filterByTag(cards: CardData[], tag: string): CardData[] {
  if (tag === 'all') {
    return cards;
  }
  return cards.filter((card) => card.tag === tag);
}

export function filterByKeyword(cards: CardData[], keyword: string): CardData[] {
  if (!keyword.trim()) {
    return cards;
  }
  const lowerKeyword = keyword.toLowerCase();
  return cards.filter(
    (card) =>
      card.title.toLowerCase().includes(lowerKeyword) ||
      card.description.toLowerCase().includes(lowerKeyword) ||
      card.tag.toLowerCase().includes(lowerKeyword)
  );
}

export function filterCards(
  cards: CardData[],
  tag: string,
  keyword: string
): CardData[] {
  let result = filterByTag(cards, tag);
  result = filterByKeyword(result, keyword);
  return result;
}
