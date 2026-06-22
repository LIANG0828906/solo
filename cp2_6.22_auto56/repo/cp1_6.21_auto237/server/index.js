import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

const items = [];

const sampleItems = [
  {
    id: uuidv4(),
    name: '黑色钱包',
    category: '证件',
    type: 'lost',
    location: '图书馆二楼',
    description: '一个黑色皮质钱包，内有身份证和校园卡，还有少量现金。希望好心人捡到能够联系我，万分感谢！',
    contact: '13800138001',
    username: '张同学',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    comments: [
      { id: uuidv4(), username: '李老师', content: '我好像在借阅台附近见过，你去问问管理员。', createdAt: new Date(Date.now() - 1800000).toISOString() }
    ]
  },
  {
    id: uuidv4(),
    name: 'iPhone 14',
    category: '电子',
    type: 'found',
    location: '食堂三楼',
    description: '在食堂三楼靠窗位置捡到一部银色iPhone 14，手机壳是蓝色的，已交至食堂服务台。',
    contact: '13900139002',
    username: '王同学',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    comments: []
  },
  {
    id: uuidv4(),
    name: '蓝色羽绒服',
    category: '服饰',
    type: 'lost',
    location: '体育馆篮球场',
    description: '昨天打球时落下的蓝色长款羽绒服，左袖口有一个小破洞，里面有一副手套。',
    contact: '13700137003',
    username: '赵同学',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    comments: []
  },
  {
    id: uuidv4(),
    name: '校园卡',
    category: '证件',
    type: 'found',
    location: '教学楼A座302',
    description: '在A座302教室课桌里捡到一张校园卡，卡号尾号2358，请失主联系认领。',
    contact: '13600136004',
    username: '陈同学',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    comments: [
      { id: uuidv4(), username: '刘同学', content: '这是我室友的！我帮你转告他。', createdAt: new Date(Date.now() - 100000000).toISOString() }
    ]
  },
  {
    id: uuidv4(),
    name: 'AirPods Pro',
    category: '电子',
    type: 'lost',
    location: '校园咖啡厅',
    description: '在咖啡厅丢了一副白色AirPods Pro，充电盒背面有刻字"Lucky"，非常重要，求好心人归还！',
    contact: '13500135005',
    username: '孙同学',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    comments: []
  },
  {
    id: uuidv4(),
    name: '考研英语词汇书',
    category: '其他',
    type: 'found',
    location: '图书馆四楼自习区',
    description: '捡到一本新东方考研英语词汇书，书里夹着一些笔记，放在图书馆四楼服务台了。',
    contact: '13400134006',
    username: '周同学',
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    comments: []
  }
];

items.push(...sampleItems);

function stringSimilarity(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.85;
  }
  
  const words1 = new Set(s1.split(/[\s,，、。.（）()【】\[\]]+/).filter(w => w.length > 0));
  const words2 = new Set(s2.split(/[\s,，、。.（）()【】\[\]]+/).filter(w => w.length > 0));
  
  let common = 0;
  words1.forEach(w => {
    if (words2.has(w)) common++;
  });
  
  const total = new Set([...words1, ...words2]).size;
  if (total === 0) return 0;
  
  return common / total;
}

app.post('/api/items', (req, res) => {
  try {
    const { name, category, type, location, description, contact, username } = req.body;
    
    if (!name || !category || !location || !description || !contact) {
      return res.status(400).json({ error: '请填写所有必填字段' });
    }
    
    if (description.length > 200) {
      return res.status(400).json({ error: '描述不能超过200字' });
    }
    
    const newItem = {
      id: uuidv4(),
      name,
      category,
      type: type || 'lost',
      location,
      description,
      contact,
      username: username || '匿名用户',
      createdAt: new Date().toISOString(),
      comments: []
    };
    
    items.unshift(newItem);
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

app.get('/api/items', (req, res) => {
  try {
    let { category, location } = req.query;
    let result = [...items];
    
    if (category && category !== '全部') {
      result = result.filter(item => item.category === category);
    }
    
    if (location) {
      const locStr = String(location).toLowerCase();
      result = result.filter(item => 
        item.location.toLowerCase().includes(locStr)
      );
    }
    
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

app.get('/api/items/:id', (req, res) => {
  try {
    const item = items.find(i => i.id === req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: '物品不存在' });
    }
    
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

app.get('/api/match/:itemId', (req, res) => {
  try {
    const item = items.find(i => i.id === req.params.itemId);
    
    if (!item) {
      return res.status(404).json({ error: '物品不存在' });
    }
    
    const matches = items
      .filter(other => {
        if (other.id === item.id) return false;
        if (other.category !== item.category) return false;
        if (other.type === item.type) return false;
        
        const locationScore = stringSimilarity(other.location, item.location);
        return locationScore > 0.7;
      })
      .map(other => {
        const locationScore = stringSimilarity(other.location, item.location);
        const matchScore = Math.round((0.6 + locationScore * 0.4) * 100);
        return {
          ...other,
          matchScore: Math.min(matchScore, 98)
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
    
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

app.post('/api/items/:id/comments', (req, res) => {
  try {
    const { username, content } = req.body;
    const item = items.find(i => i.id === req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: '物品不存在' });
    }
    
    if (!username || !content) {
      return res.status(400).json({ error: '请填写用户名和留言内容' });
    }
    
    const newComment = {
      id: uuidv4(),
      username,
      content,
      createdAt: new Date().toISOString()
    };
    
    item.comments.unshift(newComment);
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
