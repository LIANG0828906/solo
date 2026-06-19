import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { format, startOfDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3005;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

const DATA_DIR = path.join(__dirname, '../../data');
const REPAIRS_FILE = path.join(DATA_DIR, 'repairs.json');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');

interface StatusUpdate {
  status: string;
  timestamp: string;
  note?: string;
  repairer?: string;
}

interface Repair {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  images: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  repairer?: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: StatusUpdate[];
}

interface Stats {
  totalCount: number;
  statusCounts: Record<string, number>;
  priorityCounts: Record<string, number>;
  dailyCounts: Record<string, number>;
}

function readRepairs(): Repair[] {
  if (!fs.existsSync(REPAIRS_FILE)) return [];
  const data = fs.readFileSync(REPAIRS_FILE, 'utf-8');
  return JSON.parse(data) as Repair[];
}

function writeRepairs(repairs: Repair[]): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(REPAIRS_FILE, JSON.stringify(repairs, null, 2), 'utf-8');
}

function readStats(): Stats {
  if (!fs.existsSync(STATS_FILE)) {
    return {
      totalCount: 0,
      statusCounts: { pending: 0, processing: 0, completed: 0, failed: 0 },
      priorityCounts: { high: 0, medium: 0, low: 0 },
      dailyCounts: {}
    };
  }
  const data = fs.readFileSync(STATS_FILE, 'utf-8');
  return JSON.parse(data) as Stats;
}

function writeStats(stats: Stats): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8');
}

function generateTicketNumber(): string {
  const date = format(new Date(), 'yyyyMMdd', { locale: zhCN });
  const repairs = readRepairs();
  const todayCount = repairs.filter(r => r.createdAt.startsWith(date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'))).length + 1;
  return `BX${date}${String(todayCount).padStart(4, '0')}`;
}

function updateStats(): void {
  const repairs = readRepairs();
  const stats: Stats = {
    totalCount: repairs.length,
    statusCounts: { pending: 0, processing: 0, completed: 0, failed: 0 },
    priorityCounts: { high: 0, medium: 0, low: 0 },
    dailyCounts: {}
  };

  repairs.forEach(repair => {
    stats.statusCounts[repair.status] = (stats.statusCounts[repair.status] || 0) + 1;
    stats.priorityCounts[repair.priority] = (stats.priorityCounts[repair.priority] || 0) + 1;
    
    const dayKey = format(startOfDay(new Date(repair.createdAt)), 'yyyy-MM-dd', { locale: zhCN });
    stats.dailyCounts[dayKey] = (stats.dailyCounts[dayKey] || 0) + 1;
  });

  writeStats(stats);
}

app.get('/api/repairs', (req, res) => {
  try {
    const repairs = readRepairs();
    const { status, sortBy } = req.query;
    
    let filtered = [...repairs];
    
    if (status && typeof status === 'string' && status !== 'all') {
      filtered = filtered.filter(r => r.status === status);
    }
    
    if (sortBy === 'priority') {
      const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
      filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    } else if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: '获取工单列表失败' });
  }
});

app.get('/api/repairs/:id', (req, res) => {
  try {
    const repairs = readRepairs();
    const repair = repairs.find(r => r.id === req.params.id);
    
    if (!repair) {
      return res.status(404).json({ error: '工单不存在' });
    }
    
    res.json(repair);
  } catch (error) {
    res.status(500).json({ error: '获取工单详情失败' });
  }
});

app.post('/api/repairs', (req, res) => {
  try {
    const { title, description, priority, images } = req.body;
    
    if (!title || !description || !priority) {
      return res.status(400).json({ error: '请填写完整信息' });
    }
    
    const now = new Date().toISOString();
    const newRepair: Repair = {
      id: uuidv4(),
      ticketNumber: generateTicketNumber(),
      title,
      description,
      priority,
      images: images || [],
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      statusHistory: [{
        status: 'pending',
        timestamp: now,
        note: '工单已创建'
      }]
    };
    
    const repairs = readRepairs();
    repairs.unshift(newRepair);
    writeRepairs(repairs);
    updateStats();
    
    res.status(201).json(newRepair);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '创建工单失败' });
  }
});

app.put('/api/repairs/:id/accept', (req, res) => {
  try {
    const { repairer } = req.body;
    const repairs = readRepairs();
    const index = repairs.findIndex(r => r.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: '工单不存在' });
    }
    
    if (repairs[index].status !== 'pending') {
      return res.status(400).json({ error: '该工单已被接单' });
    }
    
    const now = new Date().toISOString();
    repairs[index].status = 'processing';
    repairs[index].repairer = repairer;
    repairs[index].updatedAt = now;
    repairs[index].statusHistory.push({
      status: 'processing',
      timestamp: now,
      note: `${repairer} 已接单`,
      repairer
    });
    
    writeRepairs(repairs);
    updateStats();
    
    res.json(repairs[index]);
  } catch (error) {
    res.status(500).json({ error: '接单失败' });
  }
});

app.put('/api/repairs/:id/status', (req, res) => {
  try {
    const { status, note, repairer } = req.body;
    const repairs = readRepairs();
    const index = repairs.findIndex(r => r.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: '工单不存在' });
    }
    
    if (!['processing', 'completed', 'failed'].includes(status)) {
      return res.status(400).json({ error: '无效的状态值' });
    }
    
    const now = new Date().toISOString();
    repairs[index].status = status as Repair['status'];
    repairs[index].updatedAt = now;
    
    const statusText: Record<string, string> = {
      processing: '处理中',
      completed: '已完成',
      failed: '无法修复'
    };
    
    repairs[index].statusHistory.push({
      status,
      timestamp: now,
      note: note || `状态更新为：${statusText[status]}`,
      repairer
    });
    
    writeRepairs(repairs);
    updateStats();
    
    res.json(repairs[index]);
  } catch (error) {
    res.status(500).json({ error: '更新状态失败' });
  }
});

app.get('/api/stats', (_req, res) => {
  try {
    updateStats();
    const stats = readStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

app.listen(PORT, () => {
  console.log(`后端服务运行在 http://localhost:${PORT}`);
});
