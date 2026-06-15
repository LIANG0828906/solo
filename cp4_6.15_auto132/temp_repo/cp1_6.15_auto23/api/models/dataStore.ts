import type {
  Member,
  Book,
  ReadingProgress,
  CheckIn,
  Topic,
  Reply,
  Event,
  Vote,
} from '../../src/types';

let idCounter = 1000;
const genId = (prefix: string) => `${prefix}_${++idCounter}_${Date.now().toString(36)}`;

const MEMBER_AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop&crop=face',
];

const MEMBER_NAMES = [
  '林墨', '陈书', '苏雪', '王砚', '柳清',
  '周言', '白薇', '沈砚', '许念', '郑然',
];

function generateMembers(): Member[] {
  return MEMBER_NAMES.map((name, i) => ({
    id: `m_${i + 1}`,
    name,
    avatar: MEMBER_AVATARS[i],
    role: i === 0 ? 'admin' : 'member',
  }));
}

const BOOK_TEMPLATES = [
  { title: '百年孤独', author: '加西亚·马尔克斯', chapters: 20, isbn: '9787544253994', category: '魔幻现实' },
  { title: '红楼梦', author: '曹雪芹', chapters: 120, isbn: '9787020002207', category: '古典文学' },
  { title: '三体', author: '刘慈欣', chapters: 36, isbn: '9787536692930', category: '科幻' },
  { title: '活着', author: '余华', chapters: 12, isbn: '9787506365437', category: '现代文学' },
  { title: '追风筝的人', author: '卡勒德·胡赛尼', chapters: 25, isbn: '9787208061644', category: '外国文学' },
  { title: '小王子', author: '圣埃克苏佩里', chapters: 27, isbn: '9787020042494', category: '童话' },
  { title: '1984', author: '乔治·奥威尔', chapters: 24, isbn: '9787540415457', category: '反乌托邦' },
  { title: '围城', author: '钱钟书', chapters: 9, isbn: '9787020024759', category: '现代文学' },
  { title: '平凡的世界', author: '路遥', chapters: 54, isbn: '9787530209561', category: '现代文学' },
  { title: '了不起的盖茨比', author: '菲茨杰拉德', chapters: 9, isbn: '9787020071005', category: '外国文学' },
  { title: '挪威的森林', author: '村上春树', chapters: 11, isbn: '9787544281157', category: '外国文学' },
  { title: '白夜行', author: '东野圭吾', chapters: 13, isbn: '9787544258609', category: '推理' },
  { title: '人类简史', author: '尤瓦尔·赫拉利', chapters: 20, isbn: '9787508647357', category: '历史' },
  { title: '局外人', author: '加缪', chapters: 5, isbn: '9787540468309', category: '存在主义' },
  { title: '月亮与六便士', author: '毛姆', chapters: 58, isbn: '9787540483791', category: '外国文学' },
];

const BOOK_COVERS = [
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&h=400&fit=crop',
  'https://images.unsplash.com/photo-1589998059171-988d887df646?w=300&h=400&fit=crop',
];

function pickRandom<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function generateBooks(members: Member[]): Book[] {
  const books: Book[] = [];
  for (let i = 0; i < 100; i++) {
    const tpl = BOOK_TEMPLATES[i % BOOK_TEMPLATES.length];
    const numReaders = 2 + (i % 8);
    const readerIds = members
      .sort(() => (i * 7) % 3 - 1)
      .slice(0, numReaders)
      .map(m => m.id);
    books.push({
      id: `b_${i + 1}`,
      title: `${tpl.title}${i > BOOK_TEMPLATES.length - 1 ? `（第${Math.floor(i / BOOK_TEMPLATES.length) + 1}季）` : ''}`,
      author: tpl.author,
      coverUrl: BOOK_COVERS[i % BOOK_COVERS.length],
      description: `${tpl.category}经典作品。故事围绕深刻的主题展开，以细腻的笔触刻画了人物内心世界与时代命运的交织，是一部值得反复品读的佳作。`,
      isbn: tpl.isbn,
      addedAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
      totalChapters: tpl.chapters,
      readerIds,
    });
  }
  return books;
}

function generateProgress(books: Book[], members: Member[]): ReadingProgress[] {
  const progress: ReadingProgress[] = [];
  books.forEach((book, bi) => {
    book.readerIds.forEach((mid, mi) => {
      const seed = bi * 7 + mi * 3;
      const ratio = (seed % 100) / 100;
      const currentChapter = ratio < 0.1 ? 0 : Math.max(1, Math.floor(book.totalChapters * ratio));
      const status = currentChapter === 0
        ? 'not_started'
        : currentChapter >= book.totalChapters
          ? 'completed'
          : 'reading';
      progress.push({
        memberId: mid,
        bookId: book.id,
        currentChapter,
        totalChapters: book.totalChapters,
        status,
        lastUpdateAt: new Date(Date.now() - (seed % 7) * 86400000).toISOString(),
      });
    });
  });
  return progress;
}

