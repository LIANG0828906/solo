import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import {
  initDatabase,
  getGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  hasActivities,
  getActivities,
  getActivityById,
  createActivity,
  registerActivity,
  unregisterActivity,
  isRegistered,
  getRatings,
  createRating,
  getCurrentUser,
  getGroupsByUserId,
  getActivitiesByUserId,
  getRatingsByUserId,
  User,
} from './database';

const app = express();
const PORT = 3001;
const CURRENT_USER_ID = 'user-001';
const RATING_WINDOW_MS = 24 * 60 * 60 * 1000;

app.use(cors());
app.use(express.json());

function success<T>(res: Response, data: T, status = 200) {
  res.status(status).json({ success: true, data });
}

function fail(res: Response, message: string, status = 400) {
  res.status(status).json({ success: false, message });
}

function getCurrentUserFromDb(): User {
  return getCurrentUser();
}

app.get('/api/users/me', (_req: Request, res: Response) => {
  try {
    const user = getCurrentUserFromDb();
    success(res, user);
  } catch (err) {
    fail(res, err instanceof Error ? err.message : '获取用户信息失败', 500);
  }
});

app.get('/api/groups', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const result = getGroups(page, pageSize);
    success(res, result);
  } catch (err) {
    fail(res, err instanceof Error ? err.message : '获取小组列表失败', 500);
  }
});

app.get('/api/groups/:id', (req: Request, res: Response) => {
  try {
    const group = getGroupById(req.params.id);
    if (!group) {
      return fail(res, '小组不存在', 404);
    }
    success(res, group);
  } catch (err) {
    fail(res, err instanceof Error ? err.message : '获取小组详情失败', 500);
  }
});

app.post('/api/groups', (req: Request, res: Response) => {
  try {
    const user = getCurrentUserFromDb();
    const { name, description, coverImage } = req.body;
    if (!name || !description || !coverImage) {
      return fail(res, '请填写完整信息');
    }
    const group = createGroup({
      name,
      description,
      coverImage,
      leaderId: user.id,
      leaderName: user.name,
    });
    success(res, group, 201);
  } catch (err) {
    fail(res, err instanceof Error ? err.message : '创建小组失败', 500);
  }
});

app.put('/api/groups/:id', (req: Request, res: Response) => {
  try {
    const user = getCurrentUserFromDb();
    const group = getGroupById(req.params.id);
    if (!group) {
      return fail(res, '小组不存在', 404);
    }
    if (group.leaderId !== user.id) {
      return fail(res, '仅组长可编辑小组信息', 403);
    }
    const { name, description, coverImage } = req.body;
    const updated = updateGroup(req.params.id, { name, description, coverImage });
    success(res, updated);
  } catch (err) {
    fail(res, err instanceof Error ? err.message : '更新小组失败', 500);
  }
});

app.delete('/api/groups/:id', (req: Request, res: Response) => {
  try {
    const user = getCurrentUserFromDb();
    const group = getGroupById(req.params.id);
    if (!group) {
      return fail(res, '小组不存在', 404);
    }
    if (group.leaderId !== user.id) {
      return fail(res, '仅组长可解散小组', 403);
    }
    if (hasActivities(req.params.id)) {
      return fail(res, '小组存在活动，无法解散');
    }
    deleteGroup(req.params.id);
    success(res, null as unknown as void);
  } catch (err) {
    fail(res, err instanceof Error ? err.message : '解散小组失败', 500);
  }
});

app.get('/api/groups/:groupId/activities', (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const group = getGroupById(groupId);
    if (!group) {
      return fail(res, '小组不存在', 404);
    }
    const result = getActivities(groupId, page, pageSize);
    success(res, result);
  } catch (err) {
    fail(res, err instanceof Error ? err.message : '获取活动列表失败', 500);
  }
});

app.post('/api/groups/:groupId/activities', (req: Request, res: Response) => {
  try {
    const user = getCurrentUserFromDb();
    const { groupId } = req.params;
    const group = getGroupById(groupId);
    if (!group) {
      return fail(res, '小组不存在', 404);
    }
    if (group.leaderId !== user.id) {
      return fail(res, '仅组长可发布活动', 403);
    }
    const { title, description, startTime, endTime, location, maxParticipants } = req.body;
    if (!title || !startTime || !endTime || !location || !maxParticipants) {
      return fail(res, '请填写完整信息');
    }
    if (startTime >= endTime) {
      return fail(res, '结束时间必须晚于开始时间');
    }
    const activity = createActivity({
      groupId,
      title,
      description: description || '',
      startTime,
      endTime,
      location,
      maxParticipants,
    });
    success(res, activity, 201);
  } catch (err) {
    fail(res, err instanceof Error ? err.message : '发布活动失败', 500);
  }
});

app.get('/api/activities', (req: Request, res: Response) => {
  try {
    const { groupId } = req.query as { groupId: string };
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    if (!groupId) {
      return fail(res, '缺少groupId参数');
    }
    const group = getGroupById(groupId);
    if (!group) {
      return fail(res, '小组不存在', 404);
    }
    const result = getActivities(groupId, page, pageSize);
    success(res, result);
  } catch (err) {
    fail(res, err instanceof Error ? err.message : '获取活动列表失败', 500);
  }
});

