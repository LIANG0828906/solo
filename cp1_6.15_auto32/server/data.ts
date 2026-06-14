import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');

export interface Book {
  id: string;
  title: string;
  author: string;
  courseCode: string;
  coverImage: string;
  images: string[];
  condition: '全新' | '九成新' | '八成新' | '七成新' | '一般';
  originalPrice: number;
  expectedPrice?: number;
  wantExchange?: string[];
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  sellerBio: string;
  contactInfo: string;
  status: 'active' | 'sold' | 'exchanged' | 'offline';
  createdAt: string;
}

export interface ExchangeRequest {
  id: string;
  bookId: string;
  type: 'exchange' | 'buy';
  offerBookTitle?: string;
  offerBookAuthor?: string;
  offerPrice?: number;
  message: string;
  contactInfo: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  contact: string;
  totalListings: number;
  successfulExchanges: number;
  rating: number;
  favorites: string[];
}

let books: Book[] = [];
let exchanges: ExchangeRequest[] = [];
let userProfile: UserProfile;

const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

const loadData = () => {
  ensureDataDir();

  const booksPath = path.join(DATA_DIR, 'books.json');
  const exchangesPath = path.join(DATA_DIR, 'exchanges.json');
  const userPath = path.join(DATA_DIR, 'user.json');

  if (fs.existsSync(booksPath)) {
    try {
      books = JSON.parse(fs.readFileSync(booksPath, 'utf-8'));
    } catch {
      books = [];
    }
  }

  if (fs.existsSync(exchangesPath)) {
    try {
      exchanges = JSON.parse(fs.readFileSync(exchangesPath, 'utf-8'));
    } catch {
      exchanges = [];
    }
  }

  if (fs.existsSync(userPath)) {
    try {
      userProfile = JSON.parse(fs.readFileSync(userPath, 'utf-8'));
    } catch {
      userProfile = defaultUser();
    }
  } else {
    userProfile = defaultUser();
  }

  if (books.length === 0) {
    books = seedBooks();
    saveBooks();
  }
};

const saveBooks = () => {
  ensureDataDir();
  fs.writeFileSync(path.join(DATA_DIR, 'books.json'), JSON.stringify(books, null, 2), 'utf-8');
};

const saveExchanges = () => {
  ensureDataDir();
  fs.writeFileSync(path.join(DATA_DIR, 'exchanges.json'), JSON.stringify(exchanges, null, 2), 'utf-8');
};

const saveUser = () => {
  ensureDataDir();
  fs.writeFileSync(path.join(DATA_DIR, 'user.json'), JSON.stringify(userProfile, null, 2), 'utf-8');
};

const defaultUser = (): UserProfile => ({
  id: 'user-001',
  name: '小林同学',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaolin',
  bio: '计算机科学与技术大三学生，热爱编程和阅读，希望通过课本交换认识更多朋友~',
  contact: '微信：xiaolin_2024',
  totalListings: 0,
  successfulExchanges: 0,
  rating: 4.8,
  favorites: [],
});

