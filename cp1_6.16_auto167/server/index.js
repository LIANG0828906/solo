import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const exhibitsDB = [
  {
    id: 'ex-001',
    name: '青铜方鼎',
    url: 'https://picsum.photos/seed/bronze-ding/600/800',
    category: '青铜器',
    thumbnail: 'https://picsum.photos/seed/bronze-ding/200/260',
  },
  {
    id: 'ex-002',
    name: '青花缠枝纹瓶',
    url: 'https://picsum.photos/seed/blue-porcelain/600/800',
    category: '瓷器',
    thumbnail: 'https://picsum.photos/seed/blue-porcelain/200/260',
  },
  {
    id: 'ex-003',
    name: '山水画卷',
    url: 'https://picsum.photos/seed/landscape-scroll/800/400',
    category: '书画',
    thumbnail: 'https://picsum.photos/seed/landscape-scroll/200/100',
  },
  {
    id: 'ex-004',
    name: '白玉雕件',
    url: 'https://picsum.photos/seed/jade-carving/500/500',
    category: '玉器',
    thumbnail: 'https://picsum.photos/seed/jade-carving/200/200',
  },
  {
    id: 'ex-005',
    name: '唐三彩马俑',
    url: 'https://picsum.photos/seed/sancai-horse/600/700',
    category: '陶器',
    thumbnail: 'https://picsum.photos/seed/sancai-horse/200/230',
  },
  {
    id: 'ex-006',
    name: '甲骨文片',
    url: 'https://picsum.photos/seed/oracle-bone/500/400',
    category: '文字',
    thumbnail: 'https://picsum.photos/seed/oracle-bone/200/160',
  },
  {
    id: 'ex-007',
    name: '编钟组合',
    url: 'https://picsum.photos/seed/bianzhong/700/600',
    category: '乐器',
    thumbnail: 'https://picsum.photos/seed/bianzhong/200/170',
  },
  {
    id: 'ex-008',
    name: '丝绸绣品',
    url: 'https://picsum.photos/seed/silk-embroidery/600/600',
    category: '织物',
    thumbnail: 'https://picsum.photos/seed/silk-embroidery/200/200',
  },
  {
    id: 'ex-009',
    name: '金缕玉衣',
    url: 'https://picsum.photos/seed/gold-jade-suit/600/800',
    category: '殓葬器',
    thumbnail: 'https://picsum.photos/seed/gold-jade-suit/200/260',
  },
  {
    id: 'ex-010',
    name: '银质酒器',
    url: 'https://picsum.photos/seed/silver-cup/500/500',
    category: '金银器',
    thumbnail: 'https://picsum.photos/seed/silver-cup/200/200',
  },
  {
    id: 'ex-011',
    name: '竹简书卷',
    url: 'https://picsum.photos/seed/bamboo-slip/700/500',
    category: '文字',
    thumbnail: 'https://picsum.photos/seed/bamboo-slip/200/140',
  },
  {
    id: 'ex-012',
    name: '佛像石雕',
    url: 'https://picsum.photos/seed/buddha-stone/500/700',
    category: '造像',
    thumbnail: 'https://picsum.photos/seed/buddha-stone/200/280',
  },
  {
    id: 'ex-013',
    name: '朱砂漆盒',
    url: 'https://picsum.photos/seed/lacquer-box/500/400',
    category: '漆器',
    thumbnail: 'https://picsum.photos/seed/lacquer-box/200/160',
  },
  {
    id: 'ex-014',
    name: '龙纹瓦当',
    url: 'https://picsum.photos/seed/tile-end/400/400',
    category: '建筑',
    thumbnail: 'https://picsum.photos/seed/tile-end/200/200',
  },
  {
    id: 'ex-015',
    name: '古钱币',
    url: 'https://picsum.photos/seed/ancient-coin/400/400',
    category: '货币',
    thumbnail: 'https://picsum.photos/seed/ancient-coin/200/200',
  },
  {
    id: 'ex-016',
    name: '青瓷莲花尊',
    url: 'https://picsum.photos/seed/celadon-lotus/550/700',
    category: '瓷器',
    thumbnail: 'https://picsum.photos/seed/celadon-lotus/200/250',
  },
  {
    id: 'ex-017',
    name: '珐琅彩瓶',
    url: 'https://picsum.photos/seed/enamel-bottle/500/700',
    category: '瓷器',
    thumbnail: 'https://picsum.photos/seed/enamel-bottle/200/280',
  },
  {
    id: 'ex-018',
    name: '紫檀家具',
    url: 'https://picsum.photos/seed/sandalwood/600/500',
    category: '家具',
    thumbnail: 'https://picsum.photos/seed/sandalwood/200/170',
  },
  {
    id: 'ex-019',
    name: '青铜宝剑',
    url: 'https://picsum.photos/seed/bronze-sword/800/300',
    category: '兵器',
    thumbnail: 'https://picsum.photos/seed/bronze-sword/200/75',
  },
  {
    id: 'ex-020',
    name: '壁画残片',
    url: 'https://picsum.photos/seed/mural-fragment/600/400',
    category: '书画',
    thumbnail: 'https://picsum.photos/seed/mural-fragment/200/130',
  },
  {
    id: 'ex-021',
    name: '印章组',
    url: 'https://picsum.photos/seed/seal-set/500/400',
    category: '文具',
    thumbnail: 'https://picsum.photos/seed/seal-set/200/160',
  },
  {
    id: 'ex-022',
    name: '香炉',
    url: 'https://picsum.photos/seed/incense-burner/500/550',
    category: '青铜器',
    thumbnail: 'https://picsum.photos/seed/incense-burner/200/220',
  },
  {
    id: 'ex-023',
    name: '折扇',
    url: 'https://picsum.photos/seed/folding-fan/700/400',
    category: '服饰',
    thumbnail: 'https://picsum.photos/seed/folding-fan/200/115',
  },
  {
    id: 'ex-024',
    name: '围棋子',
    url: 'https://picsum.photos/seed/go-stones/500/500',
    category: '文具',
    thumbnail: 'https://picsum.photos/seed/go-stones/200/200',
  },
];

const layoutStore = new Map();

app.get('/api/exhibits', (req, res) => {
  try {
    res.json(exhibitsDB);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exhibits' });
  }
});

app.post('/api/layout', (req, res) => {
  try {
    const { id, data } = req.body;
    const layoutId = id || uuidv4();
    layoutStore.set(layoutId, { id: layoutId, data, savedAt: Date.now() });
    res.json({ id: layoutId, success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save layout', success: false });
  }
});

app.get('/api/layout/:id', (req, res) => {
  try {
    const layout = layoutStore.get(req.params.id);
    if (!layout) {
      return res.status(404).json({ error: 'Layout not found' });
    }
    res.json(layout);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load layout' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`[Museum Curator Server] running on http://localhost:${PORT}`);
});
