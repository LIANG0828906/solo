import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const store = {
  activities: new Map(),
  participants: new Map(),
  prizes: new Map(),
  results: new Map(),
};

app.post('/api/activities', (req, res) => {
  const { name, prizes, participants } = req.body;
  
  if (!name || !prizes || prizes.length === 0 || !participants || participants.length === 0) {
    return res.status(400).json({ error: '活动名称、奖品列表和参与者名单不能为空' });
  }

  const activityId = uuidv4();
  const activity = {
    id: activityId,
    name,
    createdAt: Date.now(),
  };

  const processedPrizes = prizes.map((p, idx) => ({
    id: uuidv4(),
    activityId,
    name: p.name,
    quantity: parseInt(p.quantity),
    icon: p.icon || '🎁',
    order: idx,
    drawnCount: 0,
  }));

  const uniqueParticipants = [];
  const seen = new Set();
  let duplicates = 0;

  participants.forEach((p) => {
    const key = p.name + (p.phone || p.email || '');
    if (seen.has(key)) {
      duplicates++;
    } else {
      seen.add(key);
      uniqueParticipants.push({
        id: uuidv4(),
        activityId,
        name: p.name,
        phone: p.phone || '',
        email: p.email || '',
      });
    }
  });

  store.activities.set(activityId, activity);
  processedPrizes.forEach((p) => store.prizes.set(p.id, p));
  uniqueParticipants.forEach((p) => store.participants.set(p.id, p));

  res.json({
    activity,
    prizes: processedPrizes,
    participants: uniqueParticipants,
    stats: {
      totalParticipants: participants.length,
      uniqueParticipants: uniqueParticipants.length,
      duplicates,
    },
  });
});

app.get('/api/activities', (_req, res) => {
  const activities = Array.from(store.activities.values());
  res.json(activities);
});

app.get('/api/activities/:id', (req, res) => {
  const { id } = req.params;
  const activity = store.activities.get(id);
  
  if (!activity) {
    return res.status(404).json({ error: '活动不存在' });
  }

  const prizes = Array.from(store.prizes.values()).filter((p) => p.activityId === id);
  const participants = Array.from(store.participants.values()).filter((p) => p.activityId === id);
  const results = Array.from(store.results.values()).filter((r) => r.activityId === id);

  res.json({
    activity,
    prizes,
    participants,
    results,
    stats: {
      totalParticipants: participants.length,
      totalPrizes: prizes.reduce((sum, p) => sum + p.quantity, 0),
      drawnPrizes: results.length,
    },
  });
});

app.post('/api/lottery/draw', (req, res) => {
  const { activityId, prizeId } = req.body;

  if (!activityId) {
    return res.status(400).json({ error: '活动ID不能为空' });
  }

  const activity = store.activities.get(activityId);
  if (!activity) {
    return res.status(404).json({ error: '活动不存在' });
  }

  const availablePrizes = Array.from(store.prizes.values()).filter(
    (p) => p.activityId === activityId && p.drawnCount < p.quantity
  );

  if (availablePrizes.length === 0) {
    return res.status(400).json({ error: '所有奖品已抽完' });
  }

  let selectedPrize;
  if (prizeId) {
    selectedPrize = availablePrizes.find((p) => p.id === prizeId);
    if (!selectedPrize) {
      return res.status(400).json({ error: '该奖品已抽完或不存在' });
    }
  } else {
    const totalWeight = availablePrizes.reduce((sum, p) => sum + (p.quantity - p.drawnCount), 0);
    let random = Math.random() * totalWeight;
    for (const prize of availablePrizes) {
      random -= prize.quantity - prize.drawnCount;
      if (random <= 0) {
        selectedPrize = prize;
        break;
      }
    }
    if (!selectedPrize) selectedPrize = availablePrizes[0];
  }

  const allParticipants = Array.from(store.participants.values()).filter(
    (p) => p.activityId === activityId
  );

  const drawnParticipantIds = new Set(
    Array.from(store.results.values())
      .filter((r) => r.activityId === activityId)
      .map((r) => r.participantId)
  );

  const availableParticipants = allParticipants.filter(
    (p) => !drawnParticipantIds.has(p.id)
  );

  if (availableParticipants.length === 0) {
    return res.status(400).json({ error: '所有参与者已中奖' });
  }

  const randomIdx = Math.floor(Math.random() * availableParticipants.length);
  const winner = availableParticipants[randomIdx];

  selectedPrize.drawnCount++;
  store.prizes.set(selectedPrize.id, selectedPrize);

  const result = {
    id: uuidv4(),
    activityId,
    prizeId: selectedPrize.id,
    participantId: winner.id,
    prizeName: selectedPrize.name,
    prizeIcon: selectedPrize.icon,
    participantName: winner.name,
    drawnAt: Date.now(),
  };

  store.results.set(result.id, result);

  res.json(result);
});

