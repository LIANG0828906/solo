import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
}

interface Activity {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
  participants: string[];
  category: string;
  organizer: string;
}

interface User {
  id: string;
  name: string;
}

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const currentUser: User = {
  id: 'user-001',
  name: '张小明'
};

const announcementColors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
];

const users: User[] = [
  { id: 'user-001', name: '张小明' },
  { id: 'user-002', name: '李华' },
  { id: 'user-003', name: '王芳' },
  { id: 'user-004', name: '刘强' },
  { id: 'user-005', name: '陈静' },
  { id: 'user-006', name: '赵伟' },
  { id: 'user-007', name: '孙丽' },
  { id: 'user-008', name: '周杰' },
];

const generateMockAnnouncements = (): Announcement[] => {
  const titles = [
    '社区春季运动会开始报名',
    '小区停车位调整通知',
    '业主委员会选举公告',
    '垃圾分类知识讲座',
    '社区图书馆开放时间调整',
    '端午节包粽子活动',
    '小区消防演练通知',
    '儿童绘画比赛征集作品',
    '老年人健康体检安排',
    '社区志愿者招募',
    '宠物文明饲养倡议',
    '暑期青少年夏令营',
    '楼道清洁行动招募',
    '中秋晚会节目征集',
    '小区绿化改造意见征集',
    '冬季供暖准备通知',
    '社区英语角活动',
    '垃圾分类积分兑换',
    '邻里互助平台上线',
    '年度社区总结大会'
  ];

  const contents = [
    '为丰富社区居民的文化生活，提高居民身体素质，社区将于本月底举办春季运动会。比赛项目包括田径、球类、趣味运动等，欢迎广大居民积极报名参与。',
    '为优化小区停车秩序，物业管理处决定对现有停车位进行重新规划分配。请各位业主于本周内到物业处登记车辆信息，逾期未登记将视为自动放弃固定停车位。',
    '根据《业主大会和业主委员会指导规则》，本小区将于下月举行业主委员会换届选举。现将候选人名单及选举流程予以公示，请各位业主积极行使民主权利。',
    '为进一步推进垃圾分类工作，社区邀请环保专家举办垃圾分类知识讲座，现场将有互动问答和礼品赠送，欢迎居民朋友参加。',
    '因管理人员调整，社区图书馆开放时间自下月起调整为：周一至周五 9:00-18:00，周末 10:00-16:00，节假日闭馆。请读者相互转告。',
    '端午节即将来临，社区将举办"浓浓粽香情"包粽子活动，现场提供材料和指导，完成的粽子可带回家。名额有限，先到先得。',
    '为提高居民消防安全意识，小区定于本周末进行消防演练，届时将有消防人员现场指导灭火器材使用和逃生技巧。请各位居民配合，不要恐慌。',
    '以"美丽家园"为主题的儿童绘画比赛开始征集作品，参赛年龄5-12岁，获奖作品将在社区文化墙展示。报名截止日期：本月底。',
    '社区卫生服务中心将为65岁以上老年人提供免费健康体检，包括血压、血糖、心电图等项目。请符合条件的老年人携带身份证按时参加。',
    '社区志愿者服务队正在招募新成员，服务内容包括关爱老人、环境维护、文化活动等。欢迎有爱心、有时间的居民加入我们。'
  ];

  return titles.map((title, index) => ({
    id: uuidv4(),
    title,
    content: contents[index % contents.length],
    author: users[Math.floor(Math.random() * users.length)].name,
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
  }));
};

