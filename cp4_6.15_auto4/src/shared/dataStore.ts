export interface User {
  id: string;
  nickname: string;
  creditLevel: string;
  completedExchanges: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  description: string;
  coverUrl: string;
  city: string;
  exchangeType: string;
  status: string;
  ownerId: string;
}

export interface ExchangeRequest {
  id: string;
  bookId: string;
  requesterId: string;
  ownerId: string;
  message: string;
  desiredBook: string;
  status: string;
  isRead: boolean;
  createdAt: string;
}

const STORAGE_KEY = 'bookExchangeData';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load from storage:', e);
  }
  return fallback;
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      users,
      books,
      exchangeRequests,
    }));
  } catch (e) {
    console.warn('Failed to save to storage:', e);
  }
}

const defaultUsers: User[] = [
  { id: 'u1', nickname: '林小书', creditLevel: 'A', completedExchanges: 12 },
  { id: 'u2', nickname: '王阅读', creditLevel: 'B+', completedExchanges: 8 },
  { id: 'u3', nickname: '赵墨香', creditLevel: 'A+', completedExchanges: 25 },
  { id: 'u4', nickname: '陈书虫', creditLevel: 'A', completedExchanges: 15 },
  { id: 'u5', nickname: '李卷轴', creditLevel: 'B', completedExchanges: 5 },
  { id: 'u6', nickname: '孙知行', creditLevel: 'A', completedExchanges: 18 },
];

