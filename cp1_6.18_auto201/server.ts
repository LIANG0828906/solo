import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

export interface Card {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Relation {
  source: string;
  target: string;
  strength: number;
  tags: string[];
}

export interface GraphNode {
  id: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
  label: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: Relation[];
}

const TAG_TYPE_MAP: Record<string, { type: string; color: string }> = {
  '写作': { type: 'writing', color: '#E67E22' },
  '小说': { type: 'writing', color: '#E67E22' },
  '散文': { type: 'writing', color: '#E67E22' },
  '设计': { type: 'design', color: '#3498DB' },
  'UI': { type: 'design', color: '#3498DB' },
  '配色': { type: 'design', color: '#3498DB' },
  '排版': { type: 'design', color: '#3498DB' },
  '策划': { type: 'planning', color: '#2ECC71' },
  '活动': { type: 'planning', color: '#2ECC71' },
  '运营': { type: 'planning', color: '#2ECC71' },
  '品牌': { type: 'planning', color: '#2ECC71' },
};

function getTagColor(tag: string): string {
  return TAG_TYPE_MAP[tag]?.color || '#9B59B6';
}

function getCardColor(card: Card): string {
  for (const tag of card.tags) {
    const color = TAG_TYPE_MAP[tag]?.color;
    if (color) return color;
  }
  return '#9B59B6';
}

function getNodeRadius(content: string): number {
  const len = content.length;
  return Math.min(1.2, Math.max(0.5, 0.5 + (len / 800) * 0.7));
}

function calculateTextSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.split(/[\s，。、！？,.!?]+/).filter(w => w.length > 0));
  const wordsB = new Set(b.split(/[\s，。、！？,.!?]+/).filter(w => w.length > 0));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let intersection = 0;
  wordsA.forEach(w => { if (wordsB.has(w)) intersection++; });
  const union = wordsA.size + wordsB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function calculateRelations(cards: Card[]): Relation[] {
  const relations: Relation[] = [];
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const a = cards[i];
      const b = cards[j];
      const sharedTags = a.tags.filter(t => b.tags.includes(t));
      const tagScore = sharedTags.length / Math.max(1, Math.max(a.tags.length, b.tags.length));
      const textScore = calculateTextSimilarity(a.content + ' ' + a.title, b.content + ' ' + b.title);
      const strength = tagScore * 0.6 + textScore * 0.4;
      if (strength > 0.08) {
        relations.push({
          source: a.id,
          target: b.id,
          strength: Math.min(1, strength),
          tags: sharedTags,
        });
      }
    }
  }
  return relations;
}

function forceDirectedLayout(cards: Card[], relations: Relation[]): GraphNode[] {
  const nodes: (GraphNode & { vx: number; vy: number; vz: number })[] = cards.map((card, i) => {
    const phi = Math.acos(-1 + (2 * i) / cards.length);
    const theta = Math.sqrt(cards.length * Math.PI) * phi;
    const r = 4 + Math.random() * 2;
    return {
      id: card.id,
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.sin(phi) * Math.sin(theta),
      z: r * Math.cos(phi),
      radius: getNodeRadius(card.content),
      color: getCardColor(card),
      label: card.title,
      vx: 0, vy: 0, vz: 0,
    };
  });

  const iterations = 80;
  const k = 2.2;
  for (let iter = 0; iter < iterations; iter++) {
    nodes.forEach(n => { n.vx = 0; n.vy = 0; n.vz = 0; });
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.001;
        const repulsion = (k * k) / dist;
        const fx = (dx / dist) * repulsion;
        const fy = (dy / dist) * repulsion;
        const fz = (dz / dist) * repulsion;
        a.vx += fx; a.vy += fy; a.vz += fz;
        b.vx -= fx; b.vy -= fy; b.vz -= fz;
      }
    }
    relations.forEach(rel => {
      const a = nodes.find(n => n.id === rel.source);
      const b = nodes.find(n => n.id === rel.target);
      if (!a || !b) return;
      const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.001;
      const attraction = (dist * dist) / k * rel.strength * 0.5;
      const fx = (dx / dist) * attraction;
      const fy = (dy / dist) * attraction;
      const fz = (dz / dist) * attraction;
      a.vx += fx; a.vy += fy; a.vz += fz;
      b.vx -= fx; b.vy -= fy; b.vz -= fz;
    });
    const temp = 1 - iter / iterations;
    nodes.forEach(n => {
      const v = Math.sqrt(n.vx * n.vx + n.vy * n.vy + n.vz * n.vz) + 0.001;
      const limited = Math.min(v, temp * 3);
      n.x += (n.vx / v) * limited;
      n.y += (n.vy / v) * limited;
      n.z += (n.vz / v) * limited;
      n.x *= 0.98; n.y *= 0.98; n.z *= 0.98;
    });
  }
  return nodes.map(({ vx, vy, vz, ...rest }) => rest);
}

