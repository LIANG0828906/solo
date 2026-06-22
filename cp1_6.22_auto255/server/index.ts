import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { TransportMonitor } from './TransportMonitor.js';
import { ExportEngine } from './ExportEngine.js';
import {
  Exhibition,
  Artwork,
  ExhibitionArtwork,
  ExhibitionStatus,
  TransportStatus,
  TransportMode,
  TransportTimelineNode
} from './types.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

const exhibitions = new Map<string, Exhibition>();
const artworksCollection: Artwork[] = [];

const transportMonitor = new TransportMonitor(io, exhibitions);
const exportEngine = new ExportEngine();

function generateMockArtworks(): Artwork[] {
  const names = [
    '青花瓷瓶', '山水画轴', '青铜鼎', '玉雕观音', '唐三彩马',
    '宋代官窑碗', '明代刺绣', '清代玉佩', '敦煌壁画摹本', '甲骨文片',
    '金缕玉衣', '铜奔马', '长信宫灯', '金错刀', '玉辟邪',
    '青瓷羊', '彩绘陶俑', '鎏金铜佛像', '银香囊', '螺钿紫檀五弦琵琶',
    '大理石雕', '紫砂茶壶', '青花瓷盘', '竹编笔筒', '象牙扇',
    '翡翠白菜', '珊瑚盆景', '玛瑙杯', '水晶球', '琥珀吊坠',
    '檀香木盒', '漆器屏风', '錾金瓶', '掐丝珐琅炉', '百宝嵌方盒',
    '缂丝山水图', '顾绣花鸟', '端砚', '徽墨', '宣纸',
    '湖笔', '龙泉剑', '越王勾践剑', '曾侯乙编钟', '贾湖骨笛',
    '红山玉龙', '良渚玉琮', '三星堆青铜面具', '马王堆帛画', '秦始皇陵兵马俑'
  ];

  return names.map((name, index) => ({
    id: uuidv4(),
    name,
    code: `ART-${String(index + 1).padStart(4, '0')}`,
    thumbnail: `/placeholder.svg`,
    description: `${name}是一件珍贵的文物藏品，具有重要的历史和艺术价值。`
  }));
}

function generateMockExhibitions(): Exhibition[] {
  const exhibitionData = [
    {
      name: '丝路遗珍 - 唐代文物特展',
      description: '汇集唐代丝绸之路沿线出土的珍贵文物，展现盛唐气象与中外文化交流的辉煌历史。',
      status: ExhibitionStatus.ONGOING,
      startDate: '2026-03-15',
      endDate: '2026-06-30',
      artworkCount: 12
    },
    {
      name: '瓷韵千年 - 中国古代瓷器展',
      description: '从原始青瓷到明清官窑，系统展示中国古代瓷器的发展脉络和艺术成就。',
      status: ExhibitionStatus.PREPARING,
      startDate: '2026-07-01',
      endDate: '2026-10-15',
      artworkCount: 8
    },
    {
      name: '青铜时代 - 商周青铜器精品展',
      description: '精选商周时期青铜重器，展示中国青铜文明的灿烂成就。',
      status: ExhibitionStatus.PREPARING,
      startDate: '2026-08-01',
      endDate: '2026-11-30',
      artworkCount: 10
    },
    {
      name: '明清书画名家展',
      description: '展出明清两代著名书画家的珍贵作品，领略传统书画艺术的魅力。',
      status: ExhibitionStatus.ENDED,
      startDate: '2025-09-01',
      endDate: '2025-12-31',
      artworkCount: 15
    },
    {
      name: '玉器之光 - 中国古代玉器展',
      description: '从新石器时代到清代，展现中国玉文化的源远流长。',
      status: ExhibitionStatus.ONGOING,
      startDate: '2026-01-10',
      endDate: '2026-05-20',
      artworkCount: 18
    }
  ];

  return exhibitionData.map((data) => {
    const shuffled = [...artworksCollection].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, data.artworkCount);

    const exhibitionArtworks: ExhibitionArtwork[] = selected.map((artwork, idx) => {
      const statuses = [TransportStatus.PENDING, TransportStatus.OUT_FOR_DELIVERY, TransportStatus.IN_TRANSIT, TransportStatus.ARRIVED];
      const randomStatusIdx = Math.floor(Math.random() * (data.status === ExhibitionStatus.ONGOING ? 4 : 3));
      const transportStatus = statuses[randomStatusIdx];

      const timeline: TransportTimelineNode[] = [];
      const baseTime = Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000;

      if (transportStatus !== TransportStatus.PENDING) {
        timeline.push({
          status: TransportStatus.OUT_FOR_DELIVERY,
          timestamp: baseTime,
          description: '已出库'
        });
      }

      if (transportStatus === TransportStatus.IN_TRANSIT || transportStatus === TransportStatus.ARRIVED) {
        timeline.push({
          status: TransportStatus.IN_TRANSIT,
          timestamp: baseTime + Math.random() * 3 * 24 * 60 * 60 * 1000,
          description: '运输中'
        });
      }

      if (transportStatus === TransportStatus.ARRIVED) {
        timeline.push({
          status: TransportStatus.ARRIVED,
          timestamp: baseTime + Math.random() * 7 * 24 * 60 * 60 * 1000,
          description: '已抵达'
        });
      }

      const modes = [TransportMode.LAND, TransportMode.AIR, TransportMode.SEA];
      const borrowers = ['故宫博物院', '上海博物馆', '南京博物院', '陕西省历史博物馆', '河南省博物馆'];

      return {
        ...artwork,
        borrower: borrowers[Math.floor(Math.random() * borrowers.length)],
        transportMode: modes[Math.floor(Math.random() * modes.length)],
        insuranceAmount: Math.floor(Math.random() * 5000000) + 100000,
        transportStatus,
        transportTimeline: timeline
      };
    });

    return {
      id: uuidv4(),
      name: data.name,
      description: data.description,
      status: data.status,
      startDate: data.startDate,
      endDate: data.endDate,
      artworks: exhibitionArtworks,
      createdAt: Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000
    };
  });
}