const seedBooks = (): Book[] => [
  {
    id: 'book-001',
    title: '数据结构与算法分析',
    author: 'Mark Allen Weiss',
    courseCode: 'CS201',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=textbook%20cover%20data%20structures%20algorithms%20computer%20science%20warm%20minimal&image_size=portrait_4_3',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=data%20structures%20textbook%20pages%20algorithm%20diagrams%20notes&image_size=landscape_4_3',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=textbook%20spine%20and%20table%20of%20contents%20computer%20science&image_size=landscape_4_3',
    ],
    condition: '九成新',
    originalPrice: 79,
    expectedPrice: 35,
    wantExchange: [],
    sellerId: 'seller-001',
    sellerName: '阿杰学长',
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ajie',
    sellerBio: '计算机系大四毕业生，整理出一批专业课本，都是上课使用过的好教材。',
    contactInfo: 'QQ: 123456789 / 微信：ajie_cs',
    status: 'active',
    createdAt: '2026-06-10T08:30:00.000Z',
  },
  {
    id: 'book-002',
    title: '线性代数及其应用',
    author: 'David C. Lay',
    courseCode: 'MATH105',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=linear%20algebra%20textbook%20cover%20matrices%20vectors%20mathematical%20elegant&image_size=portrait_4_3',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=linear%20algebra%20textbook%20page%20matrix%20calculations%20handwritten%20notes&image_size=landscape_4_3',
    ],
    condition: '八成新',
    originalPrice: 65,
    wantExchange: ['高等数学（第七版）上册', '概率论与数理统计'],
    sellerId: 'seller-002',
    sellerName: '数学小达人',
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mathgirl',
    sellerBio: '数学系大二学生，教材保养得很好，有少量笔记。',
    contactInfo: '微信：math_lover2024',
    status: 'active',
    createdAt: '2026-06-09T14:20:00.000Z',
  },
  {
    id: 'book-003',
    title: '计算机网络：自顶向下方法',
    author: 'James F. Kurose',
    courseCode: 'CS305',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=computer%20networks%20textbook%20cover%20internet%20protocols%20blue%20orange%20warm&image_size=portrait_4_3',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=computer%20network%20textbook%20diagram%20TCP%20IP%20layers&image_size=landscape_4_3',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=open%20textbook%20network%20protocols%20highlighted%20sections&image_size=landscape_4_3',
    ],
    condition: '九成新',
    originalPrice: 89,
    expectedPrice: 45,
    wantExchange: [],
    sellerId: 'seller-003',
    sellerName: '网络工程师小王',
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang',
    sellerBio: '网络工程专业，这本书对我启发很大，希望能帮助更多同学。',
    contactInfo: '微信：wang_net',
    status: 'active',
    createdAt: '2026-06-08T10:15:00.000Z',
  },
  {
    id: 'book-004',
    title: '微观经济学原理',
    author: 'N. Gregory Mankiw',
    courseCode: 'ECON101',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=microeconomics%20textbook%20cover%20supply%20demand%20curves%20academic&image_size=portrait_4_3',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=economics%20textbook%20graphs%20charts%20economic%20models&image_size=landscape_4_3',
    ],
    condition: '全新',
    originalPrice: 72,
    expectedPrice: 50,
    sellerId: 'seller-004',
    sellerName: '经济学小学妹',
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=econ',
    sellerBio: '转专业了，这本教材完全没看过，全新转让。',
    contactInfo: '微信：econ_minor',
    status: 'active',
    createdAt: '2026-06-07T16:45:00.000Z',
  },
  {
    id: 'book-005',
    title: '操作系统概念',
    author: 'Abraham Silberschatz',
    courseCode: 'CS301',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=operating%20systems%20textbook%20cover%20kernel%20processes%20computer%20science&image_size=portrait_4_3',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=os%20textbook%20process%20management%20memory%20diagrams&image_size=landscape_4_3',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=open%20textbook%20operating%20system%20scheduling%20algorithms&image_size=landscape_4_3',
    ],
    condition: '八成新',
    originalPrice: 95,
    wantExchange: ['编译原理', '软件工程'],
    sellerId: 'seller-005',
    sellerName: 'OS爱好者',
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=osdev',
    sellerBio: '操作系统方向研究生，本科教材低价出或交换。',
    contactInfo: '微信：os_geek',
    status: 'active',
    createdAt: '2026-06-06T09:00:00.000Z',
  },
  {
    id: 'book-006',
    title: '大学物理（上册）',
    author: '程守洙 / 江之永',
    courseCode: 'PHY101',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=college%20physics%20textbook%20cover%20chinese%20mechanics%20waves%20warm%20tone&image_size=portrait_4_3',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=physics%20textbook%20formulas%20diagrams%20newton%20laws&image_size=landscape_4_3',
    ],
    condition: '七成新',
    originalPrice: 45,
    expectedPrice: 15,
    sellerId: 'seller-006',
    sellerName: '工科毕业生',
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=engineer',
    sellerBio: '毕业了清理书架，有笔记和重点勾画，不影响阅读。',
    contactInfo: '微信：grad_engineer',
    status: 'active',
    createdAt: '2026-06-05T11:30:00.000Z',
  },
  {
    id: 'book-007',
    title: '数据库系统概念',
    author: 'Abraham Silberschatz',
    courseCode: 'CS303',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=database%20systems%20textbook%20cover%20SQL%20tables%20relational%20model&image_size=portrait_4_3',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=database%20textbook%20ER%20diagram%20SQL%20queries%20examples&image_size=landscape_4_3',
    ],
    condition: '九成新',
    originalPrice: 88,
    expectedPrice: 40,
    sellerId: 'seller-007',
    sellerName: 'DBA小助手',
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dba',
    sellerBio: '数据库课程A+，书上有我整理的重点笔记，包你考过！',
    contactInfo: '微信：db_helper',
    status: 'active',
    createdAt: '2026-06-04T13:20:00.000Z',
  },
  {
    id: 'book-008',
    title: '软件工程：实践者的研究方法',
    author: 'Roger S. Pressman',
    courseCode: 'CS401',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=software%20engineering%20textbook%20cover%20agile%20uml%20professional&image_size=portrait_4_3',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=software%20engineering%20textbook%20agile%20scrum%20diagrams&image_size=landscape_4_3',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=open%20textbook%20uml%20class%20diagrams%20software%20design&image_size=landscape_4_3',
    ],
    condition: '八成新',
    originalPrice: 98,
    wantExchange: ['机器学习实战', '设计模式：可复用面向对象软件的基础'],
    sellerId: 'seller-008',
    sellerName: '产品经理实习生',
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pm',
    sellerBio: '从开发转产品了，这本软件工程书很适合想做研发的同学。',
    contactInfo: '微信：pm_intern',
    status: 'active',
    createdAt: '2026-06-03T15:10:00.000Z',
  },
  {
    id: 'book-009',
    title: '高等数学（第七版）下册',
    author: '同济大学数学系',
    courseCode: 'MATH102',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=advanced%20mathematics%20textbook%20cover%20chinese%20calculus%20integrals&image_size=portrait_4_3',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=calculus%20textbook%20integral%20formulas%20series%20math%20equations&image_size=landscape_4_3',
    ],
    condition: '一般',
    originalPrice: 38,
    expectedPrice: 10,
    sellerId: 'seller-009',
    sellerName: '考研上岸学长',
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kaoyan',
    sellerBio: '考研用过，有大量笔记和勾画，不嫌弃的拿走。',
    contactInfo: '微信：math_master',
    status: 'active',
    createdAt: '2026-06-02T08:50:00.000Z',
  },
  {
    id: 'book-010',
    title: '机器学习',
    author: '周志华',
    courseCode: 'CS405',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=machine%20learning%20textbook%20cover%20watermelon%20book%20chinese%20ai&image_size=portrait_4_3',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=machine%20learning%20textbook%20decision%20trees%20neural%20networks%20diagrams&image_size=landscape_4_3',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=open%20ai%20textbook%20svm%20clustering%20algorithms%20math&image_size=landscape_4_3',
    ],
    condition: '九成新',
    originalPrice: 88,
    expectedPrice: 55,
    sellerId: 'seller-010',
    sellerName: 'AI方向博士生',
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aiphd',
    sellerBio: '经典西瓜书，入门机器学习必读，几乎全新。',
    contactInfo: '微信：ml_phd',
    status: 'active',
    createdAt: '2026-06-01T17:30:00.000Z',
  },
  {
    id: 'book-011',
    title: '大学英语精读（第三版）3',
    author: '董亚芬',
    courseCode: 'ENG103',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=college%20english%20textbook%20cover%20reading%20vocabulary%20warm%20orange&image_size=portrait_4_3',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=english%20textbook%20pages%20reading%20passages%20vocabulary%20exercises&image_size=landscape_4_3',
    ],
    condition: '八成新',
    originalPrice: 35,
    wantExchange: ['大学英语精读4', '新视野大学英语'],
    sellerId: 'seller-011',
    sellerName: '外语系小仙女',
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=english',
    sellerBio: '英语课本，有部分笔记，品相很好。',
    contactInfo: '微信：english_girl',
    status: 'active',
    createdAt: '2026-05-31T12:00:00.000Z',
  },
  {
    id: 'book-012',
    title: 'Python编程：从入门到实践',
    author: 'Eric Matthes',
    courseCode: 'CS101',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=python%20programming%20textbook%20cover%20code%20snake%20blue%20warm&image_size=portrait_4_3',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=python%20code%20examples%20textbook%20page%20programming&image_size=landscape_4_3',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=open%20python%20book%20projects%20games%20data%20visualization&image_size=landscape_4_3',
    ],
    condition: '全新',
    originalPrice: 89,
    expectedPrice: 60,
    sellerId: 'seller-012',
    sellerName: 'Python入门讲师',
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=python',
    sellerBio: '全新未拆封，多买了一本，适合Python入门的同学。',
    contactInfo: '微信：python_tea',
    status: 'active',
    createdAt: '2026-05-30T14:40:00.000Z',
  },
];