function generateCheckIns(books: Book[], members: Member[]): CheckIn[] {
  const checkIns: CheckIn[] = [];
  let cid = 1;
  books.slice(0, 20).forEach((book, bi) => {
    book.readerIds.forEach((mid, mi) => {
      if ((bi + mi) % 3 === 0) {
        const seed = bi * 11 + mi * 5;
        const chapter = 1 + (seed % Math.max(1, book.totalChapters - 1));
        checkIns.push({
          id: `c_${cid++}`,
          memberId: mid,
          bookId: book.id,
          chapter,
          thought: seed % 2 === 0
            ? '这一章的描写很细腻，人物内心的挣扎写得非常动人。'
            : '情节推进出乎意料，读完久久不能平静。',
          createdAt: new Date(Date.now() - (seed % 14) * 86400000).toISOString(),
        });
      }
    });
  });
  return checkIns;
}

const TOPIC_TITLES = [
  '第一章：开篇的艺术手法分析',
  '关于主角性格发展的讨论',
  '书中象征意象解读',
  '时代背景与人物命运',
  '结局的开放性思考',
  '人物关系深度剖析',
  '语言风格与叙事技巧',
  '最打动你的一个片段',
];

function generateTopics(books: Book[], members: Member[]): Topic[] {
  const topics: Topic[] = [];
  let tid = 1;
  let rid = 1;
  books.slice(0, 15).forEach((book, bi) => {
    const numTopics = 1 + (bi % 4);
    for (let t = 0; t < numTopics; t++) {
      const topicId = `t_${tid++}`;
      const replies: Reply[] = [];
      const numReplies = (bi + t) % 5;
      for (let r = 0; r < numReplies; r++) {
        const member = pickRandom(members, bi * 3 + t * 5 + r);
        replies.push({
          id: `r_${rid++}`,
          topicId,
          memberId: member.id,
          content: r % 2 === 0
            ? '非常认同这个观点，我在阅读时也有类似的感受。'
            : '补充一点个人见解，我觉得这个情节还有另一层含义。',
          mentionIds: r === 1 && numReplies > 2 ? [pickRandom(members, r).id] : [],
          createdAt: new Date(Date.now() - (numReplies - r) * 3600000).toISOString(),
        });
      }
      const lastReplyAt = replies.length > 0
        ? replies[replies.length - 1].createdAt
        : new Date(Date.now() - bi * 86400000).toISOString();
      topics.push({
        id: topicId,
        bookId: book.id,
        title: TOPIC_TITLES[(bi + t) % TOPIC_TITLES.length],
        creatorId: pickRandom(members, bi * 3 + t).id,
        repliesCount: replies.length,
        lastReplyAt,
        createdAt: new Date(Date.now() - (bi + t) * 86400000).toISOString(),
        replies,
      });
    }
  });
  return topics;
}

function generateEvents(books: Book[]): Event[] {
  const events: Event[] = [];
  const book = books[0];
  const timeOptions = [
    '本周六 14:00-16:00',
    '本周日 10:00-12:00',
    '下周六 14:00-16:00',
  ];
  events.push({
    id: 'e_1',
    bookId: book.id,
    chapterRange: `第 1-${Math.floor(book.totalChapters / 2)} 章`,
    suggestedTime: timeOptions[0],
    status: 'scheduled',
    timeOptions,
    votes: timeOptions.slice(0, 2).map((t, i) => ({
      memberId: `m_${i + 1}`,
      timeOption: t,
      votedAt: new Date().toISOString(),
    })),
    createdAt: new Date().toISOString(),
  });
  return events;
}

class DataStore {
  members: Map<string, Member>;
  books: Map<string, Book>;
  progress: Map<string, ReadingProgress>;
  checkIns: Map<string, CheckIn>;
  topics: Map<string, Topic>;
  events: Map<string, Event>;

  constructor() {
    const members = generateMembers();
    const books = generateBooks(members);
    const progress = generateProgress(books, members);
    const checkIns = generateCheckIns(books, members);
    const topics = generateTopics(books, members);
    const events = generateEvents(books);

    this.members = new Map(members.map(m => [m.id, m]));
    this.books = new Map(books.map(b => [b.id, b]));
    this.progress = new Map(progress.map(p => [`${p.bookId}_${p.memberId}`, p]));
    this.checkIns = new Map(checkIns.map(c => [c.id, c]));
    this.topics = new Map(topics.map(t => [t.id, t]));
    this.events = new Map(events.map(e => [e.id, e]));
  }

  // Members
  getMembers(): Member[] {
    return Array.from(this.members.values());
  }

  getMember(id: string): Member | undefined {
    return this.members.get(id);
  }

  getCurrentMember(): Member {
    return this.members.get('m_1')!;
  }

  // Books
  getBooks(): Book[] {
    return Array.from(this.books.values());
  }

  getBook(id: string): Book | undefined {
    return this.books.get(id);
  }

  addBook(data: Omit<Book, 'id' | 'addedAt' | 'readerIds'>): Book {
    const book: Book = {
      ...data,
      id: genId('b'),
      addedAt: new Date().toISOString(),
      readerIds: [this.getCurrentMember().id],
    };
    this.books.set(book.id, book);
    return book;
  }