const generateMockActivities = (): Activity[] => {
  const categories = ['艺术', '体育', '技术', '社交', '其他'];
  const activities = [
    { title: '社区油画兴趣班', description: '零基础油画入门课程，每周六下午2小时，提供所有画材。', category: '艺术', location: '社区文化站201室', capacity: 15 },
    { title: '周末篮球友谊赛', description: '每周日上午篮球友谊赛，欢迎各年龄段篮球爱好者参加，水平不限。', category: '体育', location: '社区篮球场', capacity: 20 },
    { title: 'Python编程入门课', description: '免费Python编程入门课程，适合零基础，每周三晚上课。', category: '技术', location: '社区电子阅览室', capacity: 12 },
    { title: '邻里茶话会', description: '每月最后一个周五下午，品茶聊天，分享生活趣事，增进邻里感情。', category: '社交', location: '社区活动室', capacity: 30 },
    { title: '书法培训班', description: '由专业书法老师授课，学习楷书、行书 basics，自备笔墨纸砚。', category: '艺术', location: '社区文化站202室', capacity: 10 },
    { title: '瑜伽晨练班', description: '每天早晨7:00-8:00户外瑜伽，适合各年龄段，提供瑜伽垫。', category: '体育', location: '社区小广场', capacity: 25 },
    { title: '手机摄影技巧分享', description: '学习手机摄影构图、光线运用、后期修图技巧，带上你的手机来参加。', category: '技术', location: '社区会议室', capacity: 20 },
    { title: '亲子手工坊', description: '每周六上午亲子手工活动，培养孩子动手能力，增进亲子关系。', category: '社交', location: '社区儿童活动中心', capacity: 15 },
    { title: '围棋入门班', description: '围棋基础知识和技巧学习，适合儿童和成人，每周二、四晚上课。', category: '其他', location: '社区棋牌室', capacity: 8 },
    { title: '合唱队招募', description: '社区合唱队正在招募新成员，热爱唱歌的朋友欢迎加入，每周一晚排练。', category: '艺术', location: '社区音乐室', capacity: 30 },
    { title: '乒乓球联赛', description: '社区乒乓球联赛开始报名，分青年组和中老年组，奖品丰厚。', category: '体育', location: '社区乒乓球室', capacity: 32 },
    { title: '智能家居体验日', description: '体验最新智能家居产品，了解如何让生活更便捷、更节能。', category: '技术', location: '社区展示厅', capacity: 40 },
    { title: '读书分享会', description: '每月第一个周六下午，分享当月读书心得，推荐好书，以书会友。', category: '社交', location: '社区图书馆', capacity: 15 },
    { title: '花卉栽培讲座', description: '学习家庭花卉栽培技巧，常见病虫害防治，现场发放花种。', category: '其他', location: '社区温室', capacity: 20 },
    { title: '舞蹈培训班', description: '学习广场舞、民族舞、爵士舞等多种舞蹈风格，强身健体，愉悦身心。', category: '艺术', location: '社区舞蹈室', capacity: 20 }
  ];

  const startDate = new Date();
  return activities.map((activity, index) => {
    const activityDate = new Date(startDate.getTime() + (index + 1) * 2 * 24 * 60 * 60 * 1000);
    const hours = 14 + (index % 4);
    activityDate.setHours(hours, 0, 0, 0);
    
    const participantCount = Math.floor(Math.random() * (activity.capacity * 0.7));
    const participants: string[] = [];
    for (let i = 0; i < participantCount; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      if (!participants.includes(user.id)) {
        participants.push(user.id);
      }
    }

    return {
      id: uuidv4(),
      title: activity.title,
      description: activity.description,
      date: activityDate.toISOString(),
      location: activity.location,
      capacity: activity.capacity,
      participants,
      category: activity.category,
      organizer: users[Math.floor(Math.random() * users.length)].name
    };
  });
};

let announcements: Announcement[] = generateMockAnnouncements();
let activities: Activity[] = generateMockActivities();

app.get('/api/announcements', (_req: Request, res: Response) => {
  const sorted = [...announcements].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json(sorted);
});

app.post('/api/announcements', (req: Request, res: Response) => {
  const { title, content } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: '标题和内容不能为空' });
  }
  
  if (title.length > 60) {
    return res.status(400).json({ error: '标题不能超过60字' });
  }
  
  if (content.length > 500) {
    return res.status(400).json({ error: '内容不能超过500字' });
  }

  const newAnnouncement: Announcement = {
    id: uuidv4(),
    title,
    content,
    author: currentUser.name,
    createdAt: new Date().toISOString()
  };

  announcements.unshift(newAnnouncement);
  res.status(201).json(newAnnouncement);
});

app.get('/api/activities', (req: Request, res: Response) => {
  const { category } = req.query;
  let filtered = [...activities];
  
  if (category && category !== '全部') {
    filtered = filtered.filter(a => a.category === category);
  }
  
  filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  res.json(filtered);
});

app.post('/api/activities', (req: Request, res: Response) => {
  const { title, description, date, location, capacity, category } = req.body;
  
  if (!title || !description || !date || !location || !capacity || !category) {
    return res.status(400).json({ error: '缺少必填字段' });
  }

  const newActivity: Activity = {
    id: uuidv4(),
    title,
    description,
    date,
    location,
    capacity,
    participants: [],
    category,
    organizer: currentUser.name
  };

  activities.push(newActivity);
  res.status(201).json(newActivity);
});

app.post('/api/activities/join', (req: Request, res: Response) => {
  const { activityId, userId } = req.body;
  
  if (!activityId || !userId) {
    return res.status(400).json({ error: '缺少活动ID或用户ID' });
  }

  const activity = activities.find(a => a.id === activityId);
  
  if (!activity) {
    return res.status(404).json({ error: '活动不存在' });
  }

  if (activity.participants.length >= activity.capacity) {
    return res.status(400).json({ error: '活动名额已满' });
  }

  if (activity.participants.includes(userId)) {
    return res.status(400).json({ error: '已加入该活动' });
  }

  activity.participants.push(userId);
  res.json(activity);
});

app.post('/api/activities/leave', (req: Request, res: Response) => {
  const { activityId, userId } = req.body;
  
  if (!activityId || !userId) {
    return res.status(400).json({ error: '缺少活动ID或用户ID' });
  }

  const activity = activities.find(a => a.id === activityId);
  
  if (!activity) {
    return res.status(404).json({ error: '活动不存在' });
  }

  const index = activity.participants.indexOf(userId);
  if (index === -1) {
    return res.status(400).json({ error: '未加入该活动' });
  }

  activity.participants.splice(index, 1);
  res.json(activity);
});

app.get('/api/users', (_req: Request, res: Response) => {
  res.json(users);
});

app.get('/api/user/current', (_req: Request, res: Response) => {
  res.json(currentUser);
});

app.get('/api/server-time', (_req: Request, res: Response) => {
  res.json({ serverTime: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`CommunityCanvas API server running on port ${PORT}`);
  console.log(`Announcements: ${announcements.length} mock items`);
  console.log(`Activities: ${activities.length} mock items`);
});

export { announcementColors };
