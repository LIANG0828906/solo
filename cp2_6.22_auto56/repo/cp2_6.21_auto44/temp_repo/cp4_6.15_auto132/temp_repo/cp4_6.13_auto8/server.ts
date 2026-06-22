import express from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

interface Painting {
  id: string;
  title: string;
  artist: string;
  emotion: string;
  description: string;
  imageUrl: string;
  year: number;
}

interface Comment {
  id: string;
  paintingId: string;
  nickname: string;
  content: string;
  createdAt: string;
}

const emotions = ['静谧', '忧郁', '热烈', '梦幻', '宁静', '激昂', '温柔', '神秘'];

const paintingTitles = [
  '晨曦之光', '深海之梦', '秋日私语', '星空漫步', '花间蝶影',
  '山巅云海', '雨中漫步', '暮色余晖', '月光交响曲', '风之絮语',
  '梦境花园', '雾中仙境', '日落时分', '极光之舞', '雨后彩虹',
  '沙漠之星', '森林之歌', '冰川之魂', '麦田守望', '城市之光'
];

const artists = [
  '林雨轩', '陈墨白', '苏婉清', '王云帆', '李晨曦',
  '张若水', '刘星河', '赵雅琴', '周浩然', '吴梦蝶'
];

const descriptions = [
  '这幅作品捕捉了清晨第一缕阳光穿透薄雾的瞬间，光影交织间流露出无限希望。',
  '深邃的蓝色调诉说着海洋的神秘与辽阔，仿佛能听见海浪轻轻拍打着礁石。',
  '金黄的落叶铺满小径，漫步其中，感受秋天独有的浪漫与诗意。',
  '繁星点点的夜空下，一个孤独的身影仰望星河，思考着宇宙的奥秘。',
  '繁花似锦的春日，蝴蝶翩翩起舞，生命的力量在每一片花瓣中绽放。',
  '站在山巅俯瞰云海翻涌，心胸豁然开朗，尘世烦恼皆如云烟消散。',
  '淅淅沥沥的雨丝中，一把红伞缓缓走过青石板路，留下一串诗意的足迹。',
  '夕阳西下，天边被染成金红色，大地笼罩在温暖而柔和的光芒中。',
  '皎洁的月光洒落人间，银色的光辉为万物披上一层梦幻的纱衣。',
  '微风轻拂，树叶沙沙作响，仿佛大自然在低声诉说着古老的故事。'
];

const paintings: Painting[] = paintingTitles.map((title, index) => ({
  id: `painting-${index + 1}`,
  title,
  artist: artists[index % artists.length],
  emotion: emotions[index % emotions.length],
  description: descriptions[index % descriptions.length],
  imageUrl: `https://picsum.photos/seed/art${index + 1}/800/600`,
  year: 2020 + (index % 5)
}));

let comments: Comment[] = [
  {
    id: 'comment-1',
    paintingId: 'painting-1',
    nickname: '艺术爱好者',
    content: '太美了！光影处理得非常细腻，让人仿佛身临其境。',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'comment-2',
    paintingId: 'painting-1',
    nickname: '画中人',
    content: '每次看到这幅画都会想起某个清晨，同样的阳光，同样的感动。',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'comment-3',
    paintingId: 'painting-2',
    nickname: '深海漫步者',
    content: '蓝色的运用非常出色，有种神秘的吸引力。',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'comment-4',
    paintingId: 'painting-5',
    nickname: '春日暖阳',
    content: '看到这幅画心情都变好了，春天真好！',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

app.get('/api/paintings', (req, res) => {
  const { emotion } = req.query;
  let result = [...paintings];
  if (emotion && typeof emotion === 'string') {
    result = result.filter(p => p.emotion === emotion);
  }
  res.json(result);
});

app.get('/api/paintings/:id', (req, res) => {
  const painting = paintings.find(p => p.id === req.params.id);
  if (!painting) {
    res.status(404).json({ error: '画作不存在' });
    return;
  }
  res.json(painting);
});

app.get('/api/paintings/emotions/list', (req, res) => {
  res.json(emotions);
});

app.get('/api/comments/:paintingId', (req, res) => {
  const paintingComments = comments
    .filter(c => c.paintingId === req.params.paintingId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(paintingComments);
});

app.post('/api/comments', (req, res) => {
  const { paintingId, nickname, content } = req.body;
  if (!paintingId || !nickname || !content) {
    res.status(400).json({ error: '缺少必要字段' });
    return;
  }
  const newComment: Comment = {
    id: randomUUID(),
    paintingId,
    nickname,
    content,
    createdAt: new Date().toISOString()
  };
  comments.push(newComment);
  res.status(201).json(newComment);
});

app.delete('/api/comments/:id', (req, res) => {
  const index = comments.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: '评论不存在' });
    return;
  }
  comments.splice(index, 1);
  res.json({ message: '删除成功' });
});

app.get('/api/paintings/featured/today', (req, res) => {
  const today = new Date().toDateString();
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = ((hash << 5) - hash) + today.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % paintings.length;
  res.json(paintings[index]);
});

app.listen(PORT, () => {
  console.log(`艺术画廊服务器运行在 http://localhost:${PORT}`);
});
