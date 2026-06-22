import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

let nextId = 13;

const logos = [
  { id: 1, name: '红色旋风', params: { hue: 0, rotation: 90, shapeCount: 10 }, imageData: 'data:image/png;base64,placeholder1', createdAt: '2026-06-17T08:00:00Z', isFavorite: false },
  { id: 2, name: '蓝色水晶', params: { hue: 210, rotation: 180, shapeCount: 6 }, imageData: 'data:image/png;base64,placeholder2', createdAt: '2026-06-17T08:05:00Z', isFavorite: true },
  { id: 3, name: '金色旋律', params: { hue: 45, rotation: 270, shapeCount: 14 }, imageData: 'data:image/png;base64,placeholder3', createdAt: '2026-06-17T08:10:00Z', isFavorite: false },
  { id: 4, name: '翡翠之心', params: { hue: 120, rotation: 0, shapeCount: 8 }, imageData: 'data:image/png;base64,placeholder4', createdAt: '2026-06-17T08:15:00Z', isFavorite: true },
  { id: 5, name: '紫晶幻影', params: { hue: 280, rotation: 135, shapeCount: 12 }, imageData: 'data:image/png;base64,placeholder5', createdAt: '2026-06-17T08:20:00Z', isFavorite: false },
  { id: 6, name: '橙色脉冲', params: { hue: 30, rotation: 315, shapeCount: 9 }, imageData: 'data:image/png;base64,placeholder6', createdAt: '2026-06-17T08:25:00Z', isFavorite: false },
  { id: 7, name: '青色涟漪', params: { hue: 170, rotation: 45, shapeCount: 7 }, imageData: 'data:image/png;base64,placeholder7', createdAt: '2026-06-17T08:30:00Z', isFavorite: true },
  { id: 8, name: '玫瑰星辰', params: { hue: 330, rotation: 225, shapeCount: 11 }, imageData: 'data:image/png;base64,placeholder8', createdAt: '2026-06-17T08:35:00Z', isFavorite: false },
  { id: 9, name: '极光之舞', params: { hue: 150, rotation: 90, shapeCount: 13 }, imageData: 'data:image/png;base64,placeholder9', createdAt: '2026-06-17T08:40:00Z', isFavorite: false },
  { id: 10, name: '暗夜精灵', params: { hue: 260, rotation: 180, shapeCount: 5 }, imageData: 'data:image/png;base64,placeholder10', createdAt: '2026-06-17T08:45:00Z', isFavorite: true },
  { id: 11, name: '琥珀之光', params: { hue: 40, rotation: 270, shapeCount: 16 }, imageData: 'data:image/png;base64,placeholder11', createdAt: '2026-06-17T08:50:00Z', isFavorite: false },
  { id: 12, name: '冰川之息', params: { hue: 195, rotation: 45, shapeCount: 10 }, imageData: 'data:image/png;base64,placeholder12', createdAt: '2026-06-17T08:55:00Z', isFavorite: false }
];

app.post('/api/save', (req, res) => {
  const { name, params, imageData } = req.body;
  if (!name || !params || !imageData) {
    return res.status(400).json({ error: 'name, params, and imageData are required' });
  }
  const logo = {
    id: nextId++,
    name,
    params,
    imageData,
    createdAt: new Date().toISOString(),
    isFavorite: false
  };
  logos.push(logo);
  res.status(201).json(logo);
});

app.get('/api/gallery', (req, res) => {
  res.json(logos);
});

app.put('/api/favorite/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const logo = logos.find(l => l.id === id);
  if (!logo) {
    return res.status(404).json({ error: 'Logo not found' });
  }
  logo.isFavorite = !logo.isFavorite;
  res.json(logo);
});

app.get('/api/presets', (req, res) => {
  res.json([
    { name: '几何风暴', params: { hue: 0, rotation: 45, shapeCount: 12 } },
    { name: '光纤漩涡', params: { hue: 180, rotation: 270, shapeCount: 8 } },
    { name: '像素浪潮', params: { hue: 60, rotation: 135, shapeCount: 15 } }
  ]);
});

app.listen(3001, () => {
  console.log('Server running on port 3001');
});
