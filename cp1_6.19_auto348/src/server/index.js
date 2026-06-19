import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const keywordsMap = {
  python: ['python', '编程', '代码', '开发', '程序', '入门'],
  lunyu: ['论语', '国学', '孔子', '儒家', '经典', '解读'],
  english: ['英语', '英文', '外语', '学习', '单词', '语法'],
  math: ['数学', '几何', '代数', '运算', '公式', '逻辑'],
  ai: ['人工智能', 'ai', '机器学习', '深度学习', '算法', '数据'],
  design: ['设计', 'ui', '创意', '美学', '排版', '视觉'],
  default: ['知识', '学习', '成长', '思考', '智慧', '教育'],
};

function matchKeyword(text) {
  const t = text.toLowerCase();
  for (const [key, words] of Object.entries(keywordsMap)) {
    if (words.some(w => t.includes(w.toLowerCase()))) return key;
  }
  return 'default';
}

const MATERIALS_DB = [
  { id: 'm1', text: '学习的本质不在于记住，而在于触发新的思考。', tags: ['学习', '思考', '成长'], themes: ['minimal', 'business', 'cartoon'] },
  { id: 'm2', text: 'Python 入门第一步：写出人生第一个 print("Hello, World!")。', tags: ['python', '编程', '入门'], themes: ['minimal', 'cartoon'] },
  { id: 'm3', text: '子曰：学而时习之，不亦说乎？', tags: ['论语', '国学', '孔子'], themes: ['business', 'minimal'] },
  { id: 'm4', text: '代码重构的艺术：让复杂问题拆解为可执行的小步骤。', tags: ['编程', '代码', '开发'], themes: ['minimal', 'business'] },
  { id: 'm5', text: '机器学习的核心：从数据中自动发现规律。', tags: ['ai', '机器学习', '数据'], themes: ['business', 'minimal'] },
  { id: 'm6', text: '子曰：三人行，必有我师焉。', tags: ['论语', '国学', '经典'], themes: ['minimal', 'cartoon'] },
  { id: 'm7', text: '英语单词记忆法：在语境中反复遇见而非死记硬背。', tags: ['英语', '单词', '学习'], themes: ['cartoon', 'minimal'] },
  { id: 'm8', text: '设计的原则：形式永远追随功能。', tags: ['设计', 'ui', '创意'], themes: ['minimal', 'business'] },
  { id: 'm9', text: '数学之美：用最简洁的公式描述宇宙规律。', tags: ['数学', '公式', '逻辑'], themes: ['business', 'minimal'] },
  { id: 'm10', text: '递归思想：把大问题化为同构的小问题。', tags: ['编程', '算法', '开发'], themes: ['minimal', 'cartoon'] },
  { id: 'm11', text: '温故而知新，可以为师矣。', tags: ['论语', '国学', '孔子'], themes: ['business', 'minimal', 'cartoon'] },
  { id: 'm12', text: '每日 15 分钟英语听力，量变终将引发质变。', tags: ['英语', '听力', '外语'], themes: ['cartoon', 'minimal'] },
  { id: 'm13', text: '留白是设计最高级的表达。', tags: ['设计', '排版', '美学'], themes: ['minimal', 'business'] },
  { id: 'm14', text: '线性代数是数据科学的第一语言。', tags: ['数学', '代数', 'ai'], themes: ['business', 'minimal'] },
  { id: 'm15', text: '深度学习：从感知机到 Transformer 的进化之路。', tags: ['ai', '深度学习', '算法'], themes: ['business', 'cartoon'] },
  { id: 'm16', text: '变量命名是程序员的第一门艺术课。', tags: ['python', '编程', '代码'], themes: ['cartoon', 'minimal'] },
  { id: 'm17', text: '知之为知之，不知为不知，是知也。', tags: ['论语', '国学', '智慧'], themes: ['business', 'minimal'] },
  { id: 'm18', text: '语法是骨架，词汇是血肉，阅读是灵魂。', tags: ['英语', '语法', '外语'], themes: ['cartoon', 'minimal'] },
  { id: 'm19', text: '几何直觉：用图形理解抽象概念。', tags: ['数学', '几何', '逻辑'], themes: ['cartoon', 'business'] },
  { id: 'm20', text: '视觉层次：引导用户视线的设计魔法。', tags: ['设计', '视觉', 'ui'], themes: ['minimal', 'cartoon'] },
  { id: 'm21', text: '教育不是注满一桶水，而是点燃一把火。', tags: ['教育', '成长', '知识'], themes: ['minimal', 'business', 'cartoon'] },
  { id: 'm22', text: '神经网络背后其实就是矩阵乘法的反复迭代。', tags: ['ai', '机器学习', '数学'], themes: ['business', 'minimal'] },
  { id: 'm23', text: '函数式编程：把状态变更压缩到最小。', tags: ['编程', '代码', '开发'], themes: ['minimal', 'business'] },
  { id: 'm24', text: '不患人之不己知，患不知人也。', tags: ['论语', '孔子', '智慧'], themes: ['business', 'minimal'] },
  { id: 'm25', text: '听说读写，四项基本功缺一不可。', tags: ['英语', '学习', '外语'], themes: ['cartoon', 'minimal'] },
  { id: 'm26', text: '排版四大原则：对比、重复、对齐、亲密。', tags: ['设计', '排版', 'ui'], themes: ['minimal', 'business'] },
  { id: 'm27', text: '概率思维：在不确定中做出理性选择。', tags: ['数学', '逻辑', 'ai'], themes: ['business', 'cartoon'] },
  { id: 'm28', text: '面向对象：用类和对象建模真实世界。', tags: ['编程', '开发', '代码'], themes: ['minimal', 'cartoon'] },
  { id: 'm29', text: 'AI 不会取代你，但善用 AI 的人会。', tags: ['ai', '人工智能', '思考'], themes: ['business', 'minimal', 'cartoon'] },
  { id: 'm30', text: '学而不思则罔，思而不学则殆。', tags: ['论语', '国学', '学习'], themes: ['business', 'minimal', 'cartoon'] },
];

