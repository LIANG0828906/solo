import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import { storage, CareLogType, Severity, DiseaseRegion } from './storage';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

interface DiseaseTemplate {
  disease: string;
  severity: Severity;
  severityLabel: string;
  recommendation: string;
  regions: DiseaseRegion[];
}

const DISEASE_TEMPLATES: DiseaseTemplate[] = [
  {
    disease: '健康',
    severity: 'low',
    severityLabel: '低',
    recommendation: '## 植物状态良好\n\n您的植物目前状态健康！请继续保持：\n\n1. **规律浇水**：按照养护计划保持适当的浇水频率\n2. **充足光照**：确保植物获得足够的散射光\n3. **定期观察**：每周检查叶片状态，及时发现问题\n4. **适时施肥**：按照生长季节补充营养',
    regions: []
  },
  {
    disease: '叶斑病',
    severity: 'medium',
    severityLabel: '中',
    recommendation: '## 叶斑病处理建议\n\n### 症状识别\n叶片上出现圆形或不规则褐色斑点，边缘清晰，后期可能扩大融合。\n\n### 处理方法\n\n1. **及时修剪**：将已感染的叶片剪除并销毁，防止病菌扩散\n2. **保持通风**：确保植株周围空气流通，避免湿度过高\n3. **控制浇水**：避免叶片积水，浇水时直接浇灌根部\n4. **药物治疗**：可喷施多菌灵或百菌清800倍液，每周1次，连续2-3次',
    regions: [{ x: 30, y: 40, width: 25, height: 20 }, { x: 55, y: 25, width: 18, height: 15 }]
  },
  {
    disease: '白粉病',
    severity: 'medium',
    severityLabel: '中',
    recommendation: '## 白粉病处理建议\n\n### 症状识别\n叶片表面出现白色粉状霉层，后期变灰黄色，叶片卷曲枯黄。\n\n### 处理方法\n\n1. **隔离病株**：将感染植物与健康植物隔离\n2. **剪除病叶**：严重感染的叶片要及时剪除\n3. **改善环境**：增加通风，降低湿度，避免过度施肥\n4. **药物防治**：使用三唑酮或硫磺悬浮剂，按说明书稀释喷洒',
    regions: [{ x: 20, y: 30, width: 30, height: 25 }, { x: 60, y: 50, width: 20, height: 20 }]
  },
  {
    disease: '蚜虫侵害',
    severity: 'low',
    severityLabel: '低',
    recommendation: '## 蚜虫侵害处理建议\n\n### 症状识别\n叶片背面或嫩梢上有密集的小绿虫，叶片卷曲，有粘腻分泌物。\n\n### 处理方法\n\n1. **物理清除**：用清水冲洗叶片，或用软毛刷轻刷\n2. **生物防治**：可引入瓢虫等天敌\n3. **肥皂水喷洒**：稀释的肥皂水喷洒叶片，效果温和\n4. **药物防治**：严重时使用吡虫啉等杀虫剂',
    regions: [{ x: 45, y: 55, width: 15, height: 12 }]
  },
  {
    disease: '根腐病',
    severity: 'high',
    severityLabel: '高',
    recommendation: '## 根腐病紧急处理\n\n### 症状识别\n叶片发黄萎蔫，茎基部变黑腐烂，土壤有异味。\n\n### 紧急处理\n\n1. **立即脱盆**：将植物从盆中取出，检查根系\n2. **修剪病根**：剪掉所有发黑软烂的根系\n3. **消毒处理**：用多菌灵溶液浸泡根部30分钟\n4. **更换土壤**：使用新鲜的疏松透气土壤重新栽种\n5. **控制浇水**：恢复期减少浇水，保持土壤微湿即可',
    regions: [{ x: 40, y: 60, width: 30, height: 20 }]
  },
  {
    disease: '缺水枯萎',
    severity: 'low',
    severityLabel: '低',
    recommendation: '## 缺水枯萎处理\n\n### 症状识别\n叶片下垂发软，颜色暗淡，土壤干燥结块。\n\n### 处理方法\n\n1. **渐进补水**：先少量浇水，30分钟后再浇透水，避免猛灌\n2. **叶面喷水**：向叶片喷洒水雾，帮助恢复\n3. **遮阳缓苗**：移至阴凉通风处恢复\n4. **调整计划**：检查并缩短浇水周期',
    regions: []
  }
];

function broadcastStats(): void {
  const stats = storage.getStatsOverview();
  io.emit('stats:updated', stats);
}

app.get('/api/stats/overview', (_req, res) => {
  res.json(storage.getStatsOverview());
});

