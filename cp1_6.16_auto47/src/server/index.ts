import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import { MATERIALS, ROOM_LAYOUTS } from '../shared/data';
import { FloorPlan, InspirationEntry, PlacedItem, RoomType } from '../shared/types';

const app = express();
const PORT = 3001;
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

let floorPlans: Map<string, FloorPlan> = new Map();
let inspirations: Map<string, InspirationEntry> = new Map();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/materials', (req, res) => {
  const category = req.query.category as string | undefined;
  const search = (req.query.search as string | undefined)?.toLowerCase();

  let result = MATERIALS;

  if (category && category !== 'all') {
    result = result.filter(m => m.category === category);
  }

  if (search) {
    result = result.filter(m => 
      m.name.toLowerCase().includes(search) ||
      m.materials.some(mat => mat.toLowerCase().includes(search))
    );
  }

  res.json(result);
});

app.get('/api/materials/:id', (req, res) => {
  const material = MATERIALS.find(m => m.id === req.params.id);
  if (!material) {
    res.status(404).json({ error: '素材不存在' });
    return;
  }
  res.json(material);
});

app.get('/api/rooms', (req, res) => {
  const layouts = Object.entries(ROOM_LAYOUTS).map(([type, layout]) => ({
    type,
    name: layout.name,
    width: layout.width,
    height: layout.height
  }));
  res.json(layouts);
});

app.get('/api/rooms/:type', (req, res) => {
  const type = req.params.type as RoomType;
  const layout = ROOM_LAYOUTS[type];
  if (!layout) {
    res.status(404).json({ error: '房间类型不存在' });
    return;
  }
  res.json(layout);
});

app.post('/api/floorplans', (req, res) => {
  const { name, roomType } = req.body as { name: string; roomType: RoomType };

  if (!ROOM_LAYOUTS[roomType]) {
    res.status(400).json({ error: '无效的房间类型' });
    return;
  }

  const floorPlan: FloorPlan = {
    id: uuidv4(),
    name: name || ROOM_LAYOUTS[roomType].name + '方案',
    roomType,
    layout: JSON.parse(JSON.stringify(ROOM_LAYOUTS[roomType])),
    placedItems: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  floorPlans.set(floorPlan.id, floorPlan);
  res.status(201).json(floorPlan);
});

app.get('/api/floorplans', (req, res) => {
  res.json(Array.from(floorPlans.values()));
});

app.get('/api/floorplans/:id', (req, res) => {
  const plan = floorPlans.get(req.params.id);
  if (!plan) {
    res.status(404).json({ error: '平面图不存在' });
    return;
  }
  res.json(plan);
});

app.put('/api/floorplans/:id', (req, res) => {
  const plan = floorPlans.get(req.params.id);
  if (!plan) {
    res.status(404).json({ error: '平面图不存在' });
    return;
  }

  const { name, placedItems } = req.body as Partial<{ name: string; placedItems: PlacedItem[] }>;

  if (name !== undefined) plan.name = name;
  if (placedItems !== undefined) plan.placedItems = placedItems;
  plan.updatedAt = Date.now();

  floorPlans.set(plan.id, plan);
  res.json(plan);
});

app.delete('/api/floorplans/:id', (req, res) => {
  const deleted = floorPlans.delete(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: '平面图不存在' });
    return;
  }
  res.json({ success: true });
});

app.post('/api/inspirations', upload.single('thumbnail'), (req, res) => {
  const { name, description, floorPlan } = req.body;

  let parsedFloorPlan: FloorPlan;
  try {
    parsedFloorPlan = typeof floorPlan === 'string' ? JSON.parse(floorPlan) : floorPlan;
  } catch {
    res.status(400).json({ error: '无效的平面图数据' });
    return;
  }

  let thumbnailBase64 = '';
  if (req.file) {
    thumbnailBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  } else if (req.body.thumbnail) {
    thumbnailBase64 = req.body.thumbnail;
  }

  const inspiration: InspirationEntry = {
    id: uuidv4(),
    name: name || '未命名方案',
    description: description || '',
    thumbnail: thumbnailBase64,
    floorPlan: parsedFloorPlan,
    materials: [...new Set(parsedFloorPlan.placedItems.map(item => item.materialId))],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  inspirations.set(inspiration.id, inspiration);
  res.status(201).json(inspiration);
});

app.get('/api/inspirations', (req, res) => {
  const entries = Array.from(inspirations.values()).map(entry => ({
    id: entry.id,
    name: entry.name,
    description: entry.description,
    thumbnail: entry.thumbnail,
    materials: entry.materials,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt
  }));
  res.json(entries);
});

app.get('/api/inspirations/:id', (req, res) => {
  const inspiration = inspirations.get(req.params.id);
  if (!inspiration) {
    res.status(404).json({ error: '灵感条目不存在' });
    return;
  }
  res.json(inspiration);
});

app.put('/api/inspirations/:id', upload.single('thumbnail'), (req, res) => {
  const inspiration = inspirations.get(req.params.id);
  if (!inspiration) {
    res.status(404).json({ error: '灵感条目不存在' });
    return;
  }

  const { name, description, floorPlan } = req.body;

  if (name !== undefined) inspiration.name = name;
  if (description !== undefined) inspiration.description = description;
  if (floorPlan !== undefined) {
    try {
      const parsed = typeof floorPlan === 'string' ? JSON.parse(floorPlan) : floorPlan;
      inspiration.floorPlan = parsed;
      inspiration.materials = [...new Set<string>(parsed.placedItems.map((item: PlacedItem) => item.materialId))];
    } catch {
      res.status(400).json({ error: '无效的平面图数据' });
      return;
    }
  }

  if (req.file) {
    inspiration.thumbnail = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  } else if (req.body.thumbnail) {
    inspiration.thumbnail = req.body.thumbnail;
  }

  inspiration.updatedAt = Date.now();
  inspirations.set(inspiration.id, inspiration);
  res.json(inspiration);
});

app.delete('/api/inspirations/:id', (req, res) => {
  const deleted = inspirations.delete(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: '灵感条目不存在' });
    return;
  }
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`🏠 家居灵感服务器已启动: http://localhost:${PORT}`);
});