const seedCards: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { title: '雨夜独行的剑客', content: '深秋的雨夜，青石板路上传来清脆的马蹄声。一名黑衣剑客撑着油纸伞，腰间长剑泛着冷光。街角的灯笼在风雨中摇曳，他停步望着远处的小楼，那里有他等候十年的约定。', tags: ['写作', '小说'] },
  { title: '人物设定：苏墨白', content: '年龄28岁，身世神秘的江湖剑客。性格沉默寡言，重情重义。惯用左手剑，剑法走轻灵一路，喜穿素色长袍。少时家族被灭门，被隐居高人所救，十年练剑只为复仇。', tags: ['写作', '小说'] },
  { title: '情节转折：故人归来', content: '当主角终于找到灭门仇家，却发现仇人之女竟是自己救命恩人的女儿。更令人震惊的是，当年的血案背后藏着一个更大的阴谋——一切都指向朝廷内部的权力斗争。', tags: ['写作', '小说'] },
  { title: '江南小镇描写', content: '晨雾笼罩着青瓦白墙的小镇，乌篷船在石桥下缓缓划过。巷口传来早点铺的吆喝声，蒸笼里冒着腾腾热气。一位老媪坐在门槛上择菜，花猫慵懒地卧在她脚边晒太阳。', tags: ['写作', '散文'] },
  { title: '秋日暖色调配色', content: '主色调：焦糖棕#C68E58、暖米白#FDF6EC、枫叶红#C0392B、枯叶黄#F39C12、墨绿#2C5F2D。适合秋季主题界面、复古风格品牌设计。营造温暖、怀旧、丰收的视觉感受。', tags: ['设计', '配色'] },
  { title: '卡片式界面排版', content: '采用不规则瀑布流布局，卡片间距24px，圆角16px，微投影营造层级。标题使用18px粗体衬线字，正文14px常规无衬线。每张卡片底部增加8px装饰条，使用主色系渐变。', tags: ['设计', '排版', 'UI'] },
  { title: '交互动效：微动效原则', content: '悬停时卡片上浮4px+阴影加深，过渡0.25s cubic-bezier(0.4,0,0.2,1)。页面切换采用淡入+位移20px组合，时长0.35s。加载状态用骨架屏脉冲动画，避免空白焦虑。', tags: ['设计', 'UI'] },
  { title: '品牌视觉识别系统', content: 'Logo由六边形蜂巢抽象变形而来，内部融入灵感火花的星芒元素。标准色：暖橙#E67E22+米金#FAD7A1。辅助图形使用六边形重复排列的蜂巢纹理，透明度8%-15%作为背景装饰。', tags: ['设计', '品牌'] },
  { title: '春日品牌活动策划', content: '主题：「花开有时·灵感绽放」。时间：3-4月。目标人群：年轻创意工作者。线上：H5互动游戏收集花瓣解锁灵感卡片，社交平台#春日灵感挑战#话题。线下：城市快闪店「灵感花园」，实体花墙+AR互动。', tags: ['策划', '活动'] },
  { title: '用户触达路径设计', content: '第一触点：KOL内容种草→第二触点：社交平台话题互动→第三触点：H5游戏深度参与→第四触点：线下快闪体验→第五触点：UGC裂变传播。每个环节设置分享激励机制，形成闭环。', tags: ['策划', '运营'] },
  { title: '跨界合作方案', content: '与独立咖啡馆联名推出「灵感特调」系列，杯套印有随机灵感卡片二维码，扫码进入H5收集。与文创品牌合作推出蜂巢笔记本、钢笔周边，线上线下同步发售，打造生活方式品牌联想。', tags: ['策划', '品牌'] },
  { title: '内容运营日历', content: '周一：#灵感素材库# 分享创意素材；周三：#灵感故事# 用户投稿故事；周五：#灵感方法论# 干货教程；周末：#灵感周末# 轻松话题。每季度一次大型主题活动，月度一次小型互动。', tags: ['策划', '运营'] },
  { title: '六边形UI元素库', content: '基础单元：正六边形边长48px，边框2px，圆角6px（inset圆角）。变体：实心填充、描边、半透明渐变。组合：蜂巢网格排列（相邻间距2px）、大小错落拼图。适用于图标背景、标签容器、进度指示器。', tags: ['设计', 'UI'] },
  { title: '小说情感高潮写法', content: '高潮前先压抑：用慢镜头描写细节，拉长时间感。爆发瞬间用短句叠加，一句一段，制造急促节奏。环境描写同步烘托：雷电、风雨、破碎声等意象与人物情感同频。高潮后留白：用景物收尾，情绪余韵悠长。', tags: ['写作'] },
  { title: '散文意境营造三法', content: '一、感官通感：将视觉转为听觉（「阳光洒落如琴键轻响」）。二、以小见大：从一片落叶、一杯茶切入，引申至人生哲思。三、虚实交织：现实场景与回忆/想象穿插，形成时空层次感。', tags: ['写作', '散文'] },
];

