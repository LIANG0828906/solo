const express = require('express');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

let animals = [
  {
    id: '1',
    name: '毛毛',
    species: '大熊猫',
    age: 5,
    gender: '雄性',
    entryDate: '2021-03-15',
    photoUrl: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=400&h=400&fit=crop',
    healthStatus: 'healthy'
  },
  {
    id: '2',
    name: '长脖子',
    species: '长颈鹿',
    age: 8,
    gender: '雌性',
    entryDate: '2019-07-22',
    photoUrl: 'https://images.unsplash.com/photo-1547721064-da6cfb341d50?w=400&h=400&fit=crop',
    healthStatus: 'observation'
  },
  {
    id: '3',
    name: '大力',
    species: '东北虎',
    age: 6,
    gender: '雄性',
    entryDate: '2020-01-10',
    photoUrl: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=400&h=400&fit=crop',
    healthStatus: 'treatment'
  },
  {
    id: '4',
    name: '小黄',
    species: '金丝猴',
    age: 4,
    gender: '雄性',
    entryDate: '2022-05-30',
    photoUrl: 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=400&h=400&fit=crop',
    healthStatus: 'healthy'
  },
  {
    id: '5',
    name: '笨笨',
    species: '河马',
    age: 12,
    gender: '雌性',
    entryDate: '2018-09-14',
    photoUrl: 'https://images.unsplash.com/photo-1516764902804-c58b2e7dc79d?w=400&h=400&fit=crop',
    healthStatus: 'healthy'
  }
];

let feedingRecords = [
  { id: 'f1', animalId: '1', date: new Date().toISOString().split('T')[0], time: '08:30', foodType: '竹子', quantity: '15kg', notes: '新鲜竹子，食欲良好' },
  { id: 'f2', animalId: '1', date: new Date().toISOString().split('T')[0], time: '14:00', foodType: '竹笋', quantity: '5kg', notes: '喜欢吃嫩竹笋' },
  { id: 'f3', animalId: '2', date: new Date().toISOString().split('T')[0], time: '09:00', foodType: '树叶', quantity: '20kg', notes: '金合欢树叶' },
  { id: 'f4', animalId: '3', date: new Date().toISOString().split('T')[0], time: '10:00', foodType: '牛肉', quantity: '8kg', notes: '新鲜牛肉，进食正常' },
  { id: 'f5', animalId: '4', date: new Date().toISOString().split('T')[0], time: '08:00', foodType: '水果', quantity: '3kg', notes: '苹果、香蕉、梨' }
];

let healthRecords = [
  { id: 'h1', animalId: '1', date: '2026-06-10', type: '常规体检', handler: '王医生', notes: '各项指标正常，体重稳定', status: 'healthy' },
  { id: 'h2', animalId: '2', date: '2026-06-12', type: '跟进检查', handler: '李医生', notes: '腿部轻微擦伤，继续观察', status: 'observation' },
  { id: 'h3', animalId: '3', date: '2026-06-08', type: '治疗', handler: '张医生', notes: '皮肤真菌感染，正在用药治疗', status: 'treatment' },
  { id: 'h4', animalId: '1', date: '2026-05-20', type: '疫苗接种', handler: '王医生', notes: '年度疫苗接种完成', status: 'healthy' },
  { id: 'h5', animalId: '5', date: '2026-06-11', type: '常规体检', handler: '李医生', notes: '牙齿健康，食欲良好', status: 'healthy' }
];

router.get('/', (req, res) => {
  const { limit = 500, offset = 0 } = req.query;
  const limited = animals.slice(Number(offset), Number(offset) + Number(limit));
  res.json({ data: limited, total: animals.length });
});