app.get('/api/artworks', (req, res) => {
  res.json(artworksCollection);
});

app.get('/api/exhibitions', (req, res) => {
  const list = Array.from(exhibitions.values()).map(ex => ({
    id: ex.id,
    name: ex.name,
    description: ex.description,
    status: ex.status,
    startDate: ex.startDate,
    endDate: ex.endDate,
    artworkCount: ex.artworks.length,
    createdAt: ex.createdAt
  }));
  res.json(list);
});

app.get('/api/exhibitions/:id', (req, res) => {
  const exhibition = exhibitions.get(req.params.id);
  if (!exhibition) {
    res.status(404).json({ error: '展览不存在' });
    return;
  }
  res.json(exhibition);
});

app.post('/api/exhibitions', (req, res) => {
  const { name, description, startDate, endDate } = req.body;

  if (!name || !startDate || !endDate) {
    res.status(400).json({ error: '缺少必要字段' });
    return;
  }

  const exhibition: Exhibition = {
    id: uuidv4(),
    name,
    description: description || '',
    status: ExhibitionStatus.PREPARING,
    startDate,
    endDate,
    artworks: [],
    createdAt: Date.now()
  };

  exhibitions.set(exhibition.id, exhibition);
  transportMonitor.setExhibitions(exhibitions);

  res.status(201).json(exhibition);
});

app.post('/api/exhibitions/:id/artworks', (req, res) => {
  const exhibition = exhibitions.get(req.params.id);
  if (!exhibition) {
    res.status(404).json({ error: '展览不存在' });
    return;
  }

  const { artworkIds } = req.body as { artworkIds: string[] };
  if (!Array.isArray(artworkIds)) {
    res.status(400).json({ error: 'artworkIds 必须是数组' });
    return;
  }

  const newArtworks: ExhibitionArtwork[] = [];

  for (const artworkId of artworkIds) {
    const baseArtwork = artworksCollection.find(a => a.id === artworkId);
    if (!baseArtwork) continue;

    if (exhibition.artworks.some(a => a.id === artworkId)) continue;

    const exhibitionArtwork: ExhibitionArtwork = {
      ...baseArtwork,
      borrower: '',
      transportMode: TransportMode.LAND,
      insuranceAmount: 0,
      transportStatus: TransportStatus.PENDING,
      transportTimeline: []
    };

    exhibition.artworks.push(exhibitionArtwork);
    newArtworks.push(exhibitionArtwork);
  }

  transportMonitor.setExhibitions(exhibitions);
  res.json({ added: newArtworks, artworks: exhibition.artworks });
});

app.put('/api/exhibitions/:id/artworks/:artworkId', (req, res) => {
  const exhibition = exhibitions.get(req.params.id);
  if (!exhibition) {
    res.status(404).json({ error: '展览不存在' });
    return;
  }

  const artworkIndex = exhibition.artworks.findIndex(a => a.id === req.params.artworkId);
  if (artworkIndex === -1) {
    res.status(404).json({ error: '展品不存在' });
    return;
  }

  const { borrower, transportMode, insuranceAmount } = req.body;
  const artwork = exhibition.artworks[artworkIndex];

  if (borrower !== undefined) artwork.borrower = borrower;
  if (transportMode !== undefined) artwork.transportMode = transportMode;
  if (insuranceAmount !== undefined) artwork.insuranceAmount = Number(insuranceAmount);

  res.json(artwork);
});

app.post('/api/exhibitions/:id/export', async (req, res) => {
  const exhibition = exhibitions.get(req.params.id);
  if (!exhibition) {
    res.status(404).json({ error: '展览不存在' });
    return;
  }

  try {
    const downloadPath = await exportEngine.generateManual(exhibition);
    res.json({ downloadUrl: downloadPath });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: '导出失败' });
  }
});

app.get('/api/exports/:filename', (req, res) => {
  try {
    const filePath = exportEngine.getExportFilePath(req.params.filename);
    res.download(filePath);
  } catch (error) {
    res.status(404).json({ error: '文件不存在' });
  }
});

app.use(express.static(path.join(__dirname, '..', 'public')));

io.on('connection', (socket) => {
  console.log('[Socket.io] 客户端连接:', socket.id);

  socket.on('disconnect', () => {
    console.log('[Socket.io] 客户端断开:', socket.id);
  });
});

function init() {
  const mockArtworks = generateMockArtworks();
  artworksCollection.push(...mockArtworks);
  console.log(`[Init] 生成了 ${mockArtworks.length} 件模拟藏品`);

  const mockExhibitions = generateMockExhibitions();
  mockExhibitions.forEach(ex => exhibitions.set(ex.id, ex));
  console.log(`[Init] 生成了 ${mockExhibitions.length} 个模拟展览`);

  transportMonitor.start();

  const PORT = 3001;
  server.listen(PORT, () => {
    console.log(`[Server] 服务器运行在 http://localhost:${PORT}`);
  });
}

init();
