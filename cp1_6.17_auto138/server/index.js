import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const THEMES = [
  { name: '暖阳橙', color: '#FF8C00' },
  { name: '深海蓝', color: '#1E90FF' },
  { name: '森林绿', color: '#228B22' },
  { name: '玫瑰红', color: '#DC143C' },
  { name: '皇家紫', color: '#8B008B' },
  { name: '青金石', color: '#26619C' },
  { name: '珊瑚粉', color: '#FF7F7F' },
  { name: '柠檬黄', color: '#FFD700' }
];

const sampleArtists = ['林风眠', '赵无极', '吴冠中', '齐白石', '徐悲鸿', '潘天寿', '李可染', '黄宾虹', '傅抱石', '张大千'];
const sampleTitles = [
  '山水之境', '春日晨曦', '秋日私语', '冬日暖阳', '星河璀璨',
  '静谧时光', '梦幻森林', '城市印象', '海边日落', '山间云雾',
  '抽象思维', '色彩交响', '光影流转', '静物之美', '人物肖像'
];

const galleries = [];
const artworks = [];
const reviews = [];

function generateBoothNumber(index) {
  const letter = String.fromCharCode(65 + Math.floor(index / 99));
  const num = (index % 99 + 1).toString().padStart(2, '0');
  return `${letter}${num}`;
}

function seedMockData() {
  for (let i = 0; i < 20; i++) {
    const theme = THEMES[i % THEMES.length];
    const galleryId = uuidv4();
    const gallery = {
      id: galleryId,
      name: `${sampleTitles[i % sampleTitles.length]}展厅${i + 1}`,
      themeName: theme.name,
      themeColor: theme.color,
      createdAt: new Date(Date.now() - i * 86400000).toISOString()
    };
    galleries.push(gallery);

    const artworkCount = 3 + (i % 5);
    for (let j = 0; j < artworkCount; j++) {
      artworks.push({
        id: uuidv4(),
        galleryId,
        title: `${sampleTitles[(i + j) % sampleTitles.length]} #${j + 1}`,
        artist: sampleArtists[(i + j) % sampleArtists.length],
        boothNumber: generateBoothNumber(j),
        position: { x: j % 3, y: Math.floor(j / 3) },
        imageUrl: `https://picsum.photos/seed/${galleryId}-${j}/400/400`,
        description: `这是一件展现${sampleTitles[(i + j) % sampleTitles.length]}之美的数字艺术作品，融合了传统与现代的艺术手法。`
      });
    }

    const reviewCount = 2 + (i % 4);
    for (let k = 0; k < reviewCount; k++) {
      const usernames = ['ArtLover', '画廊访客', '艺术收藏家', '评论家', '学生小王', '设计师'];
      reviews.push({
        id: uuidv4(),
        galleryId,
        username: usernames[(i + k) % usernames.length],
        content: `这个画廊的${sampleTitles[i % sampleTitles.length]}主题非常出色，艺术品的选择和布置都很用心，值得细细品味。`,
        rating: 3 + ((i + k) % 3),
        createdAt: new Date(Date.now() - (i * 86400000 + k * 3600000)).toISOString()
      });
    }
  }
}

seedMockData();

app.get('/api/themes', (req, res) => {
  res.json(THEMES);
});

app.get('/api/galleries', (req, res) => {
  const galleriesWithStats = galleries.map(g => {
    const galleryArtworks = artworks.filter(a => a.galleryId === g.id);
    const galleryReviews = reviews.filter(r => r.galleryId === g.id);
    const avgRating = galleryReviews.length > 0
      ? galleryReviews.reduce((sum, r) => sum + r.rating, 0) / galleryReviews.length
      : 0;
    return {
      ...g,
      artworkCount: galleryArtworks.length,
      reviewCount: galleryReviews.length,
      averageRating: Math.round(avgRating * 10) / 10
    };
  });
  res.json(galleriesWithStats);
});

app.get('/api/galleries/:id', (req, res) => {
  const gallery = galleries.find(g => g.id === req.params.id);
  if (!gallery) {
    return res.status(404).json({ error: '画廊不存在' });
  }
  const galleryArtworks = artworks.filter(a => a.galleryId === gallery.id);
  const galleryReviews = reviews.filter(r => r.galleryId === gallery.id);
  const avgRating = galleryReviews.length > 0
    ? galleryReviews.reduce((sum, r) => sum + r.rating, 0) / galleryReviews.length
    : 0;
  res.json({
    ...gallery,
    artworks: galleryArtworks,
    reviewCount: galleryReviews.length,
    averageRating: Math.round(avgRating * 10) / 10
  });
});

