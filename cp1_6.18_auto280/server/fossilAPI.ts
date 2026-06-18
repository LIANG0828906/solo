import express from 'express';
import cors from 'cors';
import type { FossilDetail } from '../src/types';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(cors());
app.use(express.json());

const fossilsDatabase: Record<string, FossilDetail> = {
  'trex-001': {
    id: 'trex-001',
    speciesName: '霸王龙',
    latinName: 'Tyrannosaurus rex',
    period: '白垩纪晚期（约6800万年前）',
    location: '美国蒙大拿州',
    description: '骨骼完整度85%，含有罕见的尾椎骨愈合痕迹'
  },
  'triceratops-001': {
    id: 'triceratops-001',
    speciesName: '三角龙',
    latinName: 'Triceratops horridus',
    period: '白垩纪晚期（约6800万年前）',
    location: '美国怀俄明州',
    description: '颈盾保存完好，具有独特的骨质突起纹理'
  }
};

app.get('/api/fossils/:id', (req, res) => {
  const { id } = req.params;
  const fossil = fossilsDatabase[id];
  if (!fossil) {
    res.status(404).json({ error: `Fossil with id ${id} not found` });
    return;
  }
  res.json(fossil);
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`[server] Fossil API running at http://localhost:${PORT}`);
  console.log(`[server] GET /api/fossils/trex-001`);
});

export default app;
