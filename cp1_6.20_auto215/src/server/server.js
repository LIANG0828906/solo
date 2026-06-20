import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', '..', 'uploads')));

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

const users = [];
const pets = [];
const posts = [];
const hotspots = [];

const now = Date.now();

users.push(
  { id: uuidv4(), username: '小明', avatar: 'https://picsum.photos/seed/user1/100/100', createdAt: new Date(now - 86400000 * 30).toISOString() },
  { id: uuidv4(), username: '小红', avatar: 'https://picsum.photos/seed/user2/100/100', createdAt: new Date(now - 86400000 * 20).toISOString() },
  { id: uuidv4(), username: '小刚', avatar: 'https://picsum.photos/seed/user3/100/100', createdAt: new Date(now - 86400000 * 10).toISOString() }
);

pets.push(
  { id: uuidv4(), userId: users[0].id, name: '旺财', breed: '金毛犬', birthday: '2022-05-15', avatarUrl: 'https://picsum.photos/seed/pet1/200/200', createdAt: new Date(now - 86400000 * 25).toISOString() },
  { id: uuidv4(), userId: users[0].id, name: '咪咪', breed: '橘猫', birthday: '2023-02-20', avatarUrl: 'https://picsum.photos/seed/pet2/200/200', createdAt: new Date(now - 86400000 * 20).toISOString() },
  { id: uuidv4(), userId: users[1].id, name: '豆豆', breed: '柯基', birthday: '2021-11-10', avatarUrl: 'https://picsum.photos/seed/pet3/200/200', createdAt: new Date(now - 86400000 * 15).toISOString() },
  { id: uuidv4(), userId: users[2].id, name: '球球', breed: '萨摩耶', birthday: '2022-08-08', avatarUrl: 'https://picsum.photos/seed/pet4/200/200', createdAt: new Date(now - 86400000 * 12).toISOString() },
  { id: uuidv4(), userId: users[2].id, name: '小黑', breed: '田园猫', birthday: '2023-06-01', avatarUrl: 'https://picsum.photos/seed/pet5/200/200', createdAt: new Date(now - 86400000 * 8).toISOString() }
);

const petTags = ['#可爱', '#日常', '#萌宠', '#遛弯', '#美食', '#睡觉', '#玩耍', '#搞笑'];
const locations = [
  { name: '中央公园', lat: 31.2304, lng: 121.4737 },
  { name: '滨江大道', lat: 31.2350, lng: 121.4900 },
  { name: '人民广场', lat: 31.2300, lng: 121.4700 },
  { name: '徐家汇', lat: 31.1900, lng: 121.4300 },
  { name: '静安寺', lat: 31.2250, lng: 121.4500 }
];

for (let i = 0; i < 15; i++) {
  const userIndex = i % 3;
  const petIndex = i % 5;
  const locIndex = i % 5;
  const numImages = (i % 3) + 1;
  const images = [];
  for (let j = 0; j < numImages; j++) {
    images.push(`https://picsum.photos/seed/post${i}img${j}/400/300`);
  }
  const numTags = (i % 3) + 1;
  const tags = [];
  for (let j = 0; j < numTags; j++) {
    tags.push(petTags[(i + j) % petTags.length]);
  }
  posts.push({
    id: uuidv4(),
    userId: users[userIndex].id,
    petId: pets[petIndex].id,
    content: `这是第${i + 1}条动态，今天和我的宝贝一起出去玩，超级开心！希望大家喜欢我们的照片~`,
    images: images,
    tags: tags,
    location: locations[locIndex].name,
    lat: locations[locIndex].lat + (Math.random() - 0.5) * 0.01,
    lng: locations[locIndex].lng + (Math.random() - 0.5) * 0.01,
    likes: Math.floor(Math.random() * 100),
    comments: Math.floor(Math.random() * 20),
    createdAt: new Date(now - 86400000 * (15 - i)).toISOString()
  });
}

