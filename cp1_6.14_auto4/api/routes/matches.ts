/**
 * 赛事和历史记录路由模块
 * 处理赛事 CRUD、报名/取消报名、球员推荐、赛事结束、历史记录查询等接口
 * 被 api/app.ts 挂载到 /api 路径下
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { getDb } from '../db.js';
import { recommendPlayers } from '../utils/matching.js';
import type {
  Match,
  User,
  MatchHistory,
  MatchMode,
  MatchStatus,
  MatchRole,
} from '../../shared/types.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

type SafeUser = Omit<User, 'password'>;

type MatchWithPlayers = Match & {
  players: SafeUser[];
  creator: SafeUser;
};

function toSafeUser(user: User): SafeUser {
  const { password: _password, ...safe } = user;
  return safe;
}

function enrichMatch(match: Match, users: User[]): MatchWithPlayers {
  const players = match.playerIds
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is User => !!u)
    .map(toSafeUser);
  const creator = users.find((u) => u.id === match.creatorId);
  return {
    ...match,
    players,
    creator: creator ? toSafeUser(creator) : ({} as SafeUser),
  };
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    res.status(401).json({ error: '未登录或登录已过期' });
    return;
  }
  next();
}

router.get('/matches', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const db = await getDb();
    let matches = [...db.data.matches];

    if (status) {
      matches = matches.filter((m) => m.status === status);
    }

    const users = db.data.users;
    const enriched = matches
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((m) => enrichMatch(m, users));

    res.status(200).json(enriched);
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/matches', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, mode, time, location, note } = req.body;

    if (!title || !mode || !time || !location) {
      res.status(400).json({ error: '缺少必填字段' });
      return;
    }

    const validModes: MatchMode[] = ['3v3', '5v5'];
    if (!validModes.includes(mode as MatchMode)) {
      res.status(400).json({ error: '无效的赛事模式' });
      return;
    }

    const db = await getDb();
    const newMatch: Match = {
      id: uuidv4(),
      title,
      mode: mode as MatchMode,
      time,
      location,
      note: note || '',
      creatorId: req.session.userId!,
      playerIds: [],
      status: 'open',
      result: '',
      comment: '',
      createdAt: new Date().toISOString(),
    };

    db.data.matches.push(newMatch);
    await db.write();

    const enriched = enrichMatch(newMatch, db.data.users);
    res.status(201).json(enriched);
  } catch (error) {
    console.error('Create match error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/matches/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const match = db.data.matches.find((m) => m.id === id);

    if (!match) {
      res.status(404).json({ error: '赛事不存在' });
      return;
    }

    const enriched = enrichMatch(match, db.data.users);
    res.status(200).json(enriched);
  } catch (error) {
    console.error('Get match error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.put('/matches/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const matchIdx = db.data.matches.findIndex((m) => m.id === id);

    if (matchIdx === -1) {
      res.status(404).json({ error: '赛事不存在' });
      return;
    }

    const match = db.data.matches[matchIdx];
    if (match.creatorId !== req.session.userId) {
      res.status(403).json({ error: '无权限修改该赛事' });
      return;
    }

    const { title, mode, time, location, note, status } = req.body;

    if (mode) {
      const validModes: MatchMode[] = ['3v3', '5v5'];
      if (!validModes.includes(mode as MatchMode)) {
        res.status(400).json({ error: '无效的赛事模式' });
        return;
      }
    }

    if (status) {
      const validStatuses: MatchStatus[] = ['open', 'closed', 'canceled'];
      if (!validStatuses.includes(status as MatchStatus)) {
        res.status(400).json({ error: '无效的赛事状态' });
        return;
      }
    }

    const updatedMatch: Match = {
      ...match,
      title: title !== undefined ? title : match.title,
      mode: mode !== undefined ? (mode as MatchMode) : match.mode,
      time: time !== undefined ? time : match.time,
      location: location !== undefined ? location : match.location,
      note: note !== undefined ? note : match.note,
      status: status !== undefined ? (status as MatchStatus) : match.status,
    };

    db.data.matches[matchIdx] = updatedMatch;
    await db.write();

    const enriched = enrichMatch(updatedMatch, db.data.users);
    res.status(200).json(enriched);
  } catch (error) {
    console.error('Update match error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.delete('/matches/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const matchIdx = db.data.matches.findIndex((m) => m.id === id);

    if (matchIdx === -1) {
      res.status(404).json({ error: '赛事不存在' });
      return;
    }

    const match = db.data.matches[matchIdx];
    if (match.creatorId !== req.session.userId) {
      res.status(403).json({ error: '无权限取消该赛事' });
      return;
    }

    db.data.matches[matchIdx] = { ...match, status: 'canceled' };
    await db.write();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Cancel match error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/matches/:id/join', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.session.userId!;
    const db = await getDb();
    const matchIdx = db.data.matches.findIndex((m) => m.id === id);

    if (matchIdx === -1) {
      res.status(404).json({ error: '赛事不存在' });
      return;
    }

    const match = db.data.matches[matchIdx];
    if (match.status !== 'open') {
      res.status(400).json({ error: '该赛事不接受报名' });
      return;
    }

    if (match.creatorId === userId) {
      res.status(400).json({ error: '赛事创建者无需报名' });
      return;
    }

    if (match.playerIds.includes(userId)) {
      res.status(400).json({ error: '您已报名该赛事' });
      return;
    }

    const maxPlayers = match.mode === '3v3' ? 3 : 5;
    if (match.playerIds.length >= maxPlayers) {
      res.status(400).json({ error: '赛事报名人数已满' });
      return;
    }

    const updatedMatch = { ...match, playerIds: [...match.playerIds, userId] };
    db.data.matches[matchIdx] = updatedMatch;
    await db.write();

    const enriched = enrichMatch(updatedMatch, db.data.users);
    res.status(200).json(enriched);
  } catch (error) {
    console.error('Join match error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/matches/:id/leave', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.session.userId!;
    const db = await getDb();
    const matchIdx = db.data.matches.findIndex((m) => m.id === id);

    if (matchIdx === -1) {
      res.status(404).json({ error: '赛事不存在' });
      return;
    }

    const match = db.data.matches[matchIdx];
    if (!match.playerIds.includes(userId)) {
      res.status(400).json({ error: '您未报名该赛事' });
      return;
    }

    const updatedMatch = {
      ...match,
      playerIds: match.playerIds.filter((pid) => pid !== userId),
    };
    db.data.matches[matchIdx] = updatedMatch;
    await db.write();

    const enriched = enrichMatch(updatedMatch, db.data.users);
    res.status(200).json(enriched);
  } catch (error) {
    console.error('Leave match error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/matches/:id/recommend', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const match = db.data.matches.find((m) => m.id === id);

    if (!match) {
      res.status(404).json({ error: '赛事不存在' });
      return;
    }

    const results = recommendPlayers(match, db.data.users);
    const safeResults = results.map((r) => ({
      ...r,
      user: toSafeUser(r.user),
    }));

    res.status(200).json(safeResults);
  } catch (error) {
    console.error('Recommend players error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/matches/:id/finish', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { result, comment } = req.body;
    const db = await getDb();
    const matchIdx = db.data.matches.findIndex((m) => m.id === id);

    if (matchIdx === -1) {
      res.status(404).json({ error: '赛事不存在' });
      return;
    }

    const match = db.data.matches[matchIdx];
    if (match.creatorId !== req.session.userId) {
      res.status(403).json({ error: '无权限结束该赛事' });
      return;
    }

    if (!result) {
      res.status(400).json({ error: '请填写比赛结果' });
      return;
    }

    const updatedMatch: Match = {
      ...match,
      status: 'closed',
      result,
      comment: comment || '',
    };
    db.data.matches[matchIdx] = updatedMatch;

    const playedAt = new Date().toISOString();

    const creatorHistory: MatchHistory = {
      userId: match.creatorId,
      matchId: match.id,
      role: 'creator',
      result,
      comment: comment || '',
      playedAt,
    };
    db.data.history.push(creatorHistory);

    match.playerIds.forEach((pid) => {
      const playerHistory: MatchHistory = {
        userId: pid,
        matchId: match.id,
        role: 'player',
        result,
        comment: comment || '',
        playedAt,
      };
      db.data.history.push(playerHistory);
    });

    await db.write();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Finish match error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/history/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.session.userId!;
    const db = await getDb();
    const myHistory = db.data.history
      .filter((h) => h.userId === userId)
      .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime());

    const enriched = myHistory.map((h) => {
      const match = db.data.matches.find((m) => m.id === h.matchId);
      return {
        ...h,
        match: match ? enrichMatch(match, db.data.users) : null,
      };
    });

    res.status(200).json(enriched);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

export default router;
