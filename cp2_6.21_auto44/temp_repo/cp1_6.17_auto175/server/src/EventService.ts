import { v4 as uuidv4 } from 'uuid';

export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  tags: string[];
  content: string;
  images: string[];
  createdAt: number;
  likes: number;
  comments: Comment[];
  isPublic: boolean;
  userId: string;
  authorName: string;
  authorAvatar: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: number;
}

const mockUsers = [
  { id: 'user1', name: '时光旅人', avatar: '' },
  { id: 'user2', name: '记忆收藏家', avatar: '' },
  { id: 'user3', name: '追风少年', avatar: '' },
];

function generateMockEvents(): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const sampleTitles = [
    '大学毕业典礼', '第一次出国旅行', '入职新公司', '婚礼纪念日',
    '孩子出生', '买下第一套房', '学会弹吉他', '登顶泰山',
    '出版第一本书', '创办自己的公司'
  ];
  const sampleContents = [
    '这一天终于到来了，四年的大学生活画上了圆满的句号。穿着学士服站在操场上，听着校长的致辞，心中百感交集。和同学们一起抛起学士帽的那一刻，我知道青春永不散场。',
    '飞机缓缓降落在异国他乡的土地上，心中既紧张又兴奋。陌生的语言、不同的肤色、独特的建筑，一切都让我着迷。这次旅行改变了我看世界的方式。',
    '收到offer的那天晚上，我失眠了。这是我梦寐以求的公司，是我职业生涯新的起点。走进办公室的第一天，阳光透过落地窗洒在桌面上，未来充满无限可能。',
  ];
  const sampleTags = [
    ['里程碑', '成长'], ['旅行', '探索'], ['工作', '新起点'],
    ['家庭', '幸福'], ['人生', '感动'], ['梦想', '实现'],
    ['爱好', '坚持'], ['挑战', '成就'], ['创作', '分享'],
    ['创业', '勇气']
  ];
  const locations = ['北京', '上海', '东京', '巴黎', '纽约', '伦敦', '成都', '杭州', '深圳', '西安'];

  for (let i = 0; i < 15; i++) {
    const user = mockUsers[i % mockUsers.length];
    const year = 2015 + Math.floor(Math.random() * 10);
    const month = Math.floor(Math.random() * 12) + 1;
    const day = Math.floor(Math.random() * 28) + 1;
    events.push({
      id: uuidv4(),
      title: sampleTitles[i % sampleTitles.length],
      date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      location: locations[i % locations.length],
      tags: sampleTags[i % sampleTags.length],
      content: sampleContents[i % sampleContents.length],
      images: [],
      createdAt: Date.now() - Math.random() * 10000000000,
      likes: Math.floor(Math.random() * 100),
      comments: [
        {
          id: uuidv4(),
          userId: mockUsers[(i + 1) % mockUsers.length].id,
          userName: mockUsers[(i + 1) % mockUsers.length].name,
          content: '太棒了，为你高兴！',
          createdAt: Date.now() - Math.random() * 1000000000,
        },
      ],
      isPublic: true,
      userId: user.id,
      authorName: user.name,
      authorAvatar: user.avatar,
    });
  }
  return events;
}

class EventService {
  private events: TimelineEvent[] = generateMockEvents();

  createEvent(event: Omit<TimelineEvent, 'id' | 'createdAt' | 'likes' | 'comments'>): TimelineEvent {
    const newEvent: TimelineEvent = {
      ...event,
      id: uuidv4(),
      createdAt: Date.now(),
      likes: 0,
      comments: [],
    };
    this.events.unshift(newEvent);
    return newEvent;
  }

  getEvents(page: number = 1, limit: number = 10, isPublic?: boolean): { events: TimelineEvent[]; total: number } {
    let filtered = isPublic !== undefined ? this.events.filter(e => e.isPublic === isPublic) : this.events;
    filtered = filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const total = filtered.length;
    const start = (page - 1) * limit;
    const events = filtered.slice(start, start + limit);
    return { events, total };
  }

  getEventById(id: string): TimelineEvent | undefined {
    return this.events.find(e => e.id === id);
  }

  updateEvent(id: string, updates: Partial<TimelineEvent>): TimelineEvent | undefined {
    const index = this.events.findIndex(e => e.id === id);
    if (index === -1) return undefined;
    this.events[index] = { ...this.events[index], ...updates };
    return this.events[index];
  }

  deleteEvent(id: string): boolean {
    const index = this.events.findIndex(e => e.id === id);
    if (index === -1) return false;
    this.events.splice(index, 1);
    return true;
  }

  likeEvent(id: string): TimelineEvent | undefined {
    const event = this.getEventById(id);
    if (!event) return undefined;
    event.likes += 1;
    return event;
  }

  addComment(id: string, comment: Omit<Comment, 'id' | 'createdAt'>): TimelineEvent | undefined {
    const event = this.getEventById(id);
    if (!event) return undefined;
    const newComment: Comment = {
      ...comment,
      id: uuidv4(),
      createdAt: Date.now(),
    };
    event.comments.push(newComment);
    return event;
  }

  getCommunityTimelines(page: number = 1, limit: number = 9): { timelines: TimelineEvent[]; total: number } {
    return this.getEvents(page, limit, true);
  }
}

export const eventService = new EventService();
