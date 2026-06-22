import { v4 as uuidv4 } from 'uuid';

export interface Comment {
  id: string;
  content: string;
  createdAt: number;
}

export interface DiaryEntry {
  id: string;
  content: string;
  tags: string[];
  nickname: string;
  avatar: string;
  likes: number;
  liked: boolean;
  comments: Comment[];
  createdAt: number;
}

export interface PaginatedResult {
  entries: DiaryEntry[];
  hasMore: boolean;
  total: number;
}

const DB_NAME = 'MicroBlogDB';
const DB_VERSION = 1;
const STORE_NAME = 'diaries';
const PAGE_SIZE = 12;

class DataManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        }
      };
    });

    return this.initPromise;
  }

  private async ensureDb(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  async createDiary(content: string, tags: string[]): Promise<DiaryEntry> {
    const db = await this.ensureDb();
    const entry: DiaryEntry = {
      id: uuidv4(),
      content,
      tags: [...new Set(tags.map(t => t.trim()).filter(t => t.length > 0))],
      nickname: '旅行者',
      avatar: this.generateAvatar(),
      likes: 0,
      liked: false,
      comments: [],
      createdAt: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(entry);
      request.onsuccess = () => resolve(entry);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteDiary(id: string): Promise<void> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getDiary(id: string): Promise<DiaryEntry | undefined> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getDiaries(page: number = 1, tags: string[] = []): Promise<PaginatedResult> {
    const db = await this.ensureDb();
    const allEntries = await this.getAllEntries(db);
    
    let filtered = allEntries;
    if (tags.length > 0) {
      filtered = allEntries.filter(entry =>
        tags.every(tag => entry.tags.includes(tag))
      );
    }

    filtered.sort((a, b) => b.createdAt - a.createdAt);

    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const entries = filtered.slice(start, end);

    return {
      entries,
      hasMore: end < filtered.length,
      total: filtered.length
    };
  }

  private getAllEntries(db: IDBDatabase): Promise<DiaryEntry[]> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllTags(): Promise<{ tag: string; count: number }[]> {
    const db = await this.ensureDb();
    const entries = await this.getAllEntries(db);
    
    const tagCount = new Map<string, number>();
    entries.forEach(entry => {
      entry.tags.forEach(tag => {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCount.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }

  async toggleLike(id: string): Promise<DiaryEntry | undefined> {
    const db = await this.ensureDb();
    const entry = await this.getDiary(id);
    if (!entry) return undefined;

    entry.liked = !entry.liked;
    entry.likes += entry.liked ? 1 : -1;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(entry);
      request.onsuccess = () => resolve(entry);
      request.onerror = () => reject(request.error);
    });
  }

  async addComment(id: string, content: string): Promise<DiaryEntry | undefined> {
    const db = await this.ensureDb();
    const entry = await this.getDiary(id);
    if (!entry) return undefined;

    const comment: Comment = {
      id: uuidv4(),
      content,
      createdAt: Date.now()
    };

    entry.comments.push(comment);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(entry);
      request.onsuccess = () => resolve(entry);
      request.onerror = () => reject(request.error);
    });
  }

  async seedMockData(): Promise<void> {
    const db = await this.ensureDb();
    const count = await new Promise<number>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (count > 0) return;

    const mockEntries: Omit<DiaryEntry, 'id'>[] = [
      {
        content: '今天天气真好，阳光明媚，心情也跟着好起来了。去公园散了散步，看到了很多漂亮的花。生活中总有一些小确幸值得我们去发现和珍惜。',
        tags: ['生活', '心情', '日常'],
        nickname: '清风徐来',
        avatar: '',
        likes: 42,
        liked: false,
        comments: [],
        createdAt: Date.now() - 3 * 60 * 1000
      },
      {
        content: '学习了一个新的设计模式，感觉很有收获。',
        tags: ['学习', '技术'],
        nickname: '代码诗人',
        avatar: '',
        likes: 18,
        liked: true,
        comments: [
          { id: 'c1', content: '什么模式呀？', createdAt: Date.now() - 60000 }
        ],
        createdAt: Date.now() - 15 * 60 * 1000
      },
      {
        content: '周末去爬山了，站在山顶俯瞰整个城市，感觉所有的烦恼都变得渺小了。大自然真的是最好的治愈师，推荐大家有空也多出去走走，呼吸新鲜空气。',
        tags: ['旅行', '运动', '周末'],
        nickname: '山野行者',
        avatar: '',
        likes: 89,
        liked: false,
        comments: [],
        createdAt: Date.now() - 2 * 60 * 60 * 1000
      },
      {
        content: '读了一本好书，《百年孤独》真的是魔幻现实主义的巅峰之作，每一次重读都有新的感悟。马尔克斯的文字里有种神奇的魔力，能让你沉浸在那个虚构却又真实的马孔多小镇。',
        tags: ['读书', '文学', '感悟'],
        nickname: '书虫小明',
        avatar: '',
        likes: 156,
        liked: true,
        comments: [],
        createdAt: Date.now() - 5 * 60 * 60 * 1000
      },
      {
        content: '今天做了一道新菜——番茄肥牛面，味道还不错！分享一下做法：先炒番茄出汁，加水煮开，下面条，最后放肥牛卷和青菜，简单又好吃。',
        tags: ['美食', '烹饪', '分享'],
        nickname: '厨房新手',
        avatar: '',
        likes: 67,
        liked: false,
        comments: [],
        createdAt: Date.now() - 8 * 60 * 60 * 1000
      },
      {
        content: '深夜coding，bug终于修复了！原来是一个很简单的拼写错误，找了两个小时。程序员的日常就是这样，有时候一个小问题能卡半天，解决了又特别有成就感。',
        tags: ['编程', '日常', '技术'],
        nickname: '夜猫子',
        avatar: '',
        likes: 234,
        liked: false,
        comments: [],
        createdAt: Date.now() - 12 * 60 * 60 * 1000
      },
      {
        content: '刚看完一部电影《星际穿越》，虽然是老片了但每次看都很震撼。诺兰真的是天才导演，把科学和情感完美地结合在一起。',
        tags: ['电影', '科幻', '推荐'],
        nickname: '影迷阿杰',
        avatar: '',
        likes: 312,
        liked: true,
        comments: [],
        createdAt: Date.now() - 24 * 60 * 60 * 1000
      },
      {
        content: '早起跑步5公里，一整天都精神饱满。坚持运动真的很重要，身体是革命的本钱嘛。',
        tags: ['运动', '健康', '日常'],
        nickname: '健身达人',
        avatar: '',
        likes: 98,
        liked: false,
        comments: [],
        createdAt: Date.now() - 30 * 60 * 60 * 1000
      },
      {
        content: '今天公司团建，玩了很多有趣的游戏，认识了很多新同事。团队氛围真的很重要，一个好的团队能让工作变得更愉快。',
        tags: ['工作', '团队', '生活'],
        nickname: '职场小白',
        avatar: '',
        likes: 45,
        liked: false,
        comments: [],
        createdAt: Date.now() - 36 * 60 * 60 * 1000
      },
      {
        content: '入手了一把新的机械键盘，青轴手感太棒了！打字的时候咔哒咔哒的声音简直是程序员的白噪音。',
        tags: ['数码', '好物', '技术'],
        nickname: '装备党',
        avatar: '',
        likes: 76,
        liked: true,
        comments: [],
        createdAt: Date.now() - 48 * 60 * 60 * 1000
      },
      {
        content: '突然下雨了，没带伞，淋成落汤鸡...不过雨中散步也别有一番风味，空气特别清新。',
        tags: ['日常', '天气', '心情'],
        nickname: '雨天漫步',
        avatar: '',
        likes: 23,
        liked: false,
        comments: [],
        createdAt: Date.now() - 55 * 60 * 60 * 1000
      },
      {
        content: '学习TypeScript中，类型系统真的很强大，虽然写起来麻烦一点，但是能避免很多运行时错误。推荐大家都试试！',
        tags: ['学习', '技术', '编程'],
        nickname: 'TS爱好者',
        avatar: '',
        likes: 167,
        liked: false,
        comments: [],
        createdAt: Date.now() - 72 * 60 * 60 * 1000
      },
      {
        content: '今天去美术馆看了一个画展，被那些色彩和构图深深震撼了。艺术真的能给人带来力量和灵感。',
        tags: ['艺术', '展览', '生活'],
        nickname: '文艺青年',
        avatar: '',
        likes: 54,
        liked: false,
        comments: [],
        createdAt: Date.now() - 80 * 60 * 60 * 1000
      },
      {
        content: '养的小猫咪今天终于学会用猫砂盆了！老母亲流下了感动的泪水...',
        tags: ['宠物', '猫', '日常'],
        nickname: '铲屎官',
        avatar: '',
        likes: 289,
        liked: true,
        comments: [],
        createdAt: Date.now() - 96 * 60 * 60 * 1000
      },
      {
        content: '周末宅家追了一整部剧，太爽了！偶尔的放松也是必要的，给自己充充电。',
        tags: ['周末', '追剧', '生活'],
        nickname: '宅家一族',
        avatar: '',
        likes: 123,
        liked: false,
        comments: [],
        createdAt: Date.now() - 120 * 60 * 60 * 1000
      }
    ];

    for (const entry of mockEntries) {
      const fullEntry: DiaryEntry = {
        ...entry,
        id: uuidv4(),
        avatar: this.generateAvatar()
      };
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(fullEntry);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  private generateAvatar(): string {
    const colors = ['#6C63FF', '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const initials = ['旅', '诗', '山', '书', '厨', '夜', '影', '健', '职', '装', '雨', 'T', '文', '喵', '宅'];
    const initial = initials[Math.floor(Math.random() * initials.length)];
    
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <rect width="40" height="40" rx="20" fill="${color}"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".35em" fill="white" font-size="18" font-family="sans-serif" font-weight="bold">${initial}</text>
      </svg>
    `;
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg.trim())));
  }
}

export const dataManager = new DataManager();