app.post('/api/galleries', (req, res) => {
  const { name, themeName, themeColor } = req.body;
  if (!name || name.length > 20) {
    return res.status(400).json({ error: '画廊名称不能为空且不超过20字' });
  }
  const gallery = {
    id: uuidv4(),
    name,
    themeName,
    themeColor,
    createdAt: new Date().toISOString()
  };
  galleries.unshift(gallery);
  res.status(201).json(gallery);
});

app.put('/api/galleries/:id', (req, res) => {
  const index = galleries.findIndex(g => g.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '画廊不存在' });
  }
  const { name, themeName, themeColor } = req.body;
  if (name && name.length > 20) {
    return res.status(400).json({ error: '画廊名称不能超过20字' });
  }
  galleries[index] = {
    ...galleries[index],
    name: name || galleries[index].name,
    themeName: themeName || galleries[index].themeName,
    themeColor: themeColor || galleries[index].themeColor
  };
  res.json(galleries[index]);
});

app.delete('/api/galleries/:id', (req, res) => {
  const galleryIndex = galleries.findIndex(g => g.id === req.params.id);
  if (galleryIndex === -1) {
    return res.status(404).json({ error: '画廊不存在' });
  }
  galleries.splice(galleryIndex, 1);
  const galleryId = req.params.id;
  for (let i = artworks.length - 1; i >= 0; i--) {
    if (artworks[i].galleryId === galleryId) {
      artworks.splice(i, 1);
    }
  }
  for (let i = reviews.length - 1; i >= 0; i--) {
    if (reviews[i].galleryId === galleryId) {
      reviews.splice(i, 1);
    }
  }
  res.json({ message: '删除成功' });
});

app.get('/api/artworks', (req, res) => {
  const { galleryId } = req.query;
  if (galleryId) {
    res.json(artworks.filter(a => a.galleryId === galleryId));
  } else {
    res.json(artworks);
  }
});

app.post('/api/artworks', (req, res) => {
  const { galleryId, title, artist, imageUrl, description } = req.body;
  if (!galleryId || !title || !artist) {
    return res.status(400).json({ error: '缺少必填字段' });
  }
  if (title.length > 30) {
    return res.status(400).json({ error: '标题不能超过30字' });
  }
  const galleryArtworks = artworks.filter(a => a.galleryId === galleryId);
  const boothNumber = generateBoothNumber(galleryArtworks.length);
  const artwork = {
    id: uuidv4(),
    galleryId,
    title,
    artist,
    boothNumber,
    position: { x: galleryArtworks.length % 3, y: Math.floor(galleryArtworks.length / 3) },
    imageUrl: imageUrl || `https://picsum.photos/seed/${uuidv4()}/400/400`,
    description: description || ''
  };
  artworks.push(artwork);
  res.status(201).json(artwork);
});

app.delete('/api/artworks/:id', (req, res) => {
  const index = artworks.findIndex(a => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '艺术品不存在' });
  }
  artworks.splice(index, 1);
  res.json({ message: '删除成功' });
});

app.get('/api/reviews', (req, res) => {
  const { galleryId, page = 1, limit = 5 } = req.query;
  let filtered = reviews;
  if (galleryId) {
    filtered = reviews.filter(r => r.galleryId === galleryId);
  }
  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const start = (parseInt(page) - 1) * parseInt(limit);
  const end = start + parseInt(limit);
  const paginated = filtered.slice(start, end);
  const galleryReviews = galleryId ? filtered : [];
  const avgRating = galleryReviews.length > 0
    ? galleryReviews.reduce((sum, r) => sum + r.rating, 0) / galleryReviews.length
    : 0;
  res.json({
    data: paginated,
    total: filtered.length,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(filtered.length / parseInt(limit)),
    averageRating: Math.round(avgRating * 10) / 10,
    reviewCount: galleryReviews.length
  });
});

app.post('/api/reviews', (req, res) => {
  const { galleryId, username, content, rating } = req.body;
  if (!galleryId || !username || !content || !rating) {
    return res.status(400).json({ error: '缺少必填字段' });
  }
  if (content.length > 200) {
    return res.status(400).json({ error: '评论内容不能超过200字' });
  }
  if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return res.status(400).json({ error: '评分必须是1-5的整数' });
  }
  const review = {
    id: uuidv4(),
    galleryId,
    username,
    content,
    rating,
    createdAt: new Date().toISOString()
  };
  reviews.unshift(review);
  res.status(201).json(review);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
