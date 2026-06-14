import { v4 as uuidv4 } from 'uuid';
import type { User, TableRequest, ChatMessage, Participant } from './types';

const avatarEmojis = ['🍜', '🥟', '🍱', '🍲', '🍛', '🥗', '🍕', '🍔', '🍣', '🍤'];

const communities = [
  '阳光花园小区',
  '翠湖天地A栋',
  '金色家园3号楼',
  '银河大厦',
  '幸福里社区',
  '滨江壹号院',
  '学府公寓',
];

const foodImages = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=800&q=80',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80',
];

export function getAvatarEmoji(index: number): string {
  return avatarEmojis[index % avatarEmojis.length];
}

export function getAllCommunities(): string[] {
  return communities;
}

export function getRandomFoodImage(): string {
  return foodImages[Math.floor(Math.random() * foodImages.length)];
}

function createUser(partial: Partial<User> & { nickname: string; community: string }): User {
  const id = partial.id || uuidv4();
  const avatarIndex = partial.avatar ? parseInt(partial.avatar) : Math.floor(Math.random() * avatarEmojis.length);
  return {
    id,
    nickname: partial.nickname,
    avatar: partial.avatar || avatarEmojis[avatarIndex],
    community: partial.community,
    taste: partial.taste || {
      spicyLevel: 2,
      eatCilantro: true,
      isVegetarian: false,
    },
    bio: partial.bio || '很高兴认识大家！',
  };
}

export const mockUsers: User[] = [
  createUser({
    id: 'user-1',
    nickname: '小林爱吃面',
    community: '阳光花园小区',
    avatar: '🍜',
    taste: { spicyLevel: 3, eatCilantro: true, isVegetarian: false },
    bio: '程序员，喜欢做家常菜，尤其擅长面食',
  }),
  createUser({
    id: 'user-2',
    nickname: '鱼鱼阿姨',
    community: '阳光花园小区',
    avatar: '🐟',
    taste: { spicyLevel: 1, eatCilantro: true, isVegetarian: false },
    bio: '退休在家，喜欢研究各种汤品',
  }),
  createUser({
    id: 'user-3',
    nickname: 'Veggie小张',
    community: '翠湖天地A栋',
    avatar: '🥗',
    taste: { spicyLevel: 2, eatCilantro: false, isVegetarian: true },
    bio: '素食主义者，分享各种健康素食做法',
  }),
  createUser({
    id: 'user-4',
    nickname: '辣妹子阿椒',
    community: '金色家园3号楼',
    avatar: '🌶️',
    taste: { spicyLevel: 5, eatCilantro: true, isVegetarian: false },
    bio: '无辣不欢的川妹子，川菜爱好者',
  }),
  createUser({
    id: 'user-5',
    nickname: '烘焙小王',
    community: '翠湖天地A栋',
    avatar: '🧁',
    taste: { spicyLevel: 1, eatCilantro: true, isVegetarian: false },
    bio: '业余烘焙师，饭后甜点可以全包',
  }),
  createUser({
    id: 'user-6',
    nickname: '健身教练大壮',
    community: '银河大厦',
    avatar: '🥦',
    taste: { spicyLevel: 2, eatCilantro: true, isVegetarian: false },
    bio: '健身达人，擅长做低脂高蛋白餐',
  }),
];

function hoursFromNow(h: number, minutes = 0): Date {
  const d = new Date();
  d.setHours(d.getHours() + h, minutes, 0, 0);
  return d;
}

