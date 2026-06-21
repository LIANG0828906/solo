import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

interface FlavorProfile {
  acidity: number;
  sweetness: number;
  bitterness: number;
  body: number;
  aroma: number;
}

interface CoffeeBean {
  id: string;
  name: string;
  origin: string;
  roastLevel: 'light' | 'medium' | 'dark';
  altitude?: string;
  process?: string;
  flavorNotes: string[];
  flavorProfile: FlavorProfile;
  description: string;
}

interface BrewRecord {
  id: string;
  beanId: string;
  date: string;
  waterTemp: number;
  grindSize: string;
  pourMethod: string;
  tasteNotes: string;
  rating: number;
}

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let beans: CoffeeBean[] = [
  {
    id: uuidv4(),
    name: '埃塞俄比亚 古吉',
    origin: '埃塞俄比亚',
    roastLevel: 'light',
    altitude: '1900-2200m',
    process: '水洗处理',
    flavorNotes: ['花香', '柑橘', '蓝莓', '茉莉', '蜂蜜'],
    flavorProfile: {
      acidity: 8,
      sweetness: 7,
      bitterness: 3,
      body: 5,
      aroma: 9,
    },
    description: '来自埃塞俄比亚古吉产区的精品咖啡豆，以其明亮的酸度和浓郁的花果香气著称。',
  },
  {
    id: uuidv4(),
    name: '哥伦比亚 慧兰',
    origin: '哥伦比亚',
    roastLevel: 'medium',
    altitude: '1700-1900m',
    process: '水洗处理',
    flavorNotes: ['焦糖', '坚果', '巧克力', '橙皮', '红糖'],
    flavorProfile: {
      acidity: 5,
      sweetness: 7,
      bitterness: 5,
      body: 7,
      aroma: 6,
    },
    description: '哥伦比亚慧兰产区的经典咖啡豆，口感平衡，带有焦糖和坚果的甜感。',
  },
  {
    id: uuidv4(),
    name: '巴西 喜拉多',
    origin: '巴西',
    roastLevel: 'dark',
    altitude: '1000-1200m',
    process: '日晒处理',
    flavorNotes: ['可可', '黑巧克力', '烤杏仁', '焦糖', '香料'],
    flavorProfile: {
      acidity: 2,
      sweetness: 5,
      bitterness: 8,
      body: 9,
      aroma: 5,
    },
    description: '巴西喜拉多产区的深烘焙咖啡豆，醇厚浓郁，带有可可和烤坚果的风味。',
  },
];

let brews: BrewRecord[] = [
  {
    id: uuidv4(),
    beanId: beans[0].id,
    date: '2024-01-15',
    waterTemp: 92,
    grindSize: '中细',
    pourMethod: '三段式',
    tasteNotes: '花香明显，柑橘酸度明亮，余韵有蓝莓的甜感',
    rating: 9,
  },
  {
    id: uuidv4(),
    beanId: beans[0].id,
    date: '2024-01-18',
    waterTemp: 90,
    grindSize: '中',
    pourMethod: '一刀流',
    tasteNotes: '口感更加柔和，蜂蜜甜感突出',
    rating: 8,
  },
  {
    id: uuidv4(),
    beanId: beans[1].id,
    date: '2024-01-20',
    waterTemp: 93,
    grindSize: '中',
    pourMethod: '搅拌法',
    tasteNotes: '焦糖甜感明显，巧克力尾韵，醇厚度适中',
    rating: 8,
  },
];

app.get('/api/beans', (req, res) => {
  res.json(beans);
});

app.get('/api/beans/:id', (req, res) => {
  const bean = beans.find((b) => b.id === req.params.id);
  if (!bean) {
    return res.status(404).json({ error: '咖啡豆不存在' });
  }
  res.json(bean);
});

app.post('/api/beans', (req, res) => {
  const newBean: CoffeeBean = {
    id: uuidv4(),
    ...req.body,
  };
  beans.push(newBean);
  res.status(201).json(newBean);
});

app.get('/api/beans/:id/brews', (req, res) => {
  const beanBrews = brews.filter((b) => b.beanId === req.params.id);
  res.json(beanBrews);
});

app.post('/api/beans/:id/brews', (req, res) => {
  const bean = beans.find((b) => b.id === req.params.id);
  if (!bean) {
    return res.status(404).json({ error: '咖啡豆不存在' });
  }
  const newBrew: BrewRecord = {
    id: uuidv4(),
    beanId: req.params.id,
    ...req.body,
  };
  brews.push(newBrew);
  res.status(201).json(newBrew);
});

app.get('/api/origins', (req, res) => {
  const origins = [...new Set(beans.map((b) => b.origin))];
  res.json(origins);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
