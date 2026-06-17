import { create } from 'zustand';
import { Event, Registration, EventStatus, RegistrationStatus, RegistrationTrendPoint, ScheduleItem } from '../types';
import { generateId, delay, getRandomColor, formatDate } from '../utils/helpers';

const STORAGE_KEY_EVENTS = 'eventpulse_events';
const STORAGE_KEY_REGISTRATIONS = 'eventpulse_registrations';

const generateMockEvents = (): Event[] => {
  const now = new Date();
  const events: Event[] = [];

  const eventData = [
    {
      title: '2024前端技术峰会',
      description: '汇聚国内外顶尖前端技术专家，分享最新的Web技术趋势与实践经验。涵盖React、Vue、TypeScript、微前端、性能优化等热门话题。',
      location: '上海国际会议中心',
      daysFromNow: 30,
      durationDays: 2,
      status: 'upcoming' as EventStatus,
      capacity: 500,
      registrationCount: 328,
    },
    {
      title: 'AI人工智能应用大会',
      description: '探索人工智能在各行业的应用实践，包括大语言模型、计算机视觉、智能推荐等前沿技术。',
      location: '北京国家会议中心',
      daysFromNow: 15,
      durationDays: 1,
      status: 'upcoming' as EventStatus,
      capacity: 800,
      registrationCount: 612,
    },
    {
      title: '产品设计工作坊',
      description: '由资深产品设计师带队，深入讲解用户体验设计方法论，通过实战项目提升设计能力。',
      location: '深圳腾讯滨海大厦',
      daysFromNow: -5,
      durationDays: 3,
      status: 'ongoing' as EventStatus,
      capacity: 50,
      registrationCount: 45,
    },
    {
      title: '云计算技术沙龙',
      description: '分享云原生、容器化、微服务架构等云计算技术的最佳实践与案例分析。',
      location: '杭州阿里巴巴西溪园区',
      daysFromNow: -20,
      durationDays: 1,
      status: 'ended' as EventStatus,
      capacity: 200,
      registrationCount: 186,
    },
    {
      title: '创业者交流会',
      description: '为创业者搭建交流平台，分享创业经验、投资机会和行业洞察。',
      location: '北京中关村创业大街',
      daysFromNow: 45,
      durationDays: 1,
      status: 'upcoming' as EventStatus,
      capacity: 150,
      registrationCount: 78,
    },
    {
      title: '数据科学研讨会',
      description: '探讨数据科学、机器学习、大数据分析在企业中的应用与挑战。',
      location: '成都天府软件园',
      daysFromNow: -10,
      durationDays: 2,
      status: 'ongoing' as EventStatus,
      capacity: 300,
      registrationCount: 245,
    },
    {
      title: '区块链技术论坛',
      description: '深入探讨区块链技术的发展趋势、应用场景及未来前景。',
      location: '广州珠江新城',
      daysFromNow: -35,
      durationDays: 1,
      status: 'ended' as EventStatus,
      capacity: 400,
      registrationCount: 312,
    },
    {
      title: '移动开发大会',
      description: '聚焦iOS、Android、跨平台开发等移动技术的最新进展与实践。',
      location: '上海张江高科技园区',
      daysFromNow: 60,
      durationDays: 2,
      status: 'upcoming' as EventStatus,
      capacity: 600,
      registrationCount: 289,
    },
  ];

  eventData.forEach((data, index) => {
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() + data.daysFromNow);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + data.durationDays - 1);

    const schedule = generateMockSchedule(startDate, data.durationDays);
    const registrationTrend = generateMockTrend(data.registrationCount, startDate);

    events.push({
      id: generateId(),
      title: data.title,
      description: data.description,
      coverColor: getRandomColor(data.title),
      location: data.location,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: data.status,
      capacity: data.capacity,
      registrationCount: data.registrationCount,
      schedule,
      registrationTrend,
      createdAt: new Date(now.getTime() - index * 86400000 * 7).toISOString(),
    });
  });

  return events;
};

const generateMockSchedule = (startDate: Date, durationDays: number): ScheduleItem[] => {
  const schedule: ScheduleItem[] = [];
  const topics = [
    { time: '09:00', title: '签到入场', desc: '参会人员签到，领取会议资料' },
    { time: '09:30', title: '开幕致辞', desc: '主办方致辞及活动介绍' },
    { time: '10:00', title: '主题演讲', desc: '行业专家分享最新技术趋势' },
    { time: '12:00', title: '午餐休息', desc: '自助午餐及交流时间' },
    { time: '14:00', title: '分论坛讨论', desc: '多主题分论坛同时进行' },
    { time: '16:00', title: '圆桌对话', desc: '嘉宾对话与问答互动' },
    { time: '17:30', title: '闭幕总结', desc: '活动总结与颁奖仪式' },
  ];

  for (let day = 0; day < durationDays; day++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(dayDate.getDate() + day);
    topics.forEach((topic) => {
      const [hours, minutes] = topic.time.split(':').map(Number);
      const itemDate = new Date(dayDate);
      itemDate.setHours(hours, minutes, 0, 0);
      schedule.push({
        id: generateId(),
        time: itemDate.toISOString(),
        title: `${day === 0 ? '第一天' : day === 1 ? '第二天' : '第三天'} · ${topic.title}`,
        description: topic.desc,
      });
    });
  }

  return schedule;
};

