import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const initialSmells = [
  {
    id: uuidv4(),
    name: '雨后的草地',
    description: '夏日暴雨过后，湿润泥土混合青草的清新气息，带着一丝凉意，让人想起童年奔跑在田野间的午后。',
    color: '#3498DB',
    emotion: 'calm',
    createdAt: new Date('2024-01-15').toISOString()
  },
  {
    id: uuidv4(),
    name: '外婆厨房的红烧肉',
    description: '焦糖色的酱油与冰糖在热锅中融化，八角桂皮的香气弥漫整个屋子，那是周末傍晚最温暖的期盼。',
    color: '#E67E22',
    emotion: 'nostalgia',
    createdAt: new Date('2024-02-20').toISOString()
  },
  {
    id: uuidv4(),
    name: '海边日出的咸风',
    description: '带着海盐味道的湿润海风，远处有渔船的柴油味混着海鸥的鸣叫声，胸腔被自由填满。',
    color: '#1ABC9C',
    emotion: 'joy',
    createdAt: new Date('2024-03-10').toISOString()
  },
  {
    id: uuidv4(),
    name: '考试前的图书馆',
    description: '旧纸张与印刷油墨的味道，混合着咖啡和紧张的空气，每一个翻页声都敲击着心跳。',
    color: '#9B59B6',
    emotion: 'tension',
    createdAt: new Date('2024-04-05').toISOString()
  },
  {
    id: uuidv4(),
    name: '冬日壁炉旁的雪松',
    description: '壁炉中燃烧的松木散发着温暖的树脂香，旁边热可可的奶油甜味与之交织，窗外是安静的雪。',
    color: '#2ECC71',
    emotion: 'calm',
    createdAt: new Date('2024-05-18').toISOString()
  }
];

app.get('/api/smells', (req, res) => {
  res.json(initialSmells);
});

app.listen(PORT, () => {
  console.log(`气味博物馆 API 服务器运行在 http://localhost:${PORT}`);
});
