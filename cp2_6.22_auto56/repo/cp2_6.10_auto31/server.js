const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let records = [];

const getMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

app.post('/api/record', (req, res) => {
  const record = {
    ...req.body,
    id: uuidv4(),
    timestamp: Date.now()
  };
  records.push(record);
  res.json({ success: true, record });
});

app.get('/api/records', (_req, res) => {
  const currentMonth = getMonthKey();
  const monthRecords = records.filter(r => r.date.startsWith(currentMonth));
  res.json({ records: monthRecords, total: monthRecords.length });
});

app.get('/api/ranking', (_req, res) => {
  const currentMonth = getMonthKey();
  const monthRecords = records.filter(r => r.date.startsWith(currentMonth));
  
  const studentScores = new Map();
  
  monthRecords.forEach(record => {
    const existing = studentScores.get(record.studentId);
    if (existing) {
      existing.totalScore += record.score;
      existing.records.push(record);
    } else {
      studentScores.set(record.studentId, {
        studentId: record.studentId,
        studentName: record.studentName,
        totalScore: record.score,
        records: [record]
      });
    }
  });
  
  const ranking = Array.from(studentScores.values())
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 10)
    .map((item, index) => ({
      rank: index + 1,
      studentId: item.studentId,
      studentName: item.studentName,
      totalScore: item.totalScore,
      award: index === 0 ? 'first' : index === 1 ? 'second' : index === 2 ? 'third' : undefined
    }));
  
  res.json({ ranking, month: currentMonth });
});

app.post('/api/reset', (_req, res) => {
  records = [];
  res.json({ success: true, message: '本月数据已重置' });
});

app.listen(PORT, () => {
  console.log(`书院考核服务已启动: http://localhost:${PORT}`);
  console.log(`当前月份: ${getMonthKey()}`);
});
