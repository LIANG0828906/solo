import { Router } from 'express';

const router = Router();

interface Material {
  id: string;
  name: string;
  category: string;
  brand: string;
  spec: string;
  purchaseDate: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  location: string;
  tags: string[];
  image: string;
  projects: string[];
  lastUsed: string;
}

const categories = [
  { id: 'yarn', name: '毛线', icon: '🧶' },
  { id: 'wood', name: '木料', icon: '🪵' },
  { id: 'clay', name: '陶土釉料', icon: '🏺' },
  { id: 'fabric', name: '布料', icon: '🧵' },
  { id: 'beads', name: '珠子配件', icon: '📿' },
];

let materials: Material[] = [
  {
    id: '1',
    name: '美利奴羊毛线 藏青色',
    category: 'yarn',
    brand: 'Cascade Yarns',
    spec: '100g/绞，220米',
    purchaseDate: '2024-03-15',
    unitPrice: 68,
    quantity: 5,
    unit: '绞',
    location: 'A柜-第2层',
    tags: ['羊毛', '中粗', '秋冬'],
    image: 'https://picsum.photos/seed/yarn1/400/300',
    projects: ['冬季围巾', '毛线帽'],
    lastUsed: '2024-11-20',
  },
  {
    id: '2',
    name: '美利奴羊毛线 米白色',
    category: 'yarn',
    brand: 'Cascade Yarns',
    spec: '100g/绞，220米',
    purchaseDate: '2024-03-15',
    unitPrice: 68,
    quantity: 3,
    unit: '绞',
    location: 'A柜-第2层',
    tags: ['羊毛', '中粗', '百搭'],
    image: 'https://picsum.photos/seed/yarn2/400/300',
    projects: ['拼色毛衣'],
    lastUsed: '2024-10-05',
  },
  {
    id: '3',
    name: '棉麻线 抹茶绿',
    category: 'yarn',
    brand: 'DMC',
    spec: '50g/团，125米',
    purchaseDate: '2024-05-20',
    unitPrice: 35,
    quantity: 8,
    unit: '团',
    location: 'A柜-第3层',
    tags: ['棉麻', '细支', '春夏'],
    image: 'https://picsum.photos/seed/yarn3/400/300',
    projects: ['夏季开衫', '钩针杯垫'],
    lastUsed: '2024-12-01',
  },
  {
    id: '4',
    name: '黑胡桃木方料',
    category: 'wood',
    brand: '北美进口',
    spec: '30x5x5cm',
    purchaseDate: '2024-01-10',
    unitPrice: 128,
    quantity: 4,
    unit: '根',
    location: 'B区-木料架',
    tags: ['硬木', '高档', '刀柄料'],
    image: 'https://picsum.photos/seed/wood1/400/300',
    projects: ['木柄餐刀套装'],
    lastUsed: '2024-09-15',
  },
  {
    id: '5',
    name: '樱桃木板材',
    category: 'wood',
    brand: '国产精选',
    spec: '120x20x2cm',
    purchaseDate: '2024-02-28',
    unitPrice: 256,
    quantity: 2,
    unit: '块',
    location: 'B区-木料架',
    tags: ['硬木', '板材', '家具料'],
    image: 'https://picsum.photos/seed/wood2/400/300',
    projects: ['首饰盒', '茶盘'],
    lastUsed: '2024-11-10',
  },
  {
    id: '6',
    name: '榉木圆棒',
    category: 'wood',
    brand: '东北榉木',
    spec: '直径3cm，长100cm',
    purchaseDate: '2024-04-05',
    unitPrice: 45,
    quantity: 6,
    unit: '根',
    location: 'B区-木料架',
    tags: ['软木', '圆棒', '新手友好'],
    image: 'https://picsum.photos/seed/wood3/400/300',
    projects: ['木勺套装', '擀面杖'],
    lastUsed: '2024-12-05',
  },
  {
    id: '7',
    name: '高岭土瓷泥',
    category: 'clay',
    brand: '景德镇',
    spec: '10kg/袋',
    purchaseDate: '2024-06-15',
    unitPrice: 89,
    quantity: 3,
    unit: '袋',
    location: 'C区-储物架底层',
    tags: ['瓷泥', '高岭土', '白瓷'],
    image: 'https://picsum.photos/seed/clay1/400/300',
    projects: ['茶具套装', '花器'],
    lastUsed: '2024-11-28',
  },
  {
    id: '8',
    name: '紫砂泥 紫泥',
    category: 'clay',
    brand: '宜兴紫砂',
    spec: '5kg/块',
    purchaseDate: '2024-03-20',
    unitPrice: 156,
    quantity: 2,
    unit: '块',
    location: 'C区-储物架底层',
    tags: ['紫砂', '茶壶料', '收藏级'],
    image: 'https://picsum.photos/seed/clay2/400/300',
    projects: ['西施壶'],
    lastUsed: '2024-08-15',
  },
  {
    id: '9',
    name: '透明釉料',
    category: 'clay',
    brand: '景德镇制釉',
    spec: '500g/瓶',
    purchaseDate: '2024-07-10',
    unitPrice: 78,
    quantity: 4,
    unit: '瓶',
    location: 'C区-釉料柜',
    tags: ['釉料', '透明釉', '基础釉'],
    image: 'https://picsum.photos/seed/glaze1/400/300',
    projects: ['茶具套装'],
    lastUsed: '2024-11-28',
  },
  {
    id: '10',
    name: '天蓝色釉料',
    category: 'clay',
    brand: '景德镇制釉',
    spec: '500g/瓶',
    purchaseDate: '2024-07-10',
    unitPrice: 85,
    quantity: 2,
    unit: '瓶',
    location: 'C区-釉料柜',
    tags: ['釉料', '颜色釉', '蓝色'],
    image: 'https://picsum.photos/seed/glaze2/400/300',
    projects: ['花器'],
    lastUsed: '2024-10-20',
  },
  {
    id: '11',
    name: '亚麻布料 原色',
    category: 'fabric',
    brand: '法国亚麻',
    spec: '1.4米宽，按米卖',
    purchaseDate: '2024-02-10',
    unitPrice: 128,
    quantity: 5,
    unit: '米',
    location: 'D区-布架',
    tags: ['亚麻', '原色', '天然'],
    image: 'https://picsum.photos/seed/fabric1/400/300',
    projects: [' tote bag', '餐桌布'],
    lastUsed: '2024-09-05',
  },
  {
    id: '12',
    name: '纯棉布料 小碎花',
    category: 'fabric',
    brand: '日本进口',
    spec: '1.1米宽，半米起卖',
    purchaseDate: '2024-05-18',
    unitPrice: 68,
    quantity: 3,
    unit: '米',
    location: 'D区-布架',
    tags: ['纯棉', '印花', '和风'],
    image: 'https://picsum.photos/seed/fabric2/400/300',
    projects: ['口金包'],
    lastUsed: '2024-11-15',
  },
];

