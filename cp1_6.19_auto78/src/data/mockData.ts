import type { Book, ScrapPiece, Category } from '../types';
import { CATEGORY_COLORS } from '../types';

const adjustColor = (hex: string, saturationFactor: number, lightnessFactor: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = ((max + min) / 2) / 255;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (510 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }

  const newS = s * saturationFactor;
  const newL = l * lightnessFactor;

  const c = (1 - Math.abs(2 * newL - 1)) * newS;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = newL - c / 2;

  let r1 = 0, g1 = 0, b1 = 0;
  if (h >= 0 && h < 60) { r1 = c; g1 = x; b1 = 0; }
  else if (h >= 60 && h < 120) { r1 = x; g1 = c; b1 = 0; }
  else if (h >= 120 && h < 180) { r1 = 0; g1 = c; b1 = x; }
  else if (h >= 180 && h < 240) { r1 = 0; g1 = x; b1 = c; }
  else if (h >= 240 && h < 300) { r1 = x; g1 = 0; b1 = c; }
  else if (h >= 300 && h < 360) { r1 = c; g1 = 0; b1 = x; }

  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r1)}${toHex(g1)}${toHex(b1)}`;
};

const categories: Category[] = ['文学', '科学', '历史', '艺术', '哲学'];

const bookTitles: Record<Category, string[]> = {
  文学: ['百年孤独', '红楼梦', '追风筝的人', '挪威的森林', '活着', '围城', '平凡的世界', '小王子'],
  科学: ['时间简史', '自私的基因', '人类简史', '从一到无穷大', '宇宙的琴弦', '物种起源', '枪炮、病菌与钢铁'],
  历史: ['万历十五年', '明朝那些事儿', '罗马人的故事', '叫魂', '天朝的崩溃', '全球通史'],
  艺术: ['艺术的故事', '美的历程', '梵高手稿', '艺术哲学', '认识电影', '设计心理学'],
  哲学: ['苏菲的世界', '存在与时间', '查拉图斯特拉如是说', '理想国', '沉思录', '西方哲学史'],
};

const bookAuthors: Record<Category, string[]> = {
  文学: ['马尔克斯', '曹雪芹', '胡赛尼', '村上春树', '余华', '钱钟书', '路遥', '圣埃克苏佩里'],
  科学: ['霍金', '道金斯', '赫拉利', '伽莫夫', '格林', '达尔文', '戴蒙德'],
  历史: ['黄仁宇', '当年明月', '盐野七生', '孔飞力', '茅海建', '斯塔夫里阿诺斯'],
  艺术: ['贡布里希', '李泽厚', '梵高', '丹纳', '路易斯', '诺曼'],
  哲学: ['贾德', '海德格尔', '尼采', '柏拉图', '奥勒留', '罗素'],
};

export const generateBooks = (): Book[] => {
  const books: Book[] = [];
  let id = 1;
  categories.forEach((cat) => {
    bookTitles[cat].forEach((title, idx) => {
      books.push({
        id: `book-${id++}`,
        title,
        author: bookAuthors[cat][idx] || '佚名',
        category: cat,
        coverColor: adjustColor(CATEGORY_COLORS[cat], 0.6, 0.6),
        popularity: Math.floor(Math.random() * 100),
        puzzleCompletion: Math.random() > 0.5 ? Math.floor(Math.random() * 100) : 0,
        totalPuzzleAttempts: Math.floor(Math.random() * 50),
      });
    });
  });
  return books;
};

const reviewTexts: Record<string, string[]> = {
  '百年孤独': [
    '多年以后，面对行刑队，奥雷里亚诺·布恩迪亚上校将会回想起父亲带他去见识冰块的那个遥远的下午。',
    '家族的第一个人被绑在树上，家族的最后一个人正被蚂蚁吃掉。',
    '生命中曾经有过的所有灿烂，原来终究都需要用寂寞来偿还。',
    '无论走到哪里，都应该记住，过去都是假的，回忆是一条没有归途的路。',
    '以往的一切春天都无法复原，即使最狂热最坚贞的爱情，归根结底也不过是一种瞬息即逝的现实。',
  ],
  '红楼梦': [
    '满纸荒唐言，一把辛酸泪。都云作者痴，谁解其中味。',
    '假作真时真亦假，无为有处有还无。',
    '世事洞明皆学问，人情练达即文章。',
    '一个是阆苑仙葩，一个是美玉无瑕。',
    '寒塘渡鹤影，冷月葬花魂。',
  ],
  '时间简史': [
    '宇宙从何而来，又将向何处去？宇宙有开端吗？',
    '如果我们发现了一套完整的理论，那将是人类理性的终极胜利。',
    '时间和空间是不可分割的，它们共同构成了四维的时空连续体。',
    '黑洞并非完全黑暗，它们会以恒定的速率产生辐射。',
    '我们只是一个普通恒星的小小行星上的先进猴子。',
  ],
  '人类简史': [
    '我们的语言发展成为一种八卦的工具。',
    '金钱是有史以来最普遍也最有效的互信系统。',
    '农业革命是历史上最大的骗局。',
    '人类的融合统一，是历史的大方向。',
    '我们这个物种，究竟想要变成什么？',
  ],
  '万历十五年': [
    '当一个人口众多的国家，各人行动全凭儒家简单粗浅而又无法固定的原则所限制。',
    '一个带有宗教色彩的伦理道德，应该是简单的，而不是复杂的。',
    '统治者的品德和能力，决定了一个朝代的兴衰。',
    '历史的发展，有其必然的规律，也有偶然的因素。',
    '以史为鉴，可以知兴替。',
  ],
  '艺术的故事': [
    '实际上没有艺术这种东西，只有艺术家而已。',
    '所有艺术作品，都是特定时代和特定社会的产物。',
    '欣赏艺术，需要了解它的历史背景和文化语境。',
    '美的标准，随着时代的变迁而不断变化。',
    '艺术是人类表达情感和思想的最高形式。',
  ],
  '苏菲的世界': [
    '你是谁？世界从哪里来？',
    '哲学不是一种学说，而是一种活动。',
    '最聪明的人，是明白自己无知的人。',
    '我们不应该只接受别人告诉我们的事情。',
    '真正的智慧来自于内心的思考。',
  ],
};

export const generateScraps = (bookId: string, bookTitle: string): ScrapPiece[] => {
  const texts = reviewTexts[bookTitle] || reviewTexts['百年孤独'];
  const pieceCount = Math.min(5, Math.max(3, texts.length));
  return texts.slice(0, pieceCount).map((content, idx) => ({
    id: `scrap-${bookId}-${idx}`,
    bookId,
    order: idx,
    content,
  }));
};
