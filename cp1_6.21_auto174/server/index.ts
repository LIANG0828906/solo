import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const fragments = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  x: (Math.random() - 0.5) * 30,
  z: (Math.random() - 0.5) * 30,
  type: ['fire', 'water', 'earth', 'wind', 'light'][Math.floor(Math.random() * 5)],
  collected: false,
}));

const recipes = [
  {
    id: 1,
    name: '炎之符文',
    ingredients: ['fire', 'fire', 'light'],
    effect: '召唤火焰之力',
    unlocked: true,
  },
  {
    id: 2,
    name: '潮汐符文',
    ingredients: ['water', 'water', 'wind'],
    effect: '操控水流',
    unlocked: false,
  },
  {
    id: 3,
    name: '大地符文',
    ingredients: ['earth', 'earth', 'fire'],
    effect: '坚固护盾',
    unlocked: false,
  },
  {
    id: 4,
    name: '风暴符文',
    ingredients: ['wind', 'wind', 'light'],
    effect: '疾风之力',
    unlocked: false,
  },
  {
    id: 5,
    name: '圣光符文',
    ingredients: ['light', 'light', 'fire'],
    effect: '神圣光芒',
    unlocked: false,
  },
];

app.get('/api/fragments', (req, res) => {
  res.json(fragments);
});

app.get('/api/recipes', (req, res) => {
  res.json(recipes);
});

app.get('/api/character', (req, res) => {
  res.json({
    position: { x: 0, y: 0, z: 5 },
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