const defaultBooks: Book[] = [
  {
    id: 'b1',
    title: '百年孤独',
    author: '加西亚·马尔克斯',
    category: '小说',
    description: '《百年孤独》是哥伦比亚作家加西亚·马尔克斯的代表作，也是拉丁美洲魔幻现实主义文学的代表作。作品描写了布恩迪亚家族七代人的传奇故事，以及加勒比海沿岸小镇马孔多的百年兴衰，反映了拉丁美洲一个世纪以来风云变幻的历史。',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vintage%20book%20cover%20of%20One%20Hundred%20Years%20of%20Solitude%2C%20warm%20colors%2C%20magical%20realism%20style&image_size=portrait_4_3',
    city: '北京',
    exchangeType: '等价交换',
    status: '可交换',
    ownerId: 'u1',
  },
  {
    id: 'b2',
    title: '人类简史',
    author: '尤瓦尔·赫拉利',
    category: '科技',
    description: '《人类简史：从动物到上帝》是以色列历史学家尤瓦尔·赫拉利的一部重磅作品。从十万年前有生命迹象开始到21世纪资本、科技交织的人类发展史，将科学和历史编织在一起，从全新的角度述说人类历史。',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=book%20cover%20of%20Sapiens%20A%20Brief%20History%20of%20Humankind%2C%20modern%20design%2C%20earth%20and%20human&image_size=portrait_4_3',
    city: '上海',
    exchangeType: '低价转让',
    status: '可交换',
    ownerId: 'u2',
  },
  {
    id: 'b3',
    title: '活着',
    author: '余华',
    category: '小说',
    description: '《活着》讲述了在大时代背景下，随着内战、三反五反、大跃进、文化大革命等社会变革，徐福贵的人生和家庭不断经受着苦难，到了最后所有亲人都先后离他而去，仅剩下年老的他和一头老牛相依为命。',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vintage%20Chinese%20book%20cover%20of%20To%20Live%20by%20Yu%20Hua%2C%20rural%20landscape%2C%20warm%20tones&image_size=portrait_4_3',
    city: '杭州',
    exchangeType: '免费赠予',
    status: '可交换',
    ownerId: 'u3',
  },
  {
    id: 'b4',
    title: '算法导论',
    author: 'Thomas H. Cormen',
    category: '科技',
    description: '《算法导论》全面介绍了各类算法的设计和分析方法。其内容涉及排序、搜索、图论、动态规划等核心算法领域，是计算机科学领域的经典教材，被全球众多大学选为算法课程教材。',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=technical%20book%20cover%20of%20Introduction%20to%20Algorithms%2C%20clean%20design%2C%20geometric%20patterns&image_size=portrait_4_3',
    city: '深圳',
    exchangeType: '等价交换',
    status: '可交换',
    ownerId: 'u4',
  },
  {
    id: 'b5',
    title: '教育的目的',
    author: '阿尔弗雷德·怀特海',
    category: '教育',
    description: '《教育的目的》是英国哲学家怀特海关于教育的经典著作。书中批判了传统教育中的僵化模式，主张教育应激发学生的创造力与智慧，强调教育的节奏——浪漫阶段、精确阶段和综合运用阶段的重要性。',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=classic%20book%20cover%20of%20The%20Aims%20of%20Education%2C%20elegant%20design%2C%20academic%20style&image_size=portrait_4_3',
    city: '南京',
    exchangeType: '低价转让',
    status: '可交换',
    ownerId: 'u5',
  },
  {
    id: 'b6',
    title: '小王子',
    author: '安托万·圣埃克苏佩里',
    category: '小说',
    description: '《小王子》是法国作家安托万·德·圣埃克苏佩里于1943年出版的短篇小说。本书的主人公是来自外星球的小王子，书中以一位飞行员作为故事叙述者，讲述了小王子从自己星球出发前往地球的过程中所经历的各种历险。',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=whimsical%20book%20cover%20of%20The%20Little%20Prince%2C%20stars%20and%20rose%2C%20watercolor%20style&image_size=portrait_4_3',
    city: '成都',
    exchangeType: '免费赠予',
    status: '可交换',
    ownerId: 'u6',
  },
  {
    id: 'b7',
    title: 'Python编程：从入门到实践',
    author: 'Eric Matthes',
    category: '科技',
    description: '《Python编程：从入门到实践》是一本针对所有层次的Python读者而作的Python入门书。全书分两部分：第一部分介绍用Python编程所必须了解的基本概念；第二部分将理论付诸实践，讲解如何开发三个项目。',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20programming%20book%20cover%20Python%20Crash%20Course%2C%20blue%20and%20yellow%20colors%2C%20code%20visuals&image_size=portrait_4_3',
    city: '广州',
    exchangeType: '低价转让',
    status: '可交换',
    ownerId: 'u2',
  },
  {
    id: 'b8',
    title: '窗边的小豆豆',
    author: '黑柳彻子',
    category: '教育',
    description: '《窗边的小豆豆》讲述了作者上小学时的一段真实故事。作者因淘气被原学校退学后，来到巴学园。在小林校长的爱护和引导下，一般人眼里"怪怪"的小豆豆逐渐成了一个大家都能接受的孩子，并奠定了她一生的基础。',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=warm%20book%20cover%20of%20Totto-chan%20The%20Little%20Girl%20at%20the%20Window%2C%20Japanese%20school%20scene%2C%20gentle%20colors&image_size=portrait_4_3',
    city: '武汉',
    exchangeType: '免费赠予',
    status: '可交换',
    ownerId: 'u1',
  },
  {
    id: 'b9',
    title: '生活，是很好玩的',
    author: '汪曾祺',
    category: '生活',
    description: '《生活，是很好玩的》是汪曾祺的散文精选集。汪曾祺一生颠沛坎坷，却写出了今人所没有的慢与闲。平常的一草一木、一茶一饭，因他而变得生动有趣。他说："我的生活很平淡，但我自己觉得很有意思。"',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=serene%20Chinese%20book%20cover%20of%20Life%20is%20Fun%20by%20Wang%20Zengqi%2C%20tea%20and%20flowers%2C%20ink%20wash%20style&image_size=portrait_4_3',
    city: '苏州',
    exchangeType: '等价交换',
    status: '可交换',
    ownerId: 'u3',
  },
  {
    id: 'b10',
    title: '如何阅读一本书',
    author: '莫提默·艾德勒',
    category: '教育',
    description: '《如何阅读一本书》初版于1940年，1972年大幅增订改写为新版。不懂阅读的人，初探阅读的人，读这本书可以少走冤枉路。对阅读有所体会的人，读这本书可以有更深的印证与领悟。这是一本有关阅读的永不褪色的经典。',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=classic%20book%20cover%20of%20How%20to%20Read%20a%20Book%2C%20stacked%20books%2C%20warm%20library%20tones&image_size=portrait_4_3',
    city: '西安',
    exchangeType: '低价转让',
    status: '可交换',
    ownerId: 'u4',
  },
  {
    id: 'b11',
    title: '人间草木',
    author: '汪曾祺',
    category: '生活',
    description: '《人间草木》是汪曾祺的经典散文集。他以一颗从容豁达的心写出了草木山川、花鸟虫鱼的人情味，写出了乡情民俗、凡人小事的温润趣味，写出了世间百态、人生况味的多姿多彩。',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=peaceful%20Chinese%20book%20cover%20of%20Grass%20and%20Trees%20in%20the%20World%2C%20botanical%20illustration%2C%20ink%20painting&image_size=portrait_4_3',
    city: '长沙',
    exchangeType: '等价交换',
    status: '可交换',
    ownerId: 'u5',
  },
  {
    id: 'b12',
    title: '三体',
    author: '刘慈欣',
    category: '小说',
    description: '《三体》是刘慈欣创作的系列长篇科幻小说，讲述了地球人类文明和三体文明的信息交流、生死搏杀及两个文明在宇宙中的兴衰历程。作品恢弘大气，想象绚丽，被誉为中国科幻文学的里程碑之作。',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=epic%20sci-fi%20book%20cover%20of%20The%20Three-Body%20Problem%2C%20dark%20space%2C%20three%20suns%2C%20cosmic%20mystery&image_size=portrait_4_3',
    city: '重庆',
    exchangeType: '等价交换',
    status: '可交换',
    ownerId: 'u6',
  },
];