app.get('/api/plants', (_req, res) => {
  const plants = storage.getPlants();
  const enriched = plants.map(p => ({
    ...p,
    daysToWater: storage.getDaysWaterNeeded(p.id)
  }));
  res.json(enriched);
});

app.get('/api/plants/:id', (req, res) => {
  const plant = storage.getPlant(req.params.id);
  if (!plant) {
    res.status(404).json({ error: '植物不存在' });
    return;
  }
  res.json({ ...plant, daysToWater: storage.getDaysWaterNeeded(plant.id) });
});

app.post('/api/plants', (req, res) => {
  const { name, species, purchaseDate, avatar, schedule } = req.body;
  if (!name || !species || !purchaseDate) {
    res.status(400).json({ error: '缺少必填字段' });
    return;
  }
  const plant = storage.createPlant({
    name,
    species,
    purchaseDate,
    avatar: avatar || storage.getDefaultAvatar(),
    schedule
  });
  broadcastStats();
  res.status(201).json({ ...plant, daysToWater: storage.getDaysWaterNeeded(plant.id) });
});

app.put('/api/plants/:id', (req, res) => {
  const plant = storage.updatePlant(req.params.id, req.body);
  if (!plant) {
    res.status(404).json({ error: '植物不存在' });
    return;
  }
  broadcastStats();
  res.json({ ...plant, daysToWater: storage.getDaysWaterNeeded(plant.id) });
});

app.delete('/api/plants/:id', (req, res) => {
  const success = storage.deletePlant(req.params.id);
  if (!success) {
    res.status(404).json({ error: '植物不存在' });
    return;
  }
  broadcastStats();
  res.json({ success: true });
});

app.get('/api/plants/:id/schedule', (req, res) => {
  const plant = storage.getPlant(req.params.id);
  if (!plant) {
    res.status(404).json({ error: '植物不存在' });
    return;
  }
  res.json(plant.schedule);
});

app.put('/api/plants/:id/schedule', (req, res) => {
  const { wateringPeriods, fertilizingPeriods } = req.body;
  if (!Array.isArray(wateringPeriods) || !Array.isArray(fertilizingPeriods)) {
    res.status(400).json({ error: '周期格式不正确' });
    return;
  }
  const plant = storage.updateSchedule(req.params.id, { wateringPeriods, fertilizingPeriods });
  if (!plant) {
    res.status(404).json({ error: '植物不存在' });
    return;
  }
  broadcastStats();
  res.json(plant.schedule);
});

app.get('/api/plants/:id/logs', (req, res) => {
  res.json(storage.getCareLogs(req.params.id));
});

app.post('/api/plants/:id/logs', (req, res) => {
  const { type, note } = req.body;
  const validTypes: CareLogType[] = ['water', 'fertilize', 'repot', 'light'];
  if (!validTypes.includes(type)) {
    res.status(400).json({ error: '无效的操作类型' });
    return;
  }
  const log = storage.addCareLog(req.params.id, type, note);
  if (!log) {
    res.status(404).json({ error: '植物不存在' });
    return;
  }
  broadcastStats();
  res.status(201).json(log);
});

app.post('/api/recognize', upload.single('image'), (req, res) => {
  const plantId = req.body.plantId as string;
  if (plantId && !storage.getPlant(plantId)) {
    res.status(404).json({ error: '指定的植物不存在' });
    return;
  }

  const template = DISEASE_TEMPLATES[Math.floor(Math.random() * DISEASE_TEMPLATES.length)];
  let imageUrl = storage.getDefaultAvatar();

  if (req.file) {
    imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  }

  setTimeout(() => {
    if (plantId) {
      const result = storage.addRecognition(
        plantId,
        template.disease,
        template.severity,
        template.severityLabel,
        template.recommendation,
        imageUrl,
        template.regions
      );
      broadcastStats();
      io.emit('recognition:completed', result);
      res.json(result);
    } else {
      res.json({
        id: 'preview',
        plantId: null,
        disease: template.disease,
        severity: template.severity,
        severityLabel: template.severityLabel,
        recommendation: template.recommendation,
        imageUrl,
        diseaseRegions: template.regions,
        timestamp: new Date().toISOString()
      });
    }
  }, 1500 + Math.random() * 1000);
});

app.get('/api/recognitions/:id', (req, res) => {
  const result = storage.getRecognition(req.params.id);
  if (!result) {
    res.status(404).json({ error: '识别记录不存在' });
    return;
  }
  res.json(result);
});

app.get('/api/plants/:id/recognitions', (req, res) => {
  res.json(storage.getRecognitions(req.params.id));
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.emit('stats:updated', storage.getStatsOverview());

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`🌿 植物养护助手后端服务已启动: http://localhost:${PORT}`);
});
