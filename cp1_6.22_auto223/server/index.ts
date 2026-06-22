import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type {
  Activity, Participant, Comment, DashboardStats, CreateActivityRequest, RegisterRequest, CheckInRequest, CreateCommentRequest, LikeRequest, ActivityStatus, CheckInStatus
} from '../src/types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const delay = Math.random() * 500 + 300;
  setTimeout(next, delay);
});

interface MemoryStore {
  activities: Activity[];
  participants: Participant[];
  comments: Comment[];
}

const generateInviteCode = (name: string): string => {
  const prefix = name.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${suffix}`;
};

const getActivityStatus = (activityDate: string): ActivityStatus => {
  const now = new Date();
  const date = new Date(activityDate);
  const diffMs = date.getTime() - now.getTime();
  const diffHours = diffMs / 3600000;

  if (diffHours > 2) return 'upcoming';
  if (diffHours >= -2) return 'ongoing';
  return 'ended';
};

const initialStore: MemoryStore = {
  activities: [
    {
      id: '1',
      name: '《百年孤独》深度共读',
      date: '2026-07-15T19:00:00',
      location: '静思书店二楼阅读区',
      description: '一起探讨马尔克斯的魔幻现实主义世界，分享阅读感悟。活动将包含主题分享、段落朗读和自由讨论环节。',
      quota: 20,
      registrationDeadline: '2026-07-14T23:59:59',
      inviteCode: 'BNXD2026',
      status: 'upcoming',
      createdAt: '2026-06-20T10:00:00'
    },
    {
      id: '2',
      name: '悬疑推理之夜',
      date: '2026-06-25T18:30:00',
      location: '静思书店一楼咖啡区',
      description: '精选东野圭吾与阿加莎经典作品共读，解锁推理小说的叙事魅力。',
      quota: 15,
      registrationDeadline: '2026-06-24T18:00:00',
      inviteCode: 'XYTL6789',
      status: getActivityStatus('2026-06-25T18:30:00'),
      createdAt: '2026-06-15T14:00:00'
    },
    {
      id: '3',
      name: '古典诗词赏析会',
      date: '2026-06-10T15:00:00',
      location: '静思书店二楼阅读区',
      description: '唐宋诗词经典品读，感受古典文学之美。',
      quota: 25,
      registrationDeadline: '2026-06-09T23:59:59',
      inviteCode: 'GDSC1234',
      status: 'ended',
      createdAt: '2026-06-01T09:00:00'
    }
  ],
  participants: [
    {
      id: 'p1',
      activityId: '3',
      name: '张小明',
      email: 'zhang@example.com',
      checkInStatus: 'checked-in',
      qrCode: 'UkVBRElORy1DTFVCOjM6cDE6MTcxODAxOTI2NDIwNw==',
      registeredAt: '2026-06-08T10:00:00',
      checkedInAt: '2026-06-10T14:50:00'
    },
    {
      id: 'p2',
      activityId: '3',
      name: '李雨晴',
      email: 'li@example.com',
      checkInStatus: 'checked-in',
      qrCode: 'UkVBRElORy1DTFVCOjM6cDI6MTcxODAxOTI2NDIwOA==',
      registeredAt: '2026-06-07T15:30:00',
      checkedInAt: '2026-06-10T14:55:00'
    },
    {
      id: 'p3',
      activityId: '3',
      name: '王大伟',
      email: 'wang@example.com',
      checkInStatus: 'registered',
      qrCode: 'UkVBRElORy1DTFVCOjM6cDM6MTcxODAxOTI2NDIwOQ==',
      registeredAt: '2026-06-09T20:00:00'
    }
  ],
  comments: [
    {
      id: 'c1',
      activityId: '3',
      authorName: '张小明',
      content: '今天的诗词赏析会太棒了！老师对苏轼的讲解深入浅出，让我对《水调歌头》有了全新的理解。📚✨',
      likes: 5,
      likedBy: ['李雨晴', '王大伟'],
      createdAt: '2026-06-10T17:30:00'
    },
    {
      id: 'c2',
      activityId: '3',
      authorName: '李雨晴',
      content: '很喜欢这次活动的氛围，大家一起朗诵古诗词的感觉真好！希望以后多举办这样的活动。',
      likes: 3,
      likedBy: ['张小明'],
      createdAt: '2026-06-10T18:00:00'
    },
    {
      id: 'c3',
      activityId: '3',
      authorName: '王大伟',
      content: '@张小明 我也觉得！苏轼的词真的很有感染力，期待下次活动！',
      parentId: 'c1',
      likes: 2,
      likedBy: ['张小明'],
      createdAt: '2026-06-10T18:15:00'
    }
  ]
};

let store: MemoryStore = { ...initialStore };

app.get('/api/activities', (_req: Request, res: Response<Activity[]>) => {
  const activities = store.activities.map(activity => ({
    ...activity,
    status: getActivityStatus(activity.date)
  }));
  res.json(activities);
});

app.get('/api/activities/:id', (req: Request<{ id: string }>, res: Response<Activity>) => {
  const activity = store.activities.find(a => a.id === req.params.id);
  if (!activity) {
    res.status(404).json({ error: '活动不存在' } as any);
    return;
  }
  res.json({ ...activity, status: getActivityStatus(activity.date) });
});

app.post('/api/activities', (req: Request<{}, {}, CreateActivityRequest>, res: Response<Activity>) => {
  const { name, date, location, description, quota, registrationDeadline } = req.body;
  
  if (!name || !date || !location || !description || !quota || !registrationDeadline) {
    res.status(400).json({ error: '请填写完整信息' } as any);
    return;
  }

  const newActivity: Activity = {
    id: uuidv4(),
    name,
    date,
    location,
    description,
    quota,
    registrationDeadline,
    inviteCode: generateInviteCode(name),
    status: getActivityStatus(date),
    createdAt: new Date().toISOString()
  };

  store.activities.push(newActivity);
  res.status(201).json(newActivity);
});

app.post('/api/activities/register', (req: Request<{}, {}, RegisterRequest>, res: Response<Participant>) => {
  const { inviteCode, name, email } = req.body;

  if (!inviteCode || !name || !email) {
    res.status(400).json({ error: '请填写完整信息' } as any);
    return;
  }

  const activity = store.activities.find(a => a.inviteCode === inviteCode.toUpperCase());
  if (!activity) {
    res.status(404).json({ error: '邀请码无效' } as any);
    return;
  }

  if (!isRegistrationOpen(activity.registrationDeadline)) {
    res.status(400).json({ error: '报名已截止' } as any);
    return;
  }

  const currentParticipants = store.participants.filter(p => p.activityId === activity.id);
  if (currentParticipants.length >= activity.quota) {
    res.status(400).json({ error: '活动名额已满' } as any);
    return;
  }

  const existingParticipant = store.participants.find(
    p => p.activityId === activity.id && p.email === email
  );
  if (existingParticipant) {
    res.status(400).json({ error: '您已报名此活动' } as any);
    return;
  }

  const participantId = uuidv4();
  const newParticipant: Participant = {
    id: participantId,
    activityId: activity.id,
    name,
    email,
    checkInStatus: 'registered',
    qrCode: Buffer.from(`READING-CLUB:${activity.id}:${participantId}:${Date.now()}`).toString('base64'),
    registeredAt: new Date().toISOString()
  };

  store.participants.push(newParticipant);
  res.status(201).json(newParticipant);
});

app.post('/api/activities/:id/checkin', (req: Request<{ id: string }, {}, CheckInRequest>, res: Response<{ success: boolean; participant: Participant }>) => {
  const { participantId } = req.body;
  const participant = store.participants.find(p => p.id === participantId && p.activityId === req.params.id);

  if (!participant) {
    res.status(404).json({ error: '参与者不存在' } as any);
    return;
  }

  if (participant.checkInStatus === 'checked-in') {
    res.status(400).json({ error: '已签到' } as any);
    return;
  }

  participant.checkInStatus = 'checked-in';
  participant.checkedInAt = new Date().toISOString();
  res.json({ success: true, participant });
});

app.get('/api/activities/:id/participants', (req: Request<{ id: string }>, res: Response<Participant[]>) => {
  const participants = store.participants.filter(p => p.activityId === req.params.id);
  res.json(participants);
});

app.get('/api/activities/:id/comments', (req: Request<{ id: string }>, res: Response<Comment[]>) => {
  const activity = store.activities.find(a => a.id === req.params.id);
  if (!activity) {
    res.status(404).json({ error: '活动不存在' } as any);
    return;
  }

  if (getActivityStatus(activity.date) !== 'ended') {
    res.status(400).json({ error: '活动尚未结束，讨论区暂未开放' } as any);
    return;
  }

  const comments = store.comments
    .filter(c => c.activityId === req.params.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(comments);
});

app.post('/api/activities/:id/comments', (req: Request<{ id: string }, {}, CreateCommentRequest>, res: Response<Comment>) => {
  const { authorName, content, parentId } = req.body;
  const activity = store.activities.find(a => a.id === req.params.id);

  if (!activity) {
    res.status(404).json({ error: '活动不存在' } as any);
    return;
  }

  if (getActivityStatus(activity.date) !== 'ended') {
    res.status(400).json({ error: '活动尚未结束，讨论区暂未开放' } as any);
    return;
  }

  if (!authorName || !content) {
    res.status(400).json({ error: '请填写完整信息' } as any);
    return;
  }

  if (content.length > 2000) {
    res.status(400).json({ error: '评论内容不能超过2000字' } as any);
    return;
  }

  if (parentId) {
    const parentComment = store.comments.find(c => c.id === parentId);
    if (!parentComment) {
      res.status(404).json({ error: '回复的评论不存在' } as any);
      return;
    }
  }

  const newComment: Comment = {
    id: uuidv4(),
    activityId: req.params.id,
    authorName,
    content,
    parentId,
    likes: 0,
    likedBy: [],
    createdAt: new Date().toISOString()
  };

  store.comments.push(newComment);
  res.status(201).json(newComment);
});

app.post('/api/comments/:id/like', (req: Request<{ id: string }, {}, LikeRequest>, res: Response<{ likes: number; liked: boolean }>) => {
  const { userName } = req.body;
  const comment = store.comments.find(c => c.id === req.params.id);

  if (!comment) {
    res.status(404).json({ error: '评论不存在' } as any);
    return;
  }

  if (!userName) {
    res.status(400).json({ error: '请提供用户名' } as any);
    return;
  }

  const likedIndex = comment.likedBy.indexOf(userName);
  let liked: boolean;

  if (likedIndex > -1) {
    comment.likedBy.splice(likedIndex, 1);
    comment.likes--;
    liked = false;
  } else {
    comment.likedBy.push(userName);
    comment.likes++;
    liked = true;
  }

  res.json({ likes: comment.likes, liked });
});

app.get('/api/stats/dashboard', (_req: Request, res: Response<DashboardStats>) => {
  const totalActivities = store.activities.length;
  const totalRegistrations = store.participants.length;
  
  const checkedInCount = store.participants.filter(p => p.checkInStatus === 'checked-in').length;
  const averageCheckInRate = totalRegistrations > 0 ? Math.round(checkedInCount / totalRegistrations * 100) : 0;

  const monthlyData = generateMonthlyData();

  res.json({
    totalActivities,
    totalRegistrations,
    averageCheckInRate,
    monthlyData
  });
});

const generateMonthlyData = () => {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月'];
  const data = months.map(month => ({
    month,
    participants: Math.floor(Math.random() * 30) + 10,
    checkInRate: Math.floor(Math.random() * 30) + 60
  }));
  
  const endedActivities = store.activities.filter(a => a.status === 'ended' || getActivityStatus(a.date) === 'ended');
  if (endedActivities.length > 0) {
    data[data.length - 1].participants = store.participants.filter(p => {
      const activity = store.activities.find(a => a.id === p.activityId);
      return activity && (activity.status === 'ended' || getActivityStatus(activity.date) === 'ended');
    }).length;
    const lastMonthParticipants = store.participants.filter(p => p.checkInStatus === 'checked-in').length;
    data[data.length - 1].checkInRate = data[data.length - 1].participants > 0 
      ? Math.round(lastMonthParticipants / data[data.length - 1].participants * 100)
      : 0;
  }
  
  return data;
};

const isRegistrationOpen = (deadline: string): boolean => {
  return new Date() < new Date(deadline);
};

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