const generateMockTrend = (totalCount: number, eventDate: Date): RegistrationTrendPoint[] => {
  const trend: RegistrationTrendPoint[] = [];
  const daysBefore = 30;
  const startDate = new Date(eventDate);
  startDate.setDate(startDate.getDate() - daysBefore);

  let cumulative = 0;
  for (let i = 0; i <= daysBefore; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    const progress = i / daysBefore;
    const dailyIncrease = Math.floor(
      totalCount * (0.02 + 0.1 * progress + 0.5 * Math.sin(progress * Math.PI) * 0.1)
    );
    cumulative = Math.min(totalCount, cumulative + dailyIncrease);

    trend.push({
      date: formatDate(date),
      count: cumulative,
    });
  }

  return trend;
};

const loadEventsFromStorage = (): Event[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_EVENTS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load events from storage', e);
  }
  const mockEvents = generateMockEvents();
  localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(mockEvents));
  return mockEvents;
};

const loadRegistrationsFromStorage = (): Registration[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_REGISTRATIONS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load registrations from storage', e);
  }
  return [];
};

const saveEventsToStorage = (events: Event[]) => {
  localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));
};

const saveRegistrationsToStorage = (registrations: Registration[]) => {
  localStorage.setItem(STORAGE_KEY_REGISTRATIONS, JSON.stringify(registrations));
};

interface EventStore {
  events: Event[];
  registrations: Registration[];
  loading: boolean;
  fetchEvents: () => Promise<void>;
  fetchRegistrations: () => Promise<void>;
  getEventById: (id: string) => Event | undefined;
  searchEvents: (query: string, statusFilter: EventStatus | 'all') => Event[];
  registerEvent: (
    eventId: string,
    data: { name: string; email: string; phone: string; participantCount: number }
  ) => Promise<Registration>;
  cancelRegistration: (registrationId: string) => Promise<void>;
  getRegistrationsByEvent: (eventId: string) => Registration[];
  getPopularEvents: (limit?: number) => Event[];
  getRegistrationStats: () => { total: number; upcoming: number; ended: number };
}

export const useEventStore = create<EventStore>((set, get) => ({
  events: [],
  registrations: [],
  loading: false,

  fetchEvents: async () => {
    set({ loading: true });
    await delay(300);
    const events = loadEventsFromStorage();
    set({ events, loading: false });
  },

  fetchRegistrations: async () => {
    set({ loading: true });
    await delay(200);
    const registrations = loadRegistrationsFromStorage();
    set({ registrations, loading: false });
  },

  getEventById: (id: string) => {
    return get().events.find((e) => e.id === id);
  },

  searchEvents: (query: string, statusFilter: EventStatus | 'all') => {
    const { events } = get();
    return events.filter((event) => {
      const matchesQuery = event.title.toLowerCase().includes(query.toLowerCase()) ||
        event.description.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  },

  registerEvent: async (eventId, data) => {
    await delay(500);

    const registration: Registration = {
      id: generateId(),
      eventId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      participantCount: data.participantCount,
      status: 'registered' as RegistrationStatus,
      registeredAt: new Date().toISOString(),
    };

    const registrations = [...get().registrations, registration];
    saveRegistrationsToStorage(registrations);

    const events = get().events.map((e) => {
      if (e.id === eventId) {
        const newCount = e.registrationCount + data.participantCount;
        const today = formatDate(new Date());
        const updatedTrend = [...e.registrationTrend];
        const lastPoint = updatedTrend[updatedTrend.length - 1];
        if (lastPoint && lastPoint.date === today) {
          lastPoint.count = newCount;
        } else {
          updatedTrend.push({ date: today, count: newCount });
        }
        return { ...e, registrationCount: newCount, registrationTrend: updatedTrend };
      }
      return e;
    });
    saveEventsToStorage(events);

    set({ registrations, events });
    return registration;
  },

  cancelRegistration: async (registrationId) => {
    await delay(300);

    const registration = get().registrations.find((r) => r.id === registrationId);
    if (!registration) return;

    const registrations = get().registrations.map((r) => {
      if (r.id === registrationId) {
        return { ...r, status: 'cancelled' as RegistrationStatus };
      }
      return r;
    });
    saveRegistrationsToStorage(registrations);

    const events = get().events.map((e) => {
      if (e.id === registration.eventId) {
        const newCount = Math.max(0, e.registrationCount - registration.participantCount);
        const today = formatDate(new Date());
        const updatedTrend = [...e.registrationTrend];
        const lastPoint = updatedTrend[updatedTrend.length - 1];
        if (lastPoint && lastPoint.date === today) {
          lastPoint.count = newCount;
        } else {
          updatedTrend.push({ date: today, count: newCount });
        }
        return { ...e, registrationCount: newCount, registrationTrend: updatedTrend };
      }
      return e;
    });
    saveEventsToStorage(events);

    set({ registrations, events });
  },

  getRegistrationsByEvent: (eventId: string) => {
    return get().registrations.filter((r) => r.eventId === eventId);
  },

  getPopularEvents: (limit = 5) => {
    return [...get().events]
      .sort((a, b) => b.registrationCount - a.registrationCount)
      .slice(0, limit);
  },

  getRegistrationStats: () => {
    const { registrations, events } = get();
    const activeRegistrations = registrations.filter((r) => r.status !== 'cancelled');

    let upcoming = 0;
    let ended = 0;

    activeRegistrations.forEach((r) => {
      const event = events.find((e) => e.id === r.eventId);
      if (event) {
        if (event.status === 'upcoming' || event.status === 'ongoing') {
          upcoming++;
        } else if (event.status === 'ended') {
          ended++;
        }
      }
    });

    return {
      total: activeRegistrations.length,
      upcoming,
      ended,
    };
  },
}));
