import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const mockSubscriptions = [
  {
    id: uuidv4(),
    name: 'Netflix',
    category: 'streaming',
    cycle: 'monthly',
    amount: 68,
    expiryDate: '2026-06-25',
    isActive: true,
    trialReminder: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: uuidv4(),
    name: '阿里云OSS',
    category: 'cloud',
    cycle: 'yearly',
    amount: 299,
    expiryDate: '2026-07-10',
    isActive: true,
    trialReminder: true,
    createdAt: '2026-01-15T00:00:00.000Z',
  },
  {
    id: uuidv4(),
    name: '超级猩猩健身',
    category: 'fitness',
    cycle: 'monthly',
    amount: 199,
    expiryDate: '2026-06-28',
    isActive: true,
    trialReminder: false,
    createdAt: '2026-02-01T00:00:00.000Z',
  },
  {
    id: uuidv4(),
    name: 'Adobe Creative Cloud',
    category: 'software',
    cycle: 'monthly',
    amount: 349,
    expiryDate: '2026-08-15',
    isActive: true,
    trialReminder: false,
    createdAt: '2026-02-10T00:00:00.000Z',
  },
  {
    id: uuidv4(),
    name: 'Spotify',
    category: 'streaming',
    cycle: 'monthly',
    amount: 15,
    expiryDate: '2026-06-30',
    isActive: true,
    trialReminder: true,
    createdAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: uuidv4(),
    name: 'iCloud+',
    category: 'cloud',
    cycle: 'monthly',
    amount: 21,
    expiryDate: '2026-07-05',
    isActive: true,
    trialReminder: false,
    createdAt: '2026-03-15T00:00:00.000Z',
  },
  {
    id: uuidv4(),
    name: '腾讯视频VIP',
    category: 'streaming',
    cycle: 'yearly',
    amount: 288,
    expiryDate: '2026-12-01',
    isActive: false,
    trialReminder: false,
    createdAt: '2026-01-20T00:00:00.000Z',
  },
  {
    id: uuidv4(),
    name: 'Notion Plus',
    category: 'software',
    cycle: 'monthly',
    amount: 48,
    expiryDate: '2026-06-23',
    isActive: true,
    trialReminder: true,
    createdAt: '2026-04-01T00:00:00.000Z',
  },
];

app.get('/api/subscriptions', (req, res) => {
  res.json(mockSubscriptions);
});

app.post('/api/export-csv', (req, res) => {
  const subscriptions = req.body;

  const headers = ['服务名称', '类别', '计费周期', '金额', '到期日期', '状态'];
  const categoryMap = {
    streaming: '流媒体',
    cloud: '云存储',
    fitness: '健身',
    software: '软件',
    other: '其他',
  };
  const cycleMap = {
    monthly: '月',
    quarterly: '季',
    yearly: '年',
  };

  const escapeCSV = (value) => {
    if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    if (typeof value === 'string' && /^[=+-@]/.test(value)) {
      return `'${value}`;
    }
    return value;
  };

  const rows = subscriptions.map((sub) => [
    escapeCSV(sub.name),
    escapeCSV(categoryMap[sub.category] || sub.category),
    escapeCSV(cycleMap[sub.cycle] || sub.cycle),
    sub.amount,
    sub.expiryDate,
    sub.isActive ? '启用' : '暂停',
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const BOM = '\uFEFF';

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="subscriptions.csv"');
  res.send(BOM + csvContent);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