loadData();

export const dataStore = {
  getBooks: (page = 1, limit = 20, sort = 'newest'): { books: Book[]; total: number } => {
    let sorted = [...books].filter(b => b.status === 'active');
    if (sort === 'newest') {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sort === 'price_asc') {
      sorted.sort((a, b) => (a.expectedPrice || 0) - (b.expectedPrice || 0));
    }
    const total = sorted.length;
    const start = (page - 1) * limit;
    return { books: sorted.slice(start, start + limit), total };
  },

  getBookById: (id: string): Book | undefined => {
    return books.find(b => b.id === id);
  },

  createBook: (book: Omit<Book, 'id' | 'createdAt'>): Book => {
    const newBook: Book = {
      ...book,
      id: 'book-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    books.unshift(newBook);
    saveBooks();
    userProfile.totalListings++;
    saveUser();
    return newBook;
  },

  updateBook: (id: string, updates: Partial<Book>): boolean => {
    const idx = books.findIndex(b => b.id === id);
    if (idx === -1) return false;
    books[idx] = { ...books[idx], ...updates };
    saveBooks();
    return true;
  },

  deleteBook: (id: string): boolean => {
    const idx = books.findIndex(b => b.id === id);
    if (idx === -1) return false;
    books.splice(idx, 1);
    saveBooks();
    return true;
  },

  createExchange: (exchange: Omit<ExchangeRequest, 'id' | 'createdAt' | 'status'>): ExchangeRequest => {
    const newExchange: ExchangeRequest = {
      ...exchange,
      id: 'ex-' + Date.now(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    exchanges.unshift(newExchange);
    saveExchanges();
    return newExchange;
  },

  getExchangesByUser: (userId: string): ExchangeRequest[] => {
    return exchanges;
  },

  getUserProfile: (): UserProfile => {
    return { ...userProfile };
  },

  updateUserProfile: (updates: Partial<UserProfile>): UserProfile => {
    userProfile = { ...userProfile, ...updates };
    saveUser();
    return userProfile;
  },

  toggleFavorite: (bookId: string): { favorites: string[]; added: boolean } => {
    const idx = userProfile.favorites.indexOf(bookId);
    let added = false;
    if (idx === -1) {
      userProfile.favorites.push(bookId);
      added = true;
    } else {
      userProfile.favorites.splice(idx, 1);
    }
    saveUser();
    return { favorites: [...userProfile.favorites], added };
  },

  getFavoriteBooks: (): Book[] => {
    return books.filter(b => userProfile.favorites.includes(b.id));
  },

  getUserBooks: (): Book[] => {
    return books.filter(b => b.sellerId === 'user-001' || b.sellerId.startsWith('user'));
  },

  markExchangeComplete: (exchangeId: string): boolean => {
    const idx = exchanges.findIndex(e => e.id === exchangeId);
    if (idx === -1) return false;
    exchanges[idx].status = 'completed';
    userProfile.successfulExchanges++;
    saveExchanges();
    saveUser();
    return true;
  },
};