export function getMockTables(): TableRequest[] {
  const tables: TableRequest[] = [
    {
      id: 'table-1',
      hostId: 'user-1',
      host: mockUsers[0],
      time: hoursFromNow(3, 30),
      maxPeople: 4,
      participants: [
        { userId: 'user-1', user: mockUsers[0], joinType: 'share', joinedAt: new Date() },
        { userId: 'user-2', user: mockUsers[1], bringDish: '玉米排骨汤', joinType: 'dish', joinedAt: new Date() },
      ],
      costPerPerson: 35,
      invitationText: '今晚做番茄牛腩面+凉拌黄瓜，有一位阿姨带汤，还差两位邻居~ 楼下菜市场刚买的新鲜牛腩！',
      foodImage: foodImages[0],
      status: 'open',
      createdAt: new Date(),
    },
    {
      id: 'table-2',
      hostId: 'user-4',
      host: mockUsers[3],
      time: hoursFromNow(5, 0),
      maxPeople: 6,
      participants: [
        { userId: 'user-4', user: mockUsers[3], joinType: 'share', joinedAt: new Date() },
        { userId: 'user-5', user: mockUsers[4], bringDish: '提拉米苏', joinType: 'dish', joinedAt: new Date() },
        { userId: 'user-1', user: mockUsers[0], bringDish: '水煮鱼', joinType: 'dish', joinedAt: new Date() },
        { userId: 'user-6', user: mockUsers[5], joinType: 'share', joinedAt: new Date() },
      ],
      costPerPerson: 50,
      invitationText: '今晚川菜之夜！水煮肉片+麻婆豆腐+鱼香肉丝，小王负责甜品🍮 能吃辣的邻居们来~',
      foodImage: foodImages[4],
      status: 'open',
      createdAt: new Date(),
    },
    {
      id: 'table-3',
      hostId: 'user-3',
      host: mockUsers[2],
      time: hoursFromNow(26, 0),
      maxPeople: 4,
      participants: [
        { userId: 'user-3', user: mockUsers[2], joinType: 'share', joinedAt: new Date() },
        { userId: 'user-6', user: mockUsers[5], bringDish: '烤鸡胸肉沙拉', joinType: 'dish', joinedAt: new Date() },
      ],
      costPerPerson: 30,
      invitationText: '明天中午健康素食局🥗 低脂低卡，有健身教练大壮一起，欢迎想清肠的邻居~ 不吃香菜请注意！',
      foodImage: foodImages[2],
      status: 'open',
      createdAt: new Date(),
    },
    {
      id: 'table-4',
      hostId: 'user-2',
      host: mockUsers[1],
      time: hoursFromNow(1, 0),
      maxPeople: 3,
      participants: [
        { userId: 'user-2', user: mockUsers[1], joinType: 'share', joinedAt: new Date() },
        { userId: 'user-5', user: mockUsers[4], bringDish: '蒜蓉西兰花', joinType: 'dish', joinedAt: new Date() },
        { userId: 'user-3', user: mockUsers[2], bringDish: '凉拌木耳', joinType: 'dish', joinedAt: new Date() },
      ],
      costPerPerson: 25,
      invitationText: '阿姨今天做红烧肉，还差一位~ 小王做西兰花，小张拌木耳，三菜一汤完美搭配！',
      foodImage: foodImages[1],
      status: 'full',
      createdAt: new Date(),
    },
    {
      id: 'table-5',
      hostId: 'user-5',
      host: mockUsers[4],
      time: hoursFromNow(50, 30),
      maxPeople: 8,
      participants: [
        { userId: 'user-5', user: mockUsers[4], joinType: 'share', joinedAt: new Date() },
        { userId: 'user-1', user: mockUsers[0], bringDish: '意式肉酱面', joinType: 'dish', joinedAt: new Date() },
        { userId: 'user-4', user: mockUsers[3], joinType: 'share', joinedAt: new Date() },
      ],
      costPerPerson: 60,
      invitationText: '周六下午烘焙+晚餐派对！🎂 一起做披萨、烤鸡翅，我负责甜品台，最多8人，想参加的速速报名~',
      foodImage: foodImages[3],
      status: 'open',
      createdAt: new Date(),
    },
    {
      id: 'table-6',
      hostId: 'user-6',
      host: mockUsers[5],
      time: hoursFromNow(4, 30),
      maxPeople: 5,
      participants: [
        { userId: 'user-6', user: mockUsers[5], joinType: 'share', joinedAt: new Date() },
        { userId: 'user-2', user: mockUsers[1], bringDish: '菌菇鸡汤', joinType: 'dish', joinedAt: new Date() },
      ],
      costPerPerson: 40,
      invitationText: '今晚健身餐🍗 烤鸡胸+藜麦饭+蒸时蔬，阿姨带汤~ 减脂增肌的邻居约起来！',
      foodImage: foodImages[6],
      status: 'open',
      createdAt: new Date(),
    },
  ];
  return tables;
}