app.post('/api/activities', (req: Request, res: Response) => {
  try {
    const user = getCurrentUserFromDb();
    const { groupId, title, description, startTime, endTime, location, maxParticipants } = req.body;
    if (!groupId) {
      return fail(res, '缺少groupId');
    }
    const group = getGroupById(groupId);
    if (!group) {
      return fail(res, '小组不存在', 404);
    }
    if (group.leaderId !== user.id) {
      return fail(res, '仅组长可发布活动', 403);
    }
    if (!title || !startTime || !endTime || !location || !maxParticipants) {
      return fail(res, '请填写完整信息');
    }
    if (startTime >= endTime) {
      return fail(res, '结束时间必须晚于开始时间');
    }
    const activity = createActivity({
      groupId,
      title,
      description: description || '',
      startTime,
      endTime,
      location,
      maxParticipants,
    });
    success(res, activity, 201);
  } catch (err) {
    fail(res, err instanceof Error ? err.message : '发布活动失败', 500);
  }
});

app.get('/api/activities/:id', (req: Request, res: Response) => {
  try {
    const activity = getActivityById(req.params.id);
    if (!activity) {
      return fail(res, '活动不存在', 404);
    }
    success(res, activity);
  } catch (err) {
    fail(res, err instanceof Error ? err.message : '获取活动详情失败', 500);
  }
});

app.post('/api/activities/:id/register', (req: Request, res: Response) => {
  try {
    const user = getCurrentUserFromDb();
    const activity = getActivityById(req.params.id);
    if (!activity) {
      return fail(res, '活动不存在', 404);
    }
    if (activity.status === 'ended') {
      return fail(res, '活动已结束，无法报名');
    }
    const registration = registerActivity(req.params.id, user.id, user.name);
    success(res, registration, 201);
  } catch (err) {
    fail(res, err instanceof Error ? err.message : '报名失败');
  }
});

app.delete('/api/activities/:id/register', (req: Request, res: Response) => {
  try {
    const user = getCurrentUserFromDb();
    const activity = getActivityById(req.params.id);
    if (!activity) {
      return fail(res, '活动不存在', 404);
    }
    if (activity.status === 'ended') {
      return fail(res, '活动已结束，无法取消报名');
    }
    unregisterActivity(req.params.id, user.id);
    success(res, null as unknown as void);
  } catch (err) {
    fail(res, err instanceof Error ? err.message : '取消报名失败');
  }
});

app.get('/api/activities/:id/is-registered', (req: Request, res: Response) => {
  try {
    const user = getCurrentUserFromDb();
    const activity = getActivityById(req.params.id);
    if (!activity) {
      return fail(res, '活动不存在', 404);
    }
    const registered = isRegistered(req.params.id, user.id);
    success(res, { registered });
  } catch (err) {
    fail(res, err instanceof Error ? err.message : '查询报名状态失败', 500);
  }
});

app.get('/api/activities/:id/ratings', (req: Request, res: Response) => {
  try {
    const activity = getActivityById(req.params.id);
    if (!activity) {
      return fail(res, '活动不存在', 404);
    }
    const ratings = getRatings(req.params.id);
    success(res, ratings);
  } catch (err) {
    fail(res, err instanceof Error ? err.message : '获取评分列表失败', 500);
  }
});

app.post('/api/activities/:id/ratings', (req: Request, res: Response) => {
  try {
    const user = getCurrentUserFromDb();
    const activity = getActivityById(req.params.id);
    if (!activity) {
      return fail(res, '活动不存在', 404);
    }
    if (activity.status !== 'ended') {
      return fail(res, '活动未结束，暂不能评分');
    }
    const now = Date.now();
    if (now - activity.endTime > RATING_WINDOW_MS) {
      return fail(res, '评分时间已超过24小时，无法评分');
    }
    const registered = isRegistered(req.params.id, user.id);
    if (!registered) {
      return fail(res, '仅参与成员可评分', 403);
    }
    const { score, comment } = req.body;
    if (!score || score < 1 || score > 5) {
      return fail(res, '评分必须在1-5之间');
    }
    const rating = createRating({
      activityId: req.params.id,
      userId: user.id,
      userName: user.name,
      score,
      comment: comment || '',
    });
    success(res, rating, 201);
  } catch (err) {
    fail(res, err instanceof Error ? err.message : '提交评分失败', 500);
  }
});

app.get('/api/users/:id/groups', (req: Request, res: Response) => {
  try {
    const groups = getGroupsByUserId(req.params.id);
    success(res, groups);
  } catch (err) {
    fail(res, err instanceof Error ? err.message : '获取用户小组失败', 500);
  }
});

app.get('/api/users/:id/activities', (req: Request, res: Response) => {
  try {
    const activities = getActivitiesByUserId(req.params.id);
    success(res, activities);
  } catch (err) {
    fail(res, err instanceof Error ? err.message : '获取用户活动失败', 500);
  }
});

app.get('/api/users/:id/ratings', (req: Request, res: Response) => {
  try {
    const ratings = getRatingsByUserId(req.params.id);
    success(res, ratings);
  } catch (err) {
    fail(res, err instanceof Error ? err.message : '获取用户评分失败', 500);
  }
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server Error]', err);
  fail(res, err.message || '服务器内部错误', 500);
});

async function startServer() {
  try {
    await initDatabase();
    console.log('Database initialized successfully');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`API base: http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }
}

startServer();

export default app;