router.get('/categories', (req, res) => {
  res.json(categories);
});

router.get('/', (req, res) => {
  const { category, search } = req.query;
  let filtered = [...materials];

  if (category && category !== 'all') {
    filtered = filtered.filter(m => m.category === category);
  }

  if (search) {
    const searchLower = (search as string).toLowerCase();
    filtered = filtered.filter(m =>
      m.name.toLowerCase().includes(searchLower) ||
      m.tags.some(t => t.toLowerCase().includes(searchLower))
    );
  }

  res.json(filtered);
});

router.get('/:id', (req, res) => {
  const material = materials.find(m => m.id === req.params.id);
  if (!material) {
    return res.status(404).json({ error: '材料不存在' });
  }
  res.json(material);
});

router.post('/', (req, res) => {
  const newMaterial: Material = {
    ...req.body,
    id: Date.now().toString(),
  };
  materials.unshift(newMaterial);
  res.status(201).json(newMaterial);
});

router.put('/:id', (req, res) => {
  const index = materials.findIndex(m => m.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '材料不存在' });
  }
  materials[index] = { ...materials[index], ...req.body };
  res.json(materials[index]);
});

router.delete('/:id', (req, res) => {
  const index = materials.findIndex(m => m.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '材料不存在' });
  }
  materials.splice(index, 1);
  res.json({ message: '删除成功' });
});

export default router;
