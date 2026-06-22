import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type { Stage, SpeechRecord } from './types';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

interface SpeechTemplate {
  id: string;
  name: string;
  stages: Stage[];
}

const defaultTemplates: SpeechTemplate[] = [
  {
    id: 'tpl-standard',
    name: '标准演讲（10分钟）',
    stages: [
      { id: uuidv4(), name: '开场问候', plannedDuration: 60, notes: '打招呼、自我介绍、感谢听众' },
      { id: uuidv4(), name: '主题引入', plannedDuration: 120, notes: '提出问题或故事，引出演讲主题' },
      { id: uuidv4(), name: '核心内容', plannedDuration: 300, notes: '阐述核心观点，分点论述' },
      { id: uuidv4(), name: '案例分析', plannedDuration: 120, notes: '实际案例或数据支撑观点' },
      { id: uuidv4(), name: '总结升华', plannedDuration: 60, notes: '回顾要点，给出行动建议' },
      { id: uuidv4(), name: 'Q&A互动', plannedDuration: 60, notes: '回答听众提问' },
    ],
  },
  {
    id: 'tpl-short',
    name: '简短汇报（5分钟）',
    stages: [
      { id: uuidv4(), name: '开场', plannedDuration: 30, notes: '' },
      { id: uuidv4(), name: '背景介绍', plannedDuration: 60, notes: '' },
      { id: uuidv4(), name: '核心数据', plannedDuration: 120, notes: '' },
      { id: uuidv4(), name: '问题分析', plannedDuration: 60, notes: '' },
      { id: uuidv4(), name: '结论与建议', plannedDuration: 30, notes: '' },
    ],
  },
  {
    id: 'tpl-technical',
    name: '技术分享（20分钟）',
    stages: [
      { id: uuidv4(), name: '自我介绍', plannedDuration: 60, notes: '姓名、职位、技术背景' },
      { id: uuidv4(), name: '问题背景', plannedDuration: 180, notes: '我们遇到了什么问题，为什么重要' },
      { id: uuidv4(), name: '方案对比', plannedDuration: 300, notes: '可选方案分析，为什么选择当前方案' },
      { id: uuidv4(), name: '技术实现', plannedDuration: 420, notes: '关键实现细节、架构图、核心代码' },
      { id: uuidv4(), name: '效果展示', plannedDuration: 120, notes: '性能数据、前后对比、用户反馈' },
      { id: uuidv4(), name: '总结展望', plannedDuration: 60, notes: '经验总结、未来规划' },
      { id: uuidv4(), name: 'Q&A', plannedDuration: 60, notes: '' },
    ],
  },
  {
    id: 'tpl-pitch',
    name: '路演Pitch（8分钟）',
    stages: [
      { id: uuidv4(), name: '痛点阐述', plannedDuration: 90, notes: '用户痛点有多痛' },
      { id: uuidv4(), name: '解决方案', plannedDuration: 120, notes: '我们的产品/方案如何解决' },
      { id: uuidv4(), name: '市场规模', plannedDuration: 60, notes: 'TAM/SAM/SOM数据' },
      { id: uuidv4(), name: '竞争优势', plannedDuration: 90, notes: '与竞品对比优势' },
      { id: uuidv4(), name: '商业模式', plannedDuration: 60, notes: '如何盈利' },
      { id: uuidv4(), name: '团队介绍', plannedDuration: 30, notes: '核心团队背景' },
      { id: uuidv4(), name: '里程碑与融资', plannedDuration: 30, notes: '规划与需求' },
    ],
  },
];

const templates: SpeechTemplate[] = [...defaultTemplates];
const speechRecords: SpeechRecord[] = [];

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/templates', (req, res) => {
  res.json(
    templates.map((t) => ({
      id: t.id,
      name: t.name,
      stages: t.stages,
    }))
  );
});

app.get('/api/templates/:id', (req, res) => {
  const template = templates.find((t) => t.id === req.params.id);
  if (!template) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }
  res.json(template);
});

app.post('/api/templates', (req, res) => {
  const { name, stages } = req.body as { name?: string; stages?: Stage[] };
  if (!name || !stages || !Array.isArray(stages) || stages.length === 0) {
    res.status(400).json({ error: 'Invalid template data' });
    return;
  }

  const validStages = stages.every(
    (s) =>
      typeof s.name === 'string' &&
      s.name.trim().length > 0 &&
      typeof s.plannedDuration === 'number' &&
      s.plannedDuration > 0
  );

  if (!validStages) {
    res.status(400).json({ error: 'Invalid stage data' });
    return;
  }

  const newTemplate: SpeechTemplate = {
    id: uuidv4(),
    name: name.trim(),
    stages: stages.map((s) => ({
      id: s.id || uuidv4(),
      name: s.name.trim(),
      plannedDuration: Math.max(1, Math.round(s.plannedDuration)),
      notes: s.notes || '',
    })),
  };

  templates.push(newTemplate);
  res.status(201).json(newTemplate);
});

app.get('/api/records', (req, res) => {
  res.json(speechRecords);
});

app.get('/api/records/:id', (req, res) => {
  const record = speechRecords.find((r) => r.id === req.params.id);
  if (!record) {
    res.status(404).json({ error: 'Record not found' });
    return;
  }
  res.json(record);
});

app.post('/api/records', (req, res) => {
  const { date, totalDuration, totalWordCount, stages } = req.body as Partial<SpeechRecord>;

  if (
    typeof totalDuration !== 'number' ||
    totalDuration <= 0 ||
    !Array.isArray(stages) ||
    stages.length === 0
  ) {
    res.status(400).json({ error: 'Invalid record data' });
    return;
  }

  const validStages = stages.every(
    (s) =>
      typeof s.name === 'string' &&
      typeof s.plannedDuration === 'number' &&
      typeof s.actualDuration === 'number'
  );

  if (!validStages) {
    res.status(400).json({ error: 'Invalid stages data in record' });
    return;
  }

  const newRecord: SpeechRecord = {
    id: uuidv4(),
    date: date || new Date().toISOString(),
    totalDuration: Math.round(totalDuration),
    totalWordCount: Math.max(0, totalWordCount || 0),
    stages: stages.map((s) => ({
      id: s.id || uuidv4(),
      name: s.name,
      plannedDuration: Math.max(0, Math.round(s.plannedDuration)),
      actualDuration: Math.max(0, Math.round(s.actualDuration || 0)),
      notes: s.notes || '',
    })),
  };

  speechRecords.unshift(newRecord);
  res.status(201).json(newRecord);
});

app.delete('/api/records/:id', (req, res) => {
  const idx = speechRecords.findIndex((r) => r.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Record not found' });
    return;
  }
  const deleted = speechRecords.splice(idx, 1)[0];
  res.json({ deleted: true, record: deleted });
});

app.listen(PORT, () => {
  console.log(`[Speech Timer API] Server running on http://localhost:${PORT}`);
  console.log(`[Speech Timer API] Available endpoints:`);
  console.log(`  GET  /api/health          - Health check`);
  console.log(`  GET  /api/templates       - List speech templates`);
  console.log(`  GET  /api/templates/:id   - Get a template`);
  console.log(`  POST /api/templates       - Create a template`);
  console.log(`  GET  /api/records         - List speech records`);
  console.log(`  GET  /api/records/:id     - Get a record`);
  console.log(`  POST /api/records         - Save a speech record`);
  console.log(`  DELETE /api/records/:id   - Delete a record`);
});