const IMG_POOL = {
  python: [
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
    'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800',
  ],
  lunyu: [
    'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800',
    'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800',
    'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800',
  ],
  english: [
    'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800',
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
  ],
  math: [
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800',
    'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800',
    'https://images.unsplash.com/photo-1518133835878-5a9330e25215?w=800',
  ],
  ai: [
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    'https://images.unsplash.com/photo-1655720828018-edd2daec9349?w=800',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
  ],
  design: [
    'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800',
    'https://images.unsplash.com/photo-1545235617-9465d2a55698?w=800',
    'https://images.unsplash.com/photo-1634942537034-2531766767d1?w=800',
  ],
  default: [
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
  ],
};

function pickImage(seedText) {
  const key = matchKeyword(seedText);
  const pool = IMG_POOL[key] || IMG_POOL.default;
  const all = [...pool, ...IMG_POOL.default];
  return all[Math.floor(Math.random() * all.length)];
}

function filterMaterials(keyword, themes) {
  let list = MATERIALS_DB.slice();
  if (keyword && keyword.trim()) {
    const kw = keyword.trim().toLowerCase();
    list = list.filter(m =>
      m.text.toLowerCase().includes(kw) ||
      m.tags.some(t => t.toLowerCase().includes(kw)) ||
      Object.entries(keywordsMap).some(([k, words]) =>
        k.includes(kw) || words.some(w => w.toLowerCase().includes(kw))
    );
  }
  if (themes && themes.length) {
    list = list.filter(m => m.themes.some(t => themes.includes(t)));
  }
  return list;
}

app.get('/api/materials', (req, res) => {
  const { keyword = '', theme, limit = 20, offset = 0 } = req.query;
  const themes = typeof theme === 'string' ? theme.split(',').filter(Boolean) : Array.isArray(theme) ? theme : [];
  const filtered = filterMaterials(keyword, themes);
  const items = filtered.map(m => ({ ...m, imageUrl: pickImage(m.tags[0] || keyword || '' }));
  const total = items.length;
  const start = parseInt(offset) || 0;
  const end = start + (parseInt(limit) || 20);
  res.json({ total, items: items.slice(start, end) });
});

app.get('/api/materials/images', (req, res) => {
  const { keyword = '', limit = 12 } = req.query;
  const key = matchKeyword(keyword);
  const pool = [...(IMG_POOL[key] || []), ...IMG_POOL.default];
  const images = pool.slice(0, parseInt(limit) || 12).map((url, i) => ({
    id: `img_${key}_${i}`,
    url,
    tags: [key],
  }));
  res.json({ items: images });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`素材服务已启动: http://localhost:${PORT}`);
});

export default app;