export function getMockMessages(): Record<string, ChatMessage[]> {
  return {
    'table-1': [
      {
        id: 'msg-1',
        tableId: 'table-1',
        userId: 'user-1',
        user: mockUsers[0],
        content: '大家好！我买了2斤牛腩，够4个人吃~',
        timestamp: new Date(Date.now() - 3600000),
      },
      {
        id: 'msg-2',
        tableId: 'table-1',
        userId: 'user-2',
        user: mockUsers[1],
        content: '小林好呀，阿姨的玉米排骨汤已经炖上了😋',
        timestamp: new Date(Date.now() - 3000000),
      },
    ],
    'table-2': [
      {
        id: 'msg-3',
        tableId: 'table-2',
        userId: 'user-4',
        user: mockUsers[3],
        content: '辣度我打算做中辣，大家可以接受吗？',
        timestamp: new Date(Date.now() - 7200000),
      },
      {
        id: 'msg-4',
        tableId: 'table-2',
        userId: 'user-1',
        user: mockUsers[0],
        content: '没问题！期待阿椒的手艺🤤',
        timestamp: new Date(Date.now() - 6800000),
      },
      {
        id: 'msg-5',
        tableId: 'table-2',
        userId: 'user-5',
        user: mockUsers[4],
        content: '提拉米苏我提前准备，吃完饭就能吃~',
        timestamp: new Date(Date.now() - 6500000),
      },
    ],
    'table-5': [
      {
        id: 'msg-6',
        tableId: 'table-5',
        userId: 'user-5',
        user: mockUsers[4],
        content: '欢迎大家来我的烘焙派对！烤箱已经预热了🔥',
        timestamp: new Date(Date.now() - 86400000),
      },
    ],
  };
}

export function createTable(
  data: Omit<TableRequest, 'id' | 'participants' | 'status' | 'createdAt'>,
): TableRequest {
  const hostParticipant: Participant = {
    userId: data.hostId,
    user: data.host,
    joinType: 'share',
    joinedAt: new Date(),
  };
  return {
    ...data,
    id: uuidv4(),
    participants: [hostParticipant],
    status: 'open',
    createdAt: new Date(),
  };
}

export function joinTable(
  table: TableRequest,
  participant: Participant,
): TableRequest {
  const newParticipants = [...table.participants, participant];
  const isFull = newParticipants.length >= table.maxPeople;
  return {
    ...table,
    participants: newParticipants,
    status: isFull ? 'full' : table.status,
  };
}

export function createMessage(
  tableId: string,
  user: User,
  content: string,
): ChatMessage {
  return {
    id: uuidv4(),
    tableId,
    userId: user.id,
    user,
    content,
    timestamp: new Date(),
  };
}

export function formatDateTime(d: Date): string {
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = weekdays[d.getDay()];
  const hour = d.getHours().toString().padStart(2, '0');
  const minute = d.getMinutes().toString().padStart(2, '0');
  if (days === 0) return `今天 ${hour}:${minute}`;
  if (days === 1) return `明天 ${hour}:${minute}`;
  if (days === 2) return `后天 ${hour}:${minute}`;
  return `${month}月${day}日 ${weekday} ${hour}:${minute}`;
}

export function formatShortDate(d: Date): string {
  const hour = d.getHours().toString().padStart(2, '0');
  const minute = d.getMinutes().toString().padStart(2, '0');
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return `今日 ${hour}:${minute}`;
  if (days === 1) return `明日 ${hour}:${minute}`;
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}/${day} ${hour}:${minute}`;
}

export function formatMessageTime(d: Date): string {
  const hour = d.getHours().toString().padStart(2, '0');
  const minute = d.getMinutes().toString().padStart(2, '0');
  return `${hour}:${minute}`;
}
