import { v4 as uuidv4 } from 'uuid';

const currentUserId = 'user-001';

const todayStr = () => new Date().toISOString().split('T')[0];

export const users = {
  [currentUserId]: {
    id: currentUserId,
    nickname: '咖啡爱好者',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=coffee',
    points: 50,
    completedTasks: [],
    lastResetDate: todayStr(),
  },
  'user-002': {
    id: 'user-002',
    nickname: '社区达人',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=star',
    points: 280,
    completedTasks: [],
    lastResetDate: todayStr(),
  },
  'user-003': {
    id: 'user-003',
    nickname: '拿铁控',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=latte',
    points: 195,
    completedTasks: [],
    lastResetDate: todayStr(),
  },
  'user-004': {
    id: 'user-004',
    nickname: '摩卡王子',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mocha',
    points: 150,
    completedTasks: [],
    lastResetDate: todayStr(),
  },
  'user-005': {
    id: 'user-005',
    nickname: '冷萃达人',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cold',
    points: 320,
    completedTasks: [],
    lastResetDate: todayStr(),
  },
  'user-006': {
    id: 'user-006',
    nickname: '美式先生',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=americano',
    points: 88,
    completedTasks: [],
    lastResetDate: todayStr(),
  },
  'user-007': {
    id: 'user-007',
    nickname: '特调少女',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=special',
    points: 210,
    completedTasks: [],
    lastResetDate: todayStr(),
  },
  'user-008': {
    id: 'user-008',
    nickname: '咖啡品鉴师',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=taster',
    points: 175,
    completedTasks: [],
    lastResetDate: todayStr(),
  },
  'user-009': {
    id: 'user-009',
    nickname: '深夜咖啡',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=night',
    points: 245,
    completedTasks: [],
    lastResetDate: todayStr(),
  },
  'user-010': {
    id: 'user-010',
    nickname: '咖啡因依赖者',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=addict',
    points: 130,
    completedTasks: [],
    lastResetDate: todayStr(),
  },
  'user-011': {
    id: 'user-011',
    nickname: '新手小白',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=newbie',
    points: 45,
    completedTasks: [],
    lastResetDate: todayStr(),
  },
  'user-012': {
    id: 'user-012',
    nickname: '社区长老',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=elder',
    points: 310,
    completedTasks: [],
    lastResetDate: todayStr(),
  },
};

export const tasks = [
  {
    id: 'task-001',
    name: '每日签到',
    icon: 'CalendarOutlined',
    points: 1,
    description: '每日登录签到，领取每日奖励',
  },
  {
    id: 'task-002',
    name: '发表主题帖',
    icon: 'EditOutlined',
    points: 5,
    description: '发布一篇高质量主题帖，与社区分享',
  },
  {
    id: 'task-003',
    name: '评论10条',
    icon: 'MessageOutlined',
    points: 3,
    description: '在社区中评论10条帖子',
  },
  {
    id: 'task-004',
    name: '分享链接',
    icon: 'ShareAltOutlined',
    points: 2,
    description: '分享社区链接到社交平台',
  },
];

export const coffees = [
  {
    id: 'coffee-001',
    name: '经典美式',
    brand: 'StarBrew联名',
    flavor: '醇厚苦味',
    requiredPoints: 10,
    stock: 50,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=classic%20americano%20coffee%20in%20cafe%20background&image_size=square',
  },
  {
    id: 'coffee-002',
    name: '香浓拿铁',
    brand: 'BeanThere联名',
    flavor: '丝滑奶香',
    requiredPoints: 15,
    stock: 50,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=latte%20coffee%20with%20heart%20latte%20art&image_size=square',
  },
  {
    id: 'coffee-003',
    name: '浓郁摩卡',
    brand: 'CafeMoka联名',
    flavor: '巧克力甜香',
    requiredPoints: 20,
    stock: 50,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mocha%20coffee%20with%20chocolate%20drizzle&image_size=square',
  },
  {
    id: 'coffee-004',
    name: '冰爽冷萃',
    brand: 'ColdDrop联名',
    flavor: '清爽甘冽',
    requiredPoints: 25,
    stock: 50,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cold%20brew%20coffee%20iced%20in%20glass&image_size=square',
  },
  {
    id: 'coffee-005',
    name: '限定特调',
    brand: 'SecretBlend联名',
    flavor: '神秘风味',
    requiredPoints: 30,
    stock: 50,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=special%20signature%20coffee%20latte%20art%20premium&image_size=square',
  },
];