const storedData = loadFromStorage<{ users: User[]; books: Book[]; exchangeRequests: ExchangeRequest[] }>(
  STORAGE_KEY,
  { users: defaultUsers, books: defaultBooks, exchangeRequests: [] }
);

const users: User[] = storedData.users;
const books: Book[] = storedData.books;
const exchangeRequests: ExchangeRequest[] = storedData.exchangeRequests;

let listeners: Array<() => void> = [];

function notifyListeners() {
  saveToStorage();
  listeners.forEach((fn) => fn());
}

export function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((fn) => fn !== listener);
  };
}

export function getUsers(): User[] {
  return [...users];
}

export function getUserById(id: string): User | undefined {
  return users.find((u) => u.id === id);
}

export function findOrCreateUser(nickname: string): User {
  let user = users.find((u) => u.nickname === nickname);
  if (!user) {
    user = {
      id: 'u' + (users.length + 1),
      nickname,
      creditLevel: 'C',
      completedExchanges: 0,
    };
    users.push(user);
  }
  return user;
}

export function getBooks(): Book[] {
  return [...books];
}

export function getBookById(id: string): Book | undefined {
  return books.find((b) => b.id === id);
}

export function updateBookStatus(bookId: string, status: string): void {
  const book = books.find((b) => b.id === bookId);
  if (book) {
    book.status = status;
    notifyListeners();
  }
}

export function getExchangeRequests(): ExchangeRequest[] {
  return [...exchangeRequests];
}

export function getExchangeRequestsByUser(userId: string): ExchangeRequest[] {
  return exchangeRequests.filter(
    (r) => r.requesterId === userId || r.ownerId === userId
  );
}

export function getUnreadCount(userId: string): number {
  return exchangeRequests.filter(
    (r) => r.ownerId === userId && !r.isRead
  ).length;
}

export function createExchangeRequest(
  bookId: string,
  requesterId: string,
  ownerId: string,
  message: string,
  desiredBook: string
): ExchangeRequest {
  const request: ExchangeRequest = {
    id: 'e' + (exchangeRequests.length + 1),
    bookId,
    requesterId,
    ownerId,
    message,
    desiredBook,
    status: '待确认',
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  exchangeRequests.unshift(request);
  updateBookStatus(bookId, '交换中');
  return request;
}

export function markExchangeAsRead(requestId: string): void {
  const req = exchangeRequests.find((r) => r.id === requestId);
  if (req) {
    req.isRead = true;
    notifyListeners();
  }
}

export function updateExchangeStatus(
  requestId: string,
  newStatus: string
): void {
  const req = exchangeRequests.find((r) => r.id === requestId);
  if (!req) return;

  req.status = newStatus;
  req.isRead = true;

  if (newStatus === '已拒绝') {
    updateBookStatus(req.bookId, '可交换');
  } else if (newStatus === '已完成') {
    const owner = users.find((u) => u.id === req.ownerId);
    const requester = users.find((u) => u.id === req.requesterId);
    if (owner) owner.completedExchanges += 1;
    if (requester) requester.completedExchanges += 1;
    updateBookStatus(req.bookId, '可交换');
  }

  notifyListeners();
}