hotspots.push(
  { id: uuidv4(), name: '中央公园', lat: 31.2304, lng: 121.4737, intensity: 95, postCount: 45 },
  { id: uuidv4(), name: '滨江大道', lat: 31.2350, lng: 121.4900, intensity: 82, postCount: 32 },
  { id: uuidv4(), name: '人民广场', lat: 31.2300, lng: 121.4700, intensity: 76, postCount: 28 },
  { id: uuidv4(), name: '徐家汇', lat: 31.1900, lng: 121.4300, intensity: 68, postCount: 21 },
  { id: uuidv4(), name: '静安寺', lat: 31.2250, lng: 121.4500, intensity: 55, postCount: 15 }
);

app.post('/api/users', (req, res) => {
  try {
    const { username, avatar } = req.body;
    if (!username) {
      return res.status(400).json({ error: '用户名不能为空' });
    }
    const newUser = {
      id: uuidv4(),
      username,
      avatar: avatar || `https://picsum.photos/seed/${uuidv4()}/100/100`,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: '创建用户失败' });
  }
});

app.post('/api/pets', upload.single('avatar'), (req, res) => {
  try {
    const { userId, name, breed, birthday } = req.body;
    if (!userId || !name) {
      return res.status(400).json({ error: '用户ID和宠物名不能为空' });
    }
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    let avatarUrl = `https://picsum.photos/seed/${uuidv4()}/200/200`;
    if (req.file) {
      avatarUrl = `/uploads/${req.file.filename}`;
    }
    const newPet = {
      id: uuidv4(),
      userId,
      name,
      breed: breed || '',
      birthday: birthday || '',
      avatarUrl,
      createdAt: new Date().toISOString()
    };
    pets.push(newPet);
    res.status(201).json(newPet);
  } catch (error) {
    res.status(500).json({ error: '添加宠物失败' });
  }
});

app.post('/api/posts', upload.array('images', 3), (req, res) => {
  try {
    const { userId, petId, content, tags, location, lat, lng } = req.body;
    if (!userId || !content) {
      return res.status(400).json({ error: '用户ID和内容不能为空' });
    }
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        images.push(`/uploads/${file.filename}`);
      });
    }
    let parsedTags = [];
    if (tags) {
      if (typeof tags === 'string') {
        parsedTags = tags.split(',').map(t => t.trim()).filter(t => t);
      } else if (Array.isArray(tags)) {
        parsedTags = tags;
      }
    }
    const newPost = {
      id: uuidv4(),
      userId,
      petId: petId || null,
      content,
      images,
      tags: parsedTags,
      location: location || '',
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      likes: 0,
      comments: 0,
      createdAt: new Date().toISOString()
    };
    posts.unshift(newPost);
    res.status(201).json(newPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '发布动态失败' });
  }
});

app.get('/api/feed', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPosts = posts.slice(startIndex, endIndex);
    const postsWithUser = paginatedPosts.map(post => {
      const user = users.find(u => u.id === post.userId);
      const pet = pets.find(p => p.id === post.petId);
      return {
        ...post,
        user: user ? { id: user.id, username: user.username, avatar: user.avatar } : null,
        pet: pet ? { id: pet.id, name: pet.name, avatarUrl: pet.avatarUrl } : null
      };
    });
    res.json({
      data: postsWithUser,
      total: posts.length,
      page,
      limit,
      totalPages: Math.ceil(posts.length / limit)
    });
  } catch (error) {
    res.status(500).json({ error: '获取动态列表失败' });
  }
});

app.get('/api/hotspots', (req, res) => {
  try {
    res.json(hotspots);
  } catch (error) {
    res.status(500).json({ error: '获取热点数据失败' });
  }
});

app.post('/api/posts/:id/like', (req, res) => {
  try {
    const postId = req.params.id;
    const post = posts.find(p => p.id === postId);
    if (!post) {
      return res.status(404).json({ error: '动态不存在' });
    }
    post.likes += 1;
    res.json({ id: post.id, likes: post.likes });
  } catch (error) {
    res.status(500).json({ error: '点赞失败' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