  getBookReaders(bookId: string): Member[] {
    const book = this.books.get(bookId);
    if (!book) return [];
    return book.readerIds.map(id => this.members.get(id)).filter(Boolean) as Member[];
  }

  // Progress
  getBookProgress(bookId: string): ReadingProgress[] {
    return Array.from(this.progress.values()).filter(p => p.bookId === bookId);
  }

  getProgress(bookId: string, memberId: string): ReadingProgress | undefined {
    return this.progress.get(`${bookId}_${memberId}`);
  }

  updateOrCreateProgress(data: Omit<ReadingProgress, 'lastUpdateAt'>): ReadingProgress {
    const key = `${data.bookId}_${data.memberId}`;
    const existing = this.progress.get(key);
    const updated: ReadingProgress = {
      ...(existing || data),
      ...data,
      lastUpdateAt: new Date().toISOString(),
    };
    this.progress.set(key, updated);
    const book = this.books.get(data.bookId);
    if (book && !book.readerIds.includes(data.memberId)) {
      book.readerIds.push(data.memberId);
    }
    return updated;
  }

  // CheckIns
  getBookCheckIns(bookId: string): CheckIn[] {
    return Array.from(this.checkIns.values())
      .filter(c => c.bookId === bookId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  addCheckIn(data: Omit<CheckIn, 'id' | 'createdAt'>): CheckIn {
    const checkIn: CheckIn = {
      ...data,
      id: genId('c'),
      createdAt: new Date().toISOString(),
    };
    this.checkIns.set(checkIn.id, checkIn);
    const book = this.books.get(data.bookId);
    if (book) {
      const total = book.totalChapters;
      const status: ReadingProgress['status'] =
        data.chapter === 0 ? 'not_started' : data.chapter >= total ? 'completed' : 'reading';
      this.updateOrCreateProgress({
        memberId: data.memberId,
        bookId: data.bookId,
        currentChapter: data.chapter,
        totalChapters: total,
        status,
      });
    }
    return checkIn;
  }

  // Topics
  getBookTopics(bookId: string): Topic[] {
    return Array.from(this.topics.values())
      .filter(t => t.bookId === bookId)
      .sort((a, b) => new Date(b.lastReplyAt).getTime() - new Date(a.lastReplyAt).getTime());
  }

  getTopic(id: string): Topic | undefined {
    return this.topics.get(id);
  }

  addTopic(data: Omit<Topic, 'id' | 'repliesCount' | 'lastReplyAt' | 'createdAt' | 'replies'>): Topic {
    const now = new Date().toISOString();
    const topic: Topic = {
      ...data,
      id: genId('t'),
      repliesCount: 0,
      lastReplyAt: now,
      createdAt: now,
      replies: [],
    };
    this.topics.set(topic.id, topic);
    return topic;
  }

  addReply(data: Omit<Reply, 'id' | 'createdAt'>): Reply {
    const reply: Reply = {
      ...data,
      id: genId('r'),
      createdAt: new Date().toISOString(),
    };
    const topic = this.topics.get(data.topicId);
    if (topic) {
      topic.replies.push(reply);
      topic.repliesCount = topic.replies.length;
      topic.lastReplyAt = reply.createdAt;
    }
    return reply;
  }

  // Events
  getEvents(): Event[] {
    return Array.from(this.events.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getEvent(id: string): Event | undefined {
    return this.events.get(id);
  }

  addEvent(data: Omit<Event, 'id' | 'votes' | 'createdAt'>): Event {
    const event: Event = {
      ...data,
      id: genId('e'),
      votes: [],
      createdAt: new Date().toISOString(),
    };
    this.events.set(event.id, event);
    return event;
  }

  updateEvent(id: string, data: Partial<Event>): Event | undefined {
    const existing = this.events.get(id);
    if (!existing) return undefined;
    const updated: Event = { ...existing, ...data };
    this.events.set(id, updated);
    return updated;
  }

  addVote(eventId: string, memberId: string, timeOption: string): Vote | undefined {
    const event = this.events.get(eventId);
    if (!event) return undefined;
    const existingVote = event.votes.find(v => v.memberId === memberId);
    if (existingVote) {
      existingVote.timeOption = timeOption;
      existingVote.votedAt = new Date().toISOString();
      return existingVote;
    }
    const vote: Vote = { memberId, timeOption, votedAt: new Date().toISOString() };
    event.votes.push(vote);
    return vote;
  }

  getEventVotes(eventId: string): { timeOption: string; count: number }[] | undefined {
    const event = this.events.get(eventId);
    if (!event) return undefined;
    const counts: Record<string, number> = {};
    event.timeOptions.forEach(t => { counts[t] = 0; });
    event.votes.forEach(v => { counts[v.timeOption] = (counts[v.timeOption] || 0) + 1; });
    return Object.entries(counts).map(([timeOption, count]) => ({ timeOption, count }));
  }
}

export const dataStore = new DataStore();
