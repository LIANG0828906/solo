import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const defaultData = { plans: [], logs: [] };
const adapter = new JSONFile(path.join(dbDir, 'db.json'));
const db = new Low(adapter, defaultData);

await db.read();
await db.write();

const PRESET_EXERCISES = [
  { id: 'preset-1', name: '深蹲', sets: 4, reps: 12, restSeconds: 60 },
  { id: 'preset-2', name: '卧推', sets: 4, reps: 10, restSeconds: 90 },
  { id: 'preset-3', name: '硬拉', sets: 4, reps: 8, restSeconds: 120 },
  { id: 'preset-4', name: '引体向上', sets: 3, reps: 10, restSeconds: 90 },
  { id: 'preset-5', name: '哑铃肩推', sets: 3, reps: 12, restSeconds: 60 },
  { id: 'preset-6', name: '杠铃划船', sets: 4, reps: 10, restSeconds: 90 },
  { id: 'preset-7', name: '腿举', sets: 3, reps: 15, restSeconds: 60 },
  { id: 'preset-8', name: '俯卧撑', sets: 3, reps: 20, restSeconds: 45 },
  { id: 'preset-9', name: '平板支撑', sets: 3, reps: 60, restSeconds: 30 },
  { id: 'preset-10', name: '卷腹', sets: 4, reps: 20, restSeconds: 30 }
];

const LINE_COLORS = ['#FF6B6B', '#4FC3F7', '#81C784', '#FFD54F', '#CE93D8'];

function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getDateString(daysOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

function calculateCompletionRate(log, plan) {
  if (!log || !plan || plan.exercises.length === 0) return 0;
  let totalTarget = 0;
  let totalActual = 0;
  plan.exercises.forEach(ex => {
    totalTarget += ex.sets;
    const exLog = log.exerciseLogs.find(l => l.exerciseId === ex.id);
    if (exLog) {
      totalActual += Math.min(exLog.actualSets, ex.sets);
    }
  });
  return totalTarget === 0 ? 0 : Math.round((totalActual / totalTarget) * 100);
}

app.get('/api/exercises/preset', (_req, res) => {
  res.json(PRESET_EXERCISES);
});

app.post('/api/plans', async (req, res) => {
  try {
    const { name, exercises, studentName } = req.body;
    if (!name || !exercises || !Array.isArray(exercises) || exercises.length === 0) {
      return res.status(400).json({ error: '计划名称和动作列表不能为空' });
    }

    let inviteCode;
    let attempts = 0;
    do {
      inviteCode = generateInviteCode();
      attempts++;
    } while (db.data.plans.some(p => p.inviteCode === inviteCode) && attempts < 100);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const plan = {
      id: uuidv4(),
      name,
      inviteCode,
      inviteExpiresAt: expiresAt.toISOString(),
      exercises: exercises.map(ex => ({
        id: ex.id || uuidv4(),
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        restSeconds: ex.restSeconds,
        isCustom: ex.isCustom || false
      })),
      createdAt: new Date().toISOString(),
      studentName: studentName || null
    };

    db.data.plans.push(plan);
    await db.write();
    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '创建计划失败' });
  }
});

app.get('/api/plans/:code', (req, res) => {
  const { code } = req.params;
  const plan = db.data.plans.find(p => p.inviteCode === code.toUpperCase());
  if (!plan) {
    return res.status(404).json({ error: '计划不存在' });
  }
  if (new Date(plan.inviteExpiresAt) < new Date()) {
    return res.status(410).json({ error: '邀请码已过期' });
  }
  res.json(plan);
});

app.get('/api/plans/:code/stats', (req, res) => {
  const { code } = req.params;
  const plan = db.data.plans.find(p => p.inviteCode === code.toUpperCase());
  if (!plan) {
    return res.status(404).json({ error: '计划不存在' });
  }

  const studentNames = [];
  for (let i = 1; i <= 5; i++) {
    studentNames.push(`学员${i}`);
  }
  if (plan.studentName && !studentNames.includes(plan.studentName)) {
    studentNames[0] = plan.studentName;
  }

  const stats = studentNames.map((name, idx) => {
    const weekData = [];
    for (let day = -6; day <= 0; day++) {
      const dateStr = getDateString(day);
      const log = db.data.logs.find(
        l => l.planId === plan.id && l.date === dateStr && l.studentName === name
      );
      const rate = log ? calculateCompletionRate(log, plan) : Math.floor(Math.random() * 60) + 20;
      weekData.push({ date: dateStr, completionRate: rate });
    }
    const todayRate = weekData[weekData.length - 1].completionRate;
    return {
      studentName: name,
      color: LINE_COLORS[idx % LINE_COLORS.length],
      weekData,
      todayCompletion: todayRate
    };
  });

  res.json(stats);
});

app.put('/api/logs', async (req, res) => {
  try {
    const { planId, studentName, date, exerciseLogs } = req.body;
    if (!planId || !studentName || !date || !exerciseLogs) {
      return res.status(400).json({ error: '参数不完整' });
    }

    const existingIdx = db.data.logs.findIndex(
      l => l.planId === planId && l.date === date && l.studentName === studentName
    );

    if (existingIdx >= 0) {
      db.data.logs[existingIdx].exerciseLogs = exerciseLogs;
    } else {
      db.data.logs.push({
        id: uuidv4(),
        planId,
        date,
        studentName,
        exerciseLogs
      });
    }

    await db.write();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '保存日志失败' });
  }
});

app.listen(PORT, () => {
  console.log(`FitFlow 后端服务已启动: http://localhost:${PORT}`);
});
