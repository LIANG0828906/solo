import { v4 as uuidv4 } from 'uuid';
import type { Activity, User, Comment, CheckInRecord, ActivityFormData, RegisterFormData } from '../src/types/index.js';
import { calculateSignInPoints, calculateCommentPoints } from '../src/services/pointsService.js';

const generateAvatarUrl = (seed: string) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(`portrait of person ${seed}, avatar style`)}&image_size=square`;

const generateActivityImage = (seed: string) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(`community event ${seed}, vibrant, colorful`)}&image_size=landscape_16_9`;

const now = new Date();

const initialUsers: User[] = Array.from({ length: 20 }, (_, i) => ({
  id: uuidv4(),
  nickname: `居民${i + 1}`,
  avatar: generateAvatarUrl(`user${i + 1}`),
  totalPoints: Math.floor(Math.random() * 500) + 50,
  activitiesParticipated: Math.floor(Math.random() * 15) + 1,
  registeredAt: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
}));

const initialActivities: Activity[] = [
  {
    id: uuidv4(),
    title: '社区春季运动会',
    coverImage: generateActivityImage('spring-sports'),
    description: '一年一度的社区春季运动会，包含田径、球类、趣味游戏等多个项目，欢迎所有居民踊跃参与！',
    location: '社区体育馆',
    startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(),
    maxParticipants: 100,
    registeredUsers: initialUsers.slice(0, 45).map(u => u.id),
    checkedInUsers: [],
    pointsReward: 50,
    photos: [generateActivityImage('sports1'), generateActivityImage('sports2'), generateActivityImage('sports3')],
    status: 'upcoming',
    createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuidv4(),
    title: '老年书画展览',
    coverImage: generateActivityImage('art-exhibition'),
    description: '展示社区老年居民的书画作品，传承中华传统文化，丰富精神文化生活。',
    location: '社区文化中心',
    startTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    maxParticipants: 50,
    registeredUsers: initialUsers.slice(0, 28).map(u => u.id),
    checkedInUsers: initialUsers.slice(0, 20).map(u => ({ userId: u.id, time: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString() })),
    pointsReward: 30,
    photos: [generateActivityImage('art1'), generateActivityImage('art2')],
    status: 'ongoing',
    createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuidv4(),
    title: '亲子DIY手工坊',
    coverImage: generateActivityImage('diy-workshop'),
    description: '周末亲子活动，家长和孩子一起制作手工，增进亲子感情，培养动手能力。',
    location: '社区活动中心',
    startTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    maxParticipants: 30,
    registeredUsers: initialUsers.slice(0, 15).map(u => u.id),
    checkedInUsers: [],
    pointsReward: 25,
    photos: [generateActivityImage('diy1'), generateActivityImage('diy2'), generateActivityImage('diy3'), generateActivityImage('diy4')],
    status: 'upcoming',
    createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuidv4(),
    title: '健康知识讲座',
    coverImage: generateActivityImage('health-lecture'),
    description: '邀请三甲医院专家主讲春季养生保健知识，现场免费测量血压血糖。',
    location: '社区会议室',
    startTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    maxParticipants: 80,
    registeredUsers: initialUsers.slice(0, 60).map(u => u.id),
    checkedInUsers: initialUsers.slice(0, 55).map(u => ({ userId: u.id, time: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString() })),
    pointsReward: 20,
    photos: [generateActivityImage('health1'), generateActivityImage('health2')],
    status: 'ended',
    createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuidv4(),
    title: '社区环保志愿行',
    coverImage: generateActivityImage('environment-volunteer'),
    description: '组织居民清理社区公共区域垃圾，宣传环保知识，共建美丽家园。',
    location: '社区公园',
    startTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    maxParticipants: 50,
    registeredUsers: initialUsers.slice(0, 22).map(u => u.id),
    checkedInUsers: [],
    pointsReward: 40,
    photos: [generateActivityImage('env1'), generateActivityImage('env2'), generateActivityImage('env3')],
    status: 'upcoming',
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuidv4(),
    title: '元宵节猜灯谜',
    coverImage: generateActivityImage('lantern-festival'),
    description: '传统节日活动，猜灯谜、吃元宵、赏灯展，欢度元宵佳节。',
    location: '社区广场',
    startTime: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
    maxParticipants: 200,
    registeredUsers: initialUsers.map(u => u.id),
    checkedInUsers: initialUsers.slice(0, 18).map(u => ({ userId: u.id, time: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString() })),
    pointsReward: 35,
    photos: [generateActivityImage('lantern1'), generateActivityImage('lantern2')],
    status: 'ended',
    createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuidv4(),
    title: '青少年编程体验课',
    coverImage: generateActivityImage('coding-class'),
    description: '免费编程入门体验课程，激发青少年对计算机科学的兴趣。',
    location: '社区电子阅览室',
    startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    maxParticipants: 20,
    registeredUsers: initialUsers.slice(0, 18).map(u => u.id),
    checkedInUsers: [],
    pointsReward: 30,
    photos: [generateActivityImage('code1'), generateActivityImage('code2'), generateActivityImage('code3')],
    status: 'upcoming',
    createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuidv4(),
    title: '社区广场舞比赛',
    coverImage: generateActivityImage('dance-competition'),
    description: '各小区广场舞代表队同场竞技，展示居民风采，丰富文化生活。',
    location: '社区文化广场',
    startTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    maxParticipants: 120,
    registeredUsers: initialUsers.slice(0, 80).map(u => u.id),
    checkedInUsers: initialUsers.slice(0, 75).map(u => ({ userId: u.id, time: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString() })),
    pointsReward: 45,
    photos: [generateActivityImage('dance1'), generateActivityImage('dance2')],
    status: 'ended',
    createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuidv4(),
    title: '读书分享会',
    coverImage: generateActivityImage('book-club'),
    description: '每月一次的读书分享活动，交流阅读心得，以书会友。',
    location: '社区图书馆',
    startTime: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    maxParticipants: 25,
    registeredUsers: initialUsers.slice(0, 12).map(u => u.id),
    checkedInUsers: [],
    pointsReward: 20,
    photos: [generateActivityImage('book1'), generateActivityImage('book2')],
    status: 'upcoming',
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuidv4(),
    title: '消防演练活动',
    coverImage: generateActivityImage('fire-drill'),
    description: '联合辖区消防队开展消防演练，学习灭火器使用和火场逃生知识。',
    location: '社区停车场',
    startTime: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    maxParticipants: 150,
    registeredUsers: initialUsers.slice(0, 100).map(u => u.id),
    checkedInUsers: initialUsers.slice(0, 95).map(u => ({ userId: u.id, time: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString() })),
    pointsReward: 25,
    photos: [generateActivityImage('fire1'), generateActivityImage('fire2')],
    status: 'ended',
    createdAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const initialComments: Comment[] = [];
const activities = initialActivities;
const users = initialUsers;
const comments: Comment[] = initialComments;
const checkInRecords: CheckInRecord[] = [];

initialActivities.forEach(activity => {
  const commentCount = Math.floor(Math.random() * 15) + 5;
  for (let i = 0; i < commentCount; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const likeCount = Math.floor(Math.random() * 20);
    const likedBy = Array.from({ length: likeCount }, () => users[Math.floor(Math.random() * users.length)].id);
    comments.push({
      id: uuidv4(),
      activityId: activity.id,
      userId: randomUser.id,
      content: getRandomComment(),
      likes: likeCount,
      likedBy: [...new Set(likedBy)],
      createdAt: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }
});

function getRandomComment(): string {
  const comments = [
    '活动很精彩，期待下次参加！',
    '组织得非常好，工作人员辛苦了！',
    '认识了很多邻居，很开心！',
    '希望社区多组织这样的活动。',
    '孩子们玩得特别开心！',
    '学到了很多知识，受益匪浅。',
    '活动内容丰富，形式多样。',
    '给社区点赞！👍',
    '场地布置得很漂亮，很有氛围。',
    '活动时间安排得很合理。',
    '建议下次活动时间可以长一些。',
    '第一次参加社区活动，体验很棒！',
    '希望能增加更多适合老年人的活动。',
    '活动奖品很实用，谢谢社区！',
    '志愿者服务很周到，点赞！',
  ];
  return comments[Math.floor(Math.random() * comments.length)];
}

export const data = {
  activities,
  users,
  comments,
  checkInRecords,
};

export const dataMethods = {
  getActivities: (status?: string): Activity[] => {
    if (status && status !== 'all') {
      return data.activities.filter(a => a.status === status).sort((a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
    }
    return [...data.activities].sort((a, b) =>
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  },

  getActivityById: (id: string): Activity | undefined => {
    return data.activities.find(a => a.id === id);
  },

  createActivity: (activityData: ActivityFormData): Activity => {
    const now = new Date();
    const startTime = new Date(activityData.startTime);
    const endTime = new Date(activityData.endTime);
    let status: 'upcoming' | 'ongoing' | 'ended' = 'upcoming';
    if (now > endTime) status = 'ended';
    else if (now >= startTime && now <= endTime) status = 'ongoing';

    const newActivity: Activity = {
      id: uuidv4(),
      ...activityData,
      registeredUsers: [],
      checkedInUsers: [],
      photos: [activityData.coverImage],
      status,
      createdAt: now.toISOString(),
    };
    data.activities.unshift(newActivity);
    return newActivity;
  },

  registerActivity: (activityId: string, userId: string): { success: boolean; message: string } => {
    const activity = data.activities.find(a => a.id === activityId);
    if (!activity) {
      return { success: false, message: '活动不存在' };
    }
    if (activity.registeredUsers.includes(userId)) {
      return { success: false, message: '您已经报名了该活动' };
    }
    if (activity.registeredUsers.length >= activity.maxParticipants) {
      return { success: false, message: '活动名额已满' };
    }
    if (activity.status === 'ended') {
      return { success: false, message: '活动已结束' };
    }
    activity.registeredUsers.push(userId);
    const user = data.users.find(u => u.id === userId);
    if (user) {
      user.activitiesParticipated += 1;
    }
    return { success: true, message: '报名成功' };
  },

  checkIn: (activityId: string, userId: string): { success: boolean; points: number } => {
    const activity = data.activities.find(a => a.id === activityId);
    if (!activity) {
      return { success: false, points: 0 };
    }
    if (!activity.registeredUsers.includes(userId)) {
      return { success: false, points: 0 };
    }
    if (activity.checkedInUsers.some(c => c.userId === userId)) {
      return { success: false, points: 0 };
    }
    if (activity.status === 'ended') {
      return { success: false, points: 0 };
    }
    const now = new Date();
    activity.checkedInUsers.push({ userId, time: now.toISOString() });

    const points = calculateSignInPoints();
    const user = data.users.find(u => u.id === userId);
    if (user) {
      user.totalPoints += points;
    }

    const record: CheckInRecord = {
      id: uuidv4(),
      activityId,
      userId,
      time: now.toISOString(),
      pointsEarned: points,
    };
    data.checkInRecords.push(record);

    return { success: true, points };
  },

  getLeaderboard: (limit?: number): User[] => {
    const sorted = [...data.users].sort((a, b) => b.totalPoints - a.totalPoints);
    return limit ? sorted.slice(0, limit) : sorted;
  },

  registerUser: (userData: RegisterFormData): User => {
    const newUser: User = {
      id: uuidv4(),
      ...userData,
      totalPoints: 0,
      activitiesParticipated: 0,
      registeredAt: new Date().toISOString(),
    };
    data.users.push(newUser);
    return newUser;
  },

  getUserById: (id: string): User | undefined => {
    return data.users.find(u => u.id === id);
  },

  getUsersByIds: (userIds: string[]): User[] => {
    return data.users.filter(u => userIds.includes(u.id));
  },

  getComments: (activityId: string, page: number = 1, pageSize: number = 10): { comments: Comment[]; total: number } => {
    const activityComments = data.comments
      .filter(c => c.activityId === activityId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = activityComments.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      comments: activityComments.slice(start, end),
      total,
    };
  },

  createComment: (activityId: string, userId: string, content: string): Comment => {
    const newComment: Comment = {
      id: uuidv4(),
      activityId,
      userId,
      content,
      likes: 0,
      likedBy: [],
      createdAt: new Date().toISOString(),
    };
    data.comments.unshift(newComment);

    const points = calculateCommentPoints();
    const user = data.users.find(u => u.id === userId);
    if (user) {
      user.totalPoints += points;
    }

    return newComment;
  },

  likeComment: (commentId: string, userId: string): { likes: number } => {
    const comment = data.comments.find(c => c.id === commentId);
    if (!comment) {
      return { likes: 0 };
    }
    const index = comment.likedBy.indexOf(userId);
    if (index > -1) {
      comment.likedBy.splice(index, 1);
      comment.likes -= 1;
    } else {
      comment.likedBy.push(userId);
      comment.likes += 1;
    }
    return { likes: comment.likes };
  },
};
