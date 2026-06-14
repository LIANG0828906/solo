import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import bcryptjs from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const JWT_SECRET = 'your-secret-key';

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const dbFile = path.join(__dirname, 'db.json');
const adapter = new JSONFile(dbFile);
const defaultData = {
  users: [],
  communities: [],
  reviews: []
};
const db = new Low(adapter, defaultData);

await db.read();
await db.write();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ message: '未授权访问' });
  }

  try {
    const user = jsonwebtoken.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token无效' });
  }
};

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/api/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '没有上传文件' });
    }

    const filename = `${uuidv4()}.webp`;
    const filepath = path.join(uploadsDir, filename);

    await sharp(req.file.buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(filepath);

    res.json({ url: `/uploads/${filename}` });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }

    const existingUser = db.data.users.find(u => u.username === username);
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    const hashedPassword = bcryptjs.hashSync(password, 10);
    const newUser = {
      id: uuidv4(),
      username,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    db.data.users.push(newUser);
    await db.write();

    const token = jsonwebtoken.sign(
      { id: newUser.id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }

    const user = db.data.users.find(u => u.username === username);
    if (!user) {
      return res.status(400).json({ message: '用户名或密码错误' });
    }

    const validPassword = bcryptjs.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: '用户名或密码错误' });
    }

    const token = jsonwebtoken.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/communities', async (req, res, next) => {
  try {
    const { search } = req.query;
    let communities = db.data.communities;

    if (search) {
      const searchLower = search.toLowerCase();
      communities = communities.filter(
        c => c.name.toLowerCase().includes(searchLower) ||
             c.address.toLowerCase().includes(searchLower)
      );
    }

    res.json(communities);
  } catch (error) {
    next(error);
  }
});

app.get('/api/communities/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const community = db.data.communities.find(c => c.id === id);

    if (!community) {
      return res.status(404).json({ message: '小区不存在' });
    }

    res.json(community);
  } catch (error) {
    next(error);
  }
});

app.get('/api/reviews', async (req, res, next) => {
  try {
    const { communityId } = req.query;
    let reviews = [...db.data.reviews];

    if (communityId) {
      reviews = reviews.filter(r => r.communityId === communityId);
    }

    reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(reviews);
  } catch (error) {
    next(error);
  }
});

const updateCommunityStats = async (communityId) => {
  const community = db.data.communities.find(c => c.id === communityId);
  if (!community) return;

  const communityReviews = db.data.reviews.filter(r => r.communityId === communityId);
  community.reviewCount = communityReviews.length;

  if (communityReviews.length === 0) {
    community.averageScore = 0;
    community.scores = {
      life: 0,
      transport: 0,
      quiet: 0,
      green: community.scores.green,
      neighbor: community.scores.neighbor
    };
    return;
  }

  const totalScores = { life: 0, transport: 0, quiet: 0 };
  let totalScore = 0;

  communityReviews.forEach(review => {
    totalScores.life += review.scores.life;
    totalScores.transport += review.scores.transport;
    totalScores.quiet += review.scores.quiet;
    totalScore += (review.scores.life + review.scores.transport + review.scores.quiet) / 3;
  });

  community.scores.life = Number((totalScores.life / communityReviews.length).toFixed(2));
  community.scores.transport = Number((totalScores.transport / communityReviews.length).toFixed(2));
  community.scores.quiet = Number((totalScores.quiet / communityReviews.length).toFixed(2));
  community.averageScore = Number((totalScore / communityReviews.length).toFixed(2));
};

app.post('/api/reviews', authenticateToken, async (req, res, next) => {
  try {
    const { communityId, scores, content, images } = req.body;

    if (!communityId || !scores || !content) {
      return res.status(400).json({ message: '缺少必要参数' });
    }

    const community = db.data.communities.find(c => c.id === communityId);
    if (!community) {
      return res.status(404).json({ message: '小区不存在' });
    }

    const newReview = {
      id: uuidv4(),
      userId: req.user.id,
      communityId,
      username: req.user.username,
      scores: {
        life: Number(scores.life),
        transport: Number(scores.transport),
        quiet: Number(scores.quiet)
      },
      content,
      images: images || [],
      likes: 0,
      likedBy: [],
      reported: false,
      createdAt: new Date().toISOString()
    };

    db.data.reviews.push(newReview);
    await updateCommunityStats(communityId);
    await db.write();

    res.status(201).json(newReview);
  } catch (error) {
    next(error);
  }
});

app.post('/api/reviews/:id/like', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const review = db.data.reviews.find(r => r.id === id);
    if (!review) {
      return res.status(404).json({ message: '评价不存在' });
    }

    const userLikedIndex = review.likedBy.indexOf(userId);

    if (userLikedIndex === -1) {
      review.likedBy.push(userId);
      review.likes += 1;
    } else {
      review.likedBy.splice(userLikedIndex, 1);
      review.likes -= 1;
    }

    await db.write();

    res.json({
      id: review.id,
      likes: review.likes,
      liked: userLikedIndex === -1
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/reviews/:id/report', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const review = db.data.reviews.find(r => r.id === id);
    if (!review) {
      return res.status(404).json({ message: '评价不存在' });
    }

    review.reported = true;
    await db.write();

    res.json({ message: '举报成功' });
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: '服务器内部错误', error: error.message });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