export const exchangeRecords = [];

export const taskCompletionHistory = [];

function getCurrentUser() {
  return users[currentUserId];
}

function checkAndResetTasks(user) {
  const today = todayStr();
  if (user.lastResetDate !== today) {
    user.completedTasks = [];
    user.lastResetDate = today;
  }
  return user;
}

export function getUser() {
  const user = getCurrentUser();
  return checkAndResetTasks(user);
}

export function getTasks() {
  return tasks;
}

export function completeTask(taskId) {
  const user = getCurrentUser();
  checkAndResetTasks(user);
  
  if (user.completedTasks.includes(taskId)) {
    return { success: false, message: '该任务今日已完成', points: user.points };
  }
  
  const task = tasks.find(t => t.id === taskId);
  if (!task) {
    return { success: false, message: '任务不存在', points: user.points };
  }
  
  user.points += task.points;
  user.completedTasks.push(taskId);
  
  taskCompletionHistory.push({
    id: uuidv4(),
    userId: user.id,
    taskId,
    completedAt: new Date().toISOString(),
  });
  
  return { success: true, message: `获得 ${task.points} 积分`, points: user.points, taskName: task.name };
}

export function getCoffees() {
  return coffees;
}

export function exchangeCoffee(coffeeId) {
  const user = getCurrentUser();
  const coffee = coffees.find(c => c.id === coffeeId);
  
  if (!coffee) {
    return { success: false, message: '咖啡券不存在' };
  }
  
  if (user.points < coffee.requiredPoints) {
    return { success: false, message: '积分不足' };
  }
  
  if (coffee.stock <= 0) {
    return { success: false, message: '库存不足' };
  }
  
  user.points -= coffee.requiredPoints;
  coffee.stock -= 1;
  
  const record = {
    id: uuidv4(),
    userId: user.id,
    coffeeId,
    coffeeName: coffee.name,
    pointsSpent: coffee.requiredPoints,
    exchangedAt: new Date().toISOString(),
  };
  exchangeRecords.push(record);
  
  return { success: true, message: '兑换成功', remainingStock: coffee.stock, record };
}

function filterRecordsByTime(records, timeRange) {
  const now = new Date();
  let startTime;
  
  switch (timeRange) {
    case 'week':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      return records;
  }
  
  return records.filter(r => new Date(r.completedAt) >= startTime);
}

export function getRank(timeRange = 'all') {
  const filteredHistory = filterRecordsByTime(taskCompletionHistory, timeRange);
  
  const userPoints = {};
  
  Object.values(users).forEach(user => {
    userPoints[user.id] = {
      userId: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      points: 0,
    };
  });
  
  filteredHistory.forEach(record => {
    const task = tasks.find(t => t.id === record.taskId);
    if (task && userPoints[record.userId]) {
      userPoints[record.userId].points += task.points;
    }
  });
  
  const rankList = Object.values(userPoints)
    .sort((a, b) => b.points - a.points)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  
  const currentUserRank = rankList.findIndex(r => r.userId === currentUserId) + 1;
  
  return {
    rankList: rankList.slice(0, 10),
    currentUserRank,
    currentUserPoints: userPoints[currentUserId]?.points || 0,
  };
}

export function getExchangeRecords(page = 1, pageSize = 10) {
  const userRecords = exchangeRecords
    .filter(r => r.userId === currentUserId)
    .sort((a, b) => new Date(b.exchangedAt) - new Date(a.exchangedAt);
  
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  return {
    list: userRecords.slice(start, end),
    total: userRecords.length,
    page,
    pageSize,
  };
}