let cards: Card[] = seedCards.map(c => ({
  id: uuidv4(),
  ...c,
  createdAt: Date.now() - Math.floor(Math.random() * 86400000 * 30),
  updatedAt: Date.now() - Math.floor(Math.random() * 86400000 * 7),
}));

app.get('/api/cards', (_req, res) => {
  res.json({ cards });
});

app.post('/api/cards', (req, res) => {
  const { title, content, tags } = req.body;
  if (!title || typeof title !== 'string' || title.length > 35) {
    return res.status(400).json({ error: '标题无效（最多35字）' });
  }
  if (typeof content !== 'string' || content.length > 800) {
    return res.status(400).json({ error: '内容无效（最多800字）' });
  }
  if (!Array.isArray(tags) || tags.length > 5) {
    return res.status(400).json({ error: '标签无效（最多5个）' });
  }
  const now = Date.now();
  const card: Card = { id: uuidv4(), title, content, tags, createdAt: now, updatedAt: now };
  cards.unshift(card);
  res.status(201).json({ card });
});

app.put('/api/cards/:id', (req, res) => {
  const { id } = req.params;
  const idx = cards.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ error: '卡片不存在' });
  const { title, content, tags } = req.body;
  const card = cards[idx];
  if (title !== undefined) {
    if (typeof title !== 'string' || title.length > 35) return res.status(400).json({ error: '标题无效' });
    card.title = title;
  }
  if (content !== undefined) {
    if (typeof content !== 'string' || content.length > 800) return res.status(400).json({ error: '内容无效' });
    card.content = content;
  }
  if (tags !== undefined) {
    if (!Array.isArray(tags) || tags.length > 5) return res.status(400).json({ error: '标签无效' });
    card.tags = tags;
  }
  card.updatedAt = Date.now();
  res.json({ card });
});

app.delete('/api/cards/:id', (req, res) => {
  const { id } = req.params;
  const idx = cards.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ error: '卡片不存在' });
  cards.splice(idx, 1);
  res.json({ success: true });
});

app.get('/api/tags', (_req, res) => {
  const tagMap = new Map<string, number>();
  cards.forEach(c => c.tags.forEach(t => tagMap.set(t, (tagMap.get(t) || 0) + 1)));
  const tags = Array.from(tagMap.entries()).map(([name, count]) => {
    const info = TAG_TYPE_MAP[name];
    return { name, count, type: info?.type || 'other', color: info?.color || '#9B59B6' };
  }).sort((a, b) => b.count - a.count);
  res.json({ tags });
});

app.get('/api/relations', (_req, res) => {
  const relations = calculateRelations(cards);
  const nodes = forceDirectedLayout(cards, relations);
  const graph: GraphData = { nodes, edges: relations };
  res.json({ relations, graph, cardRelationCounts: cards.map(c => ({
    id: c.id,
    count: relations.filter(r => r.source === c.id || r.target === c.id).length,
  })) });
});

app.post('/api/export', (req, res) => {
  const { cardIds, title = '灵感组合' } = req.body as { cardIds: string[]; title?: string };
  if (!Array.isArray(cardIds) || cardIds.length === 0) {
    return res.status(400).json({ error: '请选择至少一张卡片' });
  }
  const ordered = cardIds.map(id => cards.find(c => c.id === id)).filter(Boolean) as Card[];
  let md = `# ${title}\n\n`;
  md += `> 由灵感蜂巢自动生成 · 共 ${ordered.length} 张灵感卡片\n\n---\n\n`;
  ordered.forEach((card, idx) => {
    md += `## ${idx + 1}. ${card.title}\n\n`;
    if (card.tags.length > 0) {
      md += card.tags.map(t => `\`${t}\``).join(' ') + '\n\n';
    }
    md += card.content + '\n\n';
  });
  const now = new Date();
  const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  const filename = `${title}_${ts}.md`;
  res.json({ markdown: md, filename });
});

app.listen(PORT, () => {
  console.log(`🐝 灵感蜂巢后端服务运行于 http://localhost:${PORT}`);
});