app.post('/api/lottery/redraw', (req, res) => {
  const { resultId } = req.body;

  if (!resultId) {
    return res.status(400).json({ error: '记录ID不能为空' });
  }

  const oldResult = store.results.get(resultId);
  if (!oldResult) {
    return res.status(404).json({ error: '记录不存在' });
  }

  store.results.delete(resultId);

  const prize = store.prizes.get(oldResult.prizeId);
  if (prize) {
    prize.drawnCount = Math.max(0, prize.drawnCount - 1);
    store.prizes.set(prize.id, prize);
  }

  const allParticipants = Array.from(store.participants.values()).filter(
    (p) => p.activityId === oldResult.activityId
  );

  const drawnParticipantIds = new Set(
    Array.from(store.results.values())
      .filter((r) => r.activityId === oldResult.activityId)
      .map((r) => r.participantId)
  );

  const availableParticipants = allParticipants.filter(
    (p) => !drawnParticipantIds.has(p.id)
  );

  if (availableParticipants.length === 0) {
    store.results.set(resultId, oldResult);
    if (prize) {
      prize.drawnCount++;
      store.prizes.set(prize.id, prize);
    }
    return res.status(400).json({ error: '没有可用的参与者进行重抽' });
  }

  const randomIdx = Math.floor(Math.random() * availableParticipants.length);
  const winner = availableParticipants[randomIdx];

  prize.drawnCount++;
  store.prizes.set(prize.id, prize);

  const newResult = {
    id: uuidv4(),
    activityId: oldResult.activityId,
    prizeId: oldResult.prizeId,
    participantId: winner.id,
    prizeName: oldResult.prizeName,
    prizeIcon: oldResult.prizeIcon,
    participantName: winner.name,
    drawnAt: Date.now(),
  };

  store.results.set(newResult.id, newResult);

  res.json(newResult);
});

app.get('/api/results/:activityId', (req, res) => {
  const { activityId } = req.params;
  const results = Array.from(store.results.values())
    .filter((r) => r.activityId === activityId)
    .sort((a, b) => b.drawnAt - a.drawnAt);
  
  res.json(results);
});

app.get('/api/results/export/:activityId', (req, res) => {
  const { activityId } = req.params;
  const activity = store.activities.get(activityId);
  
  if (!activity) {
    return res.status(404).json({ error: '活动不存在' });
  }

  const results = Array.from(store.results.values())
    .filter((r) => r.activityId === activityId)
    .sort((a, b) => a.drawnAt - b.drawnAt);

  const participants = Array.from(store.participants.values());
  const participantMap = new Map(participants.map((p) => [p.id, p]));

  let csv = '序号,中奖人,联系电话,邮箱,奖品,抽奖时间\n';
  results.forEach((r, idx) => {
    const participant = participantMap.get(r.participantId) || {};
    const time = new Date(r.drawnAt).toLocaleString('zh-CN');
    csv += `${idx + 1},"${r.participantName}","${participant.phone || ''}","${participant.email || ''}","${r.prizeName}","${time}"\n`;
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${activity.name}_中奖名单.csv"`);
  res.send('\uFEFF' + csv);
});

app.listen(PORT, () => {
  console.log(`抽奖服务运行在 http://localhost:${PORT}`);
});
