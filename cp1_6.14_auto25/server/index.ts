import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { JSONFilePreset } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DbSchema {
  users: import('../src/types').User[];
  hearts: import('../src/types').Heart[];
  matches: import('../src/types').Match[];
  messages: import('../src/types').Message[];
}

const defaultData: DbSchema = {
  users: [],
  hearts: [],
  matches: [],
  messages: [],
};

const dbFile = path.join(__dirname, 'db.json');

async function startServer() {
  const db = await JSONFilePreset<DbSchema>(dbFile, defaultData);

  if (!db.data.users) {
    db.data.users = [];
    db.data.hearts = [];
    db.data.matches = [];
    db.data.messages = [];
    await db.write();
  }

  const recommendCache = new Map<string, { users: DbSchema['users']; timestamp: number }>();

  const app = express();
  const PORT = 3001;

  app.use(cors({
    origin: true,
    credentials: true,
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(session({
    secret: 'heart-match-secret-key-2024',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
  }));

  app.post('/api/users', async (req, res) => {
    try {
      const { nickname, birthYear, gender, city, bio, interests, preference, avatarColor } = req.body;
      const currentYear = new Date().getFullYear();

      if (!nickname || !city || !bio || !interests || interests.length < 3) {
        res.status(400).json({ error: '请填写完整的个人资料，兴趣至少选择3个' });
        return;
      }

      if (birthYear < currentYear - 100 || birthYear > currentYear - 18) {
        res.status(400).json({ error: '年龄范围无效' });
        return;
      }

      const newUser = {
        id: uuidv4(),
        nickname,
        birthYear,
        gender,
        city,
        bio,
        interests,
        preference: preference || { minAge: 18, maxAge: 60, targetCity: '', targetInterests: [] },
        avatarColor: avatarColor || '#FF6B6B',
        lastActive: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      db.data.users.push(newUser);
      await db.write();
      recommendCache.clear();

      res.json(newUser);
    } catch (error) {
      console.error('创建用户失败:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  });

  app.get('/api/users/recommend', async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const excludeIdsStr = req.query.excludeIds as string;
      const excludeIds = excludeIdsStr ? excludeIdsStr.split(',').filter(Boolean) : [];

      const currentUser = db.data.users.find((u) => u.id === userId);
      if (!currentUser) {
        res.status(404).json({ error: '用户不存在' });
        return;
      }

      const cacheKey = `${userId}-${page}-${excludeIdsStr}`;
      const cached = recommendCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 30000) {
        res.json({ users: cached.users, hasMore: cached.users.length === limit });
        return;
      }

      const currentYear = new Date().getFullYear();

      let filtered = db.data.users.filter((u) => {
        if (u.id === userId) return false;
        if (excludeIds.includes(u.id)) return false;

        const age = currentYear - u.birthYear;
        const pref = currentUser.preference;

        if (age < pref.minAge || age > pref.maxAge) return false;

        if (pref.targetCity && u.city !== pref.targetCity) return false;

        if (pref.targetInterests.length > 0) {
          const commonInterests = u.interests.filter((i) =>
            pref.targetInterests.includes(i)
          );
          if (commonInterests.length === 0) return false;
        }

        return true;
      });

      filtered.sort((a, b) => {
        return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
      });

      const start = (page - 1) * limit;
      const paged = filtered.slice(start, start + limit);

      recommendCache.set(cacheKey, { users: paged, timestamp: Date.now() });

      res.json({
        users: paged,
        hasMore: start + limit < filtered.length,
      });
    } catch (error) {
      console.error('推荐失败:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  });

  app.get('/api/users/:id', async (req, res) => {
    try {
      const user = db.data.users.find((u) => u.id === req.params.id);
      if (!user) {
        res.status(404).json({ error: '用户不存在' });
        return;
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: '服务器错误' });
    }
  });

  app.put('/api/users/:id', async (req, res) => {
    try {
      const idx = db.data.users.findIndex((u) => u.id === req.params.id);
      if (idx === -1) {
        res.status(404).json({ error: '用户不存在' });
        return;
      }

      const updated = { ...db.data.users[idx], ...req.body, id: req.params.id, lastActive: new Date().toISOString() };
      db.data.users[idx] = updated;
      await db.write();
      recommendCache.clear();

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: '服务器错误' });
    }
  });

  app.post('/api/hearts', async (req, res) => {
    try {
      const { fromUserId, toUserId } = req.body;

      if (!fromUserId || !toUserId) {
        res.status(400).json({ error: '参数缺失' });
        return;
      }

      const existing = db.data.hearts.find(
        (h) => h.fromUserId === fromUserId && h.toUserId === toUserId
      );
      if (existing) {
        res.json({ success: true, isMatch: false });
        return;
      }

      const heart = {
        id: uuidv4(),
        fromUserId,
        toUserId,
        timestamp: new Date().toISOString(),
      };
      db.data.hearts.push(heart);

      const reciprocal = db.data.hearts.find(
        (h) => h.fromUserId === toUserId && h.toUserId === fromUserId
      );

      let match: import('../src/types').Match | undefined;

      if (reciprocal) {
        const existingMatch = db.data.matches.find(
          (m) => m.userIds.includes(fromUserId) && m.userIds.includes(toUserId)
        );

        if (!existingMatch) {
          match = {
            id: uuidv4(),
            userIds: [fromUserId, toUserId] as [string, string],
            matchedAt: new Date().toISOString(),
          };
          db.data.matches.push(match);
        } else {
          match = existingMatch;
        }
      }

      await db.write();

      res.json({
        success: true,
        isMatch: !!match,
        match,
      });
    } catch (error) {
      console.error('发送心动失败:', error);
      res.status(500).json({ error: '服务器错误' });
    }
  });

  app.get('/api/matches/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;
      const userMatches = db.data.matches.filter(
        (m) => m.userIds.includes(userId)
      );

      const matchesWithLastMsg = userMatches.map((m) => {
        const matchMsgs = db.data.messages.filter((msg) => msg.matchId === m.id);
        const lastMsg = matchMsgs.length > 0
          ? matchMsgs[matchMsgs.length - 1]
          : null;
        return {
          ...m,
          lastMessage: lastMsg?.content || '',
          lastMessageTime: lastMsg?.timestamp || m.matchedAt,
        };
      });

      matchesWithLastMsg.sort((a, b) => {
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });

      res.json(matchesWithLastMsg);
    } catch (error) {
      res.status(500).json({ error: '服务器错误' });
    }
  });

  app.get('/api/messages/:matchId', async (req, res) => {
    try {
      const { matchId } = req.params;
      const since = req.query.since as string | undefined;
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 200);

      let matchMsgs = db.data.messages.filter((m) => m.matchId === matchId);

      if (since) {
        matchMsgs = matchMsgs.filter((m) => new Date(m.timestamp) > new Date(since));
      }

      matchMsgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      const limited = matchMsgs.slice(-limit);

      const responseStr = JSON.stringify(limited);
      const sizeKB = Buffer.byteLength(responseStr, 'utf8') / 1024;
      if (sizeKB > 50) {
        const trimmed = matchMsgs.slice(-50);
        res.json(trimmed);
        return;
      }

      res.json(limited);
    } catch (error) {
      res.status(500).json({ error: '服务器错误' });
    }
  });

  app.post('/api/messages', async (req, res) => {
    try {
      const { matchId, senderId, content } = req.body;

      if (!matchId || !senderId || !content?.trim()) {
        res.status(400).json({ error: '参数缺失' });
        return;
      }

      const message = {
        id: uuidv4(),
        matchId,
        senderId,
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };
      db.data.messages.push(message);

      const matchIdx = db.data.matches.findIndex((m) => m.id === matchId);
      if (matchIdx !== -1) {
        db.data.matches[matchIdx].lastMessage = message.content;
        db.data.matches[matchIdx].lastMessageTime = message.timestamp;
      }

      await db.write();

      res.json(message);
    } catch (error) {
      res.status(500).json({ error: '服务器错误' });
    }
  });

  app.post('/api/seed', async (req, res) => {
    try {
      const currentYear = new Date().getFullYear();
      const seedUsers = [
        { nickname: '小雨', birthYear: currentYear - 26, gender: 'female' as const, city: '北京', bio: '热爱生活，喜欢探索城市的每个角落', interests: ['摄影', '旅行', '美食', '读书', '电影'], avatarColor: '#FF6B6B' },
        { nickname: '阿杰', birthYear: currentYear - 28, gender: 'male' as const, city: '上海', bio: '科技爱好者，周末喜欢户外运动', interests: ['游戏', '运动', '旅行', '摄影'], avatarColor: '#4D96FF' },
        { nickname: '诗涵', birthYear: currentYear - 24, gender: 'female' as const, city: '杭州', bio: '文艺青年，喜欢安静的午后', interests: ['读书', '写作', '绘画', '音乐', '瑜伽'], avatarColor: '#9B59B6' },
        { nickname: '大伟', birthYear: currentYear - 30, gender: 'male' as const, city: '深圳', bio: '互联网从业，爱猫人士', interests: ['宠物', '游戏', '动漫', '烹饪'], avatarColor: '#6BCB77' },
        { nickname: '晓琳', birthYear: currentYear - 27, gender: 'female' as const, city: '成都', bio: '火锅和辣妹子的完美结合', interests: ['美食', '旅行', '摄影', '舞蹈', '音乐'], avatarColor: '#E74C3C' },
        { nickname: '志远', birthYear: currentYear - 29, gender: 'male' as const, city: '北京', bio: '建筑设计师，喜欢城市和自然', interests: ['绘画', '旅行', '登山', '摄影'], avatarColor: '#F39C12' },
        { nickname: '佳慧', birthYear: currentYear - 25, gender: 'female' as const, city: '广州', bio: '美食博主，分享快乐的每一天', interests: ['美食', '烹饪', '摄影', '写作'], avatarColor: '#1ABC9C' },
        { nickname: '浩然', birthYear: currentYear - 31, gender: 'male' as const, city: '南京', bio: '健身达人，相信汗水不会骗人', interests: ['健身', '运动', '登山', '骑行'], avatarColor: '#3498DB' },
        { nickname: '美琪', birthYear: currentYear - 23, gender: 'female' as const, city: '上海', bio: '音乐学院在读，爱弹钢琴', interests: ['音乐', '乐器', '电影', '读书', '瑜伽'], avatarColor: '#E91E63' },
        { nickname: '子轩', birthYear: currentYear - 26, gender: 'male' as const, city: '武汉', bio: '程序员，但生活不只有代码', interests: ['游戏', '旅行', '美食', '电影', '动漫'], avatarColor: '#FFB26B' },
        { nickname: '思琪', birthYear: currentYear - 28, gender: 'female' as const, city: '杭州', bio: '自由插画师，用画笔记录生活', interests: ['绘画', '摄影', '读书', '宠物', '手工'], avatarColor: '#FF8E8E' },
        { nickname: '明辉', birthYear: currentYear - 32, gender: 'male' as const, city: '成都', bio: '旅行摄影师，用镜头看世界', interests: ['摄影', '旅行', '登山', '潜水', '电影'], avatarColor: '#FFD93D' },
        { nickname: '婉婷', birthYear: currentYear - 25, gender: 'female' as const, city: '深圳', bio: '产品经理，追求有趣的事物', interests: ['读书', '游戏', '旅行', '美食'], avatarColor: '#9B59B6' },
        { nickname: '天宇', birthYear: currentYear - 27, gender: 'male' as const, city: '广州', bio: '咖啡爱好者，每天一杯不缺席', interests: ['烹饪', '美食', '读书', '音乐', '园艺'], avatarColor: '#6BCB77' },
        { nickname: '若萱', birthYear: currentYear - 24, gender: 'female' as const, city: '南京', bio: '瑜伽教练，追求身心平衡', interests: ['瑜伽', '冥想', '舞蹈', '旅行'], avatarColor: '#1ABC9C' },
      ];

      const newUsers = seedUsers.map((u) => ({
        id: uuidv4(),
        ...u,
        preference: {
          minAge: 22,
          maxAge: 35,
          targetCity: '',
          targetInterests: u.interests.slice(0, 3),
        },
        lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      }));

      db.data.users = [...db.data.users, ...newUsers];
      await db.write();
      recommendCache.clear();

      res.json({ message: `已添加${newUsers.length}个种子用户`, count: newUsers.length });
    } catch (error) {
      res.status(500).json({ error: '服务器错误' });
    }
  });

  app.listen(PORT, () => {
    console.log(`💕 心动信号服务已启动: http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
