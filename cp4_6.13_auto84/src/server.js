import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import {
  initDb,
  createUser,
  getUserByUsername,
  getUserById,
  verifyPassword,
  getClubs,
  getClubById,
  createClub,
  getClubMembers,
  getClubMemberCount,
  getReviews,
  createReview,
  voteHelpful,
  getRecommendations,
  voteRecommendation,
  getUserVotes,
  getCrowdfundingSupports,
  supportCrowdfunding,
  getMyClubs,
  getMyReviews
} from './db.js';

const app = express();
const PORT = 3001;
const JWT_SECRET = 'book-club-app-secret-key-2026';

app.use(cors());
app.use(express.json());

initDb();

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: '未授权访问' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'token无效或已过期' });
  }
}

app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password, nickname } = req.body;
    
    if (!username || !password || !nickname) {
      return res.status(400).json({ success: false, error: '请填写完整信息' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: '密码至少6位' });
    }

    const existing = getUserByUsername(username);
    if (existing) {
      return res.status(400).json({ success: false, error: '用户名已存在' });
    }

    const user = createUser(username, password, nickname);
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ success: true, data: { user, token } });
  } catch (err) {
    console.error('注册错误:', err);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, error: '请输入用户名和密码' });
    }

    const user = getUserByUsername(username);
    if (!user) {
      return res.status(400).json({ success: false, error: '用户名或密码错误' });
    }

    if (!verifyPassword(user, password)) {
      return res.status(400).json({ success: false, error: '用户名或密码错误' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    const userData = {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      createdAt: user.created_at
    };

    res.json({ success: true, data: { user: userData, token } });
  } catch (err) {
    console.error('登录错误:', err);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  try {
    const user = getUserById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    console.error('获取用户信息错误:', err);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

app.get('/api/clubs', (req, res) => {
  try {
    const clubs = getClubs();
    res.json({ success: true, data: clubs });
  } catch (err) {
    console.error('获取读书会列表错误:', err);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

app.get('/api/clubs/:id', (req, res) => {
  try {
    const club = getClubById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, error: '读书会不存在' });
    }
    res.json({ success: true, data: club });
  } catch (err) {
    console.error('获取读书会详情错误:', err);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

app.post('/api/clubs', authMiddleware, (req, res) => {
  try {
    const {
      name,
      description,
      coverImage,
      startDate,
      endDate,
      hasCrowdfunding,
      crowdfundingGoal,
      crowdfundingDeadline
    } = req.body;

    if (!name || !description) {
      return res.status(400).json({ success: false, error: '名称和简介不能为空' });
    }

    const club = createClub({
      name,
      description,
      coverImage,
      startDate,
      endDate,
      creatorId: req.userId,
      hasCrowdfunding,
      crowdfundingGoal,
      crowdfundingDeadline
    });

    res.json({ success: true, data: club });
  } catch (err) {
    console.error('创建读书会错误:', err);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

app.get('/api/clubs/:id/members', (req, res) => {
  try {
    const { id } = req.params;
    const members = getClubMembers(id, 8);
    const totalCount = getClubMemberCount(id);
    res.json({ success: true, data: { members, totalCount } });
  } catch (err) {
    console.error('获取成员列表错误:', err);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

app.get('/api/clubs/:id/reviews', (req, res) => {
  try {
    const reviews = getReviews(req.params.id);
    
    let votedReviewIds = [];
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET);
        votedReviewIds = getUserVotes(decoded.userId, 'review');
      } catch (e) {
      }
    }

    res.json({ success: true, data: { reviews, votedReviewIds } });
  } catch (err) {
    console.error('获取书评列表错误:', err);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

app.post('/api/clubs/:id/reviews', authMiddleware, (req, res) => {
  try {
    const { rating, content } = req.body;
    
    if (!rating || !content) {
      return res.status(400).json({ success: false, error: '请填写评分和评论内容' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: '评分必须在1-5之间' });
    }

    const review = createReview(req.params.id, req.userId, rating, content);
    res.json({ success: true, data: review });
  } catch (err) {
    console.error('提交书评错误:', err);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

app.post('/api/reviews/:id/helpful', authMiddleware, (req, res) => {
  try {
    const result = voteHelpful(req.params.id, req.userId);
    res.json({ success: result.success, ...result });
  } catch (err) {
    console.error('投票错误:', err);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

app.get('/api/clubs/:id/recommendations', (req, res) => {
  try {
    const recommendations = getRecommendations(req.params.id, 3);
    
    let votedRecIds = [];
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET);
        votedRecIds = getUserVotes(decoded.userId, 'recommendation');
      } catch (e) {
      }
    }

    res.json({ success: true, data: { recommendations, votedRecIds } });
  } catch (err) {
    console.error('获取推荐书目错误:', err);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

app.post('/api/recommendations/:id/vote', authMiddleware, (req, res) => {
  try {
    const result = voteRecommendation(req.params.id, req.userId);
    res.json({ success: result.success, ...result });
  } catch (err) {
    console.error('推荐投票错误:', err);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

app.get('/api/clubs/:id/crowdfunding', (req, res) => {
  try {
    const club = getClubById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, error: '读书会不存在' });
    }

    const supports = getCrowdfundingSupports(req.params.id);
    res.json({
      success: true,
      data: {
        hasCrowdfunding: club.hasCrowdfunding,
        goal: club.crowdfundingGoal,
        raised: club.crowdfundingRaised,
        deadline: club.crowdfundingDeadline,
        supports
      }
    });
  } catch (err) {
    console.error('获取众筹信息错误:', err);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

app.post('/api/clubs/:id/crowdfunding/support', authMiddleware, (req, res) => {
  try {
    const { amount } = req.body;
    const result = supportCrowdfunding(req.params.id, req.userId, amount);
    res.json(result);
  } catch (err) {
    console.error('支持众筹错误:', err);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

app.get('/api/my/clubs', authMiddleware, (req, res) => {
  try {
    const clubs = getMyClubs(req.userId);
    res.json({ success: true, data: clubs });
  } catch (err) {
    console.error('获取我的读书会错误:', err);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

app.get('/api/my/reviews', authMiddleware, (req, res) => {
  try {
    const reviews = getMyReviews(req.userId);
    res.json({ success: true, data: reviews });
  } catch (err) {
    console.error('获取我的书评错误:', err);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