router.get('/:id', (req, res) => {
  const animal = animals.find(a => a.id === req.params.id);
  if (!animal) {
    return res.status(404).json({ error: '动物不存在' });
  }
  
  const animalFeedingRecords = feedingRecords
    .filter(r => r.animalId === req.params.id)
    .sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
  
  const animalHealthRecords = healthRecords
    .filter(r => r.animalId === req.params.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  
  res.json({
    ...animal,
    feedingRecords: animalFeedingRecords,
    healthRecords: animalHealthRecords
  });
});

router.post('/', (req, res) => {
  const { name, species, age, gender, entryDate, photoUrl } = req.body;
  
  if (!name || !species || age === undefined || !gender || !entryDate) {
    return res.status(400).json({ error: '请填写所有必填字段' });
  }
  
  const newAnimal = {
    id: uuidv4(),
    name,
    species,
    age: Number(age),
    gender,
    entryDate,
    photoUrl: photoUrl || 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=400&h=400&fit=crop',
    healthStatus: 'healthy'
  };
  
  animals.unshift(newAnimal);
  res.status(201).json(newAnimal);
});

router.put('/:id', (req, res) => {
  const index = animals.findIndex(a => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '动物不存在' });
  }
  
  animals[index] = { ...animals[index], ...req.body };
  res.json(animals[index]);
});

router.delete('/:id', (req, res) => {
  const index = animals.findIndex(a => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '动物不存在' });
  }
  
  animals.splice(index, 1);
  feedingRecords = feedingRecords.filter(r => r.animalId !== req.params.id);
  healthRecords = healthRecords.filter(r => r.animalId !== req.params.id);
  
  res.json({ message: '删除成功' });
});

router.get('/:id/feeding', (req, res) => {
  const records = feedingRecords
    .filter(r => r.animalId === req.params.id)
    .sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
  res.json(records);
});

router.post('/:id/feeding', (req, res) => {
  const { foodType, quantity, notes } = req.body;
  if (!foodType || !quantity) {
    return res.status(400).json({ error: '请填写食物类型和份量' });
  }
  
  const now = new Date();
  const newRecord = {
    id: uuidv4(),
    animalId: req.params.id,
    date: now.toISOString().split('T')[0],
    time: now.toTimeString().split(' ')[0].substring(0, 5),
    foodType,
    quantity,
    notes: notes || ''
  };
  
  feedingRecords.unshift(newRecord);
  res.status(201).json(newRecord);
});

router.put('/:id/feeding/:recordId', (req, res) => {
  const index = feedingRecords.findIndex(r => r.id === req.params.recordId && r.animalId === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '投喂记录不存在' });
  }
  
  feedingRecords[index] = { ...feedingRecords[index], ...req.body };
  res.json(feedingRecords[index]);
});

router.delete('/:id/feeding/:recordId', (req, res) => {
  const index = feedingRecords.findIndex(r => r.id === req.params.recordId && r.animalId === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '投喂记录不存在' });
  }
  
  feedingRecords.splice(index, 1);
  res.json({ message: '删除成功' });
});

router.get('/feeding/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = feedingRecords
    .filter(r => r.date === today)
    .sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
  
  const fedAnimalIds = new Set(todayRecords.map(r => r.animalId));
  const unfedAnimals = animals.filter(a => !fedAnimalIds.has(a.id));
  
  res.json({
    records: todayRecords,
    unfedAnimals: unfedAnimals
  });
});

router.get('/:id/health', (req, res) => {
  const records = healthRecords
    .filter(r => r.animalId === req.params.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(records);
});

router.post('/:id/health', (req, res) => {
  const { date, type, handler, notes, status } = req.body;
  if (!date || !type || !handler || !status) {
    return res.status(400).json({ error: '请填写所有必填字段' });
  }
  
  const newRecord = {
    id: uuidv4(),
    animalId: req.params.id,
    date,
    type,
    handler,
    notes: notes || '',
    status
  };
  
  healthRecords.unshift(newRecord);
  
  const animalIndex = animals.findIndex(a => a.id === req.params.id);
  if (animalIndex !== -1) {
    animals[animalIndex].healthStatus = status;
  }
  
  res.status(201).json({
    record: newRecord,
    notification: {
      subject: `健康状态变更通知：${animals[animalIndex]?.name || '动物'}`,
      body: `${animals[animalIndex]?.name || '该动物'}的健康状态已更新为${
        status === 'healthy' ? '健康' : status === 'observation' ? '需观察' : '需治疗'
      }。最新检查：${type} - ${notes || '无备注'}`
    }
  });
});

module.exports = router;
