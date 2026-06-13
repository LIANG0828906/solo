import { v4 as uuidv4 } from 'uuid';

export interface Event {
  id: string;
  code: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  maxParticipants: number;
  createdAt: string;
  status: 'upcoming' | 'ongoing' | 'ended';
}

export interface CheckIn {
  id: string;
  eventId: string;
  participantName: string;
  checkInTime: string;
}

const events: Event[] = [];
const checkins: CheckIn[] = [];

function generateEventCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function determineStatus(startTime: string, endTime: string): Event['status'] {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (now < start) return 'upcoming';
  if (now >= start && now <= end) return 'ongoing';
  return 'ended';
}

export function createEvent(data: {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  maxParticipants: number;
}): Event {
  if (!data.title || data.title.trim() === '') {
    throw new Error('活动标题不能为空');
  }
  if (data.maxParticipants <= 0) {
    throw new Error('最大参与人数必须大于0');
  }

  const event: Event = {
    id: uuidv4(),
    code: generateEventCode(),
    title: data.title.trim(),
    description: data.description || '',
    startTime: data.startTime,
    endTime: data.endTime,
    location: data.location || '',
    maxParticipants: data.maxParticipants,
    createdAt: new Date().toISOString(),
    status: determineStatus(data.startTime, data.endTime),
  };

  events.push(event);
  return event;
}

export function getEvents(filters?: {
  status?: string;
  keyword?: string;
  page?: number;
  limit?: number;
}): { data: Event[]; total: number; page: number; totalPages: number } {
  let result = [...events];

  if (filters?.status) {
    result = result.filter((e) => e.status === filters.status);
  }

  if (filters?.keyword) {
    const kw = filters.keyword.toLowerCase();
    result = result.filter(
      (e) =>
        e.title.toLowerCase().includes(kw) ||
        e.description.toLowerCase().includes(kw)
    );
  }

  result.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const total = result.length;
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const data = result.slice(start, start + limit);

  return { data, total, page, totalPages };
}

export function getEventById(id: string): Event | null {
  return events.find((e) => e.id === id) || null;
}

export function getEventByCode(code: string): Event | null {
  return events.find((e) => e.code === code) || null;
}

export function checkIn(
  eventId: string,
  participantName: string
): { success: boolean; message: string; checkin?: CheckIn } {
  const event = getEventById(eventId);
  if (!event) {
    return { success: false, message: '活动不存在' };
  }

  const duplicate = checkins.find(
    (c) => c.eventId === eventId && c.participantName === participantName
  );
  if (duplicate) {
    return { success: false, message: '已签到，不可重复签到' };
  }

  const record: CheckIn = {
    id: uuidv4(),
    eventId,
    participantName,
    checkInTime: new Date().toISOString(),
  };

  checkins.push(record);
  return { success: true, message: '签到成功', checkin: record };
}

export function getCheckinsByEvent(eventId: string): CheckIn[] {
  return checkins
    .filter((c) => c.eventId === eventId)
    .sort(
      (a, b) =>
        new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
    );
}

export function getCheckinStats(eventId: string): {
  total: number;
  checkedIn: number;
  rate: number;
  recent10: CheckIn[];
  trend: { hour: string; count: number }[];
} {
  const event = getEventById(eventId);
  const total = event ? event.maxParticipants : 0;
  const eventCheckins = checkins.filter((c) => c.eventId === eventId);
  const checkedIn = eventCheckins.length;
  const rate = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

  const sorted = [...eventCheckins].sort(
    (a, b) =>
      new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
  );
  const recent10 = sorted.slice(0, 10);

  const hourMap = new Map<string, number>();
  for (const c of eventCheckins) {
    const d = new Date(c.checkInTime);
    const hour = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:00`;
    hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
  }

  const trend = Array.from(hourMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hour, count]) => ({ hour, count }));

  return { total, checkedIn, rate, recent10, trend };
}

export function updateEventStatuses(): void {
  for (const event of events) {
    event.status = determineStatus(event.startTime, event.endTime);
  }
}

export function seedData(): void {
  const now = new Date();

  const event1 = createEvent({
    title: '2026前端技术峰会',
    description: '探索前端最新技术趋势，包括AI辅助开发、WebAssembly、边缘渲染等热门话题',
    startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
    location: '北京国际会议中心A厅',
    maxParticipants: 200,
  });

  const event2 = createEvent({
    title: 'React 19新特性Workshop',
    description: '深入实战React 19新特性，包括Server Components、Actions等核心概念',
    startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(now.getTime() + 26 * 60 * 60 * 1000).toISOString(),
    location: '上海张江科技园B栋3楼',
    maxParticipants: 50,
  });

  const event3 = createEvent({
    title: '开源项目贡献者聚会',
    description: '开源社区年度聚会，分享开源项目运营经验和贡献者故事',
    startTime: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(now.getTime() - 46 * 60 * 60 * 1000).toISOString(),
    location: '深圳南山软件产业基地',
    maxParticipants: 100,
  });

  const names1 = ['张伟', '李娜', '王芳', '刘洋', '陈明', '赵雪', '周强', '吴丽', '郑磊', '孙静'];
  for (let i = 0; i < 10; i++) {
    checkins.push({
      id: uuidv4(),
      eventId: event1.id,
      participantName: names1[i],
      checkInTime: new Date(now.getTime() - (10 - i) * 5 * 60 * 1000).toISOString(),
    });
  }

  const names3 = ['黄鹏', '林涛', '何敏'];
  for (let i = 0; i < 3; i++) {
    checkins.push({
      id: uuidv4(),
      eventId: event3.id,
      participantName: names3[i],
      checkInTime: new Date(now.getTime() - 47 * 60 * 60 * 1000 + i * 10 * 60 * 1000).toISOString(),
    });
  }
}
